import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const oauthProviderValues = ['google', 'apple'] as const;

export const oauthLoginSchema = z.object({
  provider: z.enum(oauthProviderValues),
  idToken: z.string().min(1, 'ID token is required'),
});

export const linkAccountSchema = z.object({
  provider: z.enum(oauthProviderValues),
  idToken: z.string().min(1, 'ID token is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>;
export type OAuthLoginInput = z.infer<typeof oauthLoginSchema>;
export type LinkAccountInput = z.infer<typeof linkAccountSchema>;
