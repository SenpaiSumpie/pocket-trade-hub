import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import {
  setPremiumStatus,
  isPremiumUser,
  handleWebhookEvent,
} from '../../src/services/premium.service';

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

describe('setPremiumStatus', () => {
  it('sets isPremium=true and premiumExpiresAt on user', async () => {
    const userId = await createTestUser();
    const expiresAt = new Date('2027-01-01T00:00:00Z');

    await setPremiumStatus(testDb, userId, true, expiresAt);

    const [user] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(user.isPremium).toBe(true);
    expect(user.premiumExpiresAt).toEqual(expiresAt);
  });

  it('sets isPremium=false and clears premiumExpiresAt', async () => {
    const userId = await createTestUser();
    // First set premium
    await setPremiumStatus(testDb, userId, true, new Date('2027-01-01'));
    // Then revoke
    await setPremiumStatus(testDb, userId, false, null);

    const [user] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(user.isPremium).toBe(false);
    expect(user.premiumExpiresAt).toBeNull();
  });
});

describe('isPremiumUser', () => {
  it('returns true when isPremium=true', async () => {
    const userId = await createTestUser();
    await setPremiumStatus(testDb, userId, true, new Date('2027-01-01'));

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(true);
  });

  it('returns false when isPremium=false', async () => {
    const userId = await createTestUser();

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(false);
  });
});

describe('handleWebhookEvent', () => {
  it('processes INITIAL_PURCHASE -> premium=true', async () => {
    const userId = await createTestUser();
    await handleWebhookEvent(testDb, {
      type: 'INITIAL_PURCHASE',
      app_user_id: userId,
      expiration_at_ms: new Date('2027-06-01').getTime(),
    });

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(true);
  });

  it('processes RENEWAL -> premium=true', async () => {
    const userId = await createTestUser();
    await handleWebhookEvent(testDb, {
      type: 'RENEWAL',
      app_user_id: userId,
      expiration_at_ms: new Date('2027-06-01').getTime(),
    });

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(true);
  });

  it('processes UNCANCELLATION -> premium=true', async () => {
    const userId = await createTestUser();
    await handleWebhookEvent(testDb, {
      type: 'UNCANCELLATION',
      app_user_id: userId,
      expiration_at_ms: new Date('2027-06-01').getTime(),
    });

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(true);
  });

  it('processes EXPIRATION -> premium=false', async () => {
    const userId = await createTestUser();
    // First set premium
    await setPremiumStatus(testDb, userId, true, new Date('2027-01-01'));

    await handleWebhookEvent(testDb, {
      type: 'EXPIRATION',
      app_user_id: userId,
      expiration_at_ms: null,
    });

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(false);
  });

  it('CANCELLATION does NOT revoke premium (user paid through period)', async () => {
    const userId = await createTestUser();
    await setPremiumStatus(testDb, userId, true, new Date('2027-01-01'));

    await handleWebhookEvent(testDb, {
      type: 'CANCELLATION',
      app_user_id: userId,
      expiration_at_ms: new Date('2027-01-01').getTime(),
    });

    const result = await isPremiumUser(testDb, userId);
    expect(result).toBe(true);
  });
});
