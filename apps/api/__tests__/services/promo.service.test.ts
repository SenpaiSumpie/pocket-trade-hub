import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, promoCodes, promoRedemptions } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import {
  createCode,
  listCodes,
  deactivateCode,
  redeemCode,
} from '../../src/services/promo.service';

let app: FastifyInstance;

async function createTestUser(overrides: Record<string, any> = {}) {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin: false,
    ...overrides,
  });
  return userId;
}

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await closeDb();
  await app.close();
});

beforeEach(async () => {
  await cleanDb();
});

describe('createCode', () => {
  it('creates a promo code with premiumDays, maxRedemptions, expiresAt', async () => {
    const result = await createCode(testDb, {
      code: 'WELCOME10',
      premiumDays: 10,
      maxRedemptions: 100,
      expiresAt: '2027-12-31T00:00:00Z',
    });

    expect(result).toBeDefined();
    expect(result.code).toBe('WELCOME10');
    expect(result.premiumDays).toBe(10);
    expect(result.maxRedemptions).toBe(100);
    expect(result.isActive).toBe(true);
    expect(result.currentRedemptions).toBe(0);
  });
});

describe('redeemCode', () => {
  it('with valid code grants premium days and returns newExpiresAt', async () => {
    const userId = await createTestUser();
    await createCode(testDb, { code: 'FREE7', premiumDays: 7 });

    const result = await redeemCode(testDb, userId, 'FREE7');

    expect(result.premiumDays).toBe(7);
    expect(result.newExpiresAt).toBeInstanceOf(Date);

    // Verify user is now premium
    const [user] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(user.isPremium).toBe(true);
    expect(user.premiumExpiresAt).toBeTruthy();
  });

  it('extends existing premium time (stacking, not overwriting)', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    const userId = await createTestUser({
      isPremium: true,
      premiumExpiresAt: futureDate,
    });
    await createCode(testDb, { code: 'EXTRA15', premiumDays: 15 });

    const result = await redeemCode(testDb, userId, 'EXTRA15');

    // New expiry should be ~45 days from now (30 existing + 15 new)
    const expectedMin = new Date();
    expectedMin.setDate(expectedMin.getDate() + 44); // allow 1 day tolerance
    expect(result.newExpiresAt.getTime()).toBeGreaterThan(expectedMin.getTime());
  });

  it('rejects duplicate redemption by same user', async () => {
    const userId = await createTestUser();
    await createCode(testDb, { code: 'ONCE', premiumDays: 5 });

    await redeemCode(testDb, userId, 'ONCE');

    await expect(redeemCode(testDb, userId, 'ONCE')).rejects.toThrow(
      'You have already redeemed this code',
    );
  });

  it('rejects inactive code', async () => {
    const userId = await createTestUser();
    const code = await createCode(testDb, { code: 'DISABLED', premiumDays: 5 });
    await deactivateCode(testDb, code.id);

    await expect(redeemCode(testDb, userId, 'DISABLED')).rejects.toThrow(
      'Invalid or inactive promo code',
    );
  });

  it('rejects expired code', async () => {
    const userId = await createTestUser();
    await createCode(testDb, {
      code: 'EXPIRED',
      premiumDays: 5,
      expiresAt: '2020-01-01T00:00:00Z',
    });

    await expect(redeemCode(testDb, userId, 'EXPIRED')).rejects.toThrow(
      'This promo code has expired',
    );
  });

  it('rejects code that reached maxRedemptions', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await createCode(testDb, {
      code: 'LIMIT1',
      premiumDays: 3,
      maxRedemptions: 1,
    });

    await redeemCode(testDb, user1, 'LIMIT1');
    await expect(redeemCode(testDb, user2, 'LIMIT1')).rejects.toThrow(
      'This promo code has reached its maximum redemptions',
    );
  });

  it('code lookup is case-insensitive (uppercase normalized)', async () => {
    const userId = await createTestUser();
    await createCode(testDb, { code: 'MiXeD', premiumDays: 5 });

    const result = await redeemCode(testDb, userId, 'mixed');
    expect(result.premiumDays).toBe(5);
  });
});

describe('deactivateCode', () => {
  it('sets isActive to false', async () => {
    const code = await createCode(testDb, { code: 'DEACT', premiumDays: 5 });
    const updated = await deactivateCode(testDb, code.id);

    expect(updated.isActive).toBe(false);
  });
});

describe('listCodes', () => {
  it('returns all promo codes ordered by createdAt desc', async () => {
    await createCode(testDb, { code: 'FIRST', premiumDays: 1 });
    await createCode(testDb, { code: 'SECOND', premiumDays: 2 });

    const codes = await listCodes(testDb);
    expect(codes).toHaveLength(2);
    // Most recent first
    expect(codes[0].code).toBe('SECOND');
    expect(codes[1].code).toBe('FIRST');
  });
});
