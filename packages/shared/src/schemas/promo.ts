import { z } from 'zod';

export const redeemCodeSchema = z.object({
  code: z.string().min(1).max(30),
});

export const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(30),
  description: z.string().optional(),
  premiumDays: z.number().int().min(1),
  maxRedemptions: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type RedeemCodeInput = z.infer<typeof redeemCodeSchema>;
export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
