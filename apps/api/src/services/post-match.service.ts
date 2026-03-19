import { eq, and, ne, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tradePosts, userWantedCards, notifications, users } from '../db/schema';
import { t } from '../i18n';
import type { Server } from 'socket.io';

type DbInstance = any;

interface PostCard {
  cardId: string;
  language: string;
  name: string;
  imageUrl: string;
  rarity: string | null;
}

interface TradePostRow {
  id: string;
  userId: string;
  type: 'offering' | 'seeking';
  status: 'active' | 'closed' | 'auto_closed';
  cards: PostCard[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Find complementary active posts for a given new post.
 * - Offering post -> find active Seeking posts with matching cardId + language
 * - Seeking post -> find active Offering posts with matching cardId + language
 * Excludes posts owned by the same user.
 */
export async function findComplementaryMatches(
  db: DbInstance,
  post: TradePostRow,
): Promise<TradePostRow[]> {
  const complementaryType = post.type === 'offering' ? 'seeking' : 'offering';
  const postCards: PostCard[] = post.cards ?? [];

  if (postCards.length === 0) return [];

  // Build JSONB containment conditions for each card (cardId + language)
  const cardConditions = postCards.map((card) =>
    sql`${tradePosts.cards} @> ${JSON.stringify([{ cardId: card.cardId, language: card.language }])}::jsonb`
  );

  // Combine with OR (any card match counts)
  const cardFilter = cardConditions.length === 1
    ? cardConditions[0]
    : sql`(${sql.join(cardConditions, sql` OR `)})`;

  const matches = await db
    .select()
    .from(tradePosts)
    .where(
      and(
        eq(tradePosts.type, complementaryType),
        eq(tradePosts.status, 'active'),
        ne(tradePosts.userId, post.userId),
        cardFilter,
      ),
    );

  return matches;
}

/**
 * For Offering posts only, find users whose wanted list contains
 * matching cardId + language. Enables proactive notifications
 * even without a Seeking post.
 */
export async function findWantedListMatches(
  db: DbInstance,
  post: TradePostRow,
): Promise<Array<{ userId: string; cardId: string; language: string }>> {
  // Only Offering posts trigger wanted list matching
  if (post.type !== 'offering') return [];

  const postCards: PostCard[] = post.cards ?? [];
  if (postCards.length === 0) return [];

  const results: Array<{ userId: string; cardId: string; language: string }> = [];

  for (const card of postCards) {
    const wantedMatches = await db
      .select({
        userId: userWantedCards.userId,
        cardId: userWantedCards.cardId,
        language: userWantedCards.language,
      })
      .from(userWantedCards)
      .where(
        and(
          eq(userWantedCards.cardId, card.cardId),
          eq(userWantedCards.language, card.language),
          ne(userWantedCards.userId, post.userId),
        ),
      );

    results.push(...wantedMatches);
  }

  return results;
}

/**
 * Insert a notification row (duplicated pattern from proposal.service.ts
 * to avoid coupling between services).
 */
async function insertNotification(
  db: DbInstance,
  opts: { userId: string; type: string; title: string; body: string; data?: any },
) {
  const id = randomUUID();
  await db.insert(notifications).values({
    id,
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    data: opts.data || null,
  });
  return id;
}

/**
 * Send push notification to a specific user (duplicated pattern).
 */
async function sendPushToUser(
  db: DbInstance,
  userId: string,
  title: string,
  body: string,
) {
  try {
    const { Expo } = require('expo-server-sdk');
    const { pushTokens } = require('../db/schema');
    const expo = new Expo();

    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (tokens.length === 0) return;

    const messages: any[] = [];
    for (const record of tokens) {
      if (!Expo.isExpoPushToken(record.token)) continue;
      messages.push({ to: record.token, sound: 'default', title, body });
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch {
          // Push failures are non-critical
        }
      }
    }
  } catch {
    // Push notification failures are non-critical
  }
}

/**
 * Main worker entry: process a post-match job.
 * 1. Load the post
 * 2. Find complementary posts + wanted list matches
 * 3. Group by userId (batch one notification per user)
 * 4. Send notifications + socket events
 */
export async function processPostMatch(
  db: DbInstance,
  io: Server | null,
  postId: string,
) {
  // Load the post
  const [post] = await db
    .select()
    .from(tradePosts)
    .where(eq(tradePosts.id, postId))
    .limit(1);

  if (!post || post.status !== 'active') return;

  // Find complementary posts
  const complementaryPosts = await findComplementaryMatches(db, post);

  // Find wanted list matches (Offering posts only)
  const wantedMatches = await findWantedListMatches(db, post);

  // Group all matched userIds (one notification per user)
  const matchedUserIds = new Set<string>();

  for (const cp of complementaryPosts) {
    matchedUserIds.add(cp.userId);
  }

  for (const wm of wantedMatches) {
    matchedUserIds.add(wm.userId);
  }

  if (matchedUserIds.size === 0) return;

  // Send batched notification per user
  const postCards: PostCard[] = post.cards ?? [];
  const cardName = postCards[0]?.name ?? 'a card';

  // Fetch language preferences for all matched users
  const userIds = Array.from(matchedUserIds);
  const userRows = await db
    .select({ id: users.id, uiLanguage: users.uiLanguage })
    .from(users)
    .where(sql`${users.id} = ANY(ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}])`);
  const langMap = new Map<string, string>(userRows.map((u: any) => [u.id, u.uiLanguage || 'en']));

  for (const userId of matchedUserIds) {
    const lang = langMap.get(userId) || 'en';
    const title = post.type === 'offering'
      ? t('notifications.postMatchOfferingTitle', lang)
      : t('notifications.postMatchSeekingTitle', lang);
    const body = post.type === 'offering'
      ? t('notifications.postMatchOfferingBody', lang, { cardName })
      : t('notifications.postMatchSeekingBody', lang, { cardName });

    await insertNotification(db, {
      userId,
      type: 'post_match',
      title,
      body,
      data: { postId: post.id, postType: post.type },
    });

    // Socket.IO event
    if (io) {
      io.to(`user:${userId}`).emit('post-match', {
        postId: post.id,
        postType: post.type,
      });
    }

    // Push notification
    await sendPushToUser(db, userId, title, body);
  }
}
