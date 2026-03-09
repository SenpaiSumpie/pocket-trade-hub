import { useEffect, useCallback, useRef } from 'react';
import { apiFetch } from './useApi';
import { useCollectionStore } from '../stores/collection';
import type { CollectionItem, CollectionProgress } from '@pocket-trade-hub/shared';

/** Load collection data on mount (only if not already loaded). */
export function useLoadCollection() {
  const { collectionLoaded, setCollection, setProgress } = useCollectionStore();

  useEffect(() => {
    if (collectionLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const [items, progress] = await Promise.all([
          apiFetch<CollectionItem[]>('/collection'),
          apiFetch<CollectionProgress[]>('/collection/progress'),
        ]);
        if (!cancelled) {
          setCollection(items);
          setProgress(progress);
        }
      } catch {
        // Silently fail -- user may not be authenticated yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [collectionLoaded, setCollection, setProgress]);
}

/** Add a card to collection with optimistic update and debounced API call. */
export function useAddToCollection() {
  const { addToCollection, removeFromCollection, collectionByCardId } = useCollectionStore();
  const pending = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  return useCallback(
    async (cardId: string, quantity = 1) => {
      const prev = collectionByCardId[cardId];
      addToCollection(cardId, quantity);

      // Debounce rapid adds for the same card
      const existing = pending.current.get(cardId);
      if (existing) clearTimeout(existing);

      return new Promise<void>((resolve) => {
        const timer = setTimeout(async () => {
          pending.current.delete(cardId);
          try {
            await apiFetch('/collection', {
              method: 'POST',
              body: JSON.stringify({ cardId, quantity }),
            });
          } catch {
            // Revert optimistic update
            if (prev != null) {
              useCollectionStore.getState().updateQuantity(cardId, prev);
            } else {
              removeFromCollection(cardId);
            }
          }
          resolve();
        }, 300);
        pending.current.set(cardId, timer);
      });
    },
    [addToCollection, removeFromCollection, collectionByCardId],
  );
}

/** Remove a card from collection with optimistic update. */
export function useRemoveFromCollection() {
  const { removeFromCollection, addToCollection, collectionByCardId } = useCollectionStore();

  return useCallback(
    async (cardId: string) => {
      const prev = collectionByCardId[cardId];
      removeFromCollection(cardId);

      try {
        await apiFetch(`/collection/${cardId}`, { method: 'DELETE' });
      } catch {
        if (prev != null) {
          addToCollection(cardId, prev);
        }
      }
    },
    [removeFromCollection, addToCollection, collectionByCardId],
  );
}

/** Update card quantity with optimistic update. */
export function useUpdateQuantity() {
  const { updateQuantity, collectionByCardId } = useCollectionStore();

  return useCallback(
    async (cardId: string, quantity: number) => {
      const prev = collectionByCardId[cardId];
      updateQuantity(cardId, quantity);

      try {
        await apiFetch(`/collection/${cardId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity }),
        });
      } catch {
        if (prev != null) {
          updateQuantity(cardId, prev);
        }
      }
    },
    [updateQuantity, collectionByCardId],
  );
}

/** Bulk update collection for a set (no optimistic -- wait for server). */
export function useBulkUpdateCollection() {
  const { setCollection, setProgress } = useCollectionStore();

  return useCallback(
    async (setId: string, additions: string[], removals: string[]) => {
      try {
        await apiFetch('/collection/bulk', {
          method: 'POST',
          body: JSON.stringify({ setId, additions, removals }),
        });

        // Refresh full collection data after bulk op
        const [items, progress] = await Promise.all([
          apiFetch<CollectionItem[]>('/collection'),
          apiFetch<CollectionProgress[]>('/collection/progress'),
        ]);
        setCollection(items);
        setProgress(progress);
      } catch {
        // Surface error -- caller can handle
        throw new Error('Bulk update failed');
      }
    },
    [setCollection, setProgress],
  );
}

/** Refresh progress data. */
export function useRefreshProgress() {
  const { setProgress } = useCollectionStore();

  return useCallback(async () => {
    try {
      const progress = await apiFetch<CollectionProgress[]>('/collection/progress');
      setProgress(progress);
    } catch {
      // Silently fail
    }
  }, [setProgress]);
}
