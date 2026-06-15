import type { AgeRangeId, Category, CategorySlug, Difficulty, DrawingItem } from '@/types';

import { CATEGORIES } from './categories';
import { alphabets } from './items/alphabets';
import { animals } from './items/animals';
import { cards } from './items/cards';
import { curriculum } from './items/curriculum';
import { nature } from './items/nature';
import { numbers } from './items/numbers';
import { space } from './items/space';
import { vehicles } from './items/vehicles';

export { CATEGORIES } from './categories';
export { STEP_COUNT } from './_helpers';

/** All preloaded drawing items (bundled local seed; source of truth for V1). */
export const DRAWING_ITEMS: DrawingItem[] = [
  ...alphabets,
  ...numbers,
  ...animals,
  ...vehicles,
  ...space,
  ...nature,
  ...curriculum,
  ...cards,
];

/** Numeric span for each selectable age band. */
export const AGE_BAND_RANGE: Record<AgeRangeId, { min: number; max: number }> = {
  '3-5': { min: 3, max: 5 },
  '6-8': { min: 6, max: 8 },
  '9-12': { min: 9, max: 12 },
};

/** True if an item's age span overlaps the selected band. */
export function itemMatchesAge(item: DrawingItem, band: AgeRangeId): boolean {
  const range = AGE_BAND_RANGE[band];
  return item.ageMin <= range.max && item.ageMax >= range.min;
}

export function getCategory(slug: CategorySlug): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getItemBySlug(slug: string): DrawingItem | undefined {
  return DRAWING_ITEMS.find((item) => item.slug === slug);
}

export function getItemsByCategory(slug: CategorySlug): DrawingItem[] {
  return DRAWING_ITEMS.filter((item) => item.categorySlug === slug);
}

export function getFeaturedItems(): DrawingItem[] {
  return DRAWING_ITEMS.filter((item) => item.isFeatured);
}

/** Items recommended for a band: featured first, then the rest that fit the age. */
export function getRecommendedItems(band: AgeRangeId | null, limit = 8): DrawingItem[] {
  const pool = band ? DRAWING_ITEMS.filter((item) => itemMatchesAge(item, band)) : DRAWING_ITEMS;
  const sorted = [...pool].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  return sorted.slice(0, limit);
}

export type ItemFilters = {
  category?: CategorySlug | null;
  age?: AgeRangeId | null;
  difficulty?: Difficulty | null;
};

/** Apply Explore filters (all optional; null/undefined = no constraint). */
export function filterItems({ category, age, difficulty }: ItemFilters): DrawingItem[] {
  return DRAWING_ITEMS.filter((item) => {
    if (category && item.categorySlug !== category) return false;
    if (difficulty && item.difficulty !== difficulty) return false;
    if (age && !itemMatchesAge(item, age)) return false;
    return true;
  });
}
