import { buildTestApp, cleanDb, closeDb } from './setup';
import type { FastifyInstance } from 'fastify';

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

// Mock jose
const mockJwtVerify = jest.fn();
jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn().mockReturnValue('mock-jwks'),
  jwtVerify: mockJwtVerify,
}));

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
  return app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
}

describe('POST /auth/oauth/google', () => {
  it('creates new user and returns tokens for valid Google token', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-uid-123',
        email: 'newuser@gmail.com',
        name: 'New User',
      }),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/google',
      payload: { provider: 'google', idToken: 'valid-google-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('newuser@gmail.com');
  });

  it('returns existing user tokens when OAuth account already exists', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-uid-456',
        email: 'returning@gmail.com',
        name: 'Returning User',
      }),
    });

    // First call creates user
    await app.inject({
      method: 'POST',
      url: '/auth/oauth/google',
      payload: { provider: 'google', idToken: 'valid-google-token' },
    });

    // Second call returns existing user
    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/google',
      payload: { provider: 'google', idToken: 'valid-google-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe('returning@gmail.com');
  });

  it('returns needs_linking when email matches existing email/password user', async () => {
    await createEmailUser(app, 'collision@example.com');

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-uid-789',
        email: 'collision@example.com',
        name: 'Collision User',
      }),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/google',
      payload: { provider: 'google', idToken: 'valid-google-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.needsLinking).toBe(true);
    expect(body.email).toBe('collision@example.com');
    expect(body.provider).toBe('google');
  });

  it('returns 401 for invalid Google token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/google',
      payload: { provider: 'google', idToken: 'invalid-token' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid token');
  });
});

describe('POST /auth/oauth/apple', () => {
  it('creates new user and returns tokens for valid Apple token', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        sub: 'apple-uid-123',
        email: 'newuser@icloud.com',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/apple',
      payload: { provider: 'apple', idToken: 'valid-apple-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('newuser@icloud.com');
  });

  it('returns needs_linking when email matches existing email/password user', async () => {
    await createEmailUser(app, 'apple-collision@example.com');

    mockJwtVerify.mockResolvedValue({
      payload: {
        sub: 'apple-uid-456',
        email: 'apple-collision@example.com',
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/apple',
      payload: { provider: 'apple', idToken: 'valid-apple-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.needsLinking).toBe(true);
    expect(body.email).toBe('apple-collision@example.com');
    expect(body.provider).toBe('apple');
  });

  it('returns 401 for invalid Apple token', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Invalid token'));

    const res = await app.inject({
      method: 'POST',
      url: '/auth/oauth/apple',
      payload: { provider: 'apple', idToken: 'invalid-token' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid token');
  });
});
