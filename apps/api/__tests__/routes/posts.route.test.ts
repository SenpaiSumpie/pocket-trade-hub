import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards } from '../../src/db/schema';
import { importCardSet } from '../../src/services/card.service';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import type { CardImportInput } from '@pocket-trade-hub/shared';

let app: FastifyInstance;

const testImport: CardImportInput = {
  set: {
    id: 'PRS1',
    name: 'Post Route Test Set',
    series: 'PR',
    cardCount: 2,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  },
  cards: [
    {
      localId: '001',
      name: 'Charizard',
      rarity: 'star2',
      type: 'fire',
      category: 'pokemon',
      hp: 180,
      stage: 'Stage 2',
      imageUrl: 'https://example.com/charizard.png',
      attacks: [{ name: 'Fire Blast', damage: '200', energyCost: ['fire'], description: null }],
      weakness: 'water',
      resistance: null,
      retreatCost: 3,
      illustrator: 'Mitsuhiro Arita',
      cardNumber: '001/100',
    },
    {
      localId: '002',
      name: 'Pikachu',
      rarity: 'diamond1',
      type: 'electric',
      category: 'pokemon',
      hp: 60,
      stage: 'Basic',
      imageUrl: 'https://example.com/pikachu.png',
      attacks: [{ name: 'Thunder Shock', damage: '20', energyCost: ['electric'], description: null }],
      weakness: 'fighting',
      resistance: null,
      retreatCost: 1,
      illustrator: 'Ken Sugimori',
      cardNumber: '002/100',
    },
  ],
};

async function createTestUser(overrides: { isPremium?: boolean } = {}) {
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('password123', 10);
  await testDb.insert(users).values({
    id: userId,
    email: `user-${userId.slice(0, 8)}@test.com`,
    passwordHash,
    isAdmin: false,
    isPremium: overrides.isPremium ?? false,
  });
  return userId;
}

function getAuthToken(userId: string): string {
  return app.jwt.sign({ sub: userId }, { expiresIn: '15m' });
}

const validPostBody = {
  type: 'offering',
  cards: [{
    cardId: 'PRS1-001',
    language: 'en',
    name: 'Charizard',
    imageUrl: 'https://example.com/charizard.png',
    rarity: 'star2',
    setId: 'PRS1',
  }],
};

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

describe('POST /posts', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      payload: validPostBody,
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing type', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { cards: validPostBody.cards },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for empty cards array', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { type: 'offering', cards: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing language in card', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        type: 'offering',
        cards: [{
          cardId: 'PRS1-001',
          name: 'Charizard',
          imageUrl: 'https://example.com/charizard.png',
          rarity: 'star2',
        }],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates an offering post and returns 201', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.post.type).toBe('offering');
    expect(body.post.status).toBe('active');
  });

  it('creates a seeking post and returns 201', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...validPostBody, type: 'seeking' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().post.type).toBe('seeking');
  });

  it('returns 403 when free user exceeds post limit', async () => {
    const userId = await createTestUser({ isPremium: false });
    const token = getAuthToken(userId);

    // Create 15 posts
    for (let i = 0; i < 15; i++) {
      await app.inject({
        method: 'POST',
        url: '/posts',
        headers: { authorization: `Bearer ${token}` },
        payload: validPostBody,
      });
    }

    // 16th should fail
    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toContain('Post limit reached');
  });
});

describe('GET /posts', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'GET', url: '/posts' });
    expect(res.statusCode).toBe(401);
  });

  it('returns posts with pagination', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const otherUser = await createTestUser();
    const otherToken = getAuthToken(otherUser);

    // Create posts as other user
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: '/posts',
        headers: { authorization: `Bearer ${otherToken}` },
        payload: validPostBody,
      });
    }

    const res = await app.inject({
      method: 'GET',
      url: '/posts?limit=2',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.posts).toHaveLength(2);
    expect(body.nextCursor).toBeDefined();
  });

  it('filters by type', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const otherUser = await createTestUser();
    const otherToken = getAuthToken(otherUser);

    await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${otherToken}` },
      payload: validPostBody,
    });
    await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { ...validPostBody, type: 'seeking' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/posts?type=offering',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().posts).toHaveLength(1);
    expect(res.json().posts[0].type).toBe('offering');
  });
});

describe('GET /posts/mine', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'GET', url: '/posts/mine' });
    expect(res.statusCode).toBe(401);
  });

  it('returns only user own posts', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const otherUser = await createTestUser();
    const otherToken = getAuthToken(otherUser);

    await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${otherToken}` },
      payload: validPostBody,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/posts/mine',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().posts).toHaveLength(1);
  });
});

describe('PUT /posts/:id/close', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'PUT', url: '/posts/some-id/close' });
    expect(res.statusCode).toBe(401);
  });

  it('closes post for owner and returns 200', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);

    const createRes = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    const postId = createRes.json().post.id;

    const res = await app.inject({
      method: 'PUT',
      url: `/posts/${postId}/close`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().post.status).toBe('closed');
  });

  it('returns 403 for non-owner', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const otherUser = await createTestUser();
    const otherToken = getAuthToken(otherUser);

    const createRes = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    const postId = createRes.json().post.id;

    const res = await app.inject({
      method: 'PUT',
      url: `/posts/${postId}/close`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for non-existent post', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'PUT',
      url: '/posts/non-existent/close',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /posts/:id', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/posts/some-id' });
    expect(res.statusCode).toBe(401);
  });

  it('deletes post for owner and returns 204', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);

    const createRes = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    const postId = createRes.json().post.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/posts/${postId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);

    // Verify deleted
    const mineRes = await app.inject({
      method: 'GET',
      url: '/posts/mine',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(mineRes.json().posts).toHaveLength(0);
  });

  it('returns 403 for non-owner', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const otherUser = await createTestUser();
    const otherToken = getAuthToken(otherUser);

    const createRes = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: validPostBody,
    });
    const postId = createRes.json().post.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/posts/${postId}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for non-existent post', async () => {
    const userId = await createTestUser();
    const token = getAuthToken(userId);
    const res = await app.inject({
      method: 'DELETE',
      url: '/posts/non-existent',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
