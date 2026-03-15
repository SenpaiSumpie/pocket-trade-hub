import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tradePosts, users, userWantedCards, userCollectionItems } from '../db/schema';

type DbInstance = any;

interface PostCard {
  cardId: string;
  language: string;
  name: string;
  imageUrl: string;
  rarity: string | null;
  setId?: string;
}

interface CreatePostInput {
  type: 'offering' | 'seeking';
  cards: PostCard[];
}

interface GetPostsFilters {
  type?: 'offering' | 'seeking';
  language?: string;
  rarity?: string;
  search?: string;
  setId?: string;
  sort?: 'newest' | 'relevant';
  cursor?: string;
  limit?: number;
}

const FREE_POST_LIMIT = 15;

export async function getActivePostCount(db: DbInstance, userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tradePosts)
    .where(and(eq(tradePosts.userId, userId), eq(tradePosts.status, 'active')));
  return result[0]?.count ?? 0;
}

export async function createPost(
  db: DbInstance,
  userId: string,
  input: CreatePostInput,
) {
  // Check premium limit for non-premium users
  const [user] = await db
    .select({ isPremium: users.isPremium })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.isPremium) {
    const activeCount = await getActivePostCount(db, userId);
    if (activeCount >= FREE_POST_LIMIT) {
      throw Object.assign(
        new Error('Post limit reached. Upgrade to premium for unlimited posts.'),
        { statusCode: 403 },
      );
    }
  }

  const id = randomUUID();
  const [post] = await db
    .insert(tradePosts)
    .values({
      id,
      userId,
      type: input.type,
      cards: input.cards,
    })
    .returning();

  return post;
}

export async function getPosts(
  db: DbInstance,
  userId: string,
  filters: GetPostsFilters = {},
) {
  const { type, language, rarity, search, setId, cursor, limit = 20 } = filters;

  const conditions: any[] = [eq(tradePosts.status, 'active')];

  if (type) {
    conditions.push(eq(tradePosts.type, type));
  }

  // JSONB filters using containment operator
  if (language) {
    conditions.push(
      sql`${tradePosts.cards} @> ${JSON.stringify([{ language }])}::jsonb`,
    );
  }

  if (rarity) {
    conditions.push(
      sql`${tradePosts.cards} @> ${JSON.stringify([{ rarity }])}::jsonb`,
    );
  }

  if (setId) {
    conditions.push(
      sql`${tradePosts.cards} @> ${JSON.stringify([{ setId }])}::jsonb`,
    );
  }

  if (search) {
    // Case-insensitive name search in JSONB cards array
    conditions.push(
      sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${tradePosts.cards}) elem WHERE lower(elem->>'name') LIKE ${`%${search.toLowerCase()}%`})`,
    );
  }

  if (cursor) {
    conditions.push(lt(tradePosts.createdAt, new Date(cursor)));
  }

  const whereClause = and(...conditions);

  const posts = await db
    .select()
    .from(tradePosts)
    .where(whereClause)
    .orderBy(desc(tradePosts.createdAt))
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const resultPosts = hasMore ? posts.slice(0, limit) : posts;

  // Compute isRelevant for each post
  // For offering posts: check if card matches user's wanted list (cardId + language)
  // For seeking posts: check if card matches user's collection (cardId + language)
  const wantedRows = await db
    .select({ cardId: userWantedCards.cardId, language: userWantedCards.language })
    .from(userWantedCards)
    .where(eq(userWantedCards.userId, userId));

  const collectionRows = await db
    .select({ cardId: userCollectionItems.cardId, language: userCollectionItems.language })
    .from(userCollectionItems)
    .where(eq(userCollectionItems.userId, userId));

  const wantedSet = new Set(wantedRows.map((w: any) => `${w.cardId}:${w.language}`));
  const collectionSet = new Set(collectionRows.map((c: any) => `${c.cardId}:${c.language}`));

  const enrichedPosts = resultPosts.map((post: any) => {
    const postCards: PostCard[] = post.cards ?? [];
    let isRelevant = false;

    if (post.type === 'offering') {
      // An offering post is relevant if user wants any of the offered cards
      isRelevant = postCards.some((c) => wantedSet.has(`${c.cardId}:${c.language}`));
    } else if (post.type === 'seeking') {
      // A seeking post is relevant if user has any of the sought cards
      isRelevant = postCards.some((c) => collectionSet.has(`${c.cardId}:${c.language}`));
    }

    return { ...post, isRelevant };
  });

  const nextCursor = hasMore
    ? resultPosts[resultPosts.length - 1].createdAt.toISOString()
    : null;

  return { posts: enrichedPosts, nextCursor };
}

export async function getMyPosts(db: DbInstance, userId: string) {
  return db
    .select()
    .from(tradePosts)
    .where(eq(tradePosts.userId, userId))
    .orderBy(desc(tradePosts.createdAt));
}

export async function closePost(db: DbInstance, userId: string, postId: string) {
  // First check if post exists
  const [post] = await db
    .select()
    .from(tradePosts)
    .where(eq(tradePosts.id, postId))
    .limit(1);

  if (!post) {
    throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  }

  if (post.userId !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }

  const [updated] = await db
    .update(tradePosts)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(tradePosts.id, postId))
    .returning();

  return updated;
}

export async function deletePost(db: DbInstance, userId: string, postId: string) {
  // First check if post exists
  const [post] = await db
    .select()
    .from(tradePosts)
    .where(eq(tradePosts.id, postId))
    .limit(1);

  if (!post) {
    throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  }

  if (post.userId !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }

  await db
    .delete(tradePosts)
    .where(eq(tradePosts.id, postId));
}
