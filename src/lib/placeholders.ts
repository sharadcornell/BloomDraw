import type { AgeRangeId } from '@/types';

/**
 * Presentational placeholder data for the Milestone 2 app shell ONLY.
 *
 * This is NOT the content library (the ~100 seeded drawing items + tutorials
 * arrive in Milestone 3 under src/content). These arrays exist purely so the
 * shell can render realistic-looking category/featured/create placeholders.
 */

export const AGE_RANGES: {
  id: AgeRangeId;
  label: string;
  name: string;
  emoji: string;
  blurb: string;
}[] = [
  { id: '3-5', label: '3–5', name: 'Sprouts', emoji: '🌱', blurb: 'Big & simple' },
  { id: '6-8', label: '6–8', name: 'Bloomers', emoji: '🌼', blurb: 'Step by step' },
  { id: '9-12', label: '9–12', name: 'Creators', emoji: '🎨', blurb: 'More to explore' },
];

export const DEFAULT_AGE_RANGE: AgeRangeId = '6-8';

export const CATEGORY_PLACEHOLDERS: { slug: string; name: string; emoji: string }[] = [
  { slug: 'alphabets', name: 'Alphabets', emoji: '🔤' },
  { slug: 'numbers', name: 'Numbers', emoji: '🔢' },
  { slug: 'animals', name: 'Animals', emoji: '🐘' },
  { slug: 'vehicles', name: 'Vehicles', emoji: '🚗' },
  { slug: 'space', name: 'Space', emoji: '🚀' },
  { slug: 'nature', name: 'Nature', emoji: '🌳' },
  { slug: 'curriculum', name: 'School', emoji: '🏫' },
  { slug: 'cards', name: 'Cards', emoji: '💌' },
];

export type CreateOptionId = 'ai' | 'upload' | 'camera';

export const CREATE_OPTIONS: {
  id: CreateOptionId;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: 'bloom' | 'sky' | 'sun';
}[] = [
  { id: 'ai', title: 'Generate with AI', subtitle: 'Turn an idea into art', emoji: '✨', gradient: 'bloom' },
  { id: 'upload', title: 'Upload a photo', subtitle: 'From your gallery', emoji: '🖼️', gradient: 'sky' },
  { id: 'camera', title: 'Take a photo', subtitle: 'Snap something to draw', emoji: '📸', gradient: 'sun' },
];
