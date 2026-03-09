import { useEffect, useCallback } from 'react';
import { apiFetch } from './useApi';
import { useCollectionStore } from '../stores/collection';
import type { Priority } from '@pocket-trade-hub/shared';

interface WantedItem {
  cardId: string;
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
    async (cardId: string, priority: Priority = 'medium') => {
      addToWanted(cardId, priority);

      try {
        await apiFetch('/wanted', {
          method: 'POST',
          body: JSON.stringify({ cardId, priority }),
        });
      } catch {
        removeFromWanted(cardId);
      }
    },
    [addToWanted, removeFromWanted],
  );
}

/** Remove a card from wanted list with optimistic update. */
export function useRemoveFromWanted() {
  const { removeFromWanted, addToWanted, wantedByCardId } = useCollectionStore();

  return useCallback(
    async (cardId: string) => {
      const prev = wantedByCardId[cardId];
      removeFromWanted(cardId);

      try {
        await apiFetch(`/wanted/${cardId}`, { method: 'DELETE' });
      } catch {
        if (prev) {
          addToWanted(cardId, prev);
        }
      }
    },
    [removeFromWanted, addToWanted, wantedByCardId],
  );
}

/** Update wanted priority with optimistic update. */
export function useUpdatePriority() {
  const { updatePriority, wantedByCardId } = useCollectionStore();

  return useCallback(
    async (cardId: string, priority: Priority) => {
      const prev = wantedByCardId[cardId];
      updatePriority(cardId, priority);

      try {
        await apiFetch(`/wanted/${cardId}`, {
          method: 'PUT',
          body: JSON.stringify({ priority }),
        });
      } catch {
        if (prev) {
          updatePriority(cardId, prev);
        }
      }
    },
    [updatePriority, wantedByCardId],
  );
}
