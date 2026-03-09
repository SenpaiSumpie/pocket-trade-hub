import { z } from 'zod';

export const createRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
});

export const tradeRatingSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  raterId: z.string(),
  ratedId: z.string(),
  stars: z.number().int().min(1).max(5),
  createdAt: z.string(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type TradeRating = z.infer<typeof tradeRatingSchema>;
