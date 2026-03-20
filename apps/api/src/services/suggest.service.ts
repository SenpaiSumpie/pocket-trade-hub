import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  cards,
  userWantedCards,
  userCollectionItems,
  cardAnalytics,
  tradeSuggestions,
} from '../db/schema';
import { getTradePower, getAnalytics } from './analytics.service';
import type IORedis from 'ioredis';

type Db = any;

const CACHE_TTL = 3600; // 1 hour
const MAX_SUGGESTIONS = 5;
const MAX_CANDIDATE_POOL = 20;

const RARITY_TIER: Record<string, number> = {
  diamond1: 1,
  diamond2: 2,
  diamond3: 3,
  diamond4: 4,
  star1: 5,
  star2: 6,
  star3: 7,
  crown: 8,
};

interface SuggestionPair {
  giveCardId: string;
  getCardId: string;
  giveCard: { name: string; rarity: string | null; imageUrl: string };
  getCard: { name: string; rarity: string | null; imageUrl: string };
  score: number;
  reasoning: string;
}

function generateReasoning(signals: {
  getCardName: string;
  giveCardName: string;
  tradePowerValue?: number;
  trendingRank?: number;
  isHighPriority: boolean;
}): string {
  const parts: string[] = [];

  if (signals.trendingRank && signals.trendingRank <= 10) {
    parts.push(`${signals.getCardName} is trending in demand right now.`);
  }

  if (signals.isHighPriority) {
    parts.push('This is on your high priority list.');
  }

  if (signals.tradePowerValue && signals.tradePowerValue >= 3) {
    parts.push(`${signals.giveCardName} is wanted by ${signals.tradePowerValue} traders.`);
  }

  if (parts.length === 0) {
    parts.push('Good value trade based on current demand.');
  }

  return parts.join(' ');
}

export async function computeSuggestions(
  db: Db,
  redis: IORedis,
  userId: string,
): Promise<{ suggestions: SuggestionPair[]; isPremium: boolean; notEnoughData?: boolean }> {
  // Check Redis cache
  const cacheKey = `suggestions:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Gather user's wanted cards
  const wantedRows = await db
    .select({
      cardId: userWantedCards.cardId,
      priority: userWantedCards.priority,
    })
    .from(userWantedCards)
    .where(eq(userWantedCards.userId, userId));

  // Gather user's collection
  const collectionRows = await db
    .select({
      cardId: userCollectionItems.cardId,
    })
    .from(userCollectionItems)
    .where(eq(userCollectionItems.userId, userId));

  // Sparse data check
  if (collectionRows.length < 3 || wantedRows.length === 0) {
    const result = { suggestions: [], isPremium: true, notEnoughData: true };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
  }

  // Get trade power for user's collection cards (cards others want)
  const tradePowerRows = await getTradePower(db, userId);
  const tradePowerMap = new Map<string, number>();
  for (const row of tradePowerRows) {
    tradePowerMap.set(row.cardId, row.value);
  }

  // Get trending data
  const analytics = await getAnalytics(db);
  const trendingMap = new Map<string, number>();
  for (const item of analytics.trending) {
    trendingMap.set(item.cardId, item.rank);
  }

  // Build candidate give cards (from collection, sorted by trade power)
  const collectionCardIds = collectionRows.map((r: any) => r.cardId);
  const giveCardIds = collectionCardIds
    .sort((a: string, b: string) => (tradePowerMap.get(b) || 0) - (tradePowerMap.get(a) || 0))
    .slice(0, MAX_CANDIDATE_POOL);

  // Build candidate get cards (wanted cards)
  const getCardIds = wantedRows
    .map((r: any) => r.cardId)
    .slice(0, MAX_CANDIDATE_POOL);

  if (giveCardIds.length === 0 || getCardIds.length === 0) {
    const result = { suggestions: [], isPremium: true, notEnoughData: true };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    return result;
  }

  // Hydrate card details for both pools
  const allCardIds = [...new Set([...giveCardIds, ...getCardIds])];
  const cardDetails = await db
    .select({
      id: cards.id,
      name: cards.name,
      rarity: cards.rarity,
      imageUrl: cards.imageUrl,
    })
    .from(cards)
    .where(inArray(cards.id, allCardIds));

  const cardMap = new Map<string, { name: string; rarity: string | null; imageUrl: string }>();
  for (const card of cardDetails) {
    cardMap.set(card.id, { name: card.name, rarity: card.rarity, imageUrl: card.imageUrl });
  }

  // Build priority map
  const priorityMap = new Map<string, string>();
  for (const w of wantedRows) {
    priorityMap.set(w.cardId, w.priority);
  }

  // Score suggestion pairs
  const pairs: SuggestionPair[] = [];

  for (const getCardId of getCardIds) {
    const getCard = cardMap.get(getCardId);
    if (!getCard) continue;

    for (const giveCardId of giveCardIds) {
      if (giveCardId === getCardId) continue;
      const giveCard = cardMap.get(giveCardId);
      if (!giveCard) continue;

      let score = 0;

      // Trade power boost
      const tp = tradePowerMap.get(giveCardId) || 0;
      score += tp * 10;

      // Trending demand boost
      const trendRank = trendingMap.get(getCardId);
      if (trendRank) {
        score += (11 - trendRank) * 5; // Higher rank = more points
      }

      // High priority wanted boost
      const priority = priorityMap.get(getCardId) || 'medium';
      if (priority === 'high') score += 30;
      else if (priority === 'medium') score += 15;
      else score += 5;

      // Rarity tier matching bonus
      const giveRarity = RARITY_TIER[giveCard.rarity || ''] || 0;
      const getRarity = RARITY_TIER[getCard.rarity || ''] || 0;
      if (giveRarity > 0 && getRarity > 0) {
        const diff = Math.abs(giveRarity - getRarity);
        score += Math.max(0, 10 - diff * 3); // Closer rarity = more points
      }

      const reasoning = generateReasoning({
        getCardName: getCard.name,
        giveCardName: giveCard.name,
        tradePowerValue: tp,
        trendingRank: trendRank,
        isHighPriority: priority === 'high',
      });

      pairs.push({
        giveCardId,
        getCardId,
        giveCard,
        getCard,
        score,
        reasoning,
      });
    }
  }

  // Sort by score desc, take top N
  pairs.sort((a, b) => b.score - a.score);
  const topPairs = pairs.slice(0, MAX_SUGGESTIONS);

  // Store in tradeSuggestions table for history
  const now = new Date();
  for (const pair of topPairs) {
    await db.insert(tradeSuggestions).values({
      id: randomUUID(),
      userId,
      giveCardId: pair.giveCardId,
      getCardId: pair.getCardId,
      score: pair.score,
      reasoning: pair.reasoning,
      computedAt: now,
    });
  }

  const result = {
    suggestions: topPairs.map((p) => ({
      id: randomUUID(),
      giveCardId: p.giveCardId,
      getCardId: p.getCardId,
      giveCard: p.giveCard,
      getCard: p.getCard,
      score: p.score,
      reasoning: p.reasoning,
      computedAt: now.toISOString(),
    })),
    isPremium: true,
  };

  // Cache in Redis
  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

  return result;
}
