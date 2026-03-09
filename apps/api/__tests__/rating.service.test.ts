import { buildTestApp, cleanDb, closeDb, testDb } from './setup';
import type { FastifyInstance } from 'fastify';
import {
  createProposal,
  acceptProposal,
  completeProposal,
} from '../src/services/proposal.service';
import { rateTradePartner, getUserReputation } from '../src/services/rating.service';

let app: FastifyInstance;
let userAId: string;
let userBId: string;

async function createUser(email: string, password = 'password123') {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
  return JSON.parse(res.body);
}

const sampleGives = [
  { cardId: 'c1', cardName: 'Pikachu', imageUrl: 'http://img/1', rarity: 'star1' },
];
const sampleGets = [
  { cardId: 'c2', cardName: 'Charizard', imageUrl: 'http://img/2', rarity: 'star2' },
];

async function createCompletedProposal() {
  const proposal = await createProposal(app.db, null, {
    senderId: userAId,
    receiverId: userBId,
    matchId: 'match-1',
    senderGives: sampleGives,
    senderGets: sampleGets,
    fairnessScore: 50,
  });
  await acceptProposal(app.db, null, proposal.id, userBId);
  await completeProposal(app.db, null, proposal.id, userAId);
  return proposal;
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
  const a = await createUser('usera@test.com');
  const b = await createUser('userb@test.com');
  userAId = a.user.id;
  userBId = b.user.id;
});

describe('rateTradePartner', () => {
  it('creates a rating for a completed proposal', async () => {
    const proposal = await createCompletedProposal();

    const rating = await rateTradePartner(app.db, {
      proposalId: proposal.id,
      raterId: userAId,
      ratedId: userBId,
      stars: 5,
    });

    expect(rating).toBeDefined();
    expect(rating!.stars).toBe(5);
    expect(rating!.raterId).toBe(userAId);
    expect(rating!.ratedId).toBe(userBId);
  });

  it('returns null for duplicate rating (idempotent)', async () => {
    const proposal = await createCompletedProposal();

    await rateTradePartner(app.db, {
      proposalId: proposal.id,
      raterId: userAId,
      ratedId: userBId,
      stars: 5,
    });

    const duplicate = await rateTradePartner(app.db, {
      proposalId: proposal.id,
      raterId: userAId,
      ratedId: userBId,
      stars: 3,
    });

    expect(duplicate).toBeNull();
  });

  it('fails if proposal is not completed', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await expect(
      rateTradePartner(app.db, {
        proposalId: proposal.id,
        raterId: userAId,
        ratedId: userBId,
        stars: 5,
      }),
    ).rejects.toThrow('Proposal must be completed to rate');
  });

  it('fails if rater is not a party', async () => {
    const proposal = await createCompletedProposal();
    const c = await createUser('userc@test.com');

    await expect(
      rateTradePartner(app.db, {
        proposalId: proposal.id,
        raterId: c.user.id,
        ratedId: userBId,
        stars: 5,
      }),
    ).rejects.toThrow('Not authorized to rate this trade');
  });
});

describe('getUserReputation', () => {
  it('returns aggregated rating data', async () => {
    const p1 = await createCompletedProposal();
    await rateTradePartner(app.db, {
      proposalId: p1.id,
      raterId: userAId,
      ratedId: userBId,
      stars: 5,
    });

    const rep = await getUserReputation(app.db, userBId);
    expect(rep.avgRating).toBe(5);
    expect(rep.tradeCount).toBe(1);
  });

  it('returns zeros for user with no ratings', async () => {
    const rep = await getUserReputation(app.db, userAId);
    expect(rep.avgRating).toBe(0);
    expect(rep.tradeCount).toBe(0);
  });
});
