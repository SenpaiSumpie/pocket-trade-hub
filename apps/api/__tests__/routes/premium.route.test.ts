import { buildTestApp, cleanDb, closeDb, testDb, TEST_JWT_SECRET } from '../setup';
import { users } from '../../src/db/schema';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { applyPremiumBoost } from '../../src/services/match.service';

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

function getAuthToken(userId: string): string {
  return app.jwt.sign({ sub: userId }, { expiresIn: '15m' });
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

describe('POST /webhooks/revenuecat', () => {
  it('returns 401 with wrong auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/revenuecat',
      headers: { authorization: 'Bearer wrong-secret' },
      payload: { type: 'INITIAL_PURCHASE', app_user_id: 'user1' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with valid auth and processes event', async () => {
    const userId = await createTestUser();

    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/revenuecat',
      headers: { authorization: 'Bearer test-webhook-secret' },
      payload: {
        type: 'INITIAL_PURCHASE',
        app_user_id: userId,
        expiration_at_ms: new Date('2027-06-01').getTime(),
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);

    // Verify user is now premium
    const [user] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(user.isPremium).toBe(true);
  });
});

describe('GET /premium/status', () => {
  it('returns subscription state for authenticated user', async () => {
    const userId = await createTestUser({ isPremium: true, premiumExpiresAt: new Date('2027-06-01') });
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'GET',
      url: '/premium/status',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.isPremium).toBe(true);
    expect(body.premiumExpiresAt).toBeTruthy();
  });

  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/premium/status',
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /premium/analytics', () => {
  it('returns 403 for free (non-premium) user', async () => {
    const userId = await createTestUser({ isPremium: false });
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'GET',
      url: '/premium/analytics',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Premium subscription required');
  });

  it('returns analytics data for premium user', async () => {
    const userId = await createTestUser({ isPremium: true });
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'GET',
      url: '/premium/analytics',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('mostWanted');
    expect(body).toHaveProperty('leastAvailable');
    expect(body).toHaveProperty('trending');
    expect(body).toHaveProperty('tradePower');
  });
});

describe('POST /premium/sync', () => {
  it('returns current premium status', async () => {
    const userId = await createTestUser({ isPremium: true });
    const token = getAuthToken(userId);

    const res = await app.inject({
      method: 'POST',
      url: '/premium/sync',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.isPremium).toBe(true);
  });
});

describe('applyPremiumBoost', () => {
  it('returns 125 for score 100 with premium', () => {
    expect(applyPremiumBoost(100, true)).toBe(125);
  });

  it('returns 100 for score 100 without premium', () => {
    expect(applyPremiumBoost(100, false)).toBe(100);
  });

  it('returns 0 for score 0 with premium', () => {
    expect(applyPremiumBoost(0, true)).toBe(0);
  });
});
