import { buildTestApp, cleanDb, closeDb, testDb, TEST_JWT_SECRET } from '../setup';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { users, tradePosts, userWantedCards, notifications, cards, sets } from '../../src/db/schema';

let app: FastifyInstance;

// Helper to create a user directly in the DB
async function createUser(overrides: Partial<{ id: string; email: string; displayName: string; isPremium: boolean }> = {}) {
  const id = overrides.id || randomUUID();
  const email = overrides.email || `${id}@test.com`;
  await testDb.insert(users).values({
    id,
    email,
    passwordHash: 'hashed',
    displayName: overrides.displayName || 'TestUser',
    isPremium: overrides.isPremium ?? false,
  });
  return id;
}

// Helper to create a set and card
async function createSetAndCard(opts: { cardId: string; name: string; setId?: string }) {
  const setId = opts.setId || 'test-set';
  // Only insert set if it doesn't exist
  const existing = await testDb.select().from(sets).where(
    require('drizzle-orm').eq(sets.id, setId)
  ).limit(1);
  if (existing.length === 0) {
    await testDb.insert(sets).values({
      id: setId,
      name: 'Test Set',
      series: 'A1',
      cardCount: 100,
    });
  }

  const existingCard = await testDb.select().from(cards).where(
    require('drizzle-orm').eq(cards.id, opts.cardId)
  ).limit(1);
  if (existingCard.length === 0) {
    await testDb.insert(cards).values({
      id: opts.cardId,
      setId,
      localId: '001',
      name: opts.name,
      imageUrl: 'https://example.com/card.png',
    });
  }
}

// Helper to create a trade post
async function createTradePost(opts: {
  userId: string;
  type: 'offering' | 'seeking';
  cardId: string;
  language: string;
  status?: 'active' | 'closed' | 'auto_closed';
}) {
  const id = randomUUID();
  await testDb.insert(tradePosts).values({
    id,
    userId: opts.userId,
    type: opts.type,
    status: opts.status || 'active',
    cards: [{ cardId: opts.cardId, language: opts.language, name: 'Test Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
  });
  return id;
}

// Helper to add to wanted list
async function addToWanted(userId: string, cardId: string, language: string) {
  await testDb.insert(userWantedCards).values({
    id: randomUUID(),
    userId,
    cardId,
    language,
    priority: 'medium',
  });
}

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

describe('post-match.service', () => {
  describe('findComplementaryMatches', () => {
    it('finds Seeking posts that match an Offering post by cardId + language', async () => {
      const { findComplementaryMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      // UserA creates an offering post for card X in English
      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });

      // UserB has a seeking post for card X in English
      await createTradePost({ userId: userB, type: 'seeking', cardId: 'card-x', language: 'en' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findComplementaryMatches(testDb, offeringPost[0]);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].userId).toBe(userB);
    });

    it('finds Offering posts that match a Seeking post by cardId + language', async () => {
      const { findComplementaryMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      // UserB has an offering post for card Y in French
      await createTradePost({ userId: userB, type: 'offering', cardId: 'card-y', language: 'fr' });

      // UserA creates a seeking post for card Y in French
      const seekingPostId = await createTradePost({ userId: userA, type: 'seeking', cardId: 'card-y', language: 'fr' });

      const seekingPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, seekingPostId)
      ).limit(1);

      const matches = await findComplementaryMatches(testDb, seekingPost[0]);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].userId).toBe(userB);
    });

    it('does not match posts with different language', async () => {
      const { findComplementaryMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });
      // UserB seeking same card but in French
      await createTradePost({ userId: userB, type: 'seeking', cardId: 'card-x', language: 'fr' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findComplementaryMatches(testDb, offeringPost[0]);
      expect(matches.length).toBe(0);
    });

    it('excludes own posts (no self-matching)', async () => {
      const { findComplementaryMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });
      // UserA also has a seeking post for the same card
      await createTradePost({ userId: userA, type: 'seeking', cardId: 'card-x', language: 'en' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findComplementaryMatches(testDb, offeringPost[0]);
      expect(matches.length).toBe(0);
    });

    it('only returns active posts (not closed or auto_closed)', async () => {
      const { findComplementaryMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });
      // UserB has a closed seeking post
      await createTradePost({ userId: userB, type: 'seeking', cardId: 'card-x', language: 'en', status: 'closed' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findComplementaryMatches(testDb, offeringPost[0]);
      expect(matches.length).toBe(0);
    });
  });

  describe('findWantedListMatches', () => {
    it('finds wanted list entries matching an Offering post cardId + language', async () => {
      const { findWantedListMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Test Card' });
      await addToWanted(userB, 'card-x', 'en');

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findWantedListMatches(testDb, offeringPost[0]);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].userId).toBe(userB);
    });

    it('does not match wanted list for Seeking posts', async () => {
      const { findWantedListMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Test Card' });
      await addToWanted(userB, 'card-x', 'en');

      const seekingPostId = await createTradePost({ userId: userA, type: 'seeking', cardId: 'card-x', language: 'en' });

      const seekingPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, seekingPostId)
      ).limit(1);

      const matches = await findWantedListMatches(testDb, seekingPost[0]);
      expect(matches.length).toBe(0);
    });

    it('excludes own wanted list entries', async () => {
      const { findWantedListMatches } = require('../../src/services/post-match.service');

      const userA = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Test Card' });
      await addToWanted(userA, 'card-x', 'en');

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });

      const offeringPost = await testDb.select().from(tradePosts).where(
        require('drizzle-orm').eq(tradePosts.id, offeringPostId)
      ).limit(1);

      const matches = await findWantedListMatches(testDb, offeringPost[0]);
      expect(matches.length).toBe(0);
    });
  });

  describe('processPostMatch (notification batching)', () => {
    it('creates batched notifications per user (one per user even with multiple matches)', async () => {
      const { processPostMatch } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Test Card' });

      // UserB has a seeking post AND a wanted list entry for the same card
      await createTradePost({ userId: userB, type: 'seeking', cardId: 'card-x', language: 'en' });
      await addToWanted(userB, 'card-x', 'en');

      // UserA creates an offering post
      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });

      // Process with null io (no socket in tests)
      await processPostMatch(testDb, null, offeringPostId);

      // Check notifications: userB should get exactly ONE notification (batched)
      const { eq } = require('drizzle-orm');
      const notifs = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userB));

      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe('post_match');
    });

    it('sends notifications to multiple different users', async () => {
      const { processPostMatch } = require('../../src/services/post-match.service');

      const userA = await createUser();
      const userB = await createUser();
      const userC = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Test Card' });

      // Both userB and userC have seeking posts for the same card
      await createTradePost({ userId: userB, type: 'seeking', cardId: 'card-x', language: 'en' });
      await createTradePost({ userId: userC, type: 'seeking', cardId: 'card-x', language: 'en' });

      const offeringPostId = await createTradePost({ userId: userA, type: 'offering', cardId: 'card-x', language: 'en' });

      await processPostMatch(testDb, null, offeringPostId);

      const { eq } = require('drizzle-orm');
      const notifsB = await testDb.select().from(notifications).where(eq(notifications.userId, userB));
      const notifsC = await testDb.select().from(notifications).where(eq(notifications.userId, userC));

      expect(notifsB.length).toBe(1);
      expect(notifsC.length).toBe(1);
    });
  });
});
