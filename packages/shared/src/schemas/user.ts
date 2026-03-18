import { z } from 'zod';
import { uiLanguageSchema } from './i18n';

export const friendCodeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{4}-\d{4}-\d{4}$/,
    'Friend code must be in XXXX-XXXX-XXXX-XXXX format (digits only)'
  );

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(30).optional(),
  avatarId: z.string().optional(),
  friendCode: friendCodeSchema.optional(),
  uiLanguage: uiLanguageSchema.optional(),
});

export const userProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  avatarId: z.string().nullable(),
  friendCode: z.string().nullable(),
  createdAt: z.string(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
