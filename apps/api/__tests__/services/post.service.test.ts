import { buildTestApp, cleanDb, closeDb, testDb } from '../setup';
import { users, sets, cards, userCollectionItems, userWantedCards, tradePosts } from '../../src/db/schema';
import {
  createPost,
  getPosts,
  getMyPosts,
  closePost,
  deletePost,
  getActivePostCount,
} from '../../src/services/post.service';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

let app: FastifyInstance;

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

async function seedCardSet() {
  const setId = 'PS1';
  await testDb.insert(sets).values({
    id: setId,
    name: 'Post Test Set',
    series: 'PT',
    cardCount: 4,
    releaseDate: '2024-01-01',
    imageUrl: 'https://example.com/set.png',
  });

  const cardData = [
    { id: 'PS1-001', localId: '001', name: 'Charizard', rarity: 'star2' as const, imageUrl: 'https://example.com/charizard.png' },
    { id: 'PS1-002', localId: '002', name: 'Pikachu', rarity: 'diamond1' as const, imageUrl: 'https://example.com/pikachu.png' },
    { id: 'PS1-003', localId: '003', name: 'Blastoise', rarity: 'star1' as const, imageUrl: 'https://example.com/blastoise.png' },
    { id: 'PS1-004', localId: '004', name: 'Venusaur', rarity: 'diamond3' as const, imageUrl: 'https://example.com/venusaur.png' },
  ];

  for (const card of cardData) {
    await testDb.insert(cards).values({
      ...card,
      setId,
      type: 'fire',
      category: 'pokemon',
      hp: 100,
      stage: 'Basic',
      attacks: null,
      weakness: null,
      resistance: null,
      retreatCost: null,
      illustrator: 'Test',
      cardNumber: card.localId,
    });
  }

  return cardData;
}

function makePostCard(card: { id: string; name: string; rarity: string | null; imageUrl: string }, lang = 'en') {
  return {
    cardId: card.id,
    language: lang,
    name: card.name,
    imageUrl: card.imageUrl,
    rarity: card.rarity,
    setId: 'PS1',
  };
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

describe('createPost', () => {
  it('creates an offering post with valid card data', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, {
      type: 'offering',
      cards: [makePostCard(cardData[0])],
    });

    expect(post.id).toBeDefined();
    expect(post.type).toBe('offering');
    expect(post.status).toBe('active');
    expect(post.userId).toBe(userId);
    expect(post.cards).toHaveLength(1);
  });

  it('creates a seeking post with valid card data', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, {
      type: 'seeking',
      cards: [makePostCard(cardData[1])],
    });

    expect(post.id).toBeDefined();
    expect(post.type).toBe('seeking');
    expect(post.status).toBe('active');
  });

  it('stores card language in post card data (TRAD-06)', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, {
      type: 'offering',
      cards: [makePostCard(cardData[0], 'de')],
    });

    const postCards = post.cards as any[];
    expect(postCards[0].language).toBe('de');
  });

  it('enforces 15 active post limit for non-premium users', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser({ isPremium: false });

    // Create 15 posts
    for (let i = 0; i < 15; i++) {
      await createPost(testDb, userId, {
        type: 'offering',
        cards: [makePostCard(cardData[0])],
      });
    }

    // 16th should fail
    await expect(
      createPost(testDb, userId, {
        type: 'offering',
        cards: [makePostCard(cardData[0])],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows unlimited posts for premium users', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser({ isPremium: true });

    // Create 16 posts (beyond free limit)
    for (let i = 0; i < 16; i++) {
      await createPost(testDb, userId, {
        type: 'offering',
        cards: [makePostCard(cardData[0])],
      });
    }

    const count = await getActivePostCount(testDb, userId);
    expect(count).toBe(16);
  });
});

describe('getPosts', () => {
  it('returns paginated results with cursor-based pagination', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();
    const otherUser = await createTestUser();

    // Create 3 posts from other user
    for (let i = 0; i < 3; i++) {
      await createPost(testDb, otherUser, {
        type: 'offering',
        cards: [makePostCard(cardData[i % cardData.length])],
      });
    }

    const result = await getPosts(testDb, userId, { limit: 2 });
    expect(result.posts).toHaveLength(2);
    expect(result.nextCursor).toBeDefined();

    const result2 = await getPosts(testDb, userId, { limit: 2, cursor: result.nextCursor! });
    expect(result2.posts).toHaveLength(1);
    expect(result2.nextCursor).toBeNull();
  });

  it('filters by type (offering/seeking)', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[0])] });
    await createPost(testDb, otherUser, { type: 'seeking', cards: [makePostCard(cardData[1])] });

    const offerings = await getPosts(testDb, userId, { type: 'offering' });
    expect(offerings.posts).toHaveLength(1);
    expect(offerings.posts[0].type).toBe('offering');

    const seekings = await getPosts(testDb, userId, { type: 'seeking' });
    expect(seekings.posts).toHaveLength(1);
    expect(seekings.posts[0].type).toBe('seeking');
  });

  it('filters by card language', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[0], 'en')] });
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[1], 'de')] });

    const enPosts = await getPosts(testDb, userId, { language: 'en' });
    expect(enPosts.posts).toHaveLength(1);

    const dePosts = await getPosts(testDb, userId, { language: 'de' });
    expect(dePosts.posts).toHaveLength(1);
  });

  it('filters by rarity', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[0])] }); // star2
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[1])] }); // diamond1

    const star2Posts = await getPosts(testDb, userId, { rarity: 'star2' });
    expect(star2Posts.posts).toHaveLength(1);
  });

  it('filters by card name search (case-insensitive)', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[0])] }); // Charizard
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[1])] }); // Pikachu

    const result = await getPosts(testDb, userId, { search: 'chariz' });
    expect(result.posts).toHaveLength(1);
    expect((result.posts[0].cards as any[])[0].name).toBe('Charizard');
  });

  it('marks posts as isRelevant when they match user wanted list (for Offering)', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    // User wants Charizard in en
    await testDb.insert(userWantedCards).values({
      id: randomUUID(),
      userId,
      cardId: 'PS1-001',
      language: 'en',
      priority: 'high',
    });

    // Other user offering Charizard in en
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[0], 'en')] });
    // Other user offering Pikachu in en (not wanted)
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[1], 'en')] });

    const result = await getPosts(testDb, userId, {});
    const relevant = result.posts.filter((p: any) => p.isRelevant);
    expect(relevant).toHaveLength(1);
    expect((relevant[0].cards as any[])[0].cardId).toBe('PS1-001');
  });

  it('marks posts as isRelevant when they match user collection (for Seeking)', async () => {
    const cardData = await seedCardSet();
    const otherUser = await createTestUser();
    const userId = await createTestUser();

    // User has Charizard in en
    await testDb.insert(userCollectionItems).values({
      id: randomUUID(),
      userId,
      cardId: 'PS1-001',
      language: 'en',
      quantity: 1,
    });

    // Other user seeking Charizard in en
    await createPost(testDb, otherUser, { type: 'seeking', cards: [makePostCard(cardData[0], 'en')] });
    // Other user seeking Pikachu in en (user doesn't have)
    await createPost(testDb, otherUser, { type: 'seeking', cards: [makePostCard(cardData[1], 'en')] });

    const result = await getPosts(testDb, userId, {});
    const relevant = result.posts.filter((p: any) => p.isRelevant);
    expect(relevant).toHaveLength(1);
    expect((relevant[0].cards as any[])[0].cardId).toBe('PS1-001');
  });
});

describe('getMyPosts', () => {
  it('returns only the authenticated user posts', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();
    const otherUser = await createTestUser();

    await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });
    await createPost(testDb, otherUser, { type: 'offering', cards: [makePostCard(cardData[1])] });

    const myPosts = await getMyPosts(testDb, userId);
    expect(myPosts).toHaveLength(1);
    expect(myPosts[0].userId).toBe(userId);
  });

  it('returns posts of any status', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });
    await closePost(testDb, userId, post.id);

    const myPosts = await getMyPosts(testDb, userId);
    expect(myPosts).toHaveLength(1);
    expect(myPosts[0].status).toBe('closed');
  });
});

describe('closePost', () => {
  it('sets status to closed for post owner', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });
    const closed = await closePost(testDb, userId, post.id);

    expect(closed.status).toBe('closed');
  });

  it('throws 403 when non-owner tries to close', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();
    const otherUser = await createTestUser();

    const post = await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });

    await expect(closePost(testDb, otherUser, post.id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 for non-existent post', async () => {
    const userId = await createTestUser();
    await expect(closePost(testDb, userId, 'non-existent')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deletePost', () => {
  it('removes post for owner', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();

    const post = await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });
    await deletePost(testDb, userId, post.id);

    const myPosts = await getMyPosts(testDb, userId);
    expect(myPosts).toHaveLength(0);
  });

  it('throws 403 when non-owner tries to delete', async () => {
    const cardData = await seedCardSet();
    const userId = await createTestUser();
    const otherUser = await createTestUser();

    const post = await createPost(testDb, userId, { type: 'offering', cards: [makePostCard(cardData[0])] });

    await expect(deletePost(testDb, otherUser, post.id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 for non-existent post', async () => {
    const userId = await createTestUser();
    await expect(deletePost(testDb, userId, 'non-existent')).rejects.toMatchObject({ statusCode: 404 });
  });
});
