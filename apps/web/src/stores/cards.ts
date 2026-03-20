'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { Card, CardSet } from '@pocket-trade-hub/shared/src/schemas/card';

interface CardsState {
  cards: Card[];
  sets: CardSet[];
  total: number;
  page: number;
  limit: number;
  query: string;
  setId: string;
  rarity: string;
  language: string;
  selectedCard: Card | null;
  loading: boolean;

  fetchCards: () => Promise<void>;
  fetchSets: () => Promise<void>;
  setFilter: (key: 'query' | 'setId' | 'rarity' | 'language', value: string) => void;
  setPage: (page: number) => void;
  selectCard: (card: Card) => void;
  clearSelection: () => void;
}

export const useCardStore = create<CardsState>((set, get) => ({
  cards: [],
  sets: [],
  total: 0,
  page: 1,
  limit: 24,
  query: '',
  setId: '',
  rarity: '',
  language: '',
  selectedCard: null,
  loading: false,

  fetchCards: async () => {
    const { page, limit, query, setId, rarity, language } = get();
    set({ loading: true });

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (setId) params.set('set', setId);
      if (rarity) params.set('rarity', rarity);
      if (language) params.set('language', language);
      params.set('limit', String(limit));
      params.set('offset', String((page - 1) * limit));

      const data = await apiFetch<{ cards: Card[]; total: number }>(
        `/cards/search?${params.toString()}`,
      );
      set({ cards: data.cards, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchSets: async () => {
    try {
      const data = await apiFetch<CardSet[]>('/sets');
      set({ sets: data });
    } catch {
      // ignore
    }
  },

  setFilter: (key, value) => {
    set({ [key]: value, page: 1 });
    get().fetchCards();
  },

  setPage: (page) => {
    set({ page });
    get().fetchCards();
  },

  selectCard: (card) => set({ selectedCard: card }),

  clearSelection: () => set({ selectedCard: null }),
}));
