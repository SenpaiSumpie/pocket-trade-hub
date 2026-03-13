import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import {
  searchCards,
  getCardById,
  getCardTranslations,
} from '../../src/services/card.service';
import { importCardSet } from '../../src/services/card.service';
import { cardTranslations } from '../../src/db/schema';
import type { CardImportInput } from '@pocket-trade-hub/shared';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

const testImport: CardImportInput = {
  set: {
    id: 'TL1',
    name: 'Translation Test Set',
    series: 'TL',
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

async function seedTranslations() {
  await testDb.insert(cardTranslations).values([
    {
      id: 'TL1-001-de',
      cardId: 'TL1-001',
      language: 'de',
      name: 'Glurak',
      imageUrl: 'https://example.com/charizard-de.png',
      attacks: [{ name: 'Feuerball', damage: '200', energyCost: ['fire'], description: null }],
    },
    {
      id: 'TL1-001-fr',
      cardId: 'TL1-001',
      language: 'fr',
      name: 'Dracaufeu',
      imageUrl: 'https://example.com/charizard-fr.png',
      attacks: [{ name: 'Feu Infernal', damage: '200', energyCost: ['fire'], description: null }],
    },
    {
      id: 'TL1-002-de',
      cardId: 'TL1-002',
      language: 'de',
      name: 'Pikachu',
      imageUrl: 'https://example.com/pikachu-de.png',
      attacks: [{ name: 'Donnerschock', damage: '20', energyCost: ['electric'], description: null }],
    },
  ]);
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
  await importCardSet(testDb, testImport);
  await seedTranslations();
});

describe('searchCards with language', () => {
  it('returns translated name and imageUrl when language is provided', async () => {
    const result = await searchCards(testDb, { language: 'de', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(2);
    const charizard = result.cards.find((c: any) => c.name === 'Glurak');
    expect(charizard).toBeDefined();
    expect(charizard!.imageUrl).toBe('https://example.com/charizard-de.png');
  });

  it('returns English data when no language is provided (backward compatible)', async () => {
    const result = await searchCards(testDb, { limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(2);
    const charizard = result.cards.find((c: any) => c.name === 'Charizard');
    expect(charizard).toBeDefined();
    expect(charizard!.imageUrl).toBe('https://example.com/charizard.png');
  });

  it('searches French card names when language=fr and q is provided', async () => {
    const result = await searchCards(testDb, { q: 'Dracaufeu', language: 'fr', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Dracaufeu');
  });

  it('returns only cards that have a translation in the specified language', async () => {
    // Only Charizard has a French translation
    const result = await searchCards(testDb, { language: 'fr', limit: 50, offset: 0 });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].name).toBe('Dracaufeu');
  });
});

describe('getCardTranslations', () => {
  it('returns all translations for a card', async () => {
    const translations = await getCardTranslations(testDb, 'TL1-001');
    expect(translations).toHaveLength(2);
    const languages = translations.map((t: any) => t.language).sort();
    expect(languages).toEqual(['de', 'fr']);
  });

  it('returns empty array for card with no translations', async () => {
    // Create a card with no translations
    const noTranslationImport: CardImportInput = {
      set: {
        id: 'NT1',
        name: 'No Translation Set',
        series: 'NT',
        cardCount: 1,
        releaseDate: '2024-01-01',
        imageUrl: 'https://example.com/set.png',
      },
      cards: [{
        localId: '001',
        name: 'Bulbasaur',
        rarity: 'diamond1',
        type: 'grass',
        category: 'pokemon',
        hp: 45,
        stage: 'Basic',
        imageUrl: 'https://example.com/bulbasaur.png',
        attacks: null,
        weakness: 'fire',
        resistance: null,
        retreatCost: 1,
        illustrator: 'Ken Sugimori',
        cardNumber: '001/100',
      }],
    };
    await importCardSet(testDb, noTranslationImport);
    const translations = await getCardTranslations(testDb, 'NT1-001');
    expect(translations).toHaveLength(0);
  });
});

describe('getCardById with language', () => {
  it('returns translated name and imageUrl when language is provided', async () => {
    const card = await getCardById(testDb, 'TL1-001', 'de');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Glurak');
    expect(card!.imageUrl).toBe('https://example.com/charizard-de.png');
  });

  it('returns English data when no language is provided', async () => {
    const card = await getCardById(testDb, 'TL1-001');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Charizard');
    expect(card!.imageUrl).toBe('https://example.com/charizard.png');
  });

  it('returns base card when translation for language does not exist', async () => {
    const card = await getCardById(testDb, 'TL1-001', 'ja');
    expect(card).not.toBeNull();
    // Should fall back to English
    expect(card!.name).toBe('Charizard');
  });
});
