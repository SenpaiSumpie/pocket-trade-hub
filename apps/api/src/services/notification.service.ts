import { eq } from 'drizzle-orm';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { pushTokens } from '../db/schema';
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
