'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';
import type { TradePost, PostType } from '@pocket-trade-hub/shared/src/schemas/post';

interface MarketPost extends TradePost {
  poster?: {
    id: string;
    username: string;
    reputation?: number;
  };
}

interface PostsState {
  posts: MarketPost[];
  total: number;
  page: number;
  limit: number;
  filters: {
    type: PostType | '';
    query: string;
    setId: string;
    rarity: string;
    language: string;
  };
  selectedPost: MarketPost | null;
  loading: boolean;
  showCreateModal: boolean;

  fetchPosts: () => Promise<void>;
  setFilter: (key: keyof PostsState['filters'], value: string) => void;
  setPage: (page: number) => void;
  selectPost: (post: MarketPost | null) => void;
  createPost: (type: PostType, cards: { cardId: string; name: string; imageUrl: string; rarity: string | null; language: string; setId?: string }[]) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleCreateModal: () => void;
}

export type { MarketPost };

export const usePostStore = create<PostsState>((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  limit: 20,
  filters: {
    type: '',
    query: '',
    setId: '',
    rarity: '',
    language: '',
  },
  selectedPost: null,
  loading: false,
  showCreateModal: false,

  fetchPosts: async () => {
    const { page, limit, filters } = get();
    set({ loading: true });

    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.query) params.set('query', filters.query);
      if (filters.setId) params.set('setId', filters.setId);
      if (filters.rarity) params.set('rarity', filters.rarity);
      if (filters.language) params.set('language', filters.language);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const data = await apiFetch<{ posts: MarketPost[]; total: number }>(
        `/posts?${params.toString()}`,
      );
      set({ posts: data.posts, total: data.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setFilter: (key, value) => {
    set((s) => ({
      filters: { ...s.filters, [key]: value },
      page: 1,
    }));
    get().fetchPosts();
  },

  setPage: (page) => {
    set({ page });
    get().fetchPosts();
  },

  selectPost: (post) => set({ selectedPost: post }),

  createPost: async (type, cards) => {
    await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ type, cards }),
    });
    set({ showCreateModal: false });
    get().fetchPosts();
  },

  deletePost: async (id) => {
    const prev = get().posts;
    set({ posts: prev.filter((p) => p.id !== id), selectedPost: null });

    try {
      await apiFetch(`/posts/${id}`, { method: 'DELETE' });
      get().fetchPosts();
    } catch {
      set({ posts: prev });
    }
  },

  toggleCreateModal: () => set((s) => ({ showCreateModal: !s.showCreateModal })),
}));
