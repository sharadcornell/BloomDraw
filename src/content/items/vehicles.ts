import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

export const vehicles: DrawingItem[] = buildItems('vehicles', [
  {
    slug: 'car',
    title: 'Car',
    emoji: '🚗',
    difficulty: 'medium',
    description: 'A zippy little car with round wheels.',
    steps: toSteps([
      { title: 'Body', instruction: 'Draw a long rounded rectangle for the car body.' },
      { title: 'Roof', instruction: 'Add a smaller shape on top for the roof.' },
      { title: 'Wheels', instruction: 'Draw two round wheels at the bottom.' },
      { title: 'Windows', instruction: 'Add windows and a door line.' },
      { title: 'Details', instruction: 'Draw headlights and a bumper.' },
      { title: 'Color it in', instruction: 'Color your car your favorite color!' },
    ]),
  },
  {
    slug: 'school-bus',
    title: 'School Bus',
    emoji: '🚌',
    difficulty: 'medium',
    description: 'A big yellow bus full of windows.',
    steps: toSteps([
      { title: 'Body', instruction: 'Draw a long box shape for the bus.' },
      { title: 'Front', instruction: 'Round the front corner just a little.' },
      { title: 'Wheels', instruction: 'Add two big wheels at the bottom.' },
      { title: 'Windows', instruction: 'Draw a row of square windows.' },
      { title: 'Door & sign', instruction: 'Add a door and a little stop sign.' },
      { title: 'Color it in', instruction: 'Color your bus bright yellow!' },
    ]),
  },
  // Placeholders (8)
  { slug: 'train', title: 'Train', emoji: '🚂', difficulty: 'medium' },
  { slug: 'airplane', title: 'Airplane', emoji: '✈️', difficulty: 'medium' },
  { slug: 'boat', title: 'Boat', emoji: '⛵', difficulty: 'easy' },
  { slug: 'bicycle', title: 'Bicycle', emoji: '🚲', difficulty: 'medium' },
  { slug: 'truck', title: 'Truck', emoji: '🚚', difficulty: 'medium' },
  { slug: 'helicopter', title: 'Helicopter', emoji: '🚁', difficulty: 'hard' },
  { slug: 'tractor', title: 'Tractor', emoji: '🚜', difficulty: 'medium' },
  { slug: 'fire-truck', title: 'Fire Truck', emoji: '🚒', difficulty: 'medium' },
]);
