import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

export const curriculum: DrawingItem[] = buildItems('curriculum', [
  {
    slug: 'simple-house',
    title: 'Simple House',
    emoji: '🏠',
    difficulty: 'medium',
    description: 'A cozy house with a triangle roof.',
    steps: toSteps([
      { title: 'Walls', instruction: 'Draw a big square for the walls.' },
      { title: 'Roof', instruction: 'Add a triangle roof on top.' },
      { title: 'Door', instruction: 'Draw a door in the middle.' },
      { title: 'Windows', instruction: 'Add two windows.' },
      { title: 'Details', instruction: 'Draw a chimney and a little path.' },
      { title: 'Color it in', instruction: 'Color your house any colors you like!' },
    ]),
  },
  // Placeholders (7)
  { slug: 'shapes', title: 'Shapes', emoji: '🔷', difficulty: 'easy' },
  { slug: 'clock', title: 'Clock', emoji: '🕐', difficulty: 'medium' },
  { slug: 'pencil', title: 'Pencil', emoji: '✏️', difficulty: 'easy' },
  { slug: 'book', title: 'Book', emoji: '📖', difficulty: 'easy' },
  { slug: 'school-bag', title: 'School Bag', emoji: '🎒', difficulty: 'medium' },
  { slug: 'picture-frame', title: 'Picture Frame', emoji: '🖼️', difficulty: 'easy' },
  { slug: 'globe', title: 'Globe', emoji: '🌍', difficulty: 'medium' },
]);
