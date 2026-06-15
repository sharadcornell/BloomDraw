import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

export const cards: DrawingItem[] = buildItems('cards', [
  {
    slug: 'mothers-day-card',
    title: "Mother's Day Card",
    emoji: '💐',
    difficulty: 'medium',
    description: 'A heartfelt card with flowers and a heart.',
    steps: toSteps([
      { title: 'Card shape', instruction: 'Draw a folded card shape (a tall rectangle).' },
      { title: 'Big heart', instruction: 'Draw a big heart on the front.' },
      { title: 'Flowers', instruction: 'Add a few flowers around the heart.' },
      { title: 'Words', instruction: "Write 'I love you' or 'Happy Mother's Day'." },
      { title: 'Border', instruction: 'Add dots, little hearts, or a border.' },
      { title: 'Color it in', instruction: 'Color your card with lots of love!' },
    ]),
  },
  {
    slug: 'birthday-card',
    title: 'Birthday Card',
    emoji: '🎂',
    difficulty: 'medium',
    description: 'A party card with cake and balloons.',
    steps: toSteps([
      { title: 'Card shape', instruction: 'Draw the folded card shape.' },
      { title: 'Cake', instruction: 'Draw a cake with candles on the front.' },
      { title: 'Balloons', instruction: 'Add a few balloons floating up.' },
      { title: 'Words', instruction: "Write 'Happy Birthday!'" },
      { title: 'Confetti', instruction: 'Add confetti and sparkles.' },
      { title: 'Color it in', instruction: 'Color it bright and fun!' },
    ]),
  },
  // Placeholders (6)
  { slug: 'thank-you-card', title: 'Thank You Card', emoji: '🙏', difficulty: 'easy' },
  { slug: 'get-well-card', title: 'Get Well Card', emoji: '💌', difficulty: 'easy' },
  { slug: 'holiday-card', title: 'Holiday Card', emoji: '🎄', difficulty: 'medium' },
  { slug: 'congrats-card', title: 'Congrats Card', emoji: '🎉', difficulty: 'medium' },
  { slug: 'friendship-card', title: 'Friendship Card', emoji: '🤝', difficulty: 'easy' },
  { slug: 'balloon-card', title: 'Balloon Card', emoji: '🎈', difficulty: 'easy' },
]);
