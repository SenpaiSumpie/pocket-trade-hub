import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';
import type { CardTranslation } from '@pocket-trade-hub/shared';

interface CardFilters {
  set?: string;
  rarity?: string;
  type?: string;
}

interface CardsState {
  selectedSetId: string | null;
  searchQuery: string;
  activeFilters: CardFilters;
  isSearchMode: boolean;
  selectedLanguage: string | undefined;
  translationsByCardId: Record<string, CardTranslation[]>;
  translationsLoading: boolean;

  setSelectedSet: (setId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: keyof CardFilters, value: string) => void;
  removeFilter: (key: keyof CardFilters) => void;
  clearFilters: () => void;
  toggleSearchMode: () => void;
  setSelectedLanguage: (lang: string | undefined) => void;
  fetchTranslations: (cardId: string) => Promise<void>;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  selectedSetId: null,
  searchQuery: '',
  activeFilters: {},
  isSearchMode: false,
  selectedLanguage: undefined,
  translationsByCardId: {},
  translationsLoading: false,

  setSelectedSet: (setId) => set({ selectedSetId: setId }),

  setSearchQuery: (query) =>
    set({ searchQuery: query, isSearchMode: query.length > 0 }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),

  removeFilter: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.activeFilters;
      return { activeFilters: rest };
    }),

  clearFilters: () => set({ activeFilters: {} }),

  toggleSearchMode: () =>
    set((state) => ({
      isSearchMode: !state.isSearchMode,
      searchQuery: state.isSearchMode ? '' : state.searchQuery,
      activeFilters: state.isSearchMode ? {} : state.activeFilters,
    })),

  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  fetchTranslations: async (cardId: string) => {
    // Skip if already loaded
    if (get().translationsByCardId[cardId]) return;
    set({ translationsLoading: true });
    try {
      const data = await apiFetch<{ translations: CardTranslation[] }>(
        `/cards/${cardId}/translations`,
        { skipAuth: true },
      );
      set((state) => ({
        translationsByCardId: {
          ...state.translationsByCardId,
          [cardId]: data.translations,
        },
        translationsLoading: false,
      }));
    } catch {
      set({ translationsLoading: false });
    }
  },
}));
