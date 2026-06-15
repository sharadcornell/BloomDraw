import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  addFavorite as addFav,
  removeFavorite as removeFav,
  sanitizeFavorites,
  toggleFavorite as toggleFav,
} from './_helpers';

/**
 * Local favorites: an array of preloaded drawing slugs (V1 is device-local only —
 * no cloud sync, no login). Logic lives in pure helpers (`_helpers.ts`) so it is
 * unit-tested without AsyncStorage.
 */
type FavoritesState = {
  favorites: string[];
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  toggleFavorite: (slug: string) => void;
  addFavorite: (slug: string) => void;
  removeFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  clearFavorites: () => void;
  _sanitize: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),
      toggleFavorite: (slug) => set((s) => ({ favorites: toggleFav(s.favorites, slug) })),
      addFavorite: (slug) => set((s) => ({ favorites: addFav(s.favorites, slug) })),
      removeFavorite: (slug) => set((s) => ({ favorites: removeFav(s.favorites, slug) })),
      isFavorite: (slug) => get().favorites.includes(slug),
      clearFavorites: () => set({ favorites: [] }),
      _sanitize: () => set((s) => ({ favorites: sanitizeFavorites(s.favorites) })),
    }),
    {
      name: 'bloomdraw-favorites',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favorites: state.favorites }),
      onRehydrateStorage: () => (state) => {
        state?._sanitize();
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Reactive selector — re-renders only when this slug's favorite status changes. */
export function useIsFavorite(slug: string): boolean {
  return useFavoritesStore((s) => s.favorites.includes(slug));
}
