import { eq, and, sql, lt, desc } from 'drizzle-orm';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { randomUUID } from 'crypto';
import { pushTokens, notifications } from '../db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const expo = new Expo();

type DbInstance = Parameters<typeof registerPushToken>[0];

export async function registerPushToken(
  db: any,
  userId: string,
  token: string,
  platform: string,
) {
  // Delete existing token for this user (upsert pattern)
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

  // Insert new token
  const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await db.insert(pushTokens).values({
    id,
    userId,
    token,
    platform,
  });

  return { id, userId, token, platform };
}

export async function sendNewSetNotification(
  db: any,
  setName: string,
  cardCount: number,
) {
  // Fetch all push tokens
  const tokens = await db.select().from(pushTokens);

  if (tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Build messages
  const messages: ExpoPushMessage[] = [];
  for (const record of tokens) {
    if (!Expo.isExpoPushToken(record.token)) {
      continue;
    }
    messages.push({
      to: record.token,
      sound: 'default',
      title: 'New Set Available!',
      body: `${setName} -- ${cardCount} new cards added`,
    });
  }

  if (messages.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Send in chunks
  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;
  const staleTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'ok') {
          sent++;
        } else {
          failed++;
          // Handle DeviceNotRegistered by removing stale token
          if (
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            const pushToken = (chunk[i] as ExpoPushMessage).to as string;
            staleTokens.push(pushToken);
          }
        }
      }
    } catch {
      failed += chunk.length;
    }
  }

  // Clean up stale tokens
  for (const staleToken of staleTokens) {
    await db.delete(pushTokens).where(eq(pushTokens.token, staleToken));
  }

  return { sent, failed };
}

export async function createNotification(
  db: any,
  opts: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  },
) {
  const id = randomUUID();
  const [notification] = await db
    .insert(notifications)
    .values({
      id,
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data || null,
    })
    .returning();

  return notification;
}

export async function getNotifications(
  db: any,
  userId: string,
  opts: { limit?: number; cursor?: string } = {},
) {
  const { limit = 20, cursor } = opts;

  const conditions: any[] = [eq(notifications.userId, userId)];

  if (cursor) {
    conditions.push(
      sql`(${notifications.createdAt}, ${notifications.id}) < (
        SELECT ${notifications.createdAt}, ${notifications.id}
        FROM ${notifications}
        WHERE ${notifications.id} = ${cursor}
      )`,
    );
  }

  const whereClause =
    conditions.length === 1 ? conditions[0] : and(...conditions);

  const rows = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const result = hasMore ? rows.slice(0, limit) : rows;

  return {
    notifications: result,
    hasMore,
  };
}

export async function markRead(
  db: any,
  notificationId: string,
  userId: string,
) {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning({ id: notifications.id });

  return result.length > 0;
}

export async function markAllRead(db: any, userId: string) {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
      ),
    )
    .returning({ id: notifications.id });

  return result.length;
}

export async function getUnreadCount(db: any, userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
      ),
    );

  return result[0]?.count || 0;
}

export async function sendProposalPushNotification(
  db: any,
  userId: string,
  title: string,
  body: string,
) {
  try {
    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
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
          // Push failures non-critical
        }
      }
    }
  } catch {
    // Non-critical
  }
}

export async function archiveOldNotifications(db: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(notifications)
    .where(lt(notifications.createdAt, thirtyDaysAgo))
    .returning({ id: notifications.id });

  return result.length;
}
