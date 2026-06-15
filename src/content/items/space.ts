import type { DrawingItem } from '@/types';

import { buildItems, toSteps } from '../_helpers';

export const space: DrawingItem[] = buildItems('space', [
  {
    slug: 'rocket',
    title: 'Rocket',
    emoji: '🚀',
    difficulty: 'medium',
    description: 'A rocket ship ready for blast off.',
    steps: toSteps([
      { title: 'Body', instruction: 'Draw a tall rounded rectangle for the rocket.' },
      { title: 'Nose cone', instruction: 'Add a triangle nose cone on top.' },
      { title: 'Fins', instruction: 'Draw two fins at the bottom.' },
      { title: 'Window', instruction: 'Add a round window in the middle.' },
      { title: 'Flames', instruction: 'Draw flames shooting out the bottom.' },
      { title: 'Color it in', instruction: 'Color your rocket and blast off!' },
    ]),
  },
  {
    slug: 'moon-and-stars',
    title: 'Moon and Stars',
    emoji: '🌙',
    difficulty: 'easy',
    description: 'A sleepy moon in a starry sky.',
    steps: toSteps([
      { title: 'Crescent moon', instruction: 'Draw a curved crescent moon shape.' },
      { title: 'Sleepy face', instruction: 'Add a calm, sleepy face if you like.' },
      { title: 'Twinkly stars', instruction: 'Draw little stars around the moon.' },
      { title: 'Color it in', instruction: 'Color the night sky a deep blue.' },
    ]),
  },
  {
    // "Cute robot" is placed in Space (sci-fi friendly robot) per docs/04 §7.
    slug: 'cute-robot',
    title: 'Cute Robot',
    emoji: '🤖',
    difficulty: 'medium',
    description: 'A friendly robot with a bright antenna.',
    steps: toSteps([
      { title: 'Head', instruction: 'Draw a square head.' },
      { title: 'Body', instruction: 'Add a bigger rectangle body below.' },
      { title: 'Arms & legs', instruction: 'Draw boxy arms and legs.' },
      { title: 'Face', instruction: 'Add eyes, a mouth, and an antenna on top.' },
      { title: 'Buttons', instruction: 'Draw buttons and dials on the body.' },
      { title: 'Color it in', instruction: 'Color your robot shiny and bright!' },
    ]),
  },
  // Placeholders (5)
  { slug: 'planet', title: 'Planet', emoji: '🪐', difficulty: 'medium' },
  { slug: 'astronaut', title: 'Astronaut', emoji: '👨‍🚀', difficulty: 'hard' },
  { slug: 'star', title: 'Star', emoji: '⭐', difficulty: 'easy' },
  { slug: 'flying-saucer', title: 'Flying Saucer', emoji: '🛸', difficulty: 'medium' },
  { slug: 'comet', title: 'Comet', emoji: '☄️', difficulty: 'medium' },
]);
