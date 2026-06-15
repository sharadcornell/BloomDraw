/**
 * Shared app types.
 *
 * These mirror the planned Postgres schema (docs/04-database-schema.md) but use
 * camelCase + slug references for the bundled local seed. The Milestone 5
 * generate-seed step maps these to the relational tables. No Supabase yet.
 */

/** Selectable age band (mirrors the DB `age_range` enum). */
export type AgeRangeId = '3-5' | '6-8' | '9-12';

/** Drawing difficulty (mirrors the DB `difficulty_level` enum); drives step count. */
export type Difficulty = 'easy' | 'medium' | 'hard';

export type CategorySlug =
  | 'alphabets'
  | 'numbers'
  | 'animals'
  | 'vehicles'
  | 'space'
  | 'nature'
  | 'curriculum'
  | 'cards';

/** Brand color key used as a category accent (see src/theme/theme.ts). */
export type AccentKey = 'violet' | 'violetDeep' | 'coral' | 'sun' | 'mint' | 'sky';

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  /** Emoji/icon key used for the category card visual. */
  emoji: string;
  accentKey: AccentKey;
  sortOrder: number;
};

export type DrawingStep = {
  stepNumber: number;
  title: string;
  instruction: string;
  /** Null until a real step asset exists; UI renders a branded placeholder. */
  imageUrl: string | null;
};

/** Kinds of creations stored in recents. Photo/AI flows arrive in M7–M8. */
export type RecentType = 'ai_generation' | 'uploaded_image' | 'preloaded_drawing';

export type RecentCreation = {
  id: string;
  type: RecentType;
  title: string;
  /** Emoji used for the placeholder thumbnail (until real images exist). */
  emoji?: string;
  thumbnailUrl?: string | null;
  /** Epoch ms — recents are ordered newest-first. */
  createdAt: number;
  // Optional context future flows attach:
  prompt?: string;
  style?: string;
  /** For `preloaded_drawing`, the drawing item slug to re-open. */
  slug?: string;
};

export type DrawingItem = {
  id: string;
  slug: string;
  title: string;
  categorySlug: CategorySlug;
  description: string;
  /**
   * Local-only placeholder visual hint (an emoji). NOT a DB column — used to
   * render branded placeholder thumbnails until real `thumbnail_url` assets exist.
   */
  emoji: string;
  ageMin: number;
  ageMax: number;
  difficulty: Difficulty;
  isFeatured: boolean;
  isPlaceholder: boolean;
  thumbnailUrl: string | null;
  finalImageUrl: string | null;
  traceImageUrl: string | null;
  steps: DrawingStep[];
};
