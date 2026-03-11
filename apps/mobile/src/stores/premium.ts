import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';
import type { AnalyticsResponse, SubscriptionStatus } from '@pocket-trade-hub/shared';

interface PremiumState {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  analyticsData: AnalyticsResponse | null;
  loading: boolean;

  fetchStatus: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  setIsPremium: (val: boolean) => void;
  reset: () => void;
}

const initialState = {
  isPremium: false,
  premiumExpiresAt: null as string | null,
  analyticsData: null as AnalyticsResponse | null,
  loading: false,
};

export const usePremiumStore = create<PremiumState>((set) => ({
  ...initialState,

  fetchStatus: async () => {
    try {
      set({ loading: true });
      const data = await apiFetch<SubscriptionStatus>('/premium/status');
      set({
        isPremium: data.isPremium,
        premiumExpiresAt: data.premiumExpiresAt,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchAnalytics: async () => {
    try {
      set({ loading: true });
      const data = await apiFetch<AnalyticsResponse>('/premium/analytics');
      set({ analyticsData: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setIsPremium: (val) => set({ isPremium: val }),

  reset: () => set(initialState),
}));
