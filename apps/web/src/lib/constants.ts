export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const THEME = {
  bg: '#0a0a0a',
  surface: '#18181b',
  surfaceHover: '#27272a',
  border: '#3f3f46',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  gold: '#f0c040',
  goldHover: '#d4a830',
} as const;
