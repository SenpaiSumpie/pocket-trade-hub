import { eq, and, desc, sql, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tierLists, tierListVotes, deckMeta } from '../db/schema';
import type { CreateTierListInput } from '@pocket-trade-hub/shared';

type Db = any;

export async function createTierList(
  db: Db,
  userId: string,
  data: CreateTierListInput,
) {
  // Validate at least 1 deck in any tier
  const hasDeck = Object.values(data.tiers).some(
    (tier: any[]) => tier.length > 0,
  );
  if (!hasDeck) {
    throw new Error('Tier list must contain at least one deck');
  }

  const id = randomUUID();
  const now = new Date();

  await db.insert(tierLists).values({
    id,
    userId,
    title: data.title,
    description: data.description || null,
    tiers: data.tiers,
    isOfficial: false,
    upvoteCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.id, id));

  return {
    ...created,
    tiers: created.tiers,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    userVoted: false,
  };
}

export async function getTierLists(
  db: Db,
  opts: { sort: string; page: number; limit: number; userId?: string },
) {
  const { sort, page, limit, userId } = opts;
  const offset = (page - 1) * limit;

  const orderBy =
    sort === 'most_liked'
      ? desc(tierLists.upvoteCount)
      : desc(tierLists.createdAt);

  const rows = await db
    .select()
    .from(tierLists)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get total count
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tierLists);
  const total = totalRow?.count ?? 0;

  // If userId provided, check which tier lists the user has voted on
  let votedSet = new Set<string>();
  if (userId && rows.length > 0) {
    const tierListIds = rows.map((r: any) => r.id);
    const votes = await db
      .select({ tierListId: tierListVotes.tierListId })
      .from(tierListVotes)
      .where(
        and(
          eq(tierListVotes.userId, userId),
          sql`${tierListVotes.tierListId} = ANY(${tierListIds})`,
        ),
      );
    votedSet = new Set(votes.map((v: any) => v.tierListId));
  }

  return {
    tierLists: rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      tiers: r.tiers,
      isOfficial: r.isOfficial,
      upvoteCount: r.upvoteCount,
      userVoted: userId ? votedSet.has(r.id) : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total,
  };
}

export async function getTierListById(
  db: Db,
  id: string,
  userId?: string,
) {
  const rows = await db
    .select()
    .from(tierLists)
    .where(eq(tierLists.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];

  let userVoted: boolean | undefined;
  if (userId) {
    const votes = await db
      .select({ id: tierListVotes.id })
      .from(tierListVotes)
      .where(
        and(
          eq(tierListVotes.tierListId, id),
          eq(tierListVotes.userId, userId),
        ),
      )
      .limit(1);
    userVoted = votes.length > 0;
  }

  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    tiers: r.tiers,
    isOfficial: r.isOfficial,
    upvoteCount: r.upvoteCount,
    userVoted,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function deleteTierList(
  db: Db,
  id: string,
  userId: string,
): Promise<'deleted' | 'not_found' | 'forbidden'> {
  const rows = await db
    .select({ id: tierLists.id, userId: tierLists.userId })
    .from(tierLists)
    .where(eq(tierLists.id, id))
    .limit(1);

  if (rows.length === 0) return 'not_found';
  if (rows[0].userId !== userId) return 'forbidden';

  await db.delete(tierListVotes).where(eq(tierListVotes.tierListId, id));
  await db.delete(tierLists).where(eq(tierLists.id, id));

  return 'deleted';
}

export async function voteTierList(
  db: Db,
  tierListId: string,
  userId: string,
): Promise<{ upvoteCount: number; userVoted: boolean } | null> {
  // Check tier list exists
  const rows = await db
    .select({ id: tierLists.id })
    .from(tierLists)
    .where(eq(tierLists.id, tierListId))
    .limit(1);

  if (rows.length === 0) return null;

  // Check if vote exists
  const existingVote = await db
    .select({ id: tierListVotes.id })
    .from(tierListVotes)
    .where(
      and(
        eq(tierListVotes.tierListId, tierListId),
        eq(tierListVotes.userId, userId),
      ),
    )
    .limit(1);

  if (existingVote.length > 0) {
    // Remove vote and decrement atomically
    await db
      .delete(tierListVotes)
      .where(eq(tierListVotes.id, existingVote[0].id));
    await db
      .update(tierLists)
      .set({
        upvoteCount: sql`${tierLists.upvoteCount} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(tierLists.id, tierListId));

    const [updated] = await db
      .select({ upvoteCount: tierLists.upvoteCount })
      .from(tierLists)
      .where(eq(tierLists.id, tierListId));

    return { upvoteCount: updated.upvoteCount, userVoted: false };
  } else {
    // Add vote and increment atomically
    await db.insert(tierListVotes).values({
      id: randomUUID(),
      tierListId,
      userId,
      createdAt: new Date(),
    });
    await db
      .update(tierLists)
      .set({
        upvoteCount: sql`${tierLists.upvoteCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tierLists.id, tierListId));

    const [updated] = await db
      .select({ upvoteCount: tierLists.upvoteCount })
      .from(tierLists)
      .where(eq(tierLists.id, tierListId));

    return { upvoteCount: updated.upvoteCount, userVoted: true };
  }
}

export async function generateOfficialTierList(db: Db): Promise<void> {
  // Get all decks sorted by win rate descending
  const decks = await db
    .select({ id: deckMeta.id, name: deckMeta.name, winRate: deckMeta.winRate })
    .from(deckMeta)
    .orderBy(desc(deckMeta.winRate));

  if (decks.length === 0) return;

  // Auto-assign to tiers based on percentile
  const total = decks.length;
  const tiers: { S: any[]; A: any[]; B: any[]; C: any[]; D: any[] } = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };

  for (let i = 0; i < total; i++) {
    const percentile = i / total;
    const entry = { deckId: decks[i].id, deckName: decks[i].name };

    if (percentile < 0.1) {
      tiers.S.push(entry);
    } else if (percentile < 0.3) {
      tiers.A.push(entry);
    } else if (percentile < 0.6) {
      tiers.B.push(entry);
    } else if (percentile < 0.85) {
      tiers.C.push(entry);
    } else {
      tiers.D.push(entry);
    }
  }

  // Upsert official tier list
  const now = new Date();
  const existing = await db
    .select({ id: tierLists.id })
    .from(tierLists)
    .where(eq(tierLists.isOfficial, true))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(tierLists)
      .set({
        title: 'Official Meta Tier List',
        tiers,
        updatedAt: now,
      })
      .where(eq(tierLists.id, existing[0].id));
  } else {
    // Need a system user ID for the official tier list
    const SYSTEM_USER_ID = 'system';
    await db.insert(tierLists).values({
      id: randomUUID(),
      userId: SYSTEM_USER_ID,
      title: 'Official Meta Tier List',
      description: 'Auto-generated from competitive meta data.',
      tiers,
      isOfficial: true,
      upvoteCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}
