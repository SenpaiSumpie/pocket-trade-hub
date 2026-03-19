import i18next from 'i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import th from './locales/th.json';

const i18n = i18next.createInstance();

const SUPPORTED_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh', 'th'];

export async function initServerI18n(): Promise<void> {
  await i18n.init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
      fr: { translation: fr },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      pt: { translation: pt },
      zh: { translation: zh },
      th: { translation: th },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export function t(key: string, lng: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { lng, ...options });
}

/**
 * Parse Accept-Language header and return best supported language.
 * Used for unauthenticated routes (login, signup, password reset).
 */
export function parseAcceptLanguage(header: string | undefined): string {
  if (!header) return 'en';
  const lang = header.split(',')[0].split('-')[0].trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}
