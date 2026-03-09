import { z } from 'zod';

export const notificationTypeValues = [
  'proposal_received',
  'proposal_accepted',
  'proposal_rejected',
  'proposal_countered',
  'trade_completed',
  'new_match',
  'rating_received',
  'system',
] as const;

export const notificationTypeSchema = z.enum(notificationTypeValues);

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.any().optional(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
