import type { CategorySlug, Difficulty, DrawingItem, DrawingStep } from '@/types';

/** Difficulty → step count (docs/01 §F, docs/04 §7). */
export const STEP_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };

/** Default age span per difficulty (tunable per item). */
const DEFAULT_AGE: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 3, max: 7 },
  medium: { min: 6, max: 10 },
  hard: { min: 9, max: 12 },
};

/** Turn authored {title,instruction} pairs into numbered DrawingSteps. */
export function toSteps(arr: { title: string; instruction: string }[]): DrawingStep[] {
  return arr.map((s, i) => ({ stepNumber: i + 1, title: s.title, instruction: s.instruction, imageUrl: null }));
}

/** Generic but reasonable build steps used for placeholder items. */
const BUILD_STEPS = [
  { title: 'Big shapes', instruction: 'Start with the big, simple shapes. Draw them lightly.' },
  { title: 'Outline', instruction: 'Trace a soft outline around your shapes.' },
  { title: 'Main parts', instruction: 'Add the main parts so it starts to take shape.' },
  { title: 'Fun details', instruction: 'Add eyes, lines, or little details.' },
  { title: 'More details', instruction: 'Add a few more details to make it your own.' },
  { title: 'Patterns', instruction: 'Draw patterns, dots, or textures.' },
  { title: 'Tidy up', instruction: 'Erase extra marks and make your lines neat.' },
];
const FINISH_STEP = { title: 'Color it in', instruction: 'Color it in any way you like. Great job!' };

/** Build a difficulty-appropriate set of generic steps (always ends on "Color it in"). */
export function genericSteps(difficulty: Difficulty): DrawingStep[] {
  const n = STEP_COUNT[difficulty];
  return toSteps([...BUILD_STEPS.slice(0, n - 1), FINISH_STEP]);
}

type ItemInput = {
  slug: string;
  title: string;
  emoji: string;
  difficulty: Difficulty;
  description?: string;
  ageMin?: number;
  ageMax?: number;
  /** Authored steps mark an item as a detailed "hero" (featured, non-placeholder). */
  steps?: DrawingStep[];
};

/**
 * Build DrawingItems for a category. An item with authored `steps` is treated as
 * a hero (isFeatured + not placeholder); others get generic steps and are
 * structured placeholders.
 */
export function buildItems(category: CategorySlug, inputs: ItemInput[]): DrawingItem[] {
  return inputs.map((p) => {
    const age = DEFAULT_AGE[p.difficulty];
    const isHero = Array.isArray(p.steps);
    return {
      id: p.slug,
      slug: p.slug,
      title: p.title,
      categorySlug: category,
      emoji: p.emoji,
      description: p.description ?? `Learn to draw ${p.title.toLowerCase()} step by step.`,
      ageMin: p.ageMin ?? age.min,
      ageMax: p.ageMax ?? age.max,
      difficulty: p.difficulty,
      isFeatured: isHero,
      isPlaceholder: !isHero,
      thumbnailUrl: null,
      finalImageUrl: null,
      traceImageUrl: null,
      steps: p.steps ?? genericSteps(p.difficulty),
    };
  });
}
