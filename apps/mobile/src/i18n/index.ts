import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { supportedUILanguages } from '@pocket-trade-hub/shared';
import en from './locales/en.json';

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
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
