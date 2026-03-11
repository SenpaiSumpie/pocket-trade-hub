import { z } from 'zod';

export const analyticsCardSchema = z.object({
  cardId: z.string(),
  cardName: z.string(),
  cardImageUrl: z.string(),
  rarity: z.string().nullable(),
  value: z.number(),
  rank: z.number(),
});

export const analyticsResponseSchema = z.object({
  mostWanted: z.array(analyticsCardSchema),
  leastAvailable: z.array(analyticsCardSchema),
  trending: z.array(analyticsCardSchema),
  tradePower: z.array(analyticsCardSchema),
});

export const subscriptionStatusSchema = z.object({
  isPremium: z.boolean(),
  premiumExpiresAt: z.string().nullable(),
});

export type AnalyticsCard = z.infer<typeof analyticsCardSchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
