import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users } from '../../src/db/schema';
import { importCardSet } from '../../src/services/card.service';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import type { CardImportInput } from '@pocket-trade-hub/shared';

let app: FastifyInstance;

const testImport: CardImportInput = {
  set: {
    id: 'WS1',
    name: 'Wanted Test Set',
    series: 'WT',
    cardCount: 2,
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
    {
      localId: '002',
      name: 'Pikachu',
      rarity: 'diamond1',
      type: 'electric',
      category: 'pokemon',
      hp: 60,
      stage: 'Basic',
      imageUrl: 'https://example.com/pikachu.png',
      attacks: [{ name: 'Thunder Shock', damage: '20', energyCost: ['electric'], description: null }],
      weakness: 'fighting',
      resistance: null,
      retreatCost: 1,
      illustrator: 'Ken Sugimori',
      cardNumber: '002/100',
    },
  ],
};

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

describe('POST /wanted', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'POST', url: '/wanted', payload: { cardId: 'WS1-001' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('adds card to wanted with default priority medium (WANT-01)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    const res = await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cardId).toBe('WS1-001');
    expect(body.priority).toBe('medium');
  });

  it('adds card with explicit priority', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    const res = await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001', priority: 'high' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().priority).toBe('high');
  });
});

describe('DELETE /wanted/:cardId', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/wanted/WS1-001' });
    expect(res.statusCode).toBe(401);
  });

  it('removes card from wanted list (WANT-02)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    // Add first
    await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001' },
    });

    // Delete
    const res = await app.inject({
      method: 'DELETE',
      url: '/wanted/WS1-001',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify removed
    const listRes = await app.inject({
      method: 'GET',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listRes.json()).toHaveLength(0);
  });
});

describe('PUT /wanted/:cardId', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'PUT', url: '/wanted/WS1-001', payload: { priority: 'high' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for invalid priority', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'PUT',
      url: '/wanted/WS1-001',
      headers: { authorization: `Bearer ${token}` },
      payload: { priority: 'invalid' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('updates priority (WANT-03)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001' },
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/wanted/WS1-001',
      headers: { authorization: `Bearer ${token}` },
      payload: { priority: 'high' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().priority).toBe('high');
  });
});

describe('GET /wanted', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'GET', url: '/wanted' });
    expect(res.statusCode).toBe(401);
  });

  it('returns user wanted items', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001' },
    });
    await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-002', priority: 'low' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('filters by setId', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/wanted',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'WS1-001' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/wanted?setId=WS1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);

    const resEmpty = await app.inject({
      method: 'GET',
      url: '/wanted?setId=NONEXISTENT',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(resEmpty.json()).toHaveLength(0);
  });
});
