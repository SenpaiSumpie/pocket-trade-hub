import { eq, ilike, and, sql, count } from 'drizzle-orm';
import { cards, sets } from '../db/schema';
import type { CardSearchParams, CardImportInput } from '@pocket-trade-hub/shared';

type Db = any;

export async function searchCards(db: Db, params: CardSearchParams) {
  const conditions: any[] = [];

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

export async function getCardById(db: Db, id: string) {
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
