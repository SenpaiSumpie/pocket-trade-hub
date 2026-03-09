import { create } from 'zustand';
import type { TradeMatch, MatchSort } from '@pocket-trade-hub/shared';

interface TradesState {
  matches: TradeMatch[];
  unseenCount: number;
  sortBy: MatchSort;
  isLoading: boolean;
  lastRefreshed: number | null;

  // Actions
  setMatches: (matches: TradeMatch[], unseenCount: number) => void;
  addMatch: (match: TradeMatch) => void;
  clearUnseen: () => void;
  setSortBy: (sort: MatchSort) => void;
  setLoading: (loading: boolean) => void;
  markSeen: (matchId: string) => void;
}

export const useTradesStore = create<TradesState>((set) => ({
  matches: [],
  unseenCount: 0,
  sortBy: 'priority',
  isLoading: false,
  lastRefreshed: null,

  setMatches: (matches, unseenCount) =>
    set({ matches, unseenCount, lastRefreshed: Date.now() }),

  addMatch: (match) =>
    set((state) => ({
      matches: [match, ...state.matches],
      unseenCount: state.unseenCount + 1,
    })),

  clearUnseen: () => set({ unseenCount: 0 }),

  setSortBy: (sort) => set({ sortBy: sort }),

  setLoading: (loading) => set({ isLoading: loading }),

  markSeen: (matchId) =>
    set((state) => {
      const match = state.matches.find((m) => m.id === matchId);
      if (!match || match.seen) return state;
      return {
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, seen: true } : m,
        ),
        unseenCount: Math.max(0, state.unseenCount - 1),
      };
    }),
}));
