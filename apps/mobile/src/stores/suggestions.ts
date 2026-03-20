import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';
import type { TradeSuggestion, SuggestionsResponse } from '@pocket-trade-hub/shared';

interface SuggestionsState {
  suggestions: TradeSuggestion[];
  isPremium: boolean;
  loading: boolean;
  error: string | null;

  fetchSuggestions: (refresh?: boolean) => Promise<void>;
  reset: () => void;
}

const initialState = {
  suggestions: [] as TradeSuggestion[],
  isPremium: false,
  loading: false,
  error: null as string | null,
};

export const useSuggestionsStore = create<SuggestionsState>((set) => ({
  ...initialState,

  fetchSuggestions: async (refresh = false) => {
    try {
      set({ loading: true, error: null });
      const query = refresh ? '?refresh=true' : '';
      const data = await apiFetch<SuggestionsResponse>(`/suggestions${query}`);
      set({
        suggestions: data.suggestions,
        isPremium: data.isPremium,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch suggestions', loading: false });
    }
  },

  reset: () => set(initialState),
}));
