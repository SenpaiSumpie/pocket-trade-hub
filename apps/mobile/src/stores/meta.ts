import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';
import type { DeckMeta, DeckMetaResponse } from '@pocket-trade-hub/shared';

type SortBy = 'winRate' | 'usageRate' | 'trending';

interface MetaState {
  decks: DeckMeta[];
  isPremium: boolean;
  scrapedAt: string | null;
  loading: boolean;
  error: string | null;
  sortBy: SortBy;

  fetchDecks: () => Promise<void>;
  setSortBy: (sort: SortBy) => void;
  reset: () => void;
}

function sortDecks(decks: DeckMeta[], sortBy: SortBy): DeckMeta[] {
  return [...decks].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return (b.winRate ?? 0) - (a.winRate ?? 0);
      case 'usageRate':
        return (b.usageRate ?? 0) - (a.usageRate ?? 0);
      case 'trending':
        // Trending: sort by play count descending as proxy
        return (b.playCount ?? 0) - (a.playCount ?? 0);
      default:
        return 0;
    }
  });
}

const initialState = {
  decks: [] as DeckMeta[],
  isPremium: false,
  scrapedAt: null as string | null,
  loading: false,
  error: null as string | null,
  sortBy: 'winRate' as SortBy,
};

export const useMetaStore = create<MetaState>((set, get) => ({
  ...initialState,

  fetchDecks: async () => {
    try {
      set({ loading: true, error: null });
      const data = await apiFetch<DeckMetaResponse>('/meta/decks');
      const sorted = sortDecks(data.decks, get().sortBy);
      const scrapedAt = sorted.length > 0 ? sorted[0].scrapedAt : null;
      set({
        decks: sorted,
        isPremium: data.isPremium,
        scrapedAt,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch decks', loading: false });
    }
  },

  setSortBy: (sort) => {
    const { decks } = get();
    set({ sortBy: sort, decks: sortDecks(decks, sort) });
  },

  reset: () => set(initialState),
}));
