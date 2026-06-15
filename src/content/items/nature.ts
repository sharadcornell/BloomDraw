import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

export const nature: DrawingItem[] = buildItems('nature', [
  {
    slug: 'tree',
    title: 'Tree',
    emoji: '🌳',
    difficulty: 'easy',
    description: 'A leafy tree with a sturdy trunk.',
    steps: toSteps([
      { title: 'Trunk', instruction: 'Draw a tall brown trunk.' },
      { title: 'Leaves', instruction: 'Add a big fluffy cloud shape on top for leaves.' },
      { title: 'Branches', instruction: 'Draw a few branches peeking out.' },
      { title: 'Color it in', instruction: 'Color the leaves green and the trunk brown.' },
    ]),
  },
  {
    slug: 'flower',
    title: 'Flower',
    emoji: '🌸',
    difficulty: 'easy',
    description: 'A happy flower with a tall stem.',
    steps: toSteps([
      { title: 'Center', instruction: 'Draw a small circle in the middle.' },
      { title: 'Petals', instruction: 'Add petals all around the circle.' },
      { title: 'Stem & leaves', instruction: 'Draw a stem and two leaves.' },
      { title: 'Color it in', instruction: 'Color your flower bright and happy!' },
    ]),
  },
  {
    slug: 'mountain-landscape',
    title: 'Mountain Landscape',
    emoji: '⛰️',
    difficulty: 'hard',
    description: 'Snowy peaks with a sunny sky.',
    steps: toSteps([
      { title: 'Horizon', instruction: 'Draw a line across the page for the ground.' },
      { title: 'Big mountain', instruction: 'Add a large triangle mountain.' },
      { title: 'More peaks', instruction: 'Draw smaller peaks beside it.' },
      { title: 'Snow caps', instruction: 'Add snowy tops to the mountains.' },
      { title: 'Sun', instruction: 'Draw a sun up in the sky.' },
      { title: 'Trees', instruction: 'Add a few little trees at the bottom.' },
      { title: 'Tidy up', instruction: 'Neaten your lines and erase extras.' },
      { title: 'Color it in', instruction: 'Color the sky, mountains, and trees.' },
    ]),
  },
  {
    slug: 'sun-and-clouds',
    title: 'Sun and Clouds',
    emoji: '🌥️',
    difficulty: 'easy',
    description: 'A bright sun peeking through clouds.',
    steps: toSteps([
      { title: 'Sun', instruction: 'Draw a big circle for the sun.' },
      { title: 'Rays', instruction: 'Add sun rays all around it.' },
      { title: 'Clouds', instruction: 'Draw two fluffy clouds.' },
      { title: 'Color it in', instruction: 'Color the sun yellow and the sky blue.' },
    ]),
  },
  // Placeholders (8)
  { slug: 'leaf', title: 'Leaf', emoji: '🍃', difficulty: 'easy' },
  { slug: 'cloud', title: 'Cloud', emoji: '☁️', difficulty: 'easy' },
  { slug: 'rainbow', title: 'Rainbow', emoji: '🌈', difficulty: 'easy' },
  { slug: 'mushroom', title: 'Mushroom', emoji: '🍄', difficulty: 'easy' },
  { slug: 'cactus', title: 'Cactus', emoji: '🌵', difficulty: 'medium' },
  { slug: 'palm-tree', title: 'Palm Tree', emoji: '🌴', difficulty: 'medium' },
  { slug: 'river', title: 'River', emoji: '🏞️', difficulty: 'hard' },
  { slug: 'snowflake', title: 'Snowflake', emoji: '❄️', difficulty: 'medium' },
]);
