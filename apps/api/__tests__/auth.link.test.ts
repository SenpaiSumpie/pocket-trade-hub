import { buildTestApp, cleanDb, closeDb } from './setup';
import type { FastifyInstance } from 'fastify';

// Must use jest.fn() inline in the factory since jest.mock is hoisted
const mockVerifyIdToken = jest.fn();
const mockJwtVerify = jest.fn();

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: (...args: any[]) => mockVerifyIdToken(...args),
    })),
  };
});

jest.mock('jose', () => {
  return {
    createRemoteJWKSet: jest.fn().mockReturnValue('mock-jwks'),
    jwtVerify: (...args: any[]) => mockJwtVerify(...args),
  };
});

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
  mockVerifyIdToken.mockReset();
  mockJwtVerify.mockReset();
});

async function createEmailUser(
  app: FastifyInstance,
  email = 'existing@example.com',
  password = 'password123'
) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
  return JSON.parse(res.body);
}

describe('POST /auth/link', () => {
  it('links Google OAuth to existing email/password account with correct password', async () => {
    const { accessToken } = await createEmailUser(app, 'link@example.com', 'password123');

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-link-uid',
        email: 'link@example.com',
        name: 'Link User',
      }),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        provider: 'google',
        idToken: 'valid-google-token',
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Account linked successfully');
  });

  it('returns 401 with wrong password', async () => {
    const { accessToken } = await createEmailUser(app, 'wrongpw@example.com', 'password123');

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-wrongpw-uid',
        email: 'wrongpw@example.com',
        name: 'Wrong PW User',
      }),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        provider: 'google',
        idToken: 'valid-google-token',
        password: 'wrongpassword',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid password');
  });

  it('returns 409 when provider already linked to account', async () => {
    const { accessToken } = await createEmailUser(app, 'dupe@example.com', 'password123');

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-dupe-uid',
        email: 'dupe@example.com',
        name: 'Dupe User',
      }),
    });

    // First link succeeds
    await app.inject({
      method: 'POST',
      url: '/auth/link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        provider: 'google',
        idToken: 'valid-google-token',
        password: 'password123',
      },
    });

    // Second link should conflict
    const res = await app.inject({
      method: 'POST',
      url: '/auth/link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        provider: 'google',
        idToken: 'valid-google-token',
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Provider already linked to this account');
  });

  it('returns 401 without access token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/link',
      payload: {
        provider: 'google',
        idToken: 'valid-google-token',
        password: 'password123',
      },
    });

    expect(res.statusCode).toBe(401);
  });
});
