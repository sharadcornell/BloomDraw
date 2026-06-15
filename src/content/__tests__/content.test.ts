import { describe, expect, it } from '@jest/globals';

import { CATEGORIES, DRAWING_ITEMS, STEP_COUNT } from '@/content';
import { validateContent } from '@/content/validate';

describe('content library integrity', () => {
  const result = validateContent();

  it('passes full content validation with no issues', () => {
    // Surface the actual issues in the failure message if any exist.
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('has exactly 8 categories with unique slugs', () => {
    expect(CATEGORIES).toHaveLength(8);
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(8);
  });

  it('has ~100 drawing items', () => {
    expect(DRAWING_ITEMS.length).toBeGreaterThanOrEqual(95);
    expect(DRAWING_ITEMS.length).toBeLessThanOrEqual(110);
  });

  it('has at least 20 hero items', () => {
    expect(result.stats.heroes).toBeGreaterThanOrEqual(20);
  });

  it('has no duplicate item slugs', () => {
    const slugs = DRAWING_ITEMS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('maps every item to a valid category', () => {
    const valid = new Set(CATEGORIES.map((c) => c.slug));
    for (const item of DRAWING_ITEMS) {
      expect(valid.has(item.categorySlug)).toBe(true);
    }
  });

  it('matches step count to difficulty (easy 4 / medium 6 / hard 8)', () => {
    for (const item of DRAWING_ITEMS) {
      expect(item.steps.length).toBe(STEP_COUNT[item.difficulty]);
    }
  });

  it('gives every item a valid age range and difficulty', () => {
    for (const item of DRAWING_ITEMS) {
      expect(item.ageMin).toBeLessThanOrEqual(item.ageMax);
      expect(item.ageMin).toBeGreaterThanOrEqual(3);
      expect(item.ageMax).toBeLessThanOrEqual(12);
      expect(['easy', 'medium', 'hard']).toContain(item.difficulty);
    }
  });

  it('places "Cute robot" in Space', () => {
    expect(DRAWING_ITEMS.find((i) => i.slug === 'cute-robot')?.categorySlug).toBe('space');
  });
});
