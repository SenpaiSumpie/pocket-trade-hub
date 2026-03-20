'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { DeckMeta } from '@pocket-trade-hub/shared/src/schemas/meta';

interface MetaSnapshot {
  topDecks: string[];
  totalDecks: number;
  lastUpdated: string;
}

interface MetaState {
  decks: DeckMeta[];
  snapshot: MetaSnapshot | null;
  total: number;
  page: number;
  limit: number;
  sort: string;
  selectedDeck: DeckMeta | null;
  loading: boolean;

  fetchDecks: () => Promise<void>;
  fetchSnapshot: () => Promise<void>;
  selectDeck: (deck: DeckMeta) => void;
  clearSelection: () => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
}

export const useMetaStore = create<MetaState>((set, get) => ({
  decks: [],
  snapshot: null,
  total: 0,
  page: 1,
  limit: 20,
  sort: 'winRate',
  selectedDeck: null,
  loading: false,

  fetchDecks: async () => {
    const { page, limit, sort } = get();
    set({ loading: true });

    try {
      const params = new URLSearchParams();
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await apiFetch<{ decks: DeckMeta[]; total?: number }>(
        `/meta/decks?${params.toString()}`,
      );
      set({ decks: data.decks, total: data.total ?? data.decks.length, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchSnapshot: async () => {
    try {
      const data = await apiFetch<MetaSnapshot>('/meta/snapshot');
      set({ snapshot: data });
    } catch {
      // ignore
    }
  },

  selectDeck: (deck) => set({ selectedDeck: deck }),

  clearSelection: () => set({ selectedDeck: null }),

  setSort: (sort) => {
    set({ sort, page: 1 });
    get().fetchDecks();
  },

  setPage: (page) => {
    set({ page });
    get().fetchDecks();
  },
}));
