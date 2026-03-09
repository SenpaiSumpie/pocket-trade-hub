import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards } from '../../src/db/schema';
import { importCardSet } from '../../src/services/card.service';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import type { CardImportInput } from '@pocket-trade-hub/shared';

let app: FastifyInstance;

const testImport: CardImportInput = {
  set: {
    id: 'CS1',
    name: 'Collection Test Set',
    series: 'CT',
    cardCount: 3,
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
    {
      localId: '003',
      name: 'Misty',
      rarity: 'diamond2',
      type: null,
      category: 'trainer',
      hp: null,
      stage: null,
      imageUrl: 'https://example.com/misty.png',
      attacks: null,
      weakness: null,
      resistance: null,
      retreatCost: null,
      illustrator: 'Yusuke Kozaki',
      cardNumber: '003/100',
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

describe('POST /collection', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'POST', url: '/collection', payload: { cardId: 'CS1-001' } });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('adds card to collection (INV-01)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    const res = await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001', quantity: 2 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cardId).toBe('CS1-001');
    expect(body.quantity).toBe(2);
  });

  it('upserts on duplicate add (INV-01)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001', quantity: 1 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001', quantity: 3 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().quantity).toBe(4);
  });
});

describe('DELETE /collection/:cardId', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/collection/CS1-001' });
    expect(res.statusCode).toBe(401);
  });

  it('removes card from collection (INV-02)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    // Add first
    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });

    // Then delete
    const res = await app.inject({
      method: 'DELETE',
      url: '/collection/CS1-001',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);

    // Verify removed
    const listRes = await app.inject({
      method: 'GET',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listRes.json()).toHaveLength(0);
  });
});

describe('PUT /collection/:cardId', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'PUT', url: '/collection/CS1-001', payload: { quantity: 5 } });
    expect(res.statusCode).toBe(401);
  });

  it('updates quantity (INV-03)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/collection/CS1-001',
      headers: { authorization: `Bearer ${token}` },
      payload: { quantity: 5 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().quantity).toBe(5);
  });

  it('removes card when quantity is 0 (INV-03)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/collection/CS1-001',
      headers: { authorization: `Bearer ${token}` },
      payload: { quantity: 0 },
    });
    expect(res.statusCode).toBe(200);

    // Verify removed
    const listRes = await app.inject({
      method: 'GET',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listRes.json()).toHaveLength(0);
  });
});

describe('GET /collection', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'GET', url: '/collection' });
    expect(res.statusCode).toBe(401);
  });

  it('returns user collection items', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });
    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-002' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/collection',
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
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/collection?setId=CS1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);

    const resEmpty = await app.inject({
      method: 'GET',
      url: '/collection?setId=NONEXISTENT',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(resEmpty.json()).toHaveLength(0);
  });
});

describe('POST /collection/bulk', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/collection/bulk',
      payload: { setId: 'CS1', additions: [], removals: [] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('bulk adds and removes cards (INV-04)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    // First add one card to remove later
    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });

    // Bulk: add 002+003, remove 001
    const res = await app.inject({
      method: 'POST',
      url: '/collection/bulk',
      headers: { authorization: `Bearer ${token}` },
      payload: { setId: 'CS1', additions: ['CS1-002', 'CS1-003'], removals: ['CS1-001'] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().added).toBe(2);
    expect(res.json().removed).toBe(1);

    // Verify state
    const listRes = await app.inject({
      method: 'GET',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
    });
    const items = listRes.json();
    expect(items).toHaveLength(2);
    const cardIds = items.map((i: any) => i.cardId).sort();
    expect(cardIds).toEqual(['CS1-002', 'CS1-003']);
  });
});

describe('GET /collection/progress', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'GET', url: '/collection/progress' });
    expect(res.statusCode).toBe(401);
  });

  it('returns per-set progress (INV-05)', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    await importCardSet(testDb, testImport);

    // Add 2 of 3 cards
    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-001' },
    });
    await app.inject({
      method: 'POST',
      url: '/collection',
      headers: { authorization: `Bearer ${token}` },
      payload: { cardId: 'CS1-002' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/collection/progress',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].setId).toBe('CS1');
    expect(body[0].setName).toBe('Collection Test Set');
    expect(body[0].owned).toBe(2);
    expect(body[0].total).toBe(3);
  });
});
