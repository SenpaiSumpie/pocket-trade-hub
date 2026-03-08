import { buildTestApp, cleanDb, closeDb } from './setup';
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

describe('POST /auth/login', () => {
  it('returns 200 with tokens for valid credentials', async () => {
    await createUser(app);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns 401 for wrong password', async () => {
    await createUser(app);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'test@example.com', password: 'wrongpassword' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for unknown email (same message as wrong password)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'unknown@example.com', password: 'password123' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });
});

describe('POST /auth/refresh', () => {
  it('returns 200 with new tokens for valid refresh token', async () => {
    const signupRes = await createUser(app);
    const { refreshToken } = JSON.parse(signupRes.body);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    // New refresh token should be different (rotation)
    expect(body.refreshToken).not.toBe(refreshToken);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken: 'invalid-token' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for already-used refresh token (rotation)', async () => {
    const signupRes = await createUser(app);
    const { refreshToken } = JSON.parse(signupRes.body);

    // Use token once (should succeed)
    await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });

    // Use same token again (should fail - already revoked)
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('returns 200 when authenticated', async () => {
    const signupRes = await createUser(app);
    const { accessToken, refreshToken } = JSON.parse(signupRes.body);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { refreshToken },
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 401 without access token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken: 'some-token' },
    });

    expect(res.statusCode).toBe(401);
  });
});
