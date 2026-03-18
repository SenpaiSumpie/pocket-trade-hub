import { create } from 'zustand';
import i18n from '../i18n';
import { apiFetch } from '../hooks/useApi';

interface LanguageState {
  currentLanguage: string;
  isLoading: boolean;
  initLanguage: (serverLanguage?: string) => void;
  setLanguage: (lang: string) => Promise<void>;
}

function getDeviceLanguage(): string {
  return i18n.language || 'en';
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: 'en',
  isLoading: false,

  initLanguage: (serverLanguage?: string) => {
    const lang = serverLanguage || getDeviceLanguage();
    i18n.changeLanguage(lang);
    set({ currentLanguage: lang });
  },

  setLanguage: async (lang: string) => {
    // Optimistic update: change UI immediately
    i18n.changeLanguage(lang);
    set({ currentLanguage: lang, isLoading: true });

    // Sync to server in background
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ uiLanguage: lang }),
      });
    } catch {
      // Silently fail server sync -- UI is already updated
    } finally {
      set({ isLoading: false });
    }
  },
}));
