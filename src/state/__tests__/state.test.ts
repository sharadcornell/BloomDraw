/// <reference types="jest" />

// AsyncStorage has no native module under Jest — use the package's official mock
// so the persisted stores can be exercised. (global `jest.mock` is hoisted above imports.)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  addFavorite,
  addRecent,
  coerceAgeRange,
  isValidAgeRange,
  RECENTS_CAP,
  removeFavorite,
  removeRecent,
  sanitizeAgeRange,
  sanitizeFavorites,
  sanitizeRecents,
  toggleFavorite,
} from '@/state/_helpers';
import { useFavoritesStore } from '@/state/useFavoritesStore';
import { useRecentsStore } from '@/state/useRecentsStore';
import type { RecentCreation } from '@/types';

const recent = (id: string, over: Partial<RecentCreation> = {}): RecentCreation => ({
  id,
  type: 'ai_generation',
  title: `Item ${id}`,
  createdAt: 1,
  ...over,
});

describe('age range helpers', () => {
  it('validates only the three bands', () => {
    expect(isValidAgeRange('3-5')).toBe(true);
    expect(isValidAgeRange('6-8')).toBe(true);
    expect(isValidAgeRange('9-12')).toBe(true);
    expect(isValidAgeRange('99')).toBe(false);
    expect(isValidAgeRange(null)).toBe(false);
  });

  it('sanitizes to a band or null', () => {
    expect(sanitizeAgeRange('9-12')).toBe('9-12');
    expect(sanitizeAgeRange('bad')).toBeNull();
    expect(sanitizeAgeRange(undefined)).toBeNull();
    expect(sanitizeAgeRange(42)).toBeNull();
  });

  it('coerces missing/corrupt values to the default 6-8', () => {
    expect(coerceAgeRange('3-5')).toBe('3-5');
    expect(coerceAgeRange('nonsense')).toBe('6-8');
    expect(coerceAgeRange(null)).toBe('6-8');
    expect(coerceAgeRange(undefined)).toBe('6-8');
  });
});

describe('favorites helpers', () => {
  it('adds without duplicates (idempotent)', () => {
    let list: string[] = [];
    list = addFavorite(list, 'cat-face');
    list = addFavorite(list, 'cat-face');
    expect(list).toEqual(['cat-face']);
  });

  it('removes a favorite', () => {
    expect(removeFavorite(['cat-face', 'dog'], 'cat-face')).toEqual(['dog']);
  });

  it('toggles on and off', () => {
    expect(toggleFavorite([], 'dog')).toEqual(['dog']);
    expect(toggleFavorite(['dog'], 'dog')).toEqual([]);
  });

  it('sanitizes to unique strings', () => {
    expect(sanitizeFavorites(['a', 'a', 'b', 5, null, 'c'])).toEqual(['a', 'b', 'c']);
    expect(sanitizeFavorites('not-an-array')).toEqual([]);
  });
});

describe('recents helpers', () => {
  it('prepends newest-first and de-duplicates by id', () => {
    let list: RecentCreation[] = [];
    list = addRecent(list, recent('a'));
    list = addRecent(list, recent('b'));
    expect(list.map((r) => r.id)).toEqual(['b', 'a']);
    // re-adding 'a' moves it to the front, no duplicate
    list = addRecent(list, recent('a'));
    expect(list.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('caps the list length', () => {
    let list: RecentCreation[] = [];
    for (let i = 0; i < RECENTS_CAP + 12; i += 1) list = addRecent(list, recent(`id-${i}`));
    expect(list.length).toBe(RECENTS_CAP);
    expect(list[0].id).toBe(`id-${RECENTS_CAP + 11}`); // newest first
  });

  it('removes by id', () => {
    expect(removeRecent([recent('a'), recent('b')], 'a').map((r) => r.id)).toEqual(['b']);
  });

  it('drops invalid entries on sanitize', () => {
    const dirty = [recent('a'), { id: 'x' }, null, { id: 'y', type: 'bad', title: 't', createdAt: 1 }];
    expect(sanitizeRecents(dirty).map((r) => r.id)).toEqual(['a']);
    expect(sanitizeRecents('nope')).toEqual([]);
  });
});

describe('favorites store actions', () => {
  beforeEach(() => useFavoritesStore.getState().clearFavorites());

  it('toggles + clears + reports isFavorite', () => {
    const s = useFavoritesStore.getState();
    s.toggleFavorite('dog');
    expect(useFavoritesStore.getState().isFavorite('dog')).toBe(true);
    s.toggleFavorite('dog');
    expect(useFavoritesStore.getState().isFavorite('dog')).toBe(false);
    s.addFavorite('cat-face');
    s.addFavorite('cat-face');
    expect(useFavoritesStore.getState().favorites).toEqual(['cat-face']);
    useFavoritesStore.getState().clearFavorites();
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });
});

describe('recents store actions', () => {
  beforeEach(() => useRecentsStore.getState().clearRecents());

  it('adds newest-first, removes, and clears', () => {
    const s = useRecentsStore.getState();
    const a = s.addRecentCreation({ type: 'preloaded_drawing', title: 'A', slug: 'dog' });
    const b = s.addRecentCreation({ type: 'ai_generation', title: 'B' });
    expect(useRecentsStore.getState().recents.map((r) => r.id)).toEqual([b.id, a.id]);
    useRecentsStore.getState().removeRecentCreation(a.id);
    expect(useRecentsStore.getState().recents.map((r) => r.id)).toEqual([b.id]);
    useRecentsStore.getState().clearRecents();
    expect(useRecentsStore.getState().recents).toEqual([]);
  });
});
