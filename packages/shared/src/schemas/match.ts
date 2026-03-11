import { z } from 'zod';
import { priorityValues } from './collection';

export const matchCardPairSchema = z.object({
  cardId: z.string(),
  cardName: z.string(),
  cardImageUrl: z.string(),
  rarity: z.string().nullable(),
  priority: z.enum(priorityValues),
});

export const tradeMatchSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  partnerDisplayName: z.string().nullable(),
  partnerAvatarId: z.string().nullable(),
  partnerFriendCode: z.string().nullable(),
  partnerTradeCount: z.number(),
  partnerAvgRating: z.number(),
  userGives: z.array(matchCardPairSchema),
  userGets: z.array(matchCardPairSchema),
  score: z.number(),
  starRating: z.number().min(1).max(3),
  cardCount: z.number(),
  seen: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  partnerIsPremium: z.boolean().optional(),
});

export const matchSortSchema = z.enum(['priority', 'cards', 'newest']).default('priority');

export type MatchCardPair = z.infer<typeof matchCardPairSchema>;
export type TradeMatch = z.infer<typeof tradeMatchSchema>;
export type MatchSort = z.infer<typeof matchSortSchema>;
