import { z } from 'zod';

export const tierEntrySchema = z.object({
  deckId: z.string(),
  deckName: z.string(),
});

export type TierEntry = z.infer<typeof tierEntrySchema>;

export const tiersSchema = z.object({
  S: z.array(tierEntrySchema),
  A: z.array(tierEntrySchema),
  B: z.array(tierEntrySchema),
  C: z.array(tierEntrySchema),
  D: z.array(tierEntrySchema),
});

export type Tiers = z.infer<typeof tiersSchema>;

export const tierListSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  tiers: tiersSchema,
  isOfficial: z.boolean(),
  upvoteCount: z.number(),
  userVoted: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TierList = z.infer<typeof tierListSchema>;

export const createTierListSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tiers: tiersSchema,
});

export type CreateTierListInput = z.infer<typeof createTierListSchema>;

export const tierListResponseSchema = z.object({
  tierLists: z.array(tierListSchema),
  total: z.number(),
});

export type TierListResponse = z.infer<typeof tierListResponseSchema>;
