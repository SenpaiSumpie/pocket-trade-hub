import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tradeProposals, tradeRatings, notifications } from '../db/schema';

type DbInstance = any;

export async function rateTradePartner(
  db: DbInstance,
  opts: {
    proposalId: string;
    raterId: string;
    ratedId: string;
    stars: number;
  },
) {
  // Verify proposal exists and is completed
  const [proposal] = await db
    .select()
    .from(tradeProposals)
    .where(eq(tradeProposals.id, opts.proposalId))
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'completed') {
    throw Object.assign(new Error('Proposal must be completed to rate'), {
      statusCode: 400,
    });
  }

  // Verify rater is a party to the proposal
  if (proposal.senderId !== opts.raterId && proposal.receiverId !== opts.raterId) {
    throw Object.assign(new Error('Not authorized to rate this trade'), {
      statusCode: 403,
    });
  }

  // Verify ratedId is the other party
  const expectedRatedId =
    proposal.senderId === opts.raterId ? proposal.receiverId : proposal.senderId;

  if (opts.ratedId !== expectedRatedId) {
    throw Object.assign(new Error('Invalid rated user'), {
      statusCode: 400,
    });
  }

  const id = randomUUID();

  // Insert with onConflict ignore for idempotency (unique on proposalId+raterId)
  const result = await db
    .insert(tradeRatings)
    .values({
      id,
      proposalId: opts.proposalId,
      raterId: opts.raterId,
      ratedId: opts.ratedId,
      stars: opts.stars,
    })
    .onConflictDoNothing({
      target: [tradeRatings.proposalId, tradeRatings.raterId],
    })
    .returning();

  // If no rows returned, it was a duplicate (idempotent)
  if (result.length === 0) {
    return null;
  }

  // Create notification for rated user
  await db.insert(notifications).values({
    id: randomUUID(),
    userId: opts.ratedId,
    type: 'rating_received',
    title: 'New rating received',
    body: `You received a ${opts.stars}-star rating for a trade.`,
    data: { proposalId: opts.proposalId, stars: opts.stars },
  });

  return result[0];
}

export async function getUserReputation(
  db: DbInstance,
  userId: string,
): Promise<{ avgRating: number; tradeCount: number }> {
  const result = await db
    .select({
      avgRating: sql<number>`COALESCE(ROUND(AVG(${tradeRatings.stars})::numeric, 1), 0)::float`,
      tradeCount: sql<number>`COUNT(*)::int`,
    })
    .from(tradeRatings)
    .where(eq(tradeRatings.ratedId, userId));

  const row = result[0];
  return {
    avgRating: row?.avgRating || 0,
    tradeCount: row?.tradeCount || 0,
  };
}
