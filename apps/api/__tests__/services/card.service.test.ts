import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import {
  searchCards,
  getCardById,
  getCardsBySet,
  getAllSets,
  importCardSet,
} from '../../src/services/card.service';
import type { CardImportInput } from '@pocket-trade-hub/shared';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

const testSet: CardImportInput['set'] = {
  id: 'T1',
  name: 'Test Set',
  series: 'T',
  cardCount: 3,
  releaseDate: '2024-01-01',
  imageUrl: 'https://example.com/set.png',
};

const testCards: CardImportInput['cards'] = [
  {
    localId: '001',
    name: 'Charizard',
    rarity: 'star2',
    type: 'fire',
    category: 'pokemon',
    hp: 180,
    stage: 'Stage 2',
    imageUrl: 'https://example.com/charizard.png',
    attacks: [{ name: 'Fire Blast', damage: '200', energyCost: ['fire', 'fire', 'fire', 'colorless'], description: null }],
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
];

const testImport: CardImportInput = {
  set: testSet,
  cards: testCards,
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

describe('importCardSet', () => {
  it('creates set and cards in a transaction', async () => {
    const result = await importCardSet(testDb, testImport);

    expect(result.setId).toBe('T1');
    expect(result.setName).toBe('Test Set');
    expect(result.cardCount).toBe(3);
  });

  it('rejects duplicate set id', async () => {
    await importCardSet(testDb, testImport);
    await expect(importCardSet(testDb, testImport)).rejects.toThrow(
      'Set "T1" already exists'
    );
  });
});

describe('searchCards', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('returns all cards when no filters applied', async () => {
    const result = await searchCards(testDb, { limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('searches by name (ILIKE)', async () => {
    const result = await searchCards(testDb, { q: 'charizard', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Charizard');
  });

  it('searches by name case-insensitively', async () => {
    const result = await searchCards(testDb, { q: 'PIKACHU', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Pikachu');
  });

  it('filters by set', async () => {
    const result = await searchCards(testDb, { set: 'T1', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(3);
  });

  it('filters by rarity', async () => {
    const result = await searchCards(testDb, { rarity: 'diamond1', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Pikachu');
  });

  it('filters by type', async () => {
    const result = await searchCards(testDb, { type: 'fire', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Charizard');
  });

  it('applies AND logic with multiple filters', async () => {
    const result = await searchCards(testDb, {
      q: 'char',
      type: 'fire',
      rarity: 'star2',
      limit: 50,
      offset: 0,
    });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Charizard');
  });

  it('returns empty for non-matching combined filters', async () => {
    const result = await searchCards(testDb, {
      q: 'pikachu',
      type: 'fire',
      limit: 50,
      offset: 0,
    });
    expect(result.cards).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('respects limit', async () => {
    const result = await searchCards(testDb, { limit: 2, offset: 0 });
    expect(result.cards).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('respects offset', async () => {
    const result = await searchCards(testDb, { limit: 50, offset: 2 });
    expect(result.cards).toHaveLength(1);
  });
});

describe('getCardById', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('returns card when found', async () => {
    const card = await getCardById(testDb, 'T1-001');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Charizard');
  });

  it('returns null when not found', async () => {
    const card = await getCardById(testDb, 'nonexistent');
    expect(card).toBeNull();
  });
});

describe('getCardsBySet', () => {
  beforeEach(async () => {
    await importCardSet(testDb, testImport);
  });

  it('returns paginated cards for a set', async () => {
    const result = await getCardsBySet(testDb, 'T1', 2, 0);
    expect(result.cards).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('returns empty for non-existent set', async () => {
    const result = await getCardsBySet(testDb, 'nonexistent');
    expect(result.cards).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('getAllSets', () => {
  it('returns empty when no sets exist', async () => {
    const result = await getAllSets(testDb);
    expect(result).toHaveLength(0);
  });

  it('returns all sets ordered by name', async () => {
    await importCardSet(testDb, testImport);

    // Import a second set
    const secondImport: CardImportInput = {
      set: { ...testSet, id: 'A1', name: 'Alpha Set' },
      cards: [testCards[0]],
    };
    await importCardSet(testDb, secondImport);

    const result = await getAllSets(testDb);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alpha Set');
    expect(result[1].name).toBe('Test Set');
  });
});
