import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { userWantedCards, cards } from '../db/schema';
import type { Priority } from '@pocket-trade-hub/shared';

type Db = any;

export async function addToWanted(db: Db, userId: string, cardId: string, priority: Priority = 'medium', language = 'en') {
  const id = randomUUID();
  const now = new Date();

  const result = await db
    .insert(userWantedCards)
    .values({ id, userId, cardId, language, priority, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [userWantedCards.userId, userWantedCards.cardId, userWantedCards.language],
      set: {
        priority,
        updatedAt: now,
      },
    })
    .returning();

  return result[0];
}

export async function removeFromWanted(db: Db, userId: string, cardId: string, language = 'en') {
  const result = await db
    .delete(userWantedCards)
    .where(and(
      eq(userWantedCards.userId, userId),
      eq(userWantedCards.cardId, cardId),
      eq(userWantedCards.language, language),
    ))
    .returning();

  return result.length > 0;
}

export async function updatePriority(db: Db, userId: string, cardId: string, priority: Priority, language = 'en') {
  const result = await db
    .update(userWantedCards)
    .set({ priority, updatedAt: new Date() })
    .where(and(
      eq(userWantedCards.userId, userId),
      eq(userWantedCards.cardId, cardId),
      eq(userWantedCards.language, language),
    ))
    .returning();

  return result[0] ?? null;
}

export async function getUserWanted(db: Db, userId: string, setId?: string) {
  const conditions = [eq(userWantedCards.userId, userId)];

  if (setId) {
    conditions.push(eq(cards.setId, setId));
    return db
      .select({
        cardId: userWantedCards.cardId,
        language: userWantedCards.language,
        priority: userWantedCards.priority,
      })
      .from(userWantedCards)
      .innerJoin(cards, eq(cards.id, userWantedCards.cardId))
      .where(and(...conditions));
  }

  return db
    .select({
      cardId: userWantedCards.cardId,
      language: userWantedCards.language,
      priority: userWantedCards.priority,
    })
    .from(userWantedCards)
    .where(and(...conditions));
}
