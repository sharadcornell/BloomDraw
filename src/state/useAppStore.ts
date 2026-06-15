import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_AGE_RANGE } from '@/lib/placeholders';
import type { AgeRangeId } from '@/types';

import { isValidAgeRange } from './_helpers';

/**
 * App-level local state: the selected age band + first-run onboarding flag,
 * persisted to AsyncStorage (docs/03 §8).
 *
 * `_hasHydrated` lets the splash gate wait for AsyncStorage so we never flash
 * onboarding to a returning user. It is intentionally NOT persisted.
 *
 * `_sanitize` runs on every rehydrate so a corrupt payload can never break the
 * app: an invalid age band falls back to 6–8 (when onboarded) or null, and a
 * non-boolean onboarding flag resets to false.
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
  _sanitize: () => void;
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
      _sanitize: () =>
        set((s) => {
          const validAge = s.selectedAgeRange === null || isValidAgeRange(s.selectedAgeRange);
          const onboarded = typeof s.hasOnboarded === 'boolean' ? s.hasOnboarded : false;
          return {
            selectedAgeRange: validAge ? s.selectedAgeRange : onboarded ? DEFAULT_AGE_RANGE : null,
            hasOnboarded: onboarded,
          };
        }),
    }),
    {
      name: 'bloomdraw-app',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user choices; never persist the hydration flag.
      partialize: (state) => ({
        selectedAgeRange: state.selectedAgeRange,
        hasOnboarded: state.hasOnboarded,
      }),
      // Sanitize, then mark hydrated even on error so the splash gate can never
      // hang on a corrupt payload (safe-default behavior per docs/02 §10).
      onRehydrateStorage: () => (state) => {
        state?._sanitize();
        state?.setHasHydrated(true);
      },
    },
  ),
);
