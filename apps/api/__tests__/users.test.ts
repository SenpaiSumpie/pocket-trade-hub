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
  const res = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
  return JSON.parse(res.body);
}

describe('GET /users/:id', () => {
  it('returns 200 with public profile for existing user', async () => {
    const { user } = await createUser(app);

    const res = await app.inject({
      method: 'GET',
      url: `/users/${user.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(user.id);
    expect(body.displayName).toBeDefined();
    expect(body.createdAt).toBeDefined();
    // Should NOT include sensitive fields
    expect(body.email).toBeUndefined();
    expect(body.passwordHash).toBeUndefined();
  });

  it('returns 404 for unknown user ID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users/00000000-0000-0000-0000-000000000000',
    });

    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /users/me', () => {
  it('updates display name when authenticated', async () => {
    const { accessToken } = await createUser(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: 'TrainerRed' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.displayName).toBe('TrainerRed');
  });

  it('updates friend code when authenticated', async () => {
    const { accessToken } = await createUser(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { friendCode: '1234-5678-9012-3456' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.friendCode).toBe('1234-5678-9012-3456');
  });

  it('returns 400 for invalid friend code format', async () => {
    const { accessToken } = await createUser(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { friendCode: 'invalid-code' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { displayName: 'TrainerRed' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejects display name longer than 30 characters', async () => {
    const { accessToken } = await createUser(app);

    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: 'A'.repeat(31) },
    });

    expect(res.statusCode).toBe(400);
  });
});
