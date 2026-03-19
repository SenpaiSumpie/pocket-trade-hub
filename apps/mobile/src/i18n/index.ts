import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { supportedUILanguages } from '@pocket-trade-hub/shared';
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

function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode;
    if (deviceLang && (supportedUILanguages as readonly string[]).includes(deviceLang)) {
      return deviceLang;
    }
  } catch {
    // Fall through to default
  }
  return 'en';
}

i18n.use(initReactI18next).init({
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
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
