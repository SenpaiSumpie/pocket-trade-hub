import { eq, sql, desc, asc, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  cards,
  userWantedCards,
  userCollectionItems,
  cardAnalytics,
} from '../db/schema';

type DbInstance = any;

export async function computeMostWanted(db: DbInstance) {
  // Count how many users want each card, ordered desc, limit 10
  const rows = await db
    .select({
      cardId: userWantedCards.cardId,
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(userWantedCards)
    .groupBy(userWantedCards.cardId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Delete old most_wanted rows
  await db.delete(cardAnalytics).where(eq(cardAnalytics.metric, 'most_wanted'));

  // Insert new rows with rank
  for (let i = 0; i < rows.length; i++) {
    await db.insert(cardAnalytics).values({
      id: randomUUID(),
      cardId: rows[i].cardId,
      metric: 'most_wanted',
      value: rows[i].count,
      rank: i + 1,
      computedAt: new Date(),
    });
  }
}

export async function computeLeastAvailable(db: DbInstance) {
  // LEFT JOIN cards with collection items, count owners, order ASC (fewest first)
  const rows = await db
    .select({
      cardId: cards.id,
      count: sql<number>`count(${userCollectionItems.id})::int`.as('count'),
    })
    .from(cards)
    .leftJoin(userCollectionItems, eq(cards.id, userCollectionItems.cardId))
    .groupBy(cards.id)
    .orderBy(asc(sql`count(${userCollectionItems.id})`))
    .limit(10);

  // Delete old least_available rows
  await db.delete(cardAnalytics).where(eq(cardAnalytics.metric, 'least_available'));

  // Insert new rows with rank
  for (let i = 0; i < rows.length; i++) {
    await db.insert(cardAnalytics).values({
      id: randomUUID(),
      cardId: rows[i].cardId,
      metric: 'least_available',
      value: rows[i].count,
      rank: i + 1,
      computedAt: new Date(),
    });
  }
}

export async function computeTrending(db: DbInstance) {
  // Cards with most wanted-list additions in past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const rows = await db
    .select({
      cardId: userWantedCards.cardId,
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(userWantedCards)
    .where(sql`${userWantedCards.createdAt} > ${sevenDaysAgoISO}::timestamp`)
    .groupBy(userWantedCards.cardId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Delete old trending rows
  await db.delete(cardAnalytics).where(eq(cardAnalytics.metric, 'trending'));

  // Insert new rows with rank
  for (let i = 0; i < rows.length; i++) {
    await db.insert(cardAnalytics).values({
      id: randomUUID(),
      cardId: rows[i].cardId,
      metric: 'trending',
      value: rows[i].count,
      rank: i + 1,
      computedAt: new Date(),
    });
  }
}

export async function computeAllAnalytics(db: DbInstance) {
  await computeMostWanted(db);
  await computeLeastAvailable(db);
  await computeTrending(db);
}

export async function getAnalytics(db: DbInstance) {
  // Read pre-computed rows, join with cards for details
  const rows = await db
    .select({
      cardId: cardAnalytics.cardId,
      metric: cardAnalytics.metric,
      value: cardAnalytics.value,
      rank: cardAnalytics.rank,
      cardName: cards.name,
      cardImageUrl: cards.imageUrl,
      rarity: cards.rarity,
    })
    .from(cardAnalytics)
    .innerJoin(cards, eq(cardAnalytics.cardId, cards.id))
    .orderBy(asc(cardAnalytics.rank));

  const result: {
    mostWanted: any[];
    leastAvailable: any[];
    trending: any[];
  } = {
    mostWanted: [],
    leastAvailable: [],
    trending: [],
  };

  for (const row of rows) {
    const item = {
      cardId: row.cardId,
      cardName: row.cardName,
      cardImageUrl: row.cardImageUrl,
      rarity: row.rarity,
      value: row.value,
      rank: row.rank,
    };

    switch (row.metric) {
      case 'most_wanted':
        result.mostWanted.push(item);
        break;
      case 'least_available':
        result.leastAvailable.push(item);
        break;
      case 'trending':
        result.trending.push(item);
        break;
    }
  }

  return result;
}

export async function getTradePower(db: DbInstance, userId: string) {
  // Cards in user's collection that appear most in other users' wanted lists
  const rows = await db
    .select({
      cardId: userCollectionItems.cardId,
      count: sql<number>`count(${userWantedCards.id})::int`.as('count'),
      cardName: cards.name,
      cardImageUrl: cards.imageUrl,
      rarity: cards.rarity,
    })
    .from(userCollectionItems)
    .innerJoin(cards, eq(userCollectionItems.cardId, cards.id))
    .innerJoin(
      userWantedCards,
      and(
        eq(userCollectionItems.cardId, userWantedCards.cardId),
        sql`${userWantedCards.userId} != ${userId}`
      )
    )
    .where(eq(userCollectionItems.userId, userId))
    .groupBy(userCollectionItems.cardId, cards.name, cards.imageUrl, cards.rarity)
    .orderBy(desc(sql`count(${userWantedCards.id})`))
    .limit(10);

  return rows.map((row: any, index: number) => ({
    cardId: row.cardId,
    cardName: row.cardName,
    cardImageUrl: row.cardImageUrl,
    rarity: row.rarity,
    value: row.count,
    rank: index + 1,
  }));
}
