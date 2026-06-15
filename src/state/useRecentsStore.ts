import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RecentCreation } from '@/types';

import { addRecent, removeRecent, sanitizeRecents } from './_helpers';

/** Input for adding a recent — id + createdAt are generated if omitted. */
export type RecentInput = Omit<RecentCreation, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: number;
};

/**
 * Local recents store. The creation flows (AI / upload) that populate this land
 * in Milestones 7–8; this milestone builds the data model, persistence, and the
 * actions those flows will call. Newest-first, de-duplicated by id, capped at 50.
 */
type RecentsState = {
  recents: RecentCreation[];
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  addRecentCreation: (input: RecentInput) => RecentCreation;
  removeRecentCreation: (id: string) => void;
  clearRecents: () => void;
  getRecentCreations: () => RecentCreation[];
  _sanitize: () => void;
};

let counter = 0;
function makeId(): string {
  counter += 1;
  // App runtime (not the workflow sandbox) — Date.now()/Math.random() are fine.
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${counter}`;
}

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set, get) => ({
      recents: [],
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),
      addRecentCreation: (input) => {
        const item: RecentCreation = {
          ...input,
          id: input.id ?? makeId(),
          createdAt: input.createdAt ?? Date.now(),
        };
        set((s) => ({ recents: addRecent(s.recents, item) }));
        return item;
      },
      removeRecentCreation: (id) => set((s) => ({ recents: removeRecent(s.recents, id) })),
      clearRecents: () => set({ recents: [] }),
      getRecentCreations: () => get().recents,
      _sanitize: () => set((s) => ({ recents: sanitizeRecents(s.recents) })),
    }),
    {
      name: 'bloomdraw-recents',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recents: state.recents }),
      onRehydrateStorage: () => (state) => {
        state?._sanitize();
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Non-React convenience API for future AI/upload flows. */
export const recents = {
  add: (input: RecentInput) => useRecentsStore.getState().addRecentCreation(input),
  remove: (id: string) => useRecentsStore.getState().removeRecentCreation(id),
  clear: () => useRecentsStore.getState().clearRecents(),
  getAll: () => useRecentsStore.getState().getRecentCreations(),
};
