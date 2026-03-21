// Backward-compatible shim -- maps old property names to new shared tokens.
// Consuming files (44+) import from this file unchanged.
// New code should import from @pocket-trade-hub/shared tokens directly.
import {
  colors as tokenColors,
  tokenTypography,
  spacing as tokenSpacing,
  borderRadius as tokenBorderRadius,
} from '@pocket-trade-hub/shared';

export const colors = {
  background: tokenColors.background,
  surface: tokenColors.surface,
  surfaceLight: tokenColors.surfaceLight,
  primary: tokenColors.accent,
  primaryDark: tokenColors.accentDark,
  text: tokenColors.onSurface,
  textSecondary: tokenColors.onSurfaceSecondary,
  textMuted: tokenColors.onSurfaceMuted,
  error: tokenColors.error,
  success: tokenColors.success,
  border: tokenColors.border,
  tabBar: tokenColors.tabBar,
  inputBackground: tokenColors.inputBackground,
};

export const typography = {
  heading: {
    fontSize: tokenTypography.heading.fontSize,
    fontWeight: tokenTypography.heading.fontWeight,
    color: colors.text,
  },
  subheading: {
    fontSize: tokenTypography.subheading.fontSize,
    fontWeight: tokenTypography.subheading.fontWeight,
    color: colors.text,
  },
  body: {
    fontSize: tokenTypography.body.fontSize,
    fontWeight: tokenTypography.body.fontWeight,
    color: colors.text,
  },
  caption: {
    fontSize: tokenTypography.caption.fontSize,
    fontWeight: tokenTypography.caption.fontWeight,
    color: colors.textSecondary,
  },
  label: {
    fontSize: tokenTypography.label.fontSize,
    fontWeight: tokenTypography.label.fontWeight,
    color: colors.textSecondary,
  },
};

export const spacing = {
  xs: tokenSpacing.xs,
  sm: tokenSpacing.sm,
  md: tokenSpacing.md,
  lg: tokenSpacing.lg,
  xl: tokenSpacing.xl,
  xxl: tokenSpacing.xxl,
};

export const borderRadius = {
  sm: tokenBorderRadius.sm,
  md: tokenBorderRadius.md,
  lg: tokenBorderRadius.lg,
  xl: tokenBorderRadius.xl,
  full: tokenBorderRadius.full,
};
