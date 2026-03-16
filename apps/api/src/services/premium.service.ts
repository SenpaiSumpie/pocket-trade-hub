import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

type DbInstance = any;

export interface WebhookEvent {
  type: string;
  app_user_id: string;
  expiration_at_ms: number | null;
}

export async function setPremiumStatus(
  db: DbInstance,
  userId: string,
  isPremium: boolean,
  expiresAt: Date | null,
) {
  await db
    .update(users)
    .set({
      isPremium,
      premiumExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function isPremiumUser(
  db: DbInstance,
  userId: string,
): Promise<boolean> {
  const [user] = await db
    .select({ isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId));

  return user?.isPremium ?? false;
}

export async function handleWebhookEvent(
  db: DbInstance,
  event: WebhookEvent,
) {
  const { type, app_user_id, expiration_at_ms } = event;

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION': {
      const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;
      await setPremiumStatus(db, app_user_id, true, expiresAt);
      break;
    }
    case 'EXPIRATION': {
      // Guard: only clear premium if premiumExpiresAt has actually passed
      // (user may have promo-granted time remaining)
      const [expUser] = await db
        .select({ premiumExpiresAt: users.premiumExpiresAt })
        .from(users)
        .where(eq(users.id, app_user_id));

      if (expUser?.premiumExpiresAt && expUser.premiumExpiresAt > new Date()) {
        // Promo-granted time still remaining, do not clear premium
        break;
      }
      await setPremiumStatus(db, app_user_id, false, null);
      break;
    }
    case 'CANCELLATION': {
      // No-op: user paid through their current period
      break;
    }
    default: {
      // Unknown event type - ignore
      break;
    }
  }
}
