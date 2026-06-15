import { color, tokens } from './tokens';

/**
 * Per-category accent colors (docs/06 §2). Keyed by category slug.
 * Used by category cards/chips; falls back to brand violet for unknown slugs.
 */
export const categoryAccent: Record<string, string> = {
  alphabets: color.brand.violet,
  numbers: color.brand.sky,
  animals: color.brand.mint,
  vehicles: color.brand.coral,
  space: color.brand.violetDeep,
  nature: color.brand.mint,
  curriculum: color.brand.sun,
  cards: color.brand.coral,
};

export function getCategoryAccent(slug: string): string {
  return categoryAccent[slug] ?? color.brand.violet;
}

export const theme = {
  ...tokens,
  categoryAccent,
  getCategoryAccent,
} as const;

export type Theme = typeof theme;
