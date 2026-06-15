import type { TextStyle, ViewStyle } from 'react-native';

import { fontFamily } from './fonts';

/**
 * BloomDraw design tokens — the single source of visual truth.
 * Mirrors docs/06-design-system.md. Consumed via `useTheme()` / `theme`.
 */

export const color = {
  brand: {
    violet: '#7C5CFC',
    violetDeep: '#5B3FE0',
    coral: '#FF7E6B',
    sun: '#FFC93C',
    mint: '#3FD6B0',
    sky: '#5FC9F3',
  },
  bg: {
    base: '#FBF8FF',
    subtle: '#F2ECFF',
  },
  surface: {
    card: '#FFFFFF',
  },
  ink: {
    strong: '#2B2350',
    body: '#4A4470',
    muted: '#857FA6',
    onBrand: '#FFFFFF',
  },
  line: {
    hairline: '#ECE6FB',
  },
  state: {
    success: '#34C98B',
    warning: '#FFB020',
    error: '#FF6B8A',
    info: '#5FC9F3',
  },
} as const;

// Gradient stops (use with expo-linear-gradient).
export const gradient = {
  bloom: ['#7C5CFC', '#FF7E6B'],
  sky: ['#5FC9F3', '#3FD6B0'],
  sun: ['#FFC93C', '#FF7E6B'],
} as const;

// 4-based spacing scale.
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  mega: 64,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// Soft, violet-tinted elevation (the "premium glow"), not hard black.
export const shadow: Record<'e1' | 'e2' | 'e3', ViewStyle> = {
  e1: {
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  e2: {
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  e3: {
    shadowColor: '#5B3FE0',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
};

// Type scale (docs/06 §3). Min body size 16 for kid readability.
export const typography: Record<
  'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'caption' | 'button',
  TextStyle
> = {
  display: { fontFamily: fontFamily.display, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: fontFamily.heading, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fontFamily.heading, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fontFamily.headingSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamily.bodySemi, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 20 },
};

export const breakpoint = {
  tablet: 600,
} as const;

// Minimum touch target (kid-friendly large targets).
export const touchTarget = {
  min: 48,
  cta: 56,
} as const;

export const tokens = {
  color,
  gradient,
  space,
  radius,
  shadow,
  typography,
  breakpoint,
  touchTarget,
} as const;

export type Tokens = typeof tokens;
