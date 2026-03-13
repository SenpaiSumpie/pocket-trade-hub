import { z } from 'zod';
import { cardLanguageValues } from './card';

export const priorityValues = ['high', 'medium', 'low'] as const;

export const addToCollectionSchema = z.object({
  cardId: z.string().min(1),
  language: z.enum(cardLanguageValues).default('en'),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const bulkCollectionSchema = z.object({
  setId: z.string().min(1),
  additions: z.array(z.string()).default([]),
  removals: z.array(z.string()).default([]),
});

export const collectionItemSchema = z.object({
  cardId: z.string(),
  language: z.enum(cardLanguageValues).default('en'),
  quantity: z.number(),
});

export const collectionProgressSchema = z.object({
  setId: z.string(),
  setName: z.string(),
  owned: z.number(),
  total: z.number(),
});

export const addToWantedSchema = z.object({
  cardId: z.string().min(1),
  language: z.enum(cardLanguageValues).default('en'),
  priority: z.enum(priorityValues).default('medium'),
});

export const updateWantedSchema = z.object({
  priority: z.enum(priorityValues),
});

export type AddToCollectionInput = z.infer<typeof addToCollectionSchema>;
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;
export type BulkCollectionInput = z.infer<typeof bulkCollectionSchema>;
export type CollectionItem = z.infer<typeof collectionItemSchema>;
export type CollectionProgress = z.infer<typeof collectionProgressSchema>;
export type AddToWantedInput = z.infer<typeof addToWantedSchema>;
export type UpdateWantedInput = z.infer<typeof updateWantedSchema>;
export type Priority = (typeof priorityValues)[number];
