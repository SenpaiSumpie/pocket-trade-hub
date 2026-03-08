export const colors = {
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  primary: '#f0c040',
  primaryDark: '#c49a20',
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  textMuted: '#6c6c80',
  error: '#e74c3c',
  success: '#2ecc71',
  border: '#2a2a45',
  tabBar: '#12121f',
  inputBackground: '#1e1e35',
};

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
