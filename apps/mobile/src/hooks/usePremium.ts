import { useCallback } from 'react';
import { usePremiumStore } from '../stores/premium';
import {
  purchasePremium,
  restorePurchases as restorePurchasesService,
} from '../services/purchases';
import { apiFetch } from './useApi';

export function usePremium() {
  const isPremium = usePremiumStore((s) => s.isPremium);
  const loading = usePremiumStore((s) => s.loading);
  const fetchStatus = usePremiumStore((s) => s.fetchStatus);

  const purchase = useCallback(async () => {
    const result = await purchasePremium();
    if (result.success) {
      // Sync with backend then refresh local state
      try {
        await apiFetch('/premium/sync', { method: 'POST' });
      } catch {
        // Non-critical -- backend will sync via webhook too
      }
      await fetchStatus();
    }
    return result;
  }, [fetchStatus]);

  const restore = useCallback(async () => {
    const restored = await restorePurchasesService();
    if (restored) {
      try {
        await apiFetch('/premium/sync', { method: 'POST' });
      } catch {
        // Non-critical
      }
      await fetchStatus();
    }
    return restored;
  }, [fetchStatus]);

  return { isPremium, loading, purchase, restore, fetchStatus };
}
