import type { Difficulty } from '@/types';

import { STEP_COUNT } from './_helpers';
import { CATEGORIES } from './categories';
import { DRAWING_ITEMS } from './index';

export type ContentValidation = {
  ok: boolean;
  issues: string[];
  stats: {
    categories: number;
    items: number;
    heroes: number;
    placeholders: number;
    byCategory: Record<string, number>;
  };
};

const VALID_DIFFICULTY: Difficulty[] = ['easy', 'medium', 'hard'];

/**
 * Lightweight content-integrity checks (docs/03 §11 quality, docs/08 §2).
 * Pure function — exercised by the Jest suite and optionally at app start in dev.
 */
export function validateContent(): ContentValidation {
  const issues: string[] = [];
  const categorySlugs = new Set(CATEGORIES.map((c) => c.slug));

  // 8 categories, unique slugs
  if (CATEGORIES.length !== 8) issues.push(`Expected 8 categories, found ${CATEGORIES.length}.`);
  if (categorySlugs.size !== CATEGORIES.length) issues.push('Duplicate category slug detected.');

  // ~100 items
  if (DRAWING_ITEMS.length < 95 || DRAWING_ITEMS.length > 110) {
    issues.push(`Expected ~100 items, found ${DRAWING_ITEMS.length}.`);
  }

  // Unique item slugs
  const seen = new Set<string>();
  for (const item of DRAWING_ITEMS) {
    if (seen.has(item.slug)) issues.push(`Duplicate item slug: ${item.slug}.`);
    seen.add(item.slug);
  }

  // Per-item invariants
  const byCategory: Record<string, number> = {};
  let heroes = 0;
  let placeholders = 0;

  for (const item of DRAWING_ITEMS) {
    byCategory[item.categorySlug] = (byCategory[item.categorySlug] ?? 0) + 1;
    if (item.isPlaceholder) placeholders += 1;
    else heroes += 1;

    if (!categorySlugs.has(item.categorySlug)) {
      issues.push(`Item ${item.slug} maps to unknown category ${item.categorySlug}.`);
    }
    if (!VALID_DIFFICULTY.includes(item.difficulty)) {
      issues.push(`Item ${item.slug} has invalid difficulty ${item.difficulty}.`);
    }
    if (!(item.ageMin >= 3 && item.ageMax <= 12 && item.ageMin <= item.ageMax)) {
      issues.push(`Item ${item.slug} has an invalid age range (${item.ageMin}–${item.ageMax}).`);
    }
    const expected = STEP_COUNT[item.difficulty];
    if (item.steps.length !== expected) {
      issues.push(`Item ${item.slug} (${item.difficulty}) has ${item.steps.length} steps, expected ${expected}.`);
    }
    // step numbers should be 1..N in order
    item.steps.forEach((step, i) => {
      if (step.stepNumber !== i + 1) issues.push(`Item ${item.slug} step ${i} has wrong stepNumber.`);
      if (!step.instruction.trim()) issues.push(`Item ${item.slug} step ${i + 1} has no instruction.`);
    });
    // hero items must have steps
    if (item.isFeatured && item.steps.length === 0) issues.push(`Hero ${item.slug} has no steps.`);
  }

  // At least 20 hero/featured items
  if (heroes < 20) issues.push(`Expected at least 20 hero items, found ${heroes}.`);

  return {
    ok: issues.length === 0,
    issues,
    stats: { categories: CATEGORIES.length, items: DRAWING_ITEMS.length, heroes, placeholders, byCategory },
  };
}
