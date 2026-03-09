import { buildTestApp, cleanDb, closeDb, testDb, TEST_JWT_SECRET } from '../setup';
import { users, sets, cards, userCollectionItems, userWantedCards, tradeMatches } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

let app: FastifyInstance;

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

function getAuthToken(userId: string): string {
  return app.jwt.sign({ sub: userId }, { expiresIn: '15m' });
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

  return cardData;
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

async function insertMatchRow(
  userId: string,
  partnerId: string,
  opts: {
    userGives: Array<{ cardId: string; priority: string }>;
    userGets: Array<{ cardId: string; priority: string }>;
    score: number;
    starRating: number;
    cardCount: number;
    seen?: boolean;
    createdAt?: Date;
  },
) {
  const id = randomUUID();
  await testDb.insert(tradeMatches).values({
    id,
    userId,
    partnerId,
    userGives: opts.userGives,
    userGets: opts.userGets,
    score: opts.score,
    starRating: opts.starRating,
    cardCount: opts.cardCount,
    seen: opts.seen ?? false,
    createdAt: opts.createdAt ?? new Date(),
    updatedAt: new Date(),
  });
  return id;
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

describe('GET /matches', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/matches' });
    expect(res.statusCode).toBe(401);
  });

  it('returns empty array for user with no matches', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'GET',
      url: '/matches',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.matches).toEqual([]);
    expect(body.unseenCount).toBe(0);
  });

  it('returns hydrated matches with card names, images, partner profile', async () => {
    const cardData = await seedCardSet();
    const userA = await createTestUser({ displayName: 'Alice', avatarId: 'fire' });
    const userB = await createTestUser({ displayName: 'Bob', avatarId: 'water', friendCode: '1234-5678-9012-3456' });

    const matchId = await insertMatchRow(userA, userB, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }],
      score: 2,
      starRating: 1,
      cardCount: 2,
    });

    const token = getAuthToken(userA);
    const res = await app.inject({
      method: 'GET',
      url: '/matches',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.matches).toHaveLength(1);

    const match = body.matches[0];
    expect(match.partnerId).toBe(userB);
    expect(match.partnerDisplayName).toBe('Bob');
    expect(match.partnerAvatarId).toBe('water');
    expect(match.partnerFriendCode).toBe('1234-5678-9012-3456');
    expect(match.userGives).toHaveLength(1);
    expect(match.userGives[0].cardName).toBe('Charizard');
    expect(match.userGives[0].cardImageUrl).toBe('https://example.com/charizard.png');
    expect(match.userGets).toHaveLength(1);
    expect(match.userGets[0].cardName).toBe('Pikachu');
    expect(body.unseenCount).toBe(1);
  });

  it('sorts by cardCount descending with ?sort=cards', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // Match with B: 2 cards
    await insertMatchRow(userA, userB, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }],
      score: 2,
      starRating: 1,
      cardCount: 2,
    });

    // Match with C: 4 cards
    await insertMatchRow(userA, userC, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }, { cardId: 'MS1-003', priority: 'medium' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }, { cardId: 'MS1-004', priority: 'low' }],
      score: 3,
      starRating: 2,
      cardCount: 4,
    });

    const token = getAuthToken(userA);
    const res = await app.inject({
      method: 'GET',
      url: '/matches?sort=cards',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = res.json();
    expect(body.matches[0].partnerId).toBe(userC); // 4 cards first
    expect(body.matches[1].partnerId).toBe(userB); // 2 cards second
  });

  it('sorts by createdAt descending with ?sort=newest', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    const older = new Date('2024-01-01');
    const newer = new Date('2024-06-01');

    await insertMatchRow(userA, userB, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }],
      score: 5,
      starRating: 2,
      cardCount: 2,
      createdAt: older,
    });

    await insertMatchRow(userA, userC, {
      userGives: [{ cardId: 'MS1-003', priority: 'low' }],
      userGets: [{ cardId: 'MS1-004', priority: 'low' }],
      score: 1,
      starRating: 1,
      cardCount: 2,
      createdAt: newer,
    });

    const token = getAuthToken(userA);
    const res = await app.inject({
      method: 'GET',
      url: '/matches?sort=newest',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = res.json();
    expect(body.matches[0].partnerId).toBe(userC); // newer first
    expect(body.matches[1].partnerId).toBe(userB);
  });
});

describe('POST /matches/refresh', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/matches/refresh' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 and recomputes matches', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();

    // Set up two-way match
    await addToCollection(userA, 'MS1-001');
    await addToWanted(userB, 'MS1-001', 'high');
    await addToCollection(userB, 'MS1-002');
    await addToWanted(userA, 'MS1-002', 'medium');

    const token = getAuthToken(userA);
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/matches/refresh',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(refreshRes.statusCode).toBe(200);
    const refreshBody = refreshRes.json();
    expect(refreshBody.refreshed).toBe(true);
    expect(refreshBody.matchCount).toBe(1);

    // Verify matches now appear
    const getRes = await app.inject({
      method: 'GET',
      url: '/matches',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = getRes.json();
    expect(body.matches).toHaveLength(1);
    expect(body.matches[0].partnerId).toBe(userB);
  });
});

describe('PUT /matches/:id/seen', () => {
  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'PUT', url: '/matches/some-id/seen' });
    expect(res.statusCode).toBe(401);
  });

  it('marks match as seen and returns 200', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();

    const matchId = await insertMatchRow(userA, userB, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }],
      score: 2,
      starRating: 1,
      cardCount: 2,
      seen: false,
    });

    const token = getAuthToken(userA);
    const res = await app.inject({
      method: 'PUT',
      url: `/matches/${matchId}/seen`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify it's now seen
    const getRes = await app.inject({
      method: 'GET',
      url: '/matches',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getRes.json().unseenCount).toBe(0);
  });

  it('returns 404 for non-existent or other user match', async () => {
    await seedCardSet();
    const userA = await createTestUser();
    const userB = await createTestUser();
    const userC = await createTestUser();

    // Match belongs to userB
    const matchId = await insertMatchRow(userB, userC, {
      userGives: [{ cardId: 'MS1-001', priority: 'high' }],
      userGets: [{ cardId: 'MS1-002', priority: 'medium' }],
      score: 2,
      starRating: 1,
      cardCount: 2,
    });

    const tokenA = getAuthToken(userA);

    // Try marking someone else's match
    const res = await app.inject({
      method: 'PUT',
      url: `/matches/${matchId}/seen`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);

    // Non-existent match
    const res2 = await app.inject({
      method: 'PUT',
      url: `/matches/${randomUUID()}/seen`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res2.statusCode).toBe(404);
  });
});
