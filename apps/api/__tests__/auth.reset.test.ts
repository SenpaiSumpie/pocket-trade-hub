import { buildTestApp, cleanDb, closeDb, testDb } from './setup';
import { passwordResetTokens } from '../src/db/schema';
import { desc } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await closeDb();
});

beforeEach(async () => {
  await cleanDb();
});

async function createUser(
  app: FastifyInstance,
  email = 'test@example.com',
  password = 'password123'
) {
  return app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
}

describe('POST /auth/reset-request', () => {
  it('returns 200 for existing email', async () => {
    await createUser(app);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-request',
      payload: { email: 'test@example.com' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 200 for non-existing email (prevents enumeration)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-request',
      payload: { email: 'unknown@example.com' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('creates a reset token in the database', async () => {
    await createUser(app);

    await app.inject({
      method: 'POST',
      url: '/auth/reset-request',
      payload: { email: 'test@example.com' },
    });

    const tokens = await testDb
      .select()
      .from(passwordResetTokens)
      .orderBy(desc(passwordResetTokens.createdAt));

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].tokenHash).toBeDefined();
    expect(tokens[0].expiresAt).toBeDefined();
  });
});

describe('POST /auth/reset-confirm', () => {
  it('resets password with valid token', async () => {
    await createUser(app);

    // Request reset
    const resetRes = await app.inject({
      method: 'POST',
      url: '/auth/reset-request',
      payload: { email: 'test@example.com' },
    });
    const { resetToken } = JSON.parse(resetRes.body);

    // Confirm reset
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/auth/reset-confirm',
      payload: { token: resetToken, newPassword: 'newpassword123' },
    });

    expect(confirmRes.statusCode).toBe(200);

    // Verify can login with new password
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'newpassword123' },
    });

    expect(loginRes.statusCode).toBe(200);
  });

  it('returns 400 for invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-confirm',
      payload: { token: 'invalid-token', newPassword: 'newpassword123' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for already-used token', async () => {
    await createUser(app);

    // Request reset
    const resetRes = await app.inject({
      method: 'POST',
      url: '/auth/reset-request',
      payload: { email: 'test@example.com' },
    });
    const { resetToken } = JSON.parse(resetRes.body);

    // Use token
    await app.inject({
      method: 'POST',
      url: '/auth/reset-confirm',
      payload: { token: resetToken, newPassword: 'newpassword123' },
    });

    // Try to use again
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-confirm',
      payload: { token: resetToken, newPassword: 'anotherpassword' },
    });

    expect(res.statusCode).toBe(400);
  });
});
