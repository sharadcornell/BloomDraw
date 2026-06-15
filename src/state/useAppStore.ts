import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_AGE_RANGE } from '@/lib/placeholders';
import type { AgeRangeId } from '@/types';

/**
 * App-level local state: the selected age band + first-run onboarding flag,
 * persisted to AsyncStorage (docs/03 §8). This is the only persisted slice in
 * Milestone 2 — favorites/recents stores arrive in Milestone 4.
 *
 * `_hasHydrated` lets the splash gate wait for AsyncStorage so we never flash
 * onboarding to a returning user. It is intentionally NOT persisted.
 */
type AppState = {
  selectedAgeRange: AgeRangeId | null;
  hasOnboarded: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setAgeRange: (range: AgeRangeId) => void;
  completeOnboarding: (range: AgeRangeId) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedAgeRange: null,
      hasOnboarded: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setAgeRange: (range) => set({ selectedAgeRange: range }),
      completeOnboarding: (range) => set({ selectedAgeRange: range, hasOnboarded: true }),
      skipOnboarding: () =>
        set({ selectedAgeRange: get().selectedAgeRange ?? DEFAULT_AGE_RANGE, hasOnboarded: true }),
      resetOnboarding: () => set({ selectedAgeRange: null, hasOnboarded: false }),
    }),
    {
      name: 'bloomdraw-app',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user choices; never persist the hydration flag.
      partialize: (state) => ({
        selectedAgeRange: state.selectedAgeRange,
        hasOnboarded: state.hasOnboarded,
      }),
      // Mark hydrated even on error so the splash gate can never hang on a
      // corrupt payload (safe-default behavior per docs/02 §10).
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
