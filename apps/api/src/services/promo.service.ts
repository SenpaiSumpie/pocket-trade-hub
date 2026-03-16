import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { promoCodes, promoRedemptions, users } from '../db/schema';

type DbInstance = any;

export interface CreateCodeInput {
  code: string;
  description?: string;
  premiumDays: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

export interface RedeemResult {
  premiumDays: number;
  newExpiresAt: Date;
}

export async function createCode(db: DbInstance, input: CreateCodeInput) {
  const id = randomUUID();
  const normalizedCode = input.code.toUpperCase().trim();

  const [created] = await db
    .insert(promoCodes)
    .values({
      id,
      code: normalizedCode,
      description: input.description || null,
      premiumDays: input.premiumDays,
      maxRedemptions: input.maxRedemptions || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();

  return created;
}

export async function listCodes(db: DbInstance) {
  return db
    .select()
    .from(promoCodes)
    .orderBy(sql`${promoCodes.createdAt} DESC`);
}

export async function deactivateCode(db: DbInstance, codeId: string) {
  const [updated] = await db
    .update(promoCodes)
    .set({ isActive: false })
    .where(eq(promoCodes.id, codeId))
    .returning();

  return updated;
}

export async function redeemCode(
  db: DbInstance,
  userId: string,
  code: string,
): Promise<RedeemResult> {
  const normalizedCode = code.toUpperCase().trim();

  return await db.transaction(async (tx: DbInstance) => {
    // 1. Find the promo code
    const [promoCode] = await tx
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, normalizedCode),
          eq(promoCodes.isActive, true),
        ),
      );

    if (!promoCode) {
      throw new Error('Invalid or inactive promo code');
    }

    // 2. Check expiration
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      throw new Error('This promo code has expired');
    }

    // 3. Check max redemptions
    if (
      promoCode.maxRedemptions !== null &&
      promoCode.currentRedemptions >= promoCode.maxRedemptions
    ) {
      throw new Error('This promo code has reached its maximum redemptions');
    }

    // 4. Check if user already redeemed
    const [existingRedemption] = await tx
      .select()
      .from(promoRedemptions)
      .where(
        and(
          eq(promoRedemptions.userId, userId),
          eq(promoRedemptions.promoCodeId, promoCode.id),
        ),
      );

    if (existingRedemption) {
      throw new Error('You have already redeemed this code');
    }

    // 5. Insert redemption record
    await tx.insert(promoRedemptions).values({
      id: randomUUID(),
      promoCodeId: promoCode.id,
      userId,
      premiumDaysGranted: promoCode.premiumDays,
    });

    // 6. Increment current redemptions
    await tx
      .update(promoCodes)
      .set({
        currentRedemptions: sql`${promoCodes.currentRedemptions} + 1`,
      })
      .where(eq(promoCodes.id, promoCode.id));

    // 7. Calculate new expiry: extend existing if premium, otherwise from now
    const [user] = await tx
      .select({
        isPremium: users.isPremium,
        premiumExpiresAt: users.premiumExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    const now = new Date();
    let baseDate = now;
    if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
      baseDate = user.premiumExpiresAt;
    }

    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + promoCode.premiumDays);

    // 8. Update user premium status
    await tx
      .update(users)
      .set({
        isPremium: true,
        premiumExpiresAt: newExpiresAt,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return {
      premiumDays: promoCode.premiumDays,
      newExpiresAt,
    };
  });
}
