import { z } from 'zod';

export const rarityValues = [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
] as const;

export const cardSchema = z.object({
  id: z.string(),
  setId: z.string(),
  localId: z.string(),
  name: z.string().min(1),
  rarity: z.enum(rarityValues).nullable(),
  type: z.string().nullable(),
  category: z.string().nullable(),
  hp: z.number().nullable(),
  stage: z.string().nullable(),
  imageUrl: z.string().url(),
  attacks: z.array(z.object({
    name: z.string(),
    damage: z.string().nullable(),
    energyCost: z.array(z.string()),
    description: z.string().nullable(),
  })).nullable(),
  weakness: z.string().nullable(),
  resistance: z.string().nullable(),
  retreatCost: z.number().nullable(),
  illustrator: z.string().nullable(),
  cardNumber: z.string(),
});

export const setSchema = z.object({
  id: z.string(),
  name: z.string(),
  series: z.string(),
  cardCount: z.number(),
  releaseDate: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});

export const cardImportSchema = z.object({
  set: setSchema,
  cards: z.array(cardSchema.omit({ id: true, setId: true })).min(1),
});

export const cardSearchSchema = z.object({
  q: z.string().optional(),
  set: z.string().optional(),
  rarity: z.enum(rarityValues).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type Card = z.infer<typeof cardSchema>;
export type CardSet = z.infer<typeof setSchema>;
export type CardImportInput = z.infer<typeof cardImportSchema>;
export type CardSearchParams = z.infer<typeof cardSearchSchema>;
