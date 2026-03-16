import { create } from 'zustand';
import { apiFetch } from '../hooks/useApi';

interface PromoResult {
  premiumDays: number;
  newExpiresAt: string;
}

interface PromoState {
  redeeming: boolean;
  lastResult: PromoResult | null;
  error: string | null;

  redeemCode: (code: string) => Promise<void>;
  clearResult: () => void;
}

export const usePromoStore = create<PromoState>((set) => ({
  redeeming: false,
  lastResult: null,
  error: null,

  redeemCode: async (code: string) => {
    set({ redeeming: true, error: null, lastResult: null });
    try {
      const data = await apiFetch<PromoResult>('/promo/redeem', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      set({ lastResult: data, redeeming: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to redeem code',
        redeeming: false,
      });
    }
  },

  clearResult: () => set({ lastResult: null, error: null }),
}));
