import { z } from 'zod';

export const postTypeValues = ['offering', 'seeking'] as const;
export const postStatusValues = ['active', 'closed', 'auto_closed'] as const;

export const postTypeSchema = z.enum(postTypeValues);
export const postStatusSchema = z.enum(postStatusValues);

export const postCardSchema = z.object({
  cardId: z.string().min(1),
  language: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  rarity: z.string().nullable(),
  setId: z.string().optional(),
});

export const createPostSchema = z.object({
  type: postTypeSchema,
  cards: z.array(postCardSchema).min(1).max(1),
});

export const tradePostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: postTypeSchema,
  status: postStatusSchema,
  cards: z.array(postCardSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PostCard = z.infer<typeof postCardSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type TradePost = z.infer<typeof tradePostSchema>;
export type PostType = z.infer<typeof postTypeSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;
