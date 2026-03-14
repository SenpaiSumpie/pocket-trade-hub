import { useEffect, useCallback, useRef } from 'react';
import { apiFetch, refreshMatchesInBackground } from './useApi';
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
  const { addToCollection, removeFromCollection, collectionByKey, setProgress } = useCollectionStore();
  const pending = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  return useCallback(
    async (cardId: string, quantity = 1, language = 'en') => {
      const key = `${cardId}:${language}`;
      const prev = collectionByKey[key];
      addToCollection(cardId, quantity, language);

      // Debounce rapid adds for the same card+language
      const existing = pending.current.get(key);
      if (existing) clearTimeout(existing);

      return new Promise<void>((resolve) => {
        const timer = setTimeout(async () => {
          pending.current.delete(key);
          try {
            await apiFetch('/collection', {
              method: 'POST',
              body: JSON.stringify({ cardId, language, quantity }),
            });
            // Refresh progress from server to keep in sync
            try {
              const progress = await apiFetch<CollectionProgress[]>('/collection/progress');
              setProgress(progress);
            } catch {
              // Non-critical -- optimistic update is already applied
            }
            // Trigger background match recompute (non-blocking)
            refreshMatchesInBackground();
          } catch {
            // Revert optimistic update
            if (prev != null) {
              useCollectionStore.getState().updateQuantity(cardId, prev, language);
            } else {
              removeFromCollection(cardId, language);
            }
          }
          resolve();
        }, 300);
        pending.current.set(key, timer);
      });
    },
    [addToCollection, removeFromCollection, collectionByKey, setProgress],
  );
}

/** Remove a card from collection with optimistic update. */
export function useRemoveFromCollection() {
  const { removeFromCollection, addToCollection, collectionByKey, setProgress } = useCollectionStore();

  return useCallback(
    async (cardId: string, language = 'en') => {
      const key = `${cardId}:${language}`;
      const prev = collectionByKey[key];
      removeFromCollection(cardId, language);

      try {
        await apiFetch(`/collection/${cardId}?language=${language}`, { method: 'DELETE' });
        // Refresh progress from server
        try {
          const progress = await apiFetch<CollectionProgress[]>('/collection/progress');
          setProgress(progress);
        } catch { /* non-critical */ }
        // Trigger background match recompute (non-blocking)
        refreshMatchesInBackground();
      } catch {
        if (prev != null) {
          addToCollection(cardId, prev, language);
        }
      }
    },
    [removeFromCollection, addToCollection, collectionByKey, setProgress],
  );
}

/** Update card quantity with optimistic update. */
export function useUpdateQuantity() {
  const { updateQuantity, collectionByKey } = useCollectionStore();

  return useCallback(
    async (cardId: string, quantity: number, language = 'en') => {
      const key = `${cardId}:${language}`;
      const prev = collectionByKey[key];
      updateQuantity(cardId, quantity, language);

      try {
        await apiFetch(`/collection/${cardId}?language=${language}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity }),
        });
      } catch {
        if (prev != null) {
          updateQuantity(cardId, prev, language);
        }
      }
    },
    [updateQuantity, collectionByKey],
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
        // Trigger background match recompute (non-blocking)
        refreshMatchesInBackground();
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
