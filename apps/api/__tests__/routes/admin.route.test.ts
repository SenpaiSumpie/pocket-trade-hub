import { buildTestApp, cleanDb, closeDb, testDb, TEST_JWT_SECRET } from '../setup';
import { users } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

let app: FastifyInstance;

const validImportBody = {
  set: {
    id: 'T1',
    name: 'Test Set',
    series: 'T',
    cardCount: 1,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  },
  cards: [
    {
      localId: '001',
      name: 'Charizard',
      rarity: 'star2',
      type: 'fire',
      category: 'pokemon',
      hp: 180,
      stage: 'Stage 2',
      imageUrl: 'https://example.com/charizard.png',
      attacks: [{ name: 'Fire Blast', damage: '200', energyCost: ['fire'], description: null }],
      weakness: 'water',
      resistance: null,
      retreatCost: 3,
      illustrator: 'Mitsuhiro Arita',
      cardNumber: '001/100',
    },
  ],
};

async function createTestUser(isAdmin: boolean) {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `${isAdmin ? 'admin' : 'user'}-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin,
  });
  return userId;
}

function getAuthToken(userId: string): string {
  return app.jwt.sign({ sub: userId }, { expiresIn: '15m' });
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

describe('POST /admin/cards/import', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      payload: validImportBody,
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const userId = await createTestUser(false);
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      headers: { authorization: `Bearer ${token}` },
      payload: validImportBody,
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const userId = await createTestUser(true);
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      headers: { authorization: `Bearer ${token}` },
      payload: { invalid: true },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 with valid body and admin user', async () => {
    const userId = await createTestUser(true);
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      headers: { authorization: `Bearer ${token}` },
      payload: validImportBody,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.setId).toBe('T1');
    expect(body.cardCount).toBe(1);
    expect(body.message).toContain('1 cards');
  });

  it('returns 409 for duplicate set import', async () => {
    const userId = await createTestUser(true);
    const token = getAuthToken(userId);

    // First import
    await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      headers: { authorization: `Bearer ${token}` },
      payload: validImportBody,
    });

    // Duplicate import
    const res = await app.inject({
      method: 'POST',
      url: '/admin/cards/import',
      headers: { authorization: `Bearer ${token}` },
      payload: validImportBody,
    });
    expect(res.statusCode).toBe(409);
  });
});
