import { useEffect, useCallback } from 'react';
import { apiFetch, refreshMatchesInBackground } from './useApi';
import { useCollectionStore } from '../stores/collection';
import type { Priority } from '@pocket-trade-hub/shared';

interface WantedItem {
  cardId: string;
  language?: string;
  priority: Priority;
}

/** Load wanted list on mount (only if not already loaded). */
export function useLoadWanted() {
  const { wantedLoaded, setWanted } = useCollectionStore();

  useEffect(() => {
    if (wantedLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const items = await apiFetch<WantedItem[]>('/wanted');
        if (!cancelled) {
          setWanted(items);
        }
      } catch {
        // Silently fail -- user may not be authenticated yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantedLoaded, setWanted]);
}

/** Add a card to wanted list with optimistic update. */
export function useAddToWanted() {
  const { addToWanted, removeFromWanted } = useCollectionStore();

  return useCallback(
    async (cardId: string, priority: Priority = 'medium', language = 'en') => {
      addToWanted(cardId, priority, language);

      try {
        await apiFetch('/wanted', {
          method: 'POST',
          body: JSON.stringify({ cardId, language, priority }),
        });
        // Trigger background match recompute (non-blocking)
        refreshMatchesInBackground();
      } catch {
        removeFromWanted(cardId, language);
      }
    },
    [addToWanted, removeFromWanted],
  );
}

/** Remove a card from wanted list with optimistic update. */
export function useRemoveFromWanted() {
  const { removeFromWanted, addToWanted, wantedByKey } = useCollectionStore();

  return useCallback(
    async (cardId: string, language = 'en') => {
      const key = `${cardId}:${language}`;
      const prev = wantedByKey[key];
      removeFromWanted(cardId, language);

      try {
        await apiFetch(`/wanted/${cardId}?language=${language}`, { method: 'DELETE' });
        // Trigger background match recompute (non-blocking)
        refreshMatchesInBackground();
      } catch {
        if (prev) {
          addToWanted(cardId, prev, language);
        }
      }
    },
    [removeFromWanted, addToWanted, wantedByKey],
  );
}

/** Update wanted priority with optimistic update. */
export function useUpdatePriority() {
  const { updatePriority, wantedByKey } = useCollectionStore();

  return useCallback(
    async (cardId: string, priority: Priority, language = 'en') => {
      const key = `${cardId}:${language}`;
      const prev = wantedByKey[key];
      updatePriority(cardId, priority, language);

      try {
        await apiFetch(`/wanted/${cardId}?language=${language}`, {
          method: 'PUT',
          body: JSON.stringify({ priority }),
        });
        // Trigger background match recompute (non-blocking)
        refreshMatchesInBackground();
      } catch {
        if (prev) {
          updatePriority(cardId, prev, language);
        }
      }
    },
    [updatePriority, wantedByKey],
  );
}
