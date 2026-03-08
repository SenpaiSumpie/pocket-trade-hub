import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { importCardSet } from '../../src/services/card.service';
import type { CardImportInput } from '@pocket-trade-hub/shared';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

const testImport: CardImportInput = {
  set: {
    id: 'T1',
    name: 'Test Set',
    series: 'T',
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

describe('GET /sets', () => {
  it('returns empty array when no sets exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/sets' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns all sets', async () => {
    await importCardSet(testDb, testImport);
    const res = await app.inject({ method: 'GET', url: '/sets' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Test Set');
  });
});

describe('GET /sets/:id/cards', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('returns paginated cards for a set', async () => {
    const res = await app.inject({ method: 'GET', url: '/sets/T1/cards' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(3);
    expect(body.total).toBe(3);
  });

  it('respects limit and offset query params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/sets/T1/cards?limit=1&offset=1',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(1);
    expect(body.total).toBe(3);
  });

  it('returns empty for non-existent set', async () => {
    const res = await app.inject({ method: 'GET', url: '/sets/NONE/cards' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe('GET /cards/search', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('searches by name', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/cards/search?q=charizard',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].name).toBe('Charizard');
  });

  it('filters by set', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/cards/search?set=T1',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(3);
  });

  it('filters by rarity', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/cards/search?rarity=diamond1',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].name).toBe('Pikachu');
  });

  it('filters by type', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/cards/search?type=fire',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(1);
    expect(body.cards[0].name).toBe('Charizard');
  });

  it('returns all cards when no filters applied', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/cards/search',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.cards).toHaveLength(3);
  });
});

describe('GET /cards/:id', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('returns a card by id', async () => {
    const res = await app.inject({ method: 'GET', url: '/cards/T1-001' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe('Charizard');
  });

  it('returns 404 for non-existent card', async () => {
    const res = await app.inject({ method: 'GET', url: '/cards/nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});
