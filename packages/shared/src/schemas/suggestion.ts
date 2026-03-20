import { z } from 'zod';

const cardInfoSchema = z.object({
  name: z.string(),
  rarity: z.string().nullable(),
  imageUrl: z.string(),
});

export const tradeSuggestionSchema = z.object({
  id: z.string(),
  giveCardId: z.string(),
  getCardId: z.string(),
  giveCard: cardInfoSchema,
  getCard: cardInfoSchema,
  score: z.number(),
  reasoning: z.string(),
  computedAt: z.string(),
});

export type TradeSuggestion = z.infer<typeof tradeSuggestionSchema>;

export const suggestionsResponseSchema = z.object({
  suggestions: z.array(tradeSuggestionSchema),
  isPremium: z.boolean(),
});

export type SuggestionsResponse = z.infer<typeof suggestionsResponseSchema>;
