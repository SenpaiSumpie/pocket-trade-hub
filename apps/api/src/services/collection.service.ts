import { eq, and, sql, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { userCollectionItems, cards, sets } from '../db/schema';

type Db = any;

export async function addToCollection(db: Db, userId: string, cardId: string, quantity = 1, language = 'en') {
  const id = randomUUID();
  const now = new Date();

  const result = await db
    .insert(userCollectionItems)
    .values({ id, userId, cardId, language, quantity, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [userCollectionItems.userId, userCollectionItems.cardId, userCollectionItems.language],
      set: {
        quantity: sql`${userCollectionItems.quantity} + ${quantity}`,
        updatedAt: now,
      },
    })
    .returning();

  return result[0];
}

export async function removeFromCollection(db: Db, userId: string, cardId: string, language = 'en') {
  const result = await db
    .delete(userCollectionItems)
    .where(and(
      eq(userCollectionItems.userId, userId),
      eq(userCollectionItems.cardId, cardId),
      eq(userCollectionItems.language, language),
    ))
    .returning();

  return result.length > 0;
}

export async function updateQuantity(db: Db, userId: string, cardId: string, quantity: number, language = 'en') {
  if (quantity <= 0) {
    return removeFromCollection(db, userId, cardId, language);
  }

  const result = await db
    .update(userCollectionItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(
      eq(userCollectionItems.userId, userId),
      eq(userCollectionItems.cardId, cardId),
      eq(userCollectionItems.language, language),
    ))
    .returning();

  return result[0] ?? null;
}

export async function bulkUpdateCollection(
  db: Db,
  userId: string,
  additions: string[],
  removals: string[],
) {
  return await db.transaction(async (tx: Db) => {
    // Process additions in batches of 50
    for (let i = 0; i < additions.length; i += 50) {
      const batch = additions.slice(i, i + 50);
      for (const cardId of batch) {
        await addToCollection(tx, userId, cardId, 1);
      }
    }

    // Process removals
    for (const cardId of removals) {
      await removeFromCollection(tx, userId, cardId);
    }

    return { added: additions.length, removed: removals.length };
  });
}

export async function getCollectionProgress(db: Db, userId: string) {
  const result = await db
    .select({
      setId: sets.id,
      setName: sets.name,
      owned: count(userCollectionItems.id),
      total: sets.cardCount,
    })
    .from(sets)
    .leftJoin(
      cards,
      eq(cards.setId, sets.id),
    )
    .leftJoin(
      userCollectionItems,
      and(
        eq(userCollectionItems.cardId, cards.id),
        eq(userCollectionItems.userId, userId),
      ),
    )
    .groupBy(sets.id, sets.name, sets.cardCount);

  return result;
}

export async function getUserCollection(db: Db, userId: string, setId?: string) {
  const conditions = [eq(userCollectionItems.userId, userId)];

  if (setId) {
    conditions.push(eq(cards.setId, setId));
    return db
      .select({
        cardId: userCollectionItems.cardId,
        language: userCollectionItems.language,
        quantity: userCollectionItems.quantity,
      })
      .from(userCollectionItems)
      .innerJoin(cards, eq(cards.id, userCollectionItems.cardId))
      .where(and(...conditions));
  }

  return db
    .select({
      cardId: userCollectionItems.cardId,
      language: userCollectionItems.language,
      quantity: userCollectionItems.quantity,
    })
    .from(userCollectionItems)
    .where(and(...conditions));
}
