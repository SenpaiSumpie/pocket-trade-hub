import { create } from 'zustand';
import type { TradePost, PostType } from '@pocket-trade-hub/shared';

export type MarketPost = TradePost & {
  isRelevant?: boolean;
  /** Poster info (populated when API returns joined user data) */
  poster?: {
    displayName: string;
    averageRating: number | null;
    tradeCount: number;
  };
};

type SortOption = 'newest' | 'relevant';

interface MarketFilters {
  type?: PostType;
  set?: string;
  rarity?: string;
  language?: string;
  search?: string;
  sort: SortOption;
}

interface PostsState {
  // Marketplace state
  marketPosts: MarketPost[];
  marketLoading: boolean;
  marketNextCursor: string | null;

  // My posts state
  myPosts: TradePost[];
  myPostsLoading: boolean;

  // Filters
  filters: MarketFilters;

  // Marketplace actions
  setMarketPosts: (posts: MarketPost[], nextCursor: string | null) => void;
  appendMarketPosts: (posts: MarketPost[], nextCursor: string | null) => void;
  setMarketLoading: (loading: boolean) => void;

  // My posts actions
  setMyPosts: (posts: TradePost[]) => void;
  setMyPostsLoading: (loading: boolean) => void;
  addMyPost: (post: TradePost) => void;
  removeMyPost: (postId: string) => void;
  updatePostStatus: (postId: string, status: TradePost['status']) => void;

  // Filter actions
  setFilters: (filters: Partial<MarketFilters>) => void;
  resetFilters: () => void;

  reset: () => void;
}

const defaultFilters: MarketFilters = {
  sort: 'newest',
};

const initialState = {
  marketPosts: [] as MarketPost[],
  marketLoading: false,
  marketNextCursor: null as string | null,
  myPosts: [] as TradePost[],
  myPostsLoading: false,
  filters: { ...defaultFilters },
};

export const usePostsStore = create<PostsState>((set) => ({
  ...initialState,

  setMarketPosts: (posts, nextCursor) =>
    set({ marketPosts: posts, marketNextCursor: nextCursor }),

  appendMarketPosts: (posts, nextCursor) =>
    set((state) => ({
      marketPosts: [...state.marketPosts, ...posts],
      marketNextCursor: nextCursor,
    })),

  setMarketLoading: (loading) => set({ marketLoading: loading }),

  setMyPosts: (posts) => set({ myPosts: posts }),

  setMyPostsLoading: (loading) => set({ myPostsLoading: loading }),

  addMyPost: (post) =>
    set((state) => ({ myPosts: [post, ...state.myPosts] })),

  removeMyPost: (postId) =>
    set((state) => ({
      myPosts: state.myPosts.filter((p) => p.id !== postId),
      marketPosts: state.marketPosts.filter((p) => p.id !== postId),
    })),

  updatePostStatus: (postId, status) =>
    set((state) => ({
      myPosts: state.myPosts.map((p) =>
        p.id === postId ? { ...p, status } : p,
      ),
      marketPosts: state.marketPosts.map((p) =>
        p.id === postId ? { ...p, status } : p,
      ),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  reset: () => set(initialState),
}));
