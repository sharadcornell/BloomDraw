import { DEFAULT_AGE_RANGE } from '@/lib/placeholders';
import type { AgeRangeId, RecentCreation, RecentType } from '@/types';

/**
 * Pure, dependency-free state reducers + validators.
 *
 * The stores delegate their logic here so it can be unit-tested without touching
 * AsyncStorage (docs/08 §2). All functions are immutable (return new values).
 */

// ---------------------------------------------------------------------------
// Age range
// ---------------------------------------------------------------------------
export const VALID_AGE_RANGES: AgeRangeId[] = ['3-5', '6-8', '9-12'];

export function isValidAgeRange(value: unknown): value is AgeRangeId {
  return typeof value === 'string' && (VALID_AGE_RANGES as string[]).includes(value);
}

/** Storage-safe: a valid band, or null when not yet chosen. Invalid → null. */
export function sanitizeAgeRange(value: unknown): AgeRangeId | null {
  return isValidAgeRange(value) ? value : null;
}

/** Always returns a definite band; missing/corrupt → default (6–8). */
export function coerceAgeRange(value: unknown): AgeRangeId {
  return isValidAgeRange(value) ? value : DEFAULT_AGE_RANGE;
}

// ---------------------------------------------------------------------------
// Favorites (array of drawing slugs; never duplicated)
// ---------------------------------------------------------------------------
export function addFavorite(list: string[], slug: string): string[] {
  return list.includes(slug) ? list : [...list, slug];
}

export function removeFavorite(list: string[], slug: string): string[] {
  return list.filter((s) => s !== slug);
}

export function toggleFavorite(list: string[], slug: string): string[] {
  return list.includes(slug) ? removeFavorite(list, slug) : addFavorite(list, slug);
}

export function sanitizeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((s): s is string => typeof s === 'string')));
}

// ---------------------------------------------------------------------------
// Recents (newest-first, capped, de-duplicated by id)
// ---------------------------------------------------------------------------
export const RECENTS_CAP = 50;

const RECENT_TYPES: RecentType[] = ['ai_generation', 'uploaded_image', 'preloaded_drawing'];

export function isValidRecent(value: unknown): value is RecentCreation {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.type === 'string' &&
    (RECENT_TYPES as string[]).includes(r.type)
  );
}

/** Prepend (newest-first), drop any prior entry with the same id, cap the list. */
export function addRecent(list: RecentCreation[], item: RecentCreation, cap = RECENTS_CAP): RecentCreation[] {
  const withoutDupe = list.filter((r) => r.id !== item.id);
  return [item, ...withoutDupe].slice(0, cap);
}

export function removeRecent(list: RecentCreation[], id: string): RecentCreation[] {
  return list.filter((r) => r.id !== id);
}

export function sanitizeRecents(value: unknown): RecentCreation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidRecent).slice(0, RECENTS_CAP);
}
