import { colors } from '@pocket-trade-hub/shared';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const THEME = {
  bg: colors.background,
  surface: colors.surface,
  surfaceHover: colors.surfaceHover,
  border: colors.border,
  text: colors.onSurface,
  textMuted: colors.onSurfaceMuted,
  gold: colors.accent,
  goldHover: colors.accentDark,
} as const;
