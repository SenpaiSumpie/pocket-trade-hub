import { useCallback } from 'react';
import { apiFetch } from './useApi';
import { usePostsStore, type MarketPost } from '../stores/posts';
import type { PostType } from '@pocket-trade-hub/shared';

interface MarketplaceResponse {
  posts: MarketPost[];
  nextCursor: string | null;
}

export function useMarketplace() {
  const posts = usePostsStore((s) => s.marketPosts);
  const loading = usePostsStore((s) => s.marketLoading);
  const nextCursor = usePostsStore((s) => s.marketNextCursor);
  const filters = usePostsStore((s) => s.filters);

  const buildQueryString = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.set) params.set('set', filters.set);
      if (filters.rarity) params.set('rarity', filters.rarity);
      if (filters.language) params.set('language', filters.language);
      if (filters.search) params.set('search', filters.search);
      if (filters.sort) params.set('sort', filters.sort);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');
      return params.toString();
    },
    [filters],
  );

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      usePostsStore.getState().setMarketLoading(true);
      try {
        const qs = buildQueryString(cursor);
        const data = await apiFetch<MarketplaceResponse>(`/posts?${qs}`);
        if (cursor) {
          usePostsStore.getState().appendMarketPosts(data.posts, data.nextCursor);
        } else {
          usePostsStore.getState().setMarketPosts(data.posts, data.nextCursor);
        }
      } catch (err) {
        console.error('[useMarketplace] fetchPosts error:', err);
      } finally {
        usePostsStore.getState().setMarketLoading(false);
      }
    },
    [buildQueryString],
  );

  const refresh = useCallback(() => {
    return fetchPosts();
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loading) return;
    return fetchPosts(nextCursor);
  }, [nextCursor, loading, fetchPosts]);

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      usePostsStore.getState().setFilters({ [key]: value });
    },
    [],
  );

  const hasMore = nextCursor !== null;

  return {
    posts,
    loading,
    hasMore,
    filters,
    setFilter,
    refresh,
    loadMore,
  };
}
