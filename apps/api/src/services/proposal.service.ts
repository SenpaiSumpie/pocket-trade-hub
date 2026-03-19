import { eq, and, or, ne, desc, asc, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tradeProposals, tradeRatings, notifications, users, userCollectionItems, userWantedCards, tradePosts } from '../db/schema';
import type { Server } from 'socket.io';
import { addToCollection, getUserCollection, updateQuantity } from './collection.service';
import { removeFromWanted } from './wanted.service';
import { t } from '../i18n';

type DbInstance = any;

interface CreateProposalOpts {
  senderId: string;
  receiverId: string;
  matchId?: string;
  postId?: string;
  senderGives: any[];
  senderGets: any[];
  fairnessScore: number;
  parentId?: string;
}

interface GetProposalsOpts {
  direction?: 'incoming' | 'outgoing' | 'all';
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create a notification row in the notifications table.
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
 * Send push notification to a specific user's push tokens.
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

export async function createProposal(
  db: DbInstance,
  io: Server | null,
  opts: CreateProposalOpts,
) {
  const id = randomUUID();

  // If this is a counter-offer, mark parent as 'countered'
  if (opts.parentId) {
    const result = await db
      .update(tradeProposals)
      .set({ status: 'countered', updatedAt: new Date() })
      .where(
        and(
          eq(tradeProposals.id, opts.parentId),
          eq(tradeProposals.status, 'pending'),
        ),
      )
      .returning({ id: tradeProposals.id });

    if (result.length === 0) {
      throw Object.assign(new Error('Parent proposal is not pending'), {
        statusCode: 409,
      });
    }
  }

  // Validate post status if postId provided
  if (opts.postId) {
    const [post] = await db
      .select()
      .from(tradePosts)
      .where(eq(tradePosts.id, opts.postId))
      .limit(1);

    if (!post) {
      throw Object.assign(new Error('Post not found'), { statusCode: 404 });
    }

    if (post.status !== 'active') {
      throw Object.assign(new Error('Post is no longer active'), { statusCode: 409 });
    }
  }

  const [proposal] = await db
    .insert(tradeProposals)
    .values({
      id,
      matchId: opts.matchId || null,
      postId: opts.postId || null,
      senderId: opts.senderId,
      receiverId: opts.receiverId,
      parentId: opts.parentId || null,
      senderGives: opts.senderGives,
      senderGets: opts.senderGets,
      fairnessScore: opts.fairnessScore,
    })
    .returning();

  // Get receiver's language preference
  const [receiver] = await db
    .select({ uiLanguage: users.uiLanguage })
    .from(users)
    .where(eq(users.id, opts.receiverId));
  const lang = receiver?.uiLanguage || 'en';

  // Create notification for receiver
  const notifType = opts.parentId ? 'proposal_countered' : 'proposal_received';
  const notifTitle = opts.parentId
    ? t('notifications.proposalCounteredTitle', lang)
    : t('notifications.proposalReceivedTitle', lang);
  const notifBody = opts.parentId
    ? t('notifications.proposalCounteredBody', lang)
    : t('notifications.proposalReceivedBody', lang);

  await insertNotification(db, {
    userId: opts.receiverId,
    type: notifType,
    title: notifTitle,
    body: notifBody,
    data: { proposalId: id, matchId: opts.matchId || null, postId: opts.postId || null },
  });

  // Emit socket event
  const socketEvent = opts.parentId ? 'proposal-countered' : 'new-proposal';
  if (io) {
    io.to(`user:${opts.receiverId}`).emit(socketEvent, {
      proposalId: id,
      senderId: opts.senderId,
      matchId: opts.matchId || null,
      postId: opts.postId || null,
    });
  }

  // Send push notification
  await sendPushToUser(db, opts.receiverId, notifTitle, notifBody);

  return proposal;
}

export async function acceptProposal(
  db: DbInstance,
  io: Server | null,
  proposalId: string,
  responderId: string,
) {
  const result = await db
    .update(tradeProposals)
    .set({ status: 'accepted', updatedAt: new Date() })
    .where(
      and(
        eq(tradeProposals.id, proposalId),
        eq(tradeProposals.status, 'pending'),
        eq(tradeProposals.receiverId, responderId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw Object.assign(
      new Error('Proposal not found, not pending, or not authorized'),
      { statusCode: 409 },
    );
  }

  const proposal = result[0];

  // Get sender's language preference
  const [senderUser] = await db
    .select({ uiLanguage: users.uiLanguage })
    .from(users)
    .where(eq(users.id, proposal.senderId));
  const acceptLang = senderUser?.uiLanguage || 'en';

  await insertNotification(db, {
    userId: proposal.senderId,
    type: 'proposal_accepted',
    title: t('notifications.proposalAcceptedTitle', acceptLang),
    body: t('notifications.proposalAcceptedBody', acceptLang),
    data: { proposalId },
  });

  if (io) {
    io.to(`user:${proposal.senderId}`).emit('proposal-accepted', {
      proposalId,
      responderId,
    });
  }

  await sendPushToUser(
    db,
    proposal.senderId,
    t('notifications.proposalAcceptedTitle', acceptLang),
    t('notifications.proposalAcceptedBody', acceptLang),
  );

  return proposal;
}

export async function rejectProposal(
  db: DbInstance,
  io: Server | null,
  proposalId: string,
  responderId: string,
) {
  const result = await db
    .update(tradeProposals)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(
      and(
        eq(tradeProposals.id, proposalId),
        eq(tradeProposals.status, 'pending'),
        eq(tradeProposals.receiverId, responderId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw Object.assign(
      new Error('Proposal not found, not pending, or not authorized'),
      { statusCode: 409 },
    );
  }

  const proposal = result[0];

  // Get sender's language preference
  const [rejectSenderUser] = await db
    .select({ uiLanguage: users.uiLanguage })
    .from(users)
    .where(eq(users.id, proposal.senderId));
  const rejectLang = rejectSenderUser?.uiLanguage || 'en';

  await insertNotification(db, {
    userId: proposal.senderId,
    type: 'proposal_rejected',
    title: t('notifications.proposalRejectedTitle', rejectLang),
    body: t('notifications.proposalRejectedBody', rejectLang),
    data: { proposalId },
  });

  if (io) {
    io.to(`user:${proposal.senderId}`).emit('proposal-rejected', {
      proposalId,
      responderId,
    });
  }

  await sendPushToUser(
    db,
    proposal.senderId,
    t('notifications.proposalRejectedTitle', rejectLang),
    t('notifications.proposalRejectedBody', rejectLang),
  );

  return proposal;
}

export async function counterProposal(
  db: DbInstance,
  io: Server | null,
  opts: CreateProposalOpts,
) {
  // counterProposal is just createProposal with parentId set
  return createProposal(db, io, opts);
}

export async function completeProposal(
  db: DbInstance,
  io: Server | null,
  proposalId: string,
  userId: string,
) {
  const result = await db
    .update(tradeProposals)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(
      and(
        eq(tradeProposals.id, proposalId),
        eq(tradeProposals.status, 'accepted'),
        or(
          eq(tradeProposals.senderId, userId),
          eq(tradeProposals.receiverId, userId),
        ),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw Object.assign(
      new Error('Proposal not found, not accepted, or not authorized'),
      { statusCode: 409 },
    );
  }

  const proposal = result[0];
  const { senderId, receiverId } = proposal;
  const senderGives: Array<{ cardId: string; cardName: string; imageUrl: string; rarity: string }> = proposal.senderGives ?? [];
  const senderGets: Array<{ cardId: string; cardName: string; imageUrl: string; rarity: string }> = proposal.senderGets ?? [];

  // ── 1. Transfer inventory inside a transaction ──
  await db.transaction(async (tx: DbInstance) => {
    // Get current collections for both users to determine quantities
    const senderCollection = await getUserCollection(tx, senderId);
    const receiverCollection = await getUserCollection(tx, receiverId);

    const senderCollectionMap = new Map<string, number>();
    for (const item of senderCollection) {
      senderCollectionMap.set(item.cardId, item.quantity);
    }
    const receiverCollectionMap = new Map<string, number>();
    for (const item of receiverCollection) {
      receiverCollectionMap.set(item.cardId, item.quantity);
    }

    // senderGives: sender loses cards, receiver gains cards
    for (const card of senderGives) {
      const currentQty = senderCollectionMap.get(card.cardId) ?? 0;
      if (currentQty <= 1) {
        // Remove entirely if quantity would be 0
        await updateQuantity(tx, senderId, card.cardId, 0);
      } else {
        await updateQuantity(tx, senderId, card.cardId, currentQty - 1);
      }
      await addToCollection(tx, receiverId, card.cardId, 1);

      // Remove from receiver's wanted list if they wanted this card
      await removeFromWanted(tx, receiverId, card.cardId);
    }

    // senderGets: receiver loses cards, sender gains cards
    for (const card of senderGets) {
      const currentQty = receiverCollectionMap.get(card.cardId) ?? 0;
      if (currentQty <= 1) {
        await updateQuantity(tx, receiverId, card.cardId, 0);
      } else {
        await updateQuantity(tx, receiverId, card.cardId, currentQty - 1);
      }
      await addToCollection(tx, senderId, card.cardId, 1);

      // Remove from sender's wanted list if they wanted this card
      await removeFromWanted(tx, senderId, card.cardId);
    }

    // ── 2. Cancel conflicting pending proposals ──
    const senderGivesCardIds = senderGives.map((c) => c.cardId);
    const senderGetsCardIds = senderGets.map((c) => c.cardId);

    // Find pending proposals that overlap with traded cards
    // A proposal conflicts if either party committed cards that were just traded away
    const conflicting = await tx
      .select()
      .from(tradeProposals)
      .where(
        and(
          eq(tradeProposals.status, 'pending'),
          ne(tradeProposals.id, proposalId),
          or(
            // Sender's other proposals where they're giving away cards they just traded
            and(
              eq(tradeProposals.senderId, senderId),
              senderGivesCardIds.length > 0
                ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${tradeProposals.senderGives}) elem WHERE elem->>'cardId' = ANY(ARRAY[${sql.join(senderGivesCardIds.map(id => sql`${id}`), sql`, `)}]))`
                : sql`false`,
            ),
            // Sender is receiver in another proposal and senderGets overlap with what sender gave away
            and(
              eq(tradeProposals.receiverId, senderId),
              senderGivesCardIds.length > 0
                ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${tradeProposals.senderGets}) elem WHERE elem->>'cardId' = ANY(ARRAY[${sql.join(senderGivesCardIds.map(id => sql`${id}`), sql`, `)}]))`
                : sql`false`,
            ),
            // Receiver's other proposals where they're giving away cards they just traded
            and(
              eq(tradeProposals.senderId, receiverId),
              senderGetsCardIds.length > 0
                ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${tradeProposals.senderGives}) elem WHERE elem->>'cardId' = ANY(ARRAY[${sql.join(senderGetsCardIds.map(id => sql`${id}`), sql`, `)}]))`
                : sql`false`,
            ),
            // Receiver is receiver in another proposal and senderGets overlap with what receiver gave away
            and(
              eq(tradeProposals.receiverId, receiverId),
              senderGetsCardIds.length > 0
                ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${tradeProposals.senderGets}) elem WHERE elem->>'cardId' = ANY(ARRAY[${sql.join(senderGetsCardIds.map(id => sql`${id}`), sql`, `)}]))`
                : sql`false`,
            ),
          ),
        ),
      );

    // Cancel each conflicting proposal
    if (conflicting.length > 0) {
      const conflictingIds = conflicting.map((p: any) => p.id);

      await tx
        .update(tradeProposals)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(inArray(tradeProposals.id, conflictingIds));

      // Notify affected users and emit socket events
      // Fetch languages for affected users
      const affectedUserIds = new Set<string>();
      for (const cp of conflicting) {
        affectedUserIds.add((cp as any).senderId);
        affectedUserIds.add((cp as any).receiverId);
      }
      const affectedUsers = await tx
        .select({ id: users.id, uiLanguage: users.uiLanguage })
        .from(users)
        .where(inArray(users.id, Array.from(affectedUserIds)));
      const cancelLangMap = new Map<string, string>(affectedUsers.map((u: any) => [u.id, u.uiLanguage || 'en']));

      for (const cp of conflicting) {
        const cpSenderId = (cp as any).senderId;
        const cpReceiverId = (cp as any).receiverId;
        const cpId = (cp as any).id;

        // Notify both parties of the cancelled proposal
        for (const notifyUserId of [cpSenderId, cpReceiverId]) {
          const cancelLang = cancelLangMap.get(notifyUserId) || 'en';
          await insertNotification(tx, {
            userId: notifyUserId,
            type: 'proposal_cancelled',
            title: t('notifications.proposalCancelledTitle', cancelLang),
            body: t('notifications.proposalCancelledBody', cancelLang),
            data: { proposalId: cpId },
          });
        }

        // ── 3. Emit socket events for cancelled proposals ──
        if (io) {
          io.to(`user:${cpSenderId}`).emit('proposal-cancelled', { proposalId: cpId });
          io.to(`user:${cpReceiverId}`).emit('proposal-cancelled', { proposalId: cpId });
        }
      }
    }
  });

  // Notify the OTHER party about trade completion
  const otherUserId =
    proposal.senderId === userId ? proposal.receiverId : proposal.senderId;

  // Get other user's language preference
  const [otherUser] = await db
    .select({ uiLanguage: users.uiLanguage })
    .from(users)
    .where(eq(users.id, otherUserId));
  const completeLang = otherUser?.uiLanguage || 'en';

  await insertNotification(db, {
    userId: otherUserId,
    type: 'trade_completed',
    title: t('notifications.tradeCompletedTitle', completeLang),
    body: t('notifications.tradeCompletedBody', completeLang),
    data: { proposalId },
  });

  if (io) {
    io.to(`user:${otherUserId}`).emit('trade-completed', { proposalId });
  }

  await sendPushToUser(
    db,
    otherUserId,
    t('notifications.tradeCompletedTitle', completeLang),
    t('notifications.tradeCompletedBody', completeLang),
  );

  // ── Auto-close affected trade posts ──
  await autoCloseAffectedPosts(db, io, proposal);

  return proposal;
}

/**
 * Auto-close active trade posts when a trade completes:
 * - Offering posts by sender where cards contain any of senderGives cardIds
 * - Offering posts by receiver where cards contain any of senderGets cardIds
 * - Seeking posts by receiver where cards contain any of senderGives cardIds (they got what they wanted)
 * - Seeking posts by sender where cards contain any of senderGets cardIds (they got what they wanted)
 */
async function autoCloseAffectedPosts(
  db: DbInstance,
  io: Server | null,
  proposal: any,
) {
  const { senderId, receiverId } = proposal;
  const senderGives: Array<{ cardId: string }> = proposal.senderGives ?? [];
  const senderGets: Array<{ cardId: string }> = proposal.senderGets ?? [];

  const senderGivesCardIds = senderGives.map((c) => c.cardId);
  const senderGetsCardIds = senderGets.map((c) => c.cardId);

  const postsToClose: Array<{ id: string; userId: string }> = [];

  // Helper: find active posts matching card IDs using JSONB containment
  async function findPostsToClose(
    userId: string,
    type: 'offering' | 'seeking',
    cardIds: string[],
  ) {
    if (cardIds.length === 0) return [];

    const conditions = cardIds.map((cardId) =>
      sql`${tradePosts.cards} @> ${JSON.stringify([{ cardId }])}::jsonb`
    );

    const cardFilter = conditions.length === 1
      ? conditions[0]
      : sql`(${sql.join(conditions, sql` OR `)})`;

    return db
      .select({ id: tradePosts.id, userId: tradePosts.userId })
      .from(tradePosts)
      .where(
        and(
          eq(tradePosts.userId, userId),
          eq(tradePosts.type, type),
          eq(tradePosts.status, 'active'),
          cardFilter,
        ),
      );
  }

  // Sender's Offering posts with cards they gave away
  const senderOfferingPosts = await findPostsToClose(senderId, 'offering', senderGivesCardIds);
  postsToClose.push(...senderOfferingPosts);

  // Receiver's Offering posts with cards they gave away
  const receiverOfferingPosts = await findPostsToClose(receiverId, 'offering', senderGetsCardIds);
  postsToClose.push(...receiverOfferingPosts);

  // Receiver's Seeking posts with cards they received (they got what they wanted)
  const receiverSeekingPosts = await findPostsToClose(receiverId, 'seeking', senderGivesCardIds);
  postsToClose.push(...receiverSeekingPosts);

  // Sender's Seeking posts with cards they received (they got what they wanted)
  const senderSeekingPosts = await findPostsToClose(senderId, 'seeking', senderGetsCardIds);
  postsToClose.push(...senderSeekingPosts);

  if (postsToClose.length === 0) return;

  // Update all affected posts to auto_closed
  const postIds = postsToClose.map((p) => p.id);
  await db
    .update(tradePosts)
    .set({ status: 'auto_closed', updatedAt: new Date() })
    .where(inArray(tradePosts.id, postIds));

  // Fetch language preferences for affected post owners
  const postOwnerIds = [...new Set(postsToClose.map((p) => p.userId))];
  const postOwners = await db
    .select({ id: users.id, uiLanguage: users.uiLanguage })
    .from(users)
    .where(inArray(users.id, postOwnerIds));
  const postLangMap = new Map<string, string>(postOwners.map((u: any) => [u.id, u.uiLanguage || 'en']));

  // Send notifications and socket events for each auto-closed post
  for (const post of postsToClose) {
    const postLang = postLangMap.get(post.userId) || 'en';
    await insertNotification(db, {
      userId: post.userId,
      type: 'post_auto_closed',
      title: t('notifications.postAutoClosedTitle', postLang),
      body: t('notifications.postAutoClosedBody', postLang),
      data: { postId: post.id },
    });

    if (io) {
      io.to(`user:${post.userId}`).emit('post-closed', { postId: post.id });
    }

    await sendPushToUser(
      db,
      post.userId,
      t('notifications.postAutoClosedTitle', postLang),
      t('notifications.postAutoClosedBody', postLang),
    );
  }
}

export async function getProposals(
  db: DbInstance,
  userId: string,
  opts: GetProposalsOpts = {},
) {
  const { direction = 'all', status = 'all', limit = 20, offset = 0 } = opts;

  const conditions: any[] = [];

  if (direction === 'incoming') {
    conditions.push(eq(tradeProposals.receiverId, userId));
  } else if (direction === 'outgoing') {
    conditions.push(eq(tradeProposals.senderId, userId));
  } else {
    conditions.push(
      or(
        eq(tradeProposals.senderId, userId),
        eq(tradeProposals.receiverId, userId),
      ),
    );
  }

  if (status && status !== 'all') {
    conditions.push(eq(tradeProposals.status, status as any));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const proposals = await db
    .select()
    .from(tradeProposals)
    .where(whereClause)
    .orderBy(desc(tradeProposals.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tradeProposals)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  // Enrich proposals with partner info
  const partnerIds = new Set<string>();
  for (const p of proposals) {
    const partnerId = p.senderId === userId ? p.receiverId : p.senderId;
    partnerIds.add(partnerId);
  }

  const partnerMap: Record<string, any> = {};
  if (partnerIds.size > 0) {
    const partnerIdArray = [...partnerIds];
    const partnerRows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarId: users.avatarId,
      })
      .from(users)
      .where(inArray(users.id, partnerIdArray));

    // Get rating stats for partners
    const ratingStats = await db
      .select({
        ratedId: tradeRatings.ratedId,
        avgRating: sql<number>`avg(${tradeRatings.stars})::float`,
        tradeCount: sql<number>`count(*)::int`,
      })
      .from(tradeRatings)
      .where(inArray(tradeRatings.ratedId, partnerIdArray))
      .groupBy(tradeRatings.ratedId);

    const ratingMap: Record<string, { avgRating: number; tradeCount: number }> = {};
    for (const r of ratingStats) {
      ratingMap[r.ratedId] = { avgRating: r.avgRating, tradeCount: r.tradeCount };
    }

    for (const row of partnerRows) {
      const stats = ratingMap[row.id];
      partnerMap[row.id] = {
        displayName: row.displayName ?? 'Trainer',
        avatarId: row.avatarId ?? 'default',
        avgRating: stats?.avgRating ?? 0,
        tradeCount: stats?.tradeCount ?? 0,
      };
    }
  }

  const enrichedProposals = proposals.map((p: any) => {
    const partnerId = p.senderId === userId ? p.receiverId : p.senderId;
    return {
      ...p,
      partner: partnerMap[partnerId] ?? null,
    };
  });

  return { proposals: enrichedProposals, total };
}

export async function getProposalThread(
  db: DbInstance,
  proposalId: string,
) {
  // First get the target proposal
  const [target] = await db
    .select()
    .from(tradeProposals)
    .where(eq(tradeProposals.id, proposalId))
    .limit(1);

  if (!target) {
    return [];
  }

  // Walk up to find the root (proposal with no parentId)
  let rootId = target.id;
  let current = target;

  while (current.parentId) {
    const [parent] = await db
      .select()
      .from(tradeProposals)
      .where(eq(tradeProposals.id, current.parentId))
      .limit(1);

    if (!parent) break;
    rootId = parent.id;
    current = parent;
  }

  // Now get all proposals in this thread by walking down from root
  // We use matchId to get the full thread since all proposals in a thread share the same matchId
  const thread = await db
    .select()
    .from(tradeProposals)
    .where(eq(tradeProposals.matchId, current.matchId))
    .orderBy(asc(tradeProposals.createdAt));

  // Filter to only include the actual thread chain (root + descendants)
  // Build a set of IDs that belong to this thread
  const threadIds = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const p of thread) {
      if (p.parentId && threadIds.has(p.parentId) && !threadIds.has(p.id)) {
        threadIds.add(p.id);
        added = true;
      }
    }
  }

  return thread.filter((p: any) => threadIds.has(p.id));
}
