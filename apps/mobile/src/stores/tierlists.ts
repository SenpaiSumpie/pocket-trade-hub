import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';
import type { TierList, TierListResponse } from '@pocket-trade-hub/shared';

type TierListSort = 'most_liked' | 'newest';

interface TierListState {
  tierLists: TierList[];
  total: number;
  loading: boolean;
  error: string | null;
  sortBy: TierListSort;
  page: number;

  fetchTierLists: () => Promise<void>;
  vote: (tierListId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  setSortBy: (sort: TierListSort) => void;
  deleteTierList: (tierListId: string) => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 20;

const initialState = {
  tierLists: [] as TierList[],
  total: 0,
  loading: false,
  error: null as string | null,
  sortBy: 'most_liked' as TierListSort,
  page: 1,
};

export const useTierListStore = create<TierListState>((set, get) => ({
  ...initialState,

  fetchTierLists: async () => {
    try {
      set({ loading: true, error: null });
      const { sortBy } = get();
      const data = await apiFetch<TierListResponse>(
        `/tierlists?sort=${sortBy}&page=1&limit=${PAGE_SIZE}`,
      );
      set({
        tierLists: data.tierLists,
        total: data.total,
        page: 1,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tier lists', loading: false });
    }
  },

  vote: async (tierListId: string) => {
    const { tierLists } = get();
    // Optimistic update
    const updated = tierLists.map((tl) => {
      if (tl.id !== tierListId) return tl;
      const wasVoted = tl.userVoted ?? false;
      return {
        ...tl,
        userVoted: !wasVoted,
        upvoteCount: wasVoted ? tl.upvoteCount - 1 : tl.upvoteCount + 1,
      };
    });
    set({ tierLists: updated });

    try {
      const result = await apiFetch<{ upvoteCount: number; userVoted: boolean }>(
        `/tierlists/${tierListId}/vote`,
        { method: 'POST' },
      );
      // Reconcile with server response
      set({
        tierLists: get().tierLists.map((tl) =>
          tl.id === tierListId
            ? { ...tl, upvoteCount: result.upvoteCount, userVoted: result.userVoted }
            : tl,
        ),
      });
    } catch {
      // Revert optimistic update on failure
      set({ tierLists });
    }
  },

  loadMore: async () => {
    const { page, total, tierLists, sortBy, loading } = get();
    if (loading || tierLists.length >= total) return;

    const nextPage = page + 1;
    try {
      set({ loading: true });
      const data = await apiFetch<TierListResponse>(
        `/tierlists?sort=${sortBy}&page=${nextPage}&limit=${PAGE_SIZE}`,
      );
      set({
        tierLists: [...tierLists, ...data.tierLists],
        total: data.total,
        page: nextPage,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load more', loading: false });
    }
  },

  setSortBy: (sort) => {
    set({ sortBy: sort, page: 1, tierLists: [], total: 0 });
    get().fetchTierLists();
  },

  deleteTierList: async (tierListId: string) => {
    const { tierLists } = get();
    try {
      await apiFetch(`/tierlists/${tierListId}`, { method: 'DELETE' });
      set({
        tierLists: tierLists.filter((tl) => tl.id !== tierListId),
        total: get().total - 1,
      });
    } catch {
      // Silent failure — list stays visible
    }
  },

  reset: () => set(initialState),
}));
