import { eq, ilike, and, sql, count } from 'drizzle-orm';
import { cards, sets, cardTranslations } from '../db/schema';
import type { CardSearchParams, CardImportInput } from '@pocket-trade-hub/shared';

type Db = any;

export async function searchCards(db: Db, params: CardSearchParams) {
  const conditions: any[] = [];

  // When language is provided, INNER JOIN with cardTranslations to filter and use translated data
  if (params.language) {
    const langConditions: any[] = [
      eq(cardTranslations.language, params.language),
    ];

    if (params.q) {
      langConditions.push(ilike(cardTranslations.name, `%${params.q}%`));
    }
    if (params.set) {
      langConditions.push(eq(cards.setId, params.set));
    }
    if (params.rarity) {
      langConditions.push(eq(cards.rarity, params.rarity));
    }
    if (params.type) {
      langConditions.push(eq(cards.type, params.type));
    }

    const whereClause = and(...langConditions);

    const [cardResults, totalResult] = await Promise.all([
      db
        .select({
          id: cards.id,
          setId: cards.setId,
          localId: cards.localId,
          name: cardTranslations.name,
          rarity: cards.rarity,
          type: cards.type,
          category: cards.category,
          hp: cards.hp,
          stage: cards.stage,
          imageUrl: cardTranslations.imageUrl,
          attacks: cardTranslations.attacks,
          weakness: cards.weakness,
          resistance: cards.resistance,
          retreatCost: cards.retreatCost,
          illustrator: cards.illustrator,
          cardNumber: cards.cardNumber,
          createdAt: cards.createdAt,
          language: cardTranslations.language,
        })
        .from(cards)
        .innerJoin(cardTranslations, eq(cardTranslations.cardId, cards.id))
        .where(whereClause)
        .limit(params.limit)
        .offset(params.offset),
      db
        .select({ count: count() })
        .from(cards)
        .innerJoin(cardTranslations, eq(cardTranslations.cardId, cards.id))
        .where(whereClause),
    ]);

    return {
      cards: cardResults,
      total: totalResult[0]?.count ?? 0,
    };
  }

  // Default: no language, use English canonical data from cards table
  if (params.q) {
    conditions.push(ilike(cards.name, `%${params.q}%`));
  }
  if (params.set) {
    conditions.push(eq(cards.setId, params.set));
  }
  if (params.rarity) {
    conditions.push(eq(cards.rarity, params.rarity));
  }
  if (params.type) {
    conditions.push(eq(cards.type, params.type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [cardResults, totalResult] = await Promise.all([
    db
      .select()
      .from(cards)
      .where(whereClause)
      .limit(params.limit)
      .offset(params.offset),
    db
      .select({ count: count() })
      .from(cards)
      .where(whereClause),
  ]);

  return {
    cards: cardResults,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function getCardTranslations(db: Db, cardId: string) {
  const results = await db
    .select({
      language: cardTranslations.language,
      name: cardTranslations.name,
      imageUrl: cardTranslations.imageUrl,
      attacks: cardTranslations.attacks,
    })
    .from(cardTranslations)
    .where(eq(cardTranslations.cardId, cardId));

  return results;
}

export async function getCardById(db: Db, id: string, language?: string) {
  if (language) {
    // Try to get translated version
    const result = await db
      .select({
        id: cards.id,
        setId: cards.setId,
        localId: cards.localId,
        name: cardTranslations.name,
        rarity: cards.rarity,
        type: cards.type,
        category: cards.category,
        hp: cards.hp,
        stage: cards.stage,
        imageUrl: cardTranslations.imageUrl,
        attacks: cardTranslations.attacks,
        weakness: cards.weakness,
        resistance: cards.resistance,
        retreatCost: cards.retreatCost,
        illustrator: cards.illustrator,
        cardNumber: cards.cardNumber,
        createdAt: cards.createdAt,
        language: cardTranslations.language,
      })
      .from(cards)
      .innerJoin(
        cardTranslations,
        and(
          eq(cardTranslations.cardId, cards.id),
          eq(cardTranslations.language, language),
        ),
      )
      .where(eq(cards.id, id))
      .limit(1);

    if (result[0]) {
      return result[0];
    }

    // Fall back to English base card if no translation exists
  }

  const result = await db
    .select()
    .from(cards)
    .where(eq(cards.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function getCardsBySet(db: Db, setId: string, limit = 50, offset = 0) {
  const [cardResults, totalResult] = await Promise.all([
    db
      .select()
      .from(cards)
      .where(eq(cards.setId, setId))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(cards)
      .where(eq(cards.setId, setId)),
  ]);

  return {
    cards: cardResults,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function getAllSets(db: Db) {
  return db
    .select()
    .from(sets)
    .orderBy(sets.name);
}

export async function importCardSet(db: Db, data: CardImportInput) {
  // Check for duplicate set
  const existing = await db
    .select()
    .from(sets)
    .where(eq(sets.id, data.set.id))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Set "${data.set.id}" already exists`);
  }

  return await db.transaction(async (tx: Db) => {
    // Insert the set
    await tx.insert(sets).values({
      id: data.set.id,
      name: data.set.name,
      series: data.set.series,
      cardCount: data.cards.length,
      releaseDate: data.set.releaseDate,
      imageUrl: data.set.imageUrl,
    });

    // Insert cards in batches of 50
    const cardValues = data.cards.map((card) => ({
      id: `${data.set.id}-${card.localId}`,
      setId: data.set.id,
      localId: card.localId,
      name: card.name,
      rarity: card.rarity,
      type: card.type,
      category: card.category,
      hp: card.hp,
      stage: card.stage,
      imageUrl: card.imageUrl,
      attacks: card.attacks,
      weakness: card.weakness,
      resistance: card.resistance,
      retreatCost: card.retreatCost,
      illustrator: card.illustrator,
      cardNumber: card.cardNumber,
    }));

    for (let i = 0; i < cardValues.length; i += 50) {
      const batch = cardValues.slice(i, i + 50);
      await tx.insert(cards).values(batch);
    }

    return {
      setId: data.set.id,
      setName: data.set.name,
      cardCount: cardValues.length,
    };
  });
}
