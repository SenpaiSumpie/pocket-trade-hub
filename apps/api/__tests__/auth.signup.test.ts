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

describe('POST /auth/signup', () => {
  const validSignup = {
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('creates user and returns 201 with tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: validSignup,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.id).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns 409 for duplicate email', async () => {
    // First signup
    await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: validSignup,
    });

    // Duplicate signup
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: validSignup,
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'not-an-email',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      },
    });

    expect(res.statusCode).toBe(400);
  });
});
