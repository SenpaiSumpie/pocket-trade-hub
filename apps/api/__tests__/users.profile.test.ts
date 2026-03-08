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

describe('GET /users/me', () => {
  it('returns own full profile when authenticated', async () => {
    const { accessToken, user } = await createUser(app);

    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(user.id);
    expect(body.email).toBe('test@example.com');
    // Should NOT include passwordHash
    expect(body.passwordHash).toBeUndefined();
  });

  it('returns 401 when not authenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(res.statusCode).toBe(401);
  });

  it('reflects profile updates', async () => {
    const { accessToken } = await createUser(app);

    // Update profile
    await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        displayName: 'TrainerBlue',
        avatarId: 'water-type',
        friendCode: '9999-8888-7777-6666',
      },
    });

    // Get profile
    const res = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.displayName).toBe('TrainerBlue');
    expect(body.avatarId).toBe('water-type');
    expect(body.friendCode).toBe('9999-8888-7777-6666');
  });
});

describe('GET /users/:id public profile', () => {
  it('does not expose email in public profile', async () => {
    const { user } = await createUser(app);

    const res = await app.inject({
      method: 'GET',
      url: `/users/${user.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.email).toBeUndefined();
    expect(body.id).toBe(user.id);
  });

  it('shows updated profile data publicly', async () => {
    const { accessToken, user } = await createUser(app);

    // Update profile
    await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        displayName: 'PublicUser',
        friendCode: '1111-2222-3333-4444',
      },
    });

    // View public profile
    const res = await app.inject({
      method: 'GET',
      url: `/users/${user.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.displayName).toBe('PublicUser');
    expect(body.friendCode).toBe('1111-2222-3333-4444');
  });
});
