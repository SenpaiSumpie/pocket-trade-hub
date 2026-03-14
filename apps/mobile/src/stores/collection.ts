import { create } from 'zustand';
import type { Priority } from '@pocket-trade-hub/shared';

type Mode = 'browse' | 'collection' | 'wanted';

/** A collection entry keyed by cardId:language */
interface CollectionEntry {
  cardId: string;
  language: string;
  quantity: number;
}

/** A wanted entry keyed by cardId:language */
interface WantedEntry {
  cardId: string;
  language: string;
  priority: Priority;
}

/** Composite key for cardId + language */
function compositeKey(cardId: string, language: string): string {
  return `${cardId}:${language}`;
}

interface CollectionState {
  mode: Mode;
  /** Composite-keyed: cardId:language -> quantity */
  collectionByKey: Record<string, number>;
  /** Language-agnostic lookup: cardId -> total quantity (across all languages). Used for card grid badges. */
  collectionByCardId: Record<string, number>;
  /** Composite-keyed: cardId:language -> priority */
  wantedByKey: Record<string, Priority>;
  /** Language-agnostic lookup: cardId -> priority (first found). Used for card grid badges. */
  wantedByCardId: Record<string, Priority>;
  /** Language info per key */
  collectionLanguages: Record<string, string>;
  wantedLanguages: Record<string, string>;
  progressBySet: Record<string, { owned: number; total: number; setName: string }>;
  collectionLoaded: boolean;
  wantedLoaded: boolean;

  // Actions
  setMode: (mode: Mode) => void;
  setCollection: (items: Array<{ cardId: string; language?: string; quantity: number }>) => void;
  setWanted: (items: Array<{ cardId: string; language?: string; priority: Priority }>) => void;
  setProgress: (progress: Array<{ setId: string; setName: string; owned: number; total: number }>) => void;

  // Optimistic update actions (with language)
  addToCollection: (cardId: string, quantity?: number, language?: string) => void;
  removeFromCollection: (cardId: string, language?: string) => void;
  updateQuantity: (cardId: string, quantity: number, language?: string) => void;
  addToWanted: (cardId: string, priority?: Priority, language?: string) => void;
  removeFromWanted: (cardId: string, language?: string) => void;
  updatePriority: (cardId: string, priority: Priority, language?: string) => void;
  reset: () => void;
}

/** Build language-agnostic cardId -> total quantity map from composite-keyed map */
function buildCardIdMap(byKey: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, qty] of Object.entries(byKey)) {
    const cardId = key.split(':')[0];
    result[cardId] = (result[cardId] ?? 0) + qty;
  }
  return result;
}

/** Build language-agnostic cardId -> priority map (first found) */
function buildWantedCardIdMap(byKey: Record<string, Priority>): Record<string, Priority> {
  const result: Record<string, Priority> = {};
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  for (const [key, priority] of Object.entries(byKey)) {
    const cardId = key.split(':')[0];
    if (!(cardId in result) || priorityOrder[priority] < priorityOrder[result[cardId]]) {
      result[cardId] = priority;
    }
  }
  return result;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  mode: 'browse',
  collectionByKey: {},
  collectionByCardId: {},
  wantedByKey: {},
  wantedByCardId: {},
  collectionLanguages: {},
  wantedLanguages: {},
  progressBySet: {},
  collectionLoaded: false,
  wantedLoaded: false,

  setMode: (mode) => set({ mode }),

  setCollection: (items) => {
    const byKey: Record<string, number> = {};
    const langs: Record<string, string> = {};
    for (const item of items) {
      const lang = item.language ?? 'en';
      const key = compositeKey(item.cardId, lang);
      byKey[key] = item.quantity;
      langs[key] = lang;
    }
    set({
      collectionByKey: byKey,
      collectionByCardId: buildCardIdMap(byKey),
      collectionLanguages: langs,
      collectionLoaded: true,
    });
  },

  setWanted: (items) => {
    const byKey: Record<string, Priority> = {};
    const langs: Record<string, string> = {};
    for (const item of items) {
      const lang = item.language ?? 'en';
      const key = compositeKey(item.cardId, lang);
      byKey[key] = item.priority;
      langs[key] = lang;
    }
    set({
      wantedByKey: byKey,
      wantedByCardId: buildWantedCardIdMap(byKey),
      wantedLanguages: langs,
      wantedLoaded: true,
    });
  },

  setProgress: (progress) =>
    set({
      progressBySet: Object.fromEntries(
        progress.map((p) => [p.setId, { owned: p.owned, total: p.total, setName: p.setName }]),
      ),
    }),

  addToCollection: (cardId, quantity = 1, language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      const wasNewCard = !Object.keys(state.collectionByKey).some((k) => k.startsWith(cardId + ':'));
      const newByKey = {
        ...state.collectionByKey,
        [key]: (state.collectionByKey[key] ?? 0) + quantity,
      };
      const newLangs = { ...state.collectionLanguages, [key]: language };
      const newByCardId = buildCardIdMap(newByKey);

      // Optimistically update progress if this card was not in collection at all
      if (wasNewCard) {
        const setId = cardId.split('-').slice(0, -1).join('-');
        const updatedProgress = { ...state.progressBySet };
        if (updatedProgress[setId]) {
          updatedProgress[setId] = {
            ...updatedProgress[setId],
            owned: updatedProgress[setId].owned + 1,
          };
        }
        return {
          collectionByKey: newByKey,
          collectionByCardId: newByCardId,
          collectionLanguages: newLangs,
          progressBySet: updatedProgress,
        };
      }
      return {
        collectionByKey: newByKey,
        collectionByCardId: newByCardId,
        collectionLanguages: newLangs,
      };
    }),

  removeFromCollection: (cardId, language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      const { [key]: _, ...restByKey } = state.collectionByKey;
      const { [key]: _l, ...restLangs } = state.collectionLanguages;
      const newByCardId = buildCardIdMap(restByKey);

      // Check if card is no longer in collection at all
      const stillHasCard = Object.keys(restByKey).some((k) => k.startsWith(cardId + ':'));
      if (!stillHasCard) {
        const setId = cardId.split('-').slice(0, -1).join('-');
        const updatedProgress = { ...state.progressBySet };
        if (updatedProgress[setId]) {
          updatedProgress[setId] = {
            ...updatedProgress[setId],
            owned: Math.max(0, updatedProgress[setId].owned - 1),
          };
        }
        return {
          collectionByKey: restByKey,
          collectionByCardId: newByCardId,
          collectionLanguages: restLangs,
          progressBySet: updatedProgress,
        };
      }
      return {
        collectionByKey: restByKey,
        collectionByCardId: newByCardId,
        collectionLanguages: restLangs,
      };
    }),

  updateQuantity: (cardId, quantity, language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      if (quantity <= 0) {
        const { [key]: _, ...restByKey } = state.collectionByKey;
        const { [key]: _l, ...restLangs } = state.collectionLanguages;
        const newByCardId = buildCardIdMap(restByKey);
        const stillHasCard = Object.keys(restByKey).some((k) => k.startsWith(cardId + ':'));
        if (!stillHasCard) {
          const setId = cardId.split('-').slice(0, -1).join('-');
          const updatedProgress = { ...state.progressBySet };
          if (updatedProgress[setId]) {
            updatedProgress[setId] = {
              ...updatedProgress[setId],
              owned: Math.max(0, updatedProgress[setId].owned - 1),
            };
          }
          return {
            collectionByKey: restByKey,
            collectionByCardId: newByCardId,
            collectionLanguages: restLangs,
            progressBySet: updatedProgress,
          };
        }
        return {
          collectionByKey: restByKey,
          collectionByCardId: newByCardId,
          collectionLanguages: restLangs,
        };
      }
      const newByKey = { ...state.collectionByKey, [key]: quantity };
      return {
        collectionByKey: newByKey,
        collectionByCardId: buildCardIdMap(newByKey),
      };
    }),

  addToWanted: (cardId, priority = 'medium', language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      const newByKey = { ...state.wantedByKey, [key]: priority };
      const newLangs = { ...state.wantedLanguages, [key]: language };
      return {
        wantedByKey: newByKey,
        wantedByCardId: buildWantedCardIdMap(newByKey),
        wantedLanguages: newLangs,
      };
    }),

  removeFromWanted: (cardId, language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      const { [key]: _, ...restByKey } = state.wantedByKey;
      const { [key]: _l, ...restLangs } = state.wantedLanguages;
      return {
        wantedByKey: restByKey,
        wantedByCardId: buildWantedCardIdMap(restByKey),
        wantedLanguages: restLangs,
      };
    }),

  updatePriority: (cardId, priority, language = 'en') =>
    set((state) => {
      const key = compositeKey(cardId, language);
      const newByKey = { ...state.wantedByKey, [key]: priority };
      return {
        wantedByKey: newByKey,
        wantedByCardId: buildWantedCardIdMap(newByKey),
      };
    }),

  reset: () =>
    set({
      mode: 'browse',
      collectionByKey: {},
      collectionByCardId: {},
      wantedByKey: {},
      wantedByCardId: {},
      collectionLanguages: {},
      wantedLanguages: {},
      progressBySet: {},
      collectionLoaded: false,
      wantedLoaded: false,
    }),
}));
