'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type {
  TierList,
  CreateTierListInput,
} from '@pocket-trade-hub/shared/src/schemas/tierlist';

interface TierListsState {
  tierLists: TierList[];
  total: number;
  page: number;
  limit: number;
  sort: string;
  selectedTierList: TierList | null;
  showCreator: boolean;
  loading: boolean;

  fetchTierLists: () => Promise<void>;
  selectTierList: (tl: TierList) => void;
  clearSelection: () => void;
  createTierList: (data: CreateTierListInput) => Promise<void>;
  updateTierList: (id: string, data: Partial<CreateTierListInput>) => Promise<void>;
  deleteTierList: (id: string) => Promise<void>;
  toggleCreator: () => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
}

export const useTierListStore = create<TierListsState>((set, get) => ({
  tierLists: [],
  total: 0,
  page: 1,
  limit: 12,
  sort: 'newest',
  selectedTierList: null,
  showCreator: false,
  loading: false,

  fetchTierLists: async () => {
    const { page, limit, sort } = get();
    set({ loading: true });

    try {
      const params = new URLSearchParams();
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await apiFetch<{ tierLists: TierList[]; total: number }>(
        `/tierlists?${params.toString()}`,
      );
      set({ tierLists: data.tierLists, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  selectTierList: (tl) => set({ selectedTierList: tl }),

  clearSelection: () => set({ selectedTierList: null }),

  createTierList: async (data) => {
    await apiFetch('/tierlists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set({ showCreator: false });
    get().fetchTierLists();
  },

  updateTierList: async (id, data) => {
    await apiFetch(`/tierlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    get().fetchTierLists();
  },

  deleteTierList: async (id) => {
    await apiFetch(`/tierlists/${id}`, { method: 'DELETE' });
    set({ selectedTierList: null });
    get().fetchTierLists();
  },

  toggleCreator: () => set((s) => ({ showCreator: !s.showCreator })),

  setSort: (sort) => {
    set({ sort, page: 1 });
    get().fetchTierLists();
  },

  setPage: (page) => {
    set({ page });
    get().fetchTierLists();
  },
}));
