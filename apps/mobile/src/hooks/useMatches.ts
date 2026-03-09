import { useEffect, useCallback } from 'react';
import { apiFetch } from './useApi';
import { useTradesStore } from '../stores/trades';
import type { TradeMatch, MatchSort } from '@pocket-trade-hub/shared';

interface MatchesResponse {
  matches: TradeMatch[];
  unseenCount: number;
}

export function useMatches() {
  const matches = useTradesStore((s) => s.matches);
  const unseenCount = useTradesStore((s) => s.unseenCount);
  const isLoading = useTradesStore((s) => s.isLoading);
  const sortBy = useTradesStore((s) => s.sortBy);
  const setSortBy = useTradesStore((s) => s.setSortBy);

  const loadMatches = useCallback(async (sort?: MatchSort) => {
    const currentSort = sort ?? useTradesStore.getState().sortBy;
    useTradesStore.getState().setLoading(true);
    try {
      const data = await apiFetch<MatchesResponse>(
        `/matches?sort=${currentSort}`,
      );
      useTradesStore.getState().setMatches(data.matches, data.unseenCount);
    } catch {
      // Silently fail -- user may not have matches yet
    } finally {
      useTradesStore.getState().setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      await apiFetch('/matches/refresh', { method: 'POST' });
      await loadMatches();
    } catch {
      // Silently fail
    }
  }, [loadMatches]);

  const markSeen = useCallback(async (matchId: string) => {
    useTradesStore.getState().markSeen(matchId);
    try {
      await apiFetch(`/matches/${matchId}/seen`, { method: 'PUT' });
    } catch {
      // Non-critical -- optimistic update already applied
    }
  }, []);

  // Load matches on mount
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Re-fetch when sortBy changes
  useEffect(() => {
    loadMatches(sortBy);
  }, [sortBy, loadMatches]);

  return { matches, unseenCount, isLoading, refresh, markSeen, sortBy, setSortBy };
}
