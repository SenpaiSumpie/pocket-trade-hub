import { buildTestApp, cleanDb, closeDb, testDb, TEST_JWT_SECRET } from '../setup';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { users, tradePosts, tradeProposals, notifications, cards, sets, userCollectionItems, userWantedCards } from '../../src/db/schema';

let app: FastifyInstance;

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

async function createSetAndCard(opts: { cardId: string; name: string; setId?: string }) {
  const setId = opts.setId || 'test-set';
  const existingSet = await testDb.select().from(sets).where(eq(sets.id, setId)).limit(1);
  if (existingSet.length === 0) {
    await testDb.insert(sets).values({
      id: setId,
      name: 'Test Set',
      series: 'A1',
      cardCount: 100,
    });
  }
  const existingCard = await testDb.select().from(cards).where(eq(cards.id, opts.cardId)).limit(1);
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

async function addToCollection(userId: string, cardId: string, quantity: number = 1) {
  await testDb.insert(userCollectionItems).values({
    id: randomUUID(),
    userId,
    cardId,
    language: 'en',
    quantity,
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

describe('proposal.service', () => {
  describe('createProposal with postId', () => {
    it('creates a proposal with postId and no matchId', async () => {
      const { createProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();
      const postId = await createTradePost({ userId: receiver, type: 'seeking', cardId: 'card-x', language: 'en' });

      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        postId,
        senderGives: [{ cardId: 'card-x', cardName: 'Test Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Other Card', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      expect(proposal).toBeDefined();
      expect(proposal.postId).toBe(postId);
      expect(proposal.matchId).toBeNull();
    });

    it('creates a proposal with matchId (backward compatible)', async () => {
      const { createProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();

      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        matchId: 'some-match-id',
        senderGives: [{ cardId: 'card-x', cardName: 'Test Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Other Card', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      expect(proposal).toBeDefined();
      expect(proposal.matchId).toBe('some-match-id');
    });

    it('returns 409 when postId references a closed post', async () => {
      const { createProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();
      const postId = await createTradePost({ userId: receiver, type: 'seeking', cardId: 'card-x', language: 'en', status: 'closed' });

      await expect(
        createProposal(testDb, null, {
          senderId: sender,
          receiverId: receiver,
          postId,
          senderGives: [{ cardId: 'card-x', cardName: 'Test Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
          senderGets: [{ cardId: 'card-y', cardName: 'Other Card', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
          fairnessScore: 85,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('returns 409 when postId references an auto_closed post', async () => {
      const { createProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();
      const postId = await createTradePost({ userId: receiver, type: 'seeking', cardId: 'card-x', language: 'en', status: 'auto_closed' });

      await expect(
        createProposal(testDb, null, {
          senderId: sender,
          receiverId: receiver,
          postId,
          senderGives: [{ cardId: 'card-x', cardName: 'Test Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
          senderGets: [{ cardId: 'card-y', cardName: 'Other Card', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
          fairnessScore: 85,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('completeProposal auto-close', () => {
    it('auto-closes Offering posts when cards are traded away', async () => {
      const { createProposal, acceptProposal, completeProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Card X' });
      await createSetAndCard({ cardId: 'card-y', name: 'Card Y' });

      // Sender has card-x in collection
      await addToCollection(sender, 'card-x', 2);
      // Receiver has card-y in collection
      await addToCollection(receiver, 'card-y', 2);

      // Sender has an active Offering post for card-x
      const senderPostId = await createTradePost({ userId: sender, type: 'offering', cardId: 'card-x', language: 'en' });

      // Create and accept a proposal where sender gives card-x
      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        matchId: 'match-1',
        senderGives: [{ cardId: 'card-x', cardName: 'Card X', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Card Y', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      await acceptProposal(testDb, null, proposal.id, receiver);
      await completeProposal(testDb, null, proposal.id, sender);

      // Check that sender's Offering post for card-x is now auto_closed
      const [updatedPost] = await testDb
        .select()
        .from(tradePosts)
        .where(eq(tradePosts.id, senderPostId));

      expect(updatedPost.status).toBe('auto_closed');
    });

    it('auto-closes Seeking posts when receiver gets desired card', async () => {
      const { createProposal, acceptProposal, completeProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Card X' });
      await createSetAndCard({ cardId: 'card-y', name: 'Card Y' });

      await addToCollection(sender, 'card-x', 2);
      await addToCollection(receiver, 'card-y', 2);

      // Receiver has a Seeking post for card-x (they want card-x)
      const receiverPostId = await createTradePost({ userId: receiver, type: 'seeking', cardId: 'card-x', language: 'en' });

      // Sender gives card-x to receiver
      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        matchId: 'match-1',
        senderGives: [{ cardId: 'card-x', cardName: 'Card X', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Card Y', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      await acceptProposal(testDb, null, proposal.id, receiver);
      await completeProposal(testDb, null, proposal.id, sender);

      // Receiver's Seeking post for card-x should be auto_closed (they got card-x)
      const [updatedPost] = await testDb
        .select()
        .from(tradePosts)
        .where(eq(tradePosts.id, receiverPostId));

      expect(updatedPost.status).toBe('auto_closed');
    });

    it('sends notification when post is auto-closed', async () => {
      const { createProposal, acceptProposal, completeProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Card X' });
      await createSetAndCard({ cardId: 'card-y', name: 'Card Y' });

      await addToCollection(sender, 'card-x', 2);
      await addToCollection(receiver, 'card-y', 2);

      // Sender has Offering post for card-x
      await createTradePost({ userId: sender, type: 'offering', cardId: 'card-x', language: 'en' });

      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        matchId: 'match-1',
        senderGives: [{ cardId: 'card-x', cardName: 'Card X', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Card Y', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      await acceptProposal(testDb, null, proposal.id, receiver);
      await completeProposal(testDb, null, proposal.id, sender);

      // Check for auto-close notification
      const notifs = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.type, 'post_auto_closed'));

      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].userId).toBe(sender);
    });

    it('does not auto-close posts with different cardId', async () => {
      const { createProposal, acceptProposal, completeProposal } = require('../../src/services/proposal.service');

      const sender = await createUser();
      const receiver = await createUser();

      await createSetAndCard({ cardId: 'card-x', name: 'Card X' });
      await createSetAndCard({ cardId: 'card-y', name: 'Card Y' });
      await createSetAndCard({ cardId: 'card-z', name: 'Card Z' });

      await addToCollection(sender, 'card-x', 2);
      await addToCollection(receiver, 'card-y', 2);

      // Sender has Offering post for card-z (NOT card-x)
      const postId = await createTradePost({ userId: sender, type: 'offering', cardId: 'card-z', language: 'en' });

      const proposal = await createProposal(testDb, null, {
        senderId: sender,
        receiverId: receiver,
        matchId: 'match-1',
        senderGives: [{ cardId: 'card-x', cardName: 'Card X', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'card-y', cardName: 'Card Y', imageUrl: 'https://img.com/d.png', rarity: 'star1' }],
        fairnessScore: 85,
      });

      await acceptProposal(testDb, null, proposal.id, receiver);
      await completeProposal(testDb, null, proposal.id, sender);

      // Post for card-z should remain active
      const [post] = await testDb.select().from(tradePosts).where(eq(tradePosts.id, postId));
      expect(post.status).toBe('active');
    });
  });

  describe('shared proposal schema', () => {
    it('accepts postId without matchId', () => {
      const { createProposalSchema } = require('@pocket-trade-hub/shared');

      const result = createProposalSchema.safeParse({
        postId: 'some-post-id',
        receiverId: 'user-2',
        senderGives: [{ cardId: 'c1', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'c2', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        fairnessScore: 90,
      });

      expect(result.success).toBe(true);
    });

    it('accepts matchId without postId', () => {
      const { createProposalSchema } = require('@pocket-trade-hub/shared');

      const result = createProposalSchema.safeParse({
        matchId: 'some-match-id',
        receiverId: 'user-2',
        senderGives: [{ cardId: 'c1', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'c2', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        fairnessScore: 90,
      });

      expect(result.success).toBe(true);
    });

    it('rejects when neither matchId nor postId is provided', () => {
      const { createProposalSchema } = require('@pocket-trade-hub/shared');

      const result = createProposalSchema.safeParse({
        receiverId: 'user-2',
        senderGives: [{ cardId: 'c1', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'c2', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        fairnessScore: 90,
      });

      expect(result.success).toBe(false);
    });

    it('tradeProposalSchema includes nullable postId', () => {
      const { tradeProposalSchema } = require('@pocket-trade-hub/shared');

      const result = tradeProposalSchema.safeParse({
        id: 'p1',
        matchId: null,
        postId: 'post-1',
        senderId: 'u1',
        receiverId: 'u2',
        parentId: null,
        status: 'pending',
        senderGives: [{ cardId: 'c1', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        senderGets: [{ cardId: 'c2', cardName: 'Card', imageUrl: 'https://img.com/c.png', rarity: 'star1' }],
        fairnessScore: 90,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      expect(result.success).toBe(true);
    });
  });
});
