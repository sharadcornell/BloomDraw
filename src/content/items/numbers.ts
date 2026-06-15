import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

const DIGITS = ['0', '2', '3', '4', '5', '6', '7', '8', '9'];

export const numbers: DrawingItem[] = buildItems('numbers', [
  {
    slug: 'number-1-rocket',
    title: 'Number 1 with Rocket',
    emoji: '🚀',
    difficulty: 'easy',
    ageMin: 3,
    ageMax: 6,
    description: 'Draw the number 1 and a rocket zooming by.',
    steps: toSteps([
      { title: 'Tall line', instruction: 'Draw a tall straight line down. That is your number 1!' },
      { title: 'Little flag', instruction: 'Add a small slanted line at the top, pointing left.' },
      { title: 'Add a rocket', instruction: 'Draw a rocket zooming up next to your 1.' },
      { title: 'Color it in', instruction: 'Color your number and rocket. Blast off!' },
    ]),
  },
  ...DIGITS.map((digit) => ({
    slug: `number-${digit}`,
    title: `Number ${digit}`,
    emoji: '🔢',
    difficulty: 'easy' as const,
    ageMin: 3,
    ageMax: 6,
    description: `Practice drawing the number ${digit}.`,
  })),
]);
