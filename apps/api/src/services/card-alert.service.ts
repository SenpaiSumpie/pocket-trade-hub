import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  users,
  cards,
  userWantedCards,
  cardAlertEvents,
} from '../db/schema';
import { createNotification } from './notification.service';
import { t } from '../i18n';

type DbInstance = any;

/**
 * Checks for premium users who want the card just added by addedByUserId,
 * and creates cardAlertEvent rows for each (excluding the adder).
 */
export async function checkCardAlerts(
  db: DbInstance,
  addedByUserId: string,
  cardId: string,
) {
  // Find premium users who want this card (exclude the adder)
  const premiumWanters = await db
    .select({
      userId: userWantedCards.userId,
    })
    .from(userWantedCards)
    .innerJoin(users, eq(userWantedCards.userId, users.id))
    .where(
      and(
        eq(userWantedCards.cardId, cardId),
        eq(users.isPremium, true),
        sql`${userWantedCards.userId} != ${addedByUserId}`
      )
    );

  // Insert alert event for each premium user
  for (const row of premiumWanters) {
    await db.insert(cardAlertEvents).values({
      id: randomUUID(),
      premiumUserId: row.userId,
      cardId,
      addedByUserId,
      processed: false,
    });
  }

  return premiumWanters.length;
}

/**
 * Process unprocessed card alert events: group by user, create batched notifications,
 * and mark events as processed.
 */
export async function processCardAlertBatch(db: DbInstance) {
  // Get unprocessed events
  const events = await db
    .select({
      id: cardAlertEvents.id,
      premiumUserId: cardAlertEvents.premiumUserId,
      cardId: cardAlertEvents.cardId,
    })
    .from(cardAlertEvents)
    .where(eq(cardAlertEvents.processed, false));

  if (events.length === 0) return;

  // Group by premium user
  const byUser = new Map<string, Set<string>>();
  const eventIds: string[] = [];

  for (const event of events) {
    eventIds.push(event.id);
    const existing = byUser.get(event.premiumUserId) || new Set<string>();
    existing.add(event.cardId);
    byUser.set(event.premiumUserId, existing);
  }

  // Fetch language preferences for all affected users
  const alertUserIds = Array.from(byUser.keys());
  const alertUsers = await db
    .select({ id: users.id, uiLanguage: users.uiLanguage })
    .from(users)
    .where(sql`${users.id} = ANY(ARRAY[${sql.join(alertUserIds.map(id => sql`${id}`), sql`, `)}])`);
  const alertLangMap = new Map<string, string>(alertUsers.map((u: any) => [u.id, u.uiLanguage || 'en']));

  // Create batched notification per user
  for (const [userId, cardIds] of byUser.entries()) {
    const cardCount = cardIds.size;
    const lang = alertLangMap.get(userId) || 'en';

    await createNotification(db, {
      userId,
      type: 'card_alert',
      title: t('notifications.cardAlertTitle', lang),
      body: t('notifications.cardAlertBody', lang, { cardCount }),
      data: { cardIds: Array.from(cardIds) },
    });
  }

  // Mark all events as processed
  for (const eventId of eventIds) {
    await db
      .update(cardAlertEvents)
      .set({ processed: true })
      .where(eq(cardAlertEvents.id, eventId));
  }
}
