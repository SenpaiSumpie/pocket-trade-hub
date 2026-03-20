import { z } from 'zod';

export const deckMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  winRate: z.number().nullable(),
  usageRate: z.number().nullable(),
  playCount: z.number().nullable(),
  matchRecord: z.string().nullable(),
  cards: z.any().nullable(),
  matchups: z.any().nullable(),
  tournamentResults: z.any().nullable(),
  scrapedAt: z.string(),
});

export type DeckMeta = z.infer<typeof deckMetaSchema>;

export const deckMetaResponseSchema = z.object({
  decks: z.array(deckMetaSchema),
  isPremium: z.boolean(),
});

export type DeckMetaResponse = z.infer<typeof deckMetaResponseSchema>;
