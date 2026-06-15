import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

const LETTERS = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const alphabets: DrawingItem[] = buildItems('alphabets', [
  {
    slug: 'letter-a-apple',
    title: 'Letter A with Apple',
    emoji: '🍎',
    difficulty: 'easy',
    ageMin: 3,
    ageMax: 6,
    description: 'Draw a big letter A and a yummy apple.',
    steps: toSteps([
      { title: 'Make a tent', instruction: 'Draw two slanted lines that meet at the top, like a tent.' },
      { title: 'Add the bar', instruction: 'Draw a line across the middle to finish your letter A.' },
      { title: 'Draw an apple', instruction: 'Draw a round apple with a little stem next to your A.' },
      { title: 'Color it in', instruction: 'Color the A and make the apple bright red. Yum!' },
    ]),
  },
  ...LETTERS.map((letter) => ({
    slug: `letter-${letter.toLowerCase()}`,
    title: `Letter ${letter}`,
    emoji: '🔤',
    difficulty: 'easy' as const,
    ageMin: 3,
    ageMax: 6,
    description: `Practice drawing the letter ${letter}.`,
  })),
]);
