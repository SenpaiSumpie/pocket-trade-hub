import { buildTestApp, cleanDb, closeDb, testDb } from './setup';
import type { FastifyInstance } from 'fastify';
import {
  createProposal,
  acceptProposal,
  rejectProposal,
  completeProposal,
  getProposals,
  getProposalThread,
} from '../src/services/proposal.service';
import { tradeProposals, notifications } from '../src/db/schema';
import { eq } from 'drizzle-orm';

let app: FastifyInstance;
let userAId: string;
let userBId: string;
let userAToken: string;
let userBToken: string;

async function createUser(email: string, password = 'password123') {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: { email, password, confirmPassword: password },
  });
  return JSON.parse(res.body);
}

const sampleGives = [
  { cardId: 'card-1', cardName: 'Pikachu', imageUrl: 'http://img/1', rarity: 'star1' },
];
const sampleGets = [
  { cardId: 'card-2', cardName: 'Charizard', imageUrl: 'http://img/2', rarity: 'star2' },
];

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
  userAToken = a.accessToken;
  userBToken = b.accessToken;
});

describe('createProposal', () => {
  it('creates a proposal with pending status', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    expect(proposal.id).toBeDefined();
    expect(proposal.status).toBe('pending');
    expect(proposal.senderId).toBe(userAId);
    expect(proposal.receiverId).toBe(userBId);
  });

  it('creates a notification for the receiver', async () => {
    await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const notifs = await testDb
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userBId));

    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe('proposal_received');
  });

  it('with parentId marks parent as countered', async () => {
    const parent = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const counter = await createProposal(app.db, null, {
      senderId: userBId,
      receiverId: userAId,
      matchId: 'match-1',
      senderGives: sampleGets,
      senderGets: sampleGives,
      fairnessScore: 50,
      parentId: parent.id,
    });

    expect(counter.parentId).toBe(parent.id);

    const [updatedParent] = await testDb
      .select()
      .from(tradeProposals)
      .where(eq(tradeProposals.id, parent.id));

    expect(updatedParent.status).toBe('countered');
  });

  it('fails to counter a non-pending proposal', async () => {
    const parent = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    // Reject the parent first
    await rejectProposal(app.db, null, parent.id, userBId);

    await expect(
      createProposal(app.db, null, {
        senderId: userBId,
        receiverId: userAId,
        matchId: 'match-1',
        senderGives: sampleGets,
        senderGets: sampleGives,
        fairnessScore: 50,
        parentId: parent.id,
      }),
    ).rejects.toThrow('Parent proposal is not pending');
  });
});

describe('acceptProposal', () => {
  it('sets status to accepted when pending', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const accepted = await acceptProposal(app.db, null, proposal.id, userBId);
    expect(accepted.status).toBe('accepted');
  });

  it('creates a notification for the sender', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await acceptProposal(app.db, null, proposal.id, userBId);

    const notifs = await testDb
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userAId));

    const accepted = notifs.find((n: any) => n.type === 'proposal_accepted');
    expect(accepted).toBeDefined();
  });

  it('returns 409 for already accepted proposal', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await acceptProposal(app.db, null, proposal.id, userBId);

    await expect(
      acceptProposal(app.db, null, proposal.id, userBId),
    ).rejects.toThrow();
  });
});

describe('rejectProposal', () => {
  it('sets status to rejected when pending', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const rejected = await rejectProposal(app.db, null, proposal.id, userBId);
    expect(rejected.status).toBe('rejected');
  });

  it('returns 409 for non-pending proposal', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await rejectProposal(app.db, null, proposal.id, userBId);

    await expect(
      rejectProposal(app.db, null, proposal.id, userBId),
    ).rejects.toThrow();
  });
});

describe('completeProposal', () => {
  it('sets status to completed when accepted', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await acceptProposal(app.db, null, proposal.id, userBId);
    const completed = await completeProposal(app.db, null, proposal.id, userAId);
    expect(completed.status).toBe('completed');
  });

  it('returns 409 for non-accepted proposal', async () => {
    const proposal = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await expect(
      completeProposal(app.db, null, proposal.id, userAId),
    ).rejects.toThrow();
  });
});

describe('getProposals', () => {
  it('returns paginated proposals filtered by direction', async () => {
    await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const incoming = await getProposals(app.db, userBId, {
      direction: 'incoming',
    });
    expect(incoming.proposals.length).toBe(1);
    expect(incoming.total).toBe(1);

    const outgoing = await getProposals(app.db, userBId, {
      direction: 'outgoing',
    });
    expect(outgoing.proposals.length).toBe(0);
    expect(outgoing.total).toBe(0);
  });

  it('filters by status', async () => {
    const p1 = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    await acceptProposal(app.db, null, p1.id, userBId);

    const pending = await getProposals(app.db, userBId, {
      direction: 'all',
      status: 'pending',
    });
    expect(pending.proposals.length).toBe(0);

    const accepted = await getProposals(app.db, userBId, {
      direction: 'all',
      status: 'accepted',
    });
    expect(accepted.proposals.length).toBe(1);
  });
});

describe('getProposalThread', () => {
  it('returns root proposal and all counters', async () => {
    const root = await createProposal(app.db, null, {
      senderId: userAId,
      receiverId: userBId,
      matchId: 'match-1',
      senderGives: sampleGives,
      senderGets: sampleGets,
      fairnessScore: 50,
    });

    const counter1 = await createProposal(app.db, null, {
      senderId: userBId,
      receiverId: userAId,
      matchId: 'match-1',
      senderGives: sampleGets,
      senderGets: sampleGives,
      fairnessScore: 50,
      parentId: root.id,
    });

    const thread = await getProposalThread(app.db, counter1.id);
    expect(thread.length).toBe(2);
    expect(thread[0].id).toBe(root.id);
    expect(thread[1].id).toBe(counter1.id);
  });
});
