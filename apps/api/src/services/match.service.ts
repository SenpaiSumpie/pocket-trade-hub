import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  users,
  cards,
  pushTokens,
  userCollectionItems,
  userWantedCards,
  tradeMatches,
} from '../db/schema';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

type DbInstance = any;

const expo = new Expo();

const PRIORITY_WEIGHTS: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface CardPairData {
  cardId: string;
  priority: string;
}

export function calculateMatchScore(userGets: CardPairData[]): { score: number; starRating: number } {
  const score = userGets.reduce((sum, card) => sum + (PRIORITY_WEIGHTS[card.priority] || 1), 0);
  let starRating: number;
  if (score >= 6) {
    starRating = 3;
  } else if (score >= 3) {
    starRating = 2;
  } else {
    starRating = 1;
  }
  return { score, starRating };
}

/**
 * Finds two-way matches for a given user.
 * A match exists when: user A has cardX (partner B wants cardX) AND partner B has cardY (user A wants cardY).
 * Returns an array of { partnerId, userGives: CardPairData[], userGets: CardPairData[] }.
 */
export async function computeTwoWayMatches(db: DbInstance, userId: string) {
  // Find cards the user has that other users want
  // AND cards those other users have that the user wants

  // Step 1: Get cards the user has in collection
  const userCollection = await db
    .select({ cardId: userCollectionItems.cardId })
    .from(userCollectionItems)
    .where(eq(userCollectionItems.userId, userId));

  if (userCollection.length === 0) return [];

  const userCardIds = userCollection.map((c: any) => c.cardId);

  // Step 2: Get cards the user wants
  const userWants = await db
    .select({ cardId: userWantedCards.cardId, priority: userWantedCards.priority })
    .from(userWantedCards)
    .where(eq(userWantedCards.userId, userId));

  if (userWants.length === 0) return [];

  const userWantedCardIds = userWants.map((w: any) => w.cardId);
  const userWantedMap = new Map<string, string>(userWants.map((w: any) => [w.cardId, w.priority as string]));

  // Step 3: Find potential partners who want cards the user has
  const partnersWhoWantUserCards = await db
    .select({
      userId: userWantedCards.userId,
      cardId: userWantedCards.cardId,
      priority: userWantedCards.priority,
    })
    .from(userWantedCards)
    .where(
      and(
        inArray(userWantedCards.cardId, userCardIds),
        sql`${userWantedCards.userId} != ${userId}`
      )
    );

  if (partnersWhoWantUserCards.length === 0) return [];

  // Group by partner
  const partnerWantsFromUser = new Map<string, CardPairData[]>();
  for (const row of partnersWhoWantUserCards) {
    const existing = partnerWantsFromUser.get(row.userId) || [];
    existing.push({ cardId: row.cardId, priority: row.priority });
    partnerWantsFromUser.set(row.userId, existing);
  }

  const partnerIds = Array.from(partnerWantsFromUser.keys());

  // Step 4: Find which of those partners have cards the user wants
  const partnersWhoHaveUserWants = await db
    .select({
      userId: userCollectionItems.userId,
      cardId: userCollectionItems.cardId,
    })
    .from(userCollectionItems)
    .where(
      and(
        inArray(userCollectionItems.userId, partnerIds),
        inArray(userCollectionItems.cardId, userWantedCardIds)
      )
    );

  if (partnersWhoHaveUserWants.length === 0) return [];

  // Group by partner
  const partnerHasForUser = new Map<string, string[]>();
  for (const row of partnersWhoHaveUserWants) {
    const existing = partnerHasForUser.get(row.userId) || [];
    existing.push(row.cardId);
    partnerHasForUser.set(row.userId, existing);
  }

  // Step 5: Build matches - only partners who appear in BOTH maps
  const matches: Array<{
    partnerId: string;
    userGives: CardPairData[];
    userGets: CardPairData[];
  }> = [];

  for (const [partnerId, userGivesCards] of partnerWantsFromUser.entries()) {
    const partnerHasCards = partnerHasForUser.get(partnerId);
    if (!partnerHasCards || partnerHasCards.length === 0) continue;

    // userGives: cards the user has that the partner wants (priority from partner's wanted list)
    const userGives = userGivesCards;

    // userGets: cards the partner has that the user wants (priority from user's wanted list)
    const userGets: CardPairData[] = partnerHasCards.map((cardId) => ({
      cardId,
      priority: userWantedMap.get(cardId) || 'medium',
    }));

    matches.push({ partnerId, userGives, userGets });
  }

  return matches;
}

/**
 * Recomputes matches for a user, stores both perspectives, and returns new partner IDs.
 */
export async function recomputeMatchesForUser(
  db: DbInstance,
  io: any | null,
  userId: string,
) {
  // Get existing matches for diffing
  const existingMatches = await db
    .select({ partnerId: tradeMatches.partnerId })
    .from(tradeMatches)
    .where(eq(tradeMatches.userId, userId));

  const existingPartnerIds = new Set(existingMatches.map((m: any) => m.partnerId));

  // Compute new matches
  const rawMatches = await computeTwoWayMatches(db, userId);

  // Delete old matches for this user (both as user and as partner perspective from this user's compute)
  await db.delete(tradeMatches).where(eq(tradeMatches.userId, userId));

  // Insert new match rows for the user's perspective
  const newPartnerIds: string[] = [];

  for (const match of rawMatches) {
    const { score, starRating } = calculateMatchScore(match.userGets);
    const cardCount = match.userGives.length + match.userGets.length;

    // Insert user's perspective
    await db.insert(tradeMatches).values({
      id: randomUUID(),
      userId,
      partnerId: match.partnerId,
      userGives: match.userGives,
      userGets: match.userGets,
      score,
      starRating,
      cardCount,
      seen: false,
    });

    // Insert partner's perspective (reverse gives/gets)
    const partnerGets = match.userGives;
    const partnerGives = match.userGets;
    const { score: partnerScore, starRating: partnerStarRating } = calculateMatchScore(partnerGets);
    const partnerCardCount = partnerGives.length + partnerGets.length;

    // Upsert partner's perspective (they may already have a match row from their own recompute)
    await db
      .insert(tradeMatches)
      .values({
        id: randomUUID(),
        userId: match.partnerId,
        partnerId: userId,
        userGives: partnerGives,
        userGets: partnerGets,
        score: partnerScore,
        starRating: partnerStarRating,
        cardCount: partnerCardCount,
        seen: false,
      })
      .onConflictDoUpdate({
        target: [tradeMatches.userId, tradeMatches.partnerId],
        set: {
          userGives: partnerGives,
          userGets: partnerGets,
          score: partnerScore,
          starRating: partnerStarRating,
          cardCount: partnerCardCount,
          updatedAt: new Date(),
        },
      });

    // Track new partners
    if (!existingPartnerIds.has(match.partnerId)) {
      newPartnerIds.push(match.partnerId);
    }
  }

  // Notify user of new matches via Socket.IO and push notifications
  if (newPartnerIds.length > 0 && io) {
    // Get partner names for notification content
    const newPartners = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(inArray(users.id, newPartnerIds));

    const partnerNameMap = new Map<string, string | null>(
      newPartners.map((p: any) => [p.id, p.displayName])
    );

    for (const match of rawMatches) {
      if (!newPartnerIds.includes(match.partnerId)) continue;

      const partnerName = partnerNameMap.get(match.partnerId) || 'Someone';
      const { score, starRating } = calculateMatchScore(match.userGets);
      const topCardId = match.userGets[0]?.cardId;

      // Get top card name for notification
      let topCardName = 'a card';
      if (topCardId) {
        const cardRows = await db
          .select({ name: cards.name })
          .from(cards)
          .where(eq(cards.id, topCardId));
        if (cardRows.length > 0) {
          topCardName = cardRows[0].name;
        }
      }

      // Socket.IO emit
      io.to(`user:${userId}`).emit('new-match', {
        partnerId: match.partnerId,
        partnerName,
        topCardName,
        starRating,
      });

      // Push notification
      const hasHighPriority = match.userGets.some((g: CardPairData) => g.priority === 'high');
      await sendMatchPushNotification(db, userId, {
        partnerName,
        topCardName,
        isHighPriority: hasHighPriority,
      });
    }
  }

  return { matchCount: rawMatches.length, newPartnerIds };
}

/**
 * Send push notification for a new match.
 */
async function sendMatchPushNotification(
  db: DbInstance,
  userId: string,
  opts: { partnerName: string; topCardName: string; isHighPriority: boolean },
) {
  try {
    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    for (const record of tokens) {
      if (!Expo.isExpoPushToken(record.token)) continue;
      messages.push({
        to: record.token,
        sound: 'default',
        title: opts.isHighPriority ? 'High-priority match!' : 'New match found!',
        body: `${opts.partnerName} has ${opts.topCardName} you want.`,
      });
    }

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch {
          // Non-critical: silently fail
        }
      }
    }
  } catch {
    // Push notification failures are non-critical
  }
}

/**
 * Returns hydrated match objects for a user.
 */
export async function getMatchesForUser(
  db: DbInstance,
  userId: string,
  sort: string = 'priority',
) {
  // Get raw match rows
  let orderBy;
  switch (sort) {
    case 'cards':
      orderBy = [desc(tradeMatches.cardCount), desc(tradeMatches.score)];
      break;
    case 'newest':
      orderBy = [desc(tradeMatches.createdAt)];
      break;
    case 'priority':
    default:
      orderBy = [desc(tradeMatches.score), desc(tradeMatches.cardCount)];
      break;
  }

  const matchRows = await db
    .select()
    .from(tradeMatches)
    .where(eq(tradeMatches.userId, userId))
    .orderBy(...orderBy);

  if (matchRows.length === 0) {
    return { matches: [], unseenCount: 0 };
  }

  // Get partner profiles
  const partnerIds = matchRows.map((m: any) => m.partnerId);
  const partners = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarId: users.avatarId,
      friendCode: users.friendCode,
    })
    .from(users)
    .where(inArray(users.id, partnerIds));

  const partnerMap = new Map<string, { id: string; displayName: string | null; avatarId: string | null; friendCode: string | null }>(partners.map((p: any) => [p.id, p]));

  // Collect all card IDs for batch lookup
  const allCardIds = new Set<string>();
  for (const match of matchRows) {
    const gives = match.userGives as CardPairData[];
    const gets = match.userGets as CardPairData[];
    for (const g of gives) allCardIds.add(g.cardId);
    for (const g of gets) allCardIds.add(g.cardId);
  }

  const cardDetails = await db
    .select({
      id: cards.id,
      name: cards.name,
      imageUrl: cards.imageUrl,
      rarity: cards.rarity,
    })
    .from(cards)
    .where(inArray(cards.id, Array.from(allCardIds)));

  const cardMap = new Map<string, { id: string; name: string; imageUrl: string; rarity: string | null }>(cardDetails.map((c: any) => [c.id, c]));

  // Hydrate matches
  let unseenCount = 0;
  const hydratedMatches = matchRows.map((match: any) => {
    const partner = partnerMap.get(match.partnerId);
    const gives = (match.userGives as CardPairData[]).map((g) => {
      const card = cardMap.get(g.cardId);
      return {
        cardId: g.cardId,
        cardName: card?.name || 'Unknown',
        cardImageUrl: card?.imageUrl || '',
        rarity: card?.rarity || null,
        priority: g.priority,
      };
    });
    const gets = (match.userGets as CardPairData[]).map((g) => {
      const card = cardMap.get(g.cardId);
      return {
        cardId: g.cardId,
        cardName: card?.name || 'Unknown',
        cardImageUrl: card?.imageUrl || '',
        rarity: card?.rarity || null,
        priority: g.priority,
      };
    });

    if (!match.seen) unseenCount++;

    return {
      id: match.id,
      partnerId: match.partnerId,
      partnerDisplayName: partner?.displayName || null,
      partnerAvatarId: partner?.avatarId || null,
      partnerFriendCode: partner?.friendCode || null,
      partnerTradeCount: 0, // Trade count comes in Phase 5
      userGives: gives,
      userGets: gets,
      score: match.score,
      starRating: match.starRating,
      cardCount: match.cardCount,
      seen: match.seen,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };
  });

  return { matches: hydratedMatches, unseenCount };
}

/**
 * Mark a match as seen.
 */
export async function markMatchSeen(
  db: DbInstance,
  userId: string,
  matchId: string,
): Promise<boolean> {
  const result = await db
    .update(tradeMatches)
    .set({ seen: true, updatedAt: new Date() })
    .where(and(eq(tradeMatches.id, matchId), eq(tradeMatches.userId, userId)))
    .returning({ id: tradeMatches.id });

  return result.length > 0;
}
