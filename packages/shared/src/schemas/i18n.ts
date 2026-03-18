import { z } from 'zod';

export const supportedUILanguages = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh', 'th'] as const;

export type UILanguage = typeof supportedUILanguages[number];

export const UI_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '\u65e5\u672c\u8a9e' },
  { code: 'ko', name: 'Korean', nativeName: '\ud55c\uad6d\uc5b4' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'zh', name: 'Chinese', nativeName: '\u4e2d\u6587' },
  { code: 'th', name: 'Thai', nativeName: '\u0e44\u0e17\u0e22' },
] as const;

export const uiLanguageSchema = z.enum(supportedUILanguages);
