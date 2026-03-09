import { create } from 'zustand';
import type { Priority } from '@pocket-trade-hub/shared';

type Mode = 'browse' | 'collection' | 'wanted';

interface CollectionState {
  mode: Mode;
  collectionByCardId: Record<string, number>;
  wantedByCardId: Record<string, Priority>;
  progressBySet: Record<string, { owned: number; total: number; setName: string }>;
  collectionLoaded: boolean;
  wantedLoaded: boolean;

  // Actions
  setMode: (mode: Mode) => void;
  setCollection: (items: Array<{ cardId: string; quantity: number }>) => void;
  setWanted: (items: Array<{ cardId: string; priority: Priority }>) => void;
  setProgress: (progress: Array<{ setId: string; setName: string; owned: number; total: number }>) => void;

  // Optimistic update actions
  addToCollection: (cardId: string, quantity?: number) => void;
  removeFromCollection: (cardId: string) => void;
  updateQuantity: (cardId: string, quantity: number) => void;
  addToWanted: (cardId: string, priority?: Priority) => void;
  removeFromWanted: (cardId: string) => void;
  updatePriority: (cardId: string, priority: Priority) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  mode: 'browse',
  collectionByCardId: {},
  wantedByCardId: {},
  progressBySet: {},
  collectionLoaded: false,
  wantedLoaded: false,

  setMode: (mode) => set({ mode }),

  setCollection: (items) =>
    set({
      collectionByCardId: Object.fromEntries(items.map((i) => [i.cardId, i.quantity])),
      collectionLoaded: true,
    }),

  setWanted: (items) =>
    set({
      wantedByCardId: Object.fromEntries(items.map((i) => [i.cardId, i.priority])),
      wantedLoaded: true,
    }),

  setProgress: (progress) =>
    set({
      progressBySet: Object.fromEntries(
        progress.map((p) => [p.setId, { owned: p.owned, total: p.total, setName: p.setName }]),
      ),
    }),

  addToCollection: (cardId, quantity = 1) =>
    set((state) => ({
      collectionByCardId: {
        ...state.collectionByCardId,
        [cardId]: (state.collectionByCardId[cardId] ?? 0) + quantity,
      },
    })),

  removeFromCollection: (cardId) =>
    set((state) => {
      const { [cardId]: _, ...rest } = state.collectionByCardId;
      return { collectionByCardId: rest };
    }),

  updateQuantity: (cardId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        const { [cardId]: _, ...rest } = state.collectionByCardId;
        return { collectionByCardId: rest };
      }
      return {
        collectionByCardId: { ...state.collectionByCardId, [cardId]: quantity },
      };
    }),

  addToWanted: (cardId, priority = 'medium') =>
    set((state) => ({
      wantedByCardId: { ...state.wantedByCardId, [cardId]: priority },
    })),

  removeFromWanted: (cardId) =>
    set((state) => {
      const { [cardId]: _, ...rest } = state.wantedByCardId;
      return { wantedByCardId: rest };
    }),

  updatePriority: (cardId, priority) =>
    set((state) => ({
      wantedByCardId: { ...state.wantedByCardId, [cardId]: priority },
    })),
}));
