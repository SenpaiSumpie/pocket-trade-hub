import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tradeProposals, notifications, users } from '../db/schema';
import type { Server } from 'socket.io';

type DbInstance = any;

interface CreateProposalOpts {
  senderId: string;
  receiverId: string;
  matchId: string;
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

  const [proposal] = await db
    .insert(tradeProposals)
    .values({
      id,
      matchId: opts.matchId,
      senderId: opts.senderId,
      receiverId: opts.receiverId,
      parentId: opts.parentId || null,
      senderGives: opts.senderGives,
      senderGets: opts.senderGets,
      fairnessScore: opts.fairnessScore,
    })
    .returning();

  // Create notification for receiver
  const notifType = opts.parentId ? 'proposal_countered' : 'proposal_received';
  const notifTitle = opts.parentId ? 'Counter-offer received' : 'New trade proposal';
  const notifBody = opts.parentId
    ? 'You received a counter-offer on your trade proposal.'
    : 'You received a new trade proposal.';

  await insertNotification(db, {
    userId: opts.receiverId,
    type: notifType,
    title: notifTitle,
    body: notifBody,
    data: { proposalId: id, matchId: opts.matchId },
  });

  // Emit socket event
  const socketEvent = opts.parentId ? 'proposal-countered' : 'new-proposal';
  if (io) {
    io.to(`user:${opts.receiverId}`).emit(socketEvent, {
      proposalId: id,
      senderId: opts.senderId,
      matchId: opts.matchId,
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

  await insertNotification(db, {
    userId: proposal.senderId,
    type: 'proposal_accepted',
    title: 'Proposal accepted',
    body: 'Your trade proposal has been accepted!',
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
    'Proposal accepted',
    'Your trade proposal has been accepted!',
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

  await insertNotification(db, {
    userId: proposal.senderId,
    type: 'proposal_rejected',
    title: 'Proposal rejected',
    body: 'Your trade proposal has been rejected.',
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
    'Proposal rejected',
    'Your trade proposal has been rejected.',
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

  // Notify the OTHER party
  const otherUserId =
    proposal.senderId === userId ? proposal.receiverId : proposal.senderId;

  await insertNotification(db, {
    userId: otherUserId,
    type: 'trade_completed',
    title: 'Trade completed',
    body: 'A trade has been marked as completed!',
    data: { proposalId },
  });

  if (io) {
    io.to(`user:${otherUserId}`).emit('trade-completed', { proposalId });
  }

  await sendPushToUser(
    db,
    otherUserId,
    'Trade completed',
    'A trade has been marked as completed!',
  );

  return proposal;
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

  return { proposals, total };
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
