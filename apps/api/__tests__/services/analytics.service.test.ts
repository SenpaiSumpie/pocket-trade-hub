import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards, userCollectionItems, userWantedCards, cardAnalytics } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import {
  computeMostWanted,
  computeLeastAvailable,
  computeTrending,
  computeAllAnalytics,
  getAnalytics,
  getTradePower,
} from '../../src/services/analytics.service';

let app: FastifyInstance;

async function createTestUser() {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin: false,
  });
  return userId;
}

async function seedCardSet() {
  const setId = 'AS1';
  await testDb.insert(sets).values({
    id: setId,
    name: 'Analytics Test Set',
    series: 'AT',
    cardCount: 4,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  });

  const cardData = [
    { id: 'AS1-001', localId: '001', name: 'Charizard', rarity: 'star2' as const, imageUrl: 'https://example.com/charizard.png' },
    { id: 'AS1-002', localId: '002', name: 'Pikachu', rarity: 'diamond1' as const, imageUrl: 'https://example.com/pikachu.png' },
    { id: 'AS1-003', localId: '003', name: 'Blastoise', rarity: 'star1' as const, imageUrl: 'https://example.com/blastoise.png' },
    { id: 'AS1-004', localId: '004', name: 'Venusaur', rarity: 'diamond3' as const, imageUrl: 'https://example.com/venusaur.png' },
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

  return cardData;
}

async function addToWanted(userId: string, cardId: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  await testDb.insert(userWantedCards).values({
    id: randomUUID(),
    userId,
    cardId,
    priority,
  });
}

async function addToCollection(userId: string, cardId: string) {
  await testDb.insert(userCollectionItems).values({
    id: randomUUID(),
    userId,
    cardId,
    quantity: 1,
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

describe('computeMostWanted', () => {
  it('ranks cards by number of users wanting them', async () => {
    const cardData = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // Charizard wanted by 3 users, Pikachu by 2, Blastoise by 1
    await addToWanted(userA, 'AS1-001');
    await addToWanted(userB, 'AS1-001');
    await addToWanted(userC, 'AS1-001');
    await addToWanted(userA, 'AS1-002');
    await addToWanted(userB, 'AS1-002');
    await addToWanted(userA, 'AS1-003');

    await computeMostWanted(testDb);

    const rows = await testDb
      .select()
      .from(cardAnalytics)
      .where(eq(cardAnalytics.metric, 'most_wanted'));

    expect(rows.length).toBe(3);
    expect(rows.find(r => r.rank === 1)?.cardId).toBe('AS1-001'); // Charizard most wanted
    expect(rows.find(r => r.rank === 2)?.cardId).toBe('AS1-002'); // Pikachu second
    expect(rows.find(r => r.rank === 3)?.cardId).toBe('AS1-003'); // Blastoise third
  });
});

describe('computeLeastAvailable', () => {
  it('ranks cards by fewest collection entries', async () => {
    const cardData = await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // Charizard owned by 3, Pikachu by 1, Blastoise by 0, Venusaur by 0
    await addToCollection(userA, 'AS1-001');
    await addToCollection(userB, 'AS1-001');
    await addToCollection(userC, 'AS1-001');
    await addToCollection(userA, 'AS1-002');

    await computeLeastAvailable(testDb);

    const rows = await testDb
      .select()
      .from(cardAnalytics)
      .where(eq(cardAnalytics.metric, 'least_available'));

    expect(rows.length).toBeGreaterThanOrEqual(2);
    // Cards with 0 owners should be ranked first
    const topRanked = rows.filter(r => r.rank <= 2).map(r => r.cardId);
    expect(topRanked).toContain('AS1-003'); // Blastoise: 0 owners
    expect(topRanked).toContain('AS1-004'); // Venusaur: 0 owners
  });
});

describe('computeAllAnalytics', () => {
  it('populates cardAnalytics with all metric types', async () => {
    await seedCardSet();
    const userA = await createTestUser();

    await addToWanted(userA, 'AS1-001');
    await addToCollection(userA, 'AS1-002');

    await computeAllAnalytics(testDb);

    const allRows = await testDb.select().from(cardAnalytics);
    const metrics = new Set(allRows.map(r => r.metric));
    expect(metrics.has('most_wanted')).toBe(true);
    expect(metrics.has('least_available')).toBe(true);
    expect(metrics.has('trending')).toBe(true);
  });
});

describe('getAnalytics', () => {
  it('returns top-10 per metric from pre-computed data', async () => {
    await seedCardSet();
    const userA = await createTestUser();

    await addToWanted(userA, 'AS1-001');
    await addToWanted(userA, 'AS1-002');
    await computeAllAnalytics(testDb);

    const result = await getAnalytics(testDb);
    expect(result.mostWanted).toBeDefined();
    expect(result.leastAvailable).toBeDefined();
    expect(result.trending).toBeDefined();
    // Most wanted should include card names from join
    if (result.mostWanted.length > 0) {
      expect(result.mostWanted[0]).toHaveProperty('cardName');
      expect(result.mostWanted[0]).toHaveProperty('cardImageUrl');
    }
  });
});

describe('getTradePower', () => {
  it('returns cards from user collection that others want most', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // userA has Charizard and Pikachu
    await addToCollection(userA, 'AS1-001');
    await addToCollection(userA, 'AS1-002');

    // Other users want Charizard more than Pikachu
    await addToWanted(userB, 'AS1-001');
    await addToWanted(userC, 'AS1-001');
    await addToWanted(userB, 'AS1-002');

    const result = await getTradePower(testDb, userA);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Charizard should be highest trade power (2 users want it)
    expect(result[0].cardId).toBe('AS1-001');
  });
});
