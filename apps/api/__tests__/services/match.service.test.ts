import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards, userCollectionItems, userWantedCards, tradeMatches } from '../../src/db/schema';
import {
  computeTwoWayMatches,
  calculateMatchScore,
  recomputeMatchesForUser,
} from '../../src/services/match.service';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

let app: FastifyInstance;

// Test data helpers
async function createTestUser(overrides: Partial<{ displayName: string; avatarId: string; friendCode: string }> = {}) {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin: false,
    displayName: overrides.displayName || null,
    avatarId: overrides.avatarId || null,
    friendCode: overrides.friendCode || null,
  });
  return userId;
}

async function seedCardSet() {
  const setId = 'MS1';
  await testDb.insert(sets).values({
    id: setId,
    name: 'Match Test Set',
    series: 'MT',
    cardCount: 4,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  });

  const cardData = [
    { id: 'MS1-001', localId: '001', name: 'Charizard', rarity: 'star2' as const, imageUrl: 'https://example.com/charizard.png' },
    { id: 'MS1-002', localId: '002', name: 'Pikachu', rarity: 'diamond1' as const, imageUrl: 'https://example.com/pikachu.png' },
    { id: 'MS1-003', localId: '003', name: 'Blastoise', rarity: 'star1' as const, imageUrl: 'https://example.com/blastoise.png' },
    { id: 'MS1-004', localId: '004', name: 'Venusaur', rarity: 'diamond3' as const, imageUrl: 'https://example.com/venusaur.png' },
  ];

  for (const card of cardData) {
    await testDb.insert(cards).values({
      ...card,
      setId,
      type: 'fire',
      category: 'pokemon',
      hp: 100,
      stage: 'Basic',
      attacks: null,
      weakness: null,
      resistance: null,
      retreatCost: null,
      illustrator: 'Test',
      cardNumber: card.localId,
    });
  }

  return cardData.map((c) => c.id);
}

async function addToCollection(userId: string, cardId: string) {
  await testDb.insert(userCollectionItems).values({
    id: randomUUID(),
    userId,
    cardId,
    quantity: 1,
  });
}

async function addToWanted(userId: string, cardId: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  await testDb.insert(userWantedCards).values({
    id: randomUUID(),
    userId,
    cardId,
    priority,
  });
}

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await closeDb();
  await app.close();
});

beforeEach(async () => {
  await cleanDb();
});

describe('computeTwoWayMatches', () => {
  it('finds matches when user A has what B wants AND B has what A wants', async () => {
    const cardIds = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();

    // A has Charizard, B wants Charizard
    await addToCollection(userA, cardIds[0]); // Charizard
    await addToWanted(userB, cardIds[0], 'high'); // B wants Charizard

    // B has Pikachu, A wants Pikachu
    await addToCollection(userB, cardIds[1]); // Pikachu
    await addToWanted(userA, cardIds[1], 'medium'); // A wants Pikachu

    const matches = await computeTwoWayMatches(testDb, userA);

    expect(matches).toHaveLength(1);
    expect(matches[0].partnerId).toBe(userB);
    expect(matches[0].userGives).toHaveLength(1);
    expect(matches[0].userGives[0].cardId).toBe(cardIds[0]); // A gives Charizard
    expect(matches[0].userGets).toHaveLength(1);
    expect(matches[0].userGets[0].cardId).toBe(cardIds[1]); // A gets Pikachu
  });

  it('returns empty when only one direction matches', async () => {
    const cardIds = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();

    // A has Charizard, B wants Charizard
    await addToCollection(userA, cardIds[0]);
    await addToWanted(userB, cardIds[0]);

    // But B does NOT have anything A wants
    await addToWanted(userA, cardIds[1]); // A wants Pikachu but B doesn't have it

    const matches = await computeTwoWayMatches(testDb, userA);

    expect(matches).toHaveLength(0);
  });
});

describe('calculateMatchScore', () => {
  it('returns score=3 and starRating=2 for single high-priority card', () => {
    const result = calculateMatchScore([{ cardId: 'c1', priority: 'high' }]);
    expect(result.score).toBe(3);
    expect(result.starRating).toBe(2); // score=3 >= 3 threshold = 2 stars
  });

  it('returns starRating=1 for single low-priority card (score < 3)', () => {
    const result = calculateMatchScore([{ cardId: 'c1', priority: 'low' }]);
    expect(result.score).toBe(1);
    expect(result.starRating).toBe(1);
  });

  it('returns starRating=3 when score >= 6 (two high-priority cards)', () => {
    const result = calculateMatchScore([
      { cardId: 'c1', priority: 'high' },
      { cardId: 'c2', priority: 'high' },
    ]);
    expect(result.score).toBe(6);
    expect(result.starRating).toBe(3);
  });

  it('returns starRating=2 when score >= 3 and < 6', () => {
    const result = calculateMatchScore([
      { cardId: 'c1', priority: 'high' },
      { cardId: 'c2', priority: 'low' }, // 3 + 1 = 4
    ]);
    expect(result.score).toBe(4);
    expect(result.starRating).toBe(2);
  });
});

describe('recomputeMatchesForUser', () => {
  it('stores match rows for BOTH user perspectives', async () => {
    const cardIds = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();

    // Set up two-way match
    await addToCollection(userA, cardIds[0]); // A has Charizard
    await addToWanted(userB, cardIds[0], 'high'); // B wants Charizard
    await addToCollection(userB, cardIds[1]); // B has Pikachu
    await addToWanted(userA, cardIds[1], 'medium'); // A wants Pikachu

    await recomputeMatchesForUser(testDb, null, userA);

    // Check user A's perspective
    const userAMatches = await testDb
      .select()
      .from(tradeMatches)
      .where(eq(tradeMatches.userId, userA));
    expect(userAMatches).toHaveLength(1);
    expect(userAMatches[0].partnerId).toBe(userB);

    // Check user B's perspective (inserted as partner)
    const userBMatches = await testDb
      .select()
      .from(tradeMatches)
      .where(eq(tradeMatches.userId, userB));
    expect(userBMatches).toHaveLength(1);
    expect(userBMatches[0].partnerId).toBe(userA);
  });

  it('returns newPartnerIds only for truly new matches', async () => {
    const cardIds = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // Set up match A <-> B
    await addToCollection(userA, cardIds[0]);
    await addToWanted(userB, cardIds[0], 'high');
    await addToCollection(userB, cardIds[1]);
    await addToWanted(userA, cardIds[1], 'medium');

    // First compute - B should be new
    const result1 = await recomputeMatchesForUser(testDb, null, userA);
    expect(result1.newPartnerIds).toContain(userB);

    // Now add match A <-> C
    await addToCollection(userA, cardIds[2]); // A has Blastoise
    await addToWanted(userC, cardIds[2], 'low'); // C wants Blastoise
    await addToCollection(userC, cardIds[3]); // C has Venusaur
    await addToWanted(userA, cardIds[3], 'high'); // A wants Venusaur

    // Second compute - B should NOT be new, C should be new
    const result2 = await recomputeMatchesForUser(testDb, null, userA);
    expect(result2.newPartnerIds).not.toContain(userB);
    expect(result2.newPartnerIds).toContain(userC);
    expect(result2.matchCount).toBe(2);
  });
});
