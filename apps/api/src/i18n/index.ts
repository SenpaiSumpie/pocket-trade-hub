import i18next from 'i18next';
import en from './locales/en.json';

const i18n = i18next.createInstance();

export async function initServerI18n(): Promise<void> {
  await i18n.init({
    resources: {
      en: { translation: en },
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
