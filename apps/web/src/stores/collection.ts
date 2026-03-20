'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { Card } from '@pocket-trade-hub/shared/src/schemas/card';

interface CollectionItem {
  cardId: string;
  language: string;
  quantity: number;
  card?: Card;
}

interface CollectionProgress {
  setId: string;
  setName: string;
  owned: number;
  total: number;
}

interface CollectionState {
  items: CollectionItem[];
  progress: CollectionProgress[];
  loading: boolean;
  filter: {
    query: string;
    setId: string;
  };

  fetchCollection: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  addToCollection: (cardId: string, language?: string, quantity?: number) => Promise<void>;
  removeFromCollection: (cardId: string) => Promise<void>;
  updateQuantity: (cardId: string, quantity: number) => Promise<void>;
  setFilter: (key: 'query' | 'setId', value: string) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  items: [],
  progress: [],
  loading: false,
  filter: {
    query: '',
    setId: '',
  },

  fetchCollection: async () => {
    set({ loading: true });
    try {
      const data = await apiFetch<CollectionItem[]>('/collection');
      set({ items: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchProgress: async () => {
    try {
      const data = await apiFetch<CollectionProgress[]>('/collection/progress');
      set({ progress: data });
    } catch {
      // ignore
    }
  },

  addToCollection: async (cardId, language = 'en', quantity = 1) => {
    // Optimistic update
    const prev = get().items;
    const existing = prev.find((i) => i.cardId === cardId);
    if (existing) {
      set({
        items: prev.map((i) =>
          i.cardId === cardId ? { ...i, quantity: i.quantity + quantity } : i,
        ),
      });
    } else {
      set({ items: [...prev, { cardId, language, quantity }] });
    }

    try {
      await apiFetch('/collection', {
        method: 'POST',
        body: JSON.stringify({ cardId, language, quantity }),
      });
      // Refresh to get server state
      get().fetchCollection();
      get().fetchProgress();
    } catch {
      // Rollback
      set({ items: prev });
    }
  },

  removeFromCollection: async (cardId) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.cardId !== cardId) });

    try {
      await apiFetch(`/collection/${cardId}`, { method: 'DELETE' });
      get().fetchProgress();
    } catch {
      set({ items: prev });
    }
  },

  updateQuantity: async (cardId, quantity) => {
    if (quantity <= 0) {
      return get().removeFromCollection(cardId);
    }

    const prev = get().items;
    set({
      items: prev.map((i) =>
        i.cardId === cardId ? { ...i, quantity } : i,
      ),
    });

    try {
      await apiFetch(`/collection/${cardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
    } catch {
      set({ items: prev });
    }
  },

  setFilter: (key, value) => {
    set((s) => ({ filter: { ...s.filter, [key]: value } }));
  },
}));
