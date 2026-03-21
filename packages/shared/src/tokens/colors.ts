import { palette } from './primitives';

export const colors = {
  // Surfaces
  background: palette.gray[950],
  surface: palette.gray[800],
  surfaceLight: palette.gray[700],
  surfaceHover: palette.gray[600],

  // Text / on-surface
  onSurface: palette.white,
  onSurfaceSecondary: palette.gray[300],
  onSurfaceMuted: palette.gray[400],

  // Accent
  accent: palette.gold[500],
  accentDark: palette.gold[600],

  // Feedback
  error: palette.red[500],
  success: palette.green[500],
  warning: palette.orange[500],

  // UI chrome
  border: palette.gray[600],
  inputBackground: palette.gray[800],
  tabBar: palette.gray[900],

  // Rarity (first-class)
  rarityDiamond: palette.diamond[500],
  rarityStar: palette.gold[500],
  rarityCrown: palette.crown[500],

  // Tier grades
  tierS: palette.red[500],
  tierA: palette.orange[500],
  tierB: palette.gold[500],
  tierC: palette.green[500],
  tierD: '#3498db',
} as const;
