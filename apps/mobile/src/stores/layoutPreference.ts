import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardLayoutMode = 'grid' | 'compact' | 'list';

interface LayoutPreferenceState {
  cardLayoutMode: CardLayoutMode;
  setCardLayoutMode: (mode: CardLayoutMode) => void;
  cycleLayoutMode: () => void;
}

export const useLayoutPreferenceStore = create<LayoutPreferenceState>()(
  persist(
    (set, get) => ({
      cardLayoutMode: 'grid',
      setCardLayoutMode: (mode) => set({ cardLayoutMode: mode }),
      cycleLayoutMode: () => {
        const current = get().cardLayoutMode;
        const next = current === 'grid' ? 'compact' : current === 'compact' ? 'list' : 'grid';
        set({ cardLayoutMode: next });
      },
    }),
    {
      name: 'layout-preference',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
