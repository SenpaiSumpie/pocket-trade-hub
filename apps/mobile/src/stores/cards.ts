import { create } from 'zustand';

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
  setSelectedSet: (setId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: keyof CardFilters, value: string) => void;
  removeFilter: (key: keyof CardFilters) => void;
  clearFilters: () => void;
  toggleSearchMode: () => void;
}

export const useCardsStore = create<CardsState>((set) => ({
  selectedSetId: null,
  searchQuery: '',
  activeFilters: {},
  isSearchMode: false,

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
}));
