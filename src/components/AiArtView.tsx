import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * Renders an AI result image. Real (http) results render via expo-image; DEMO /
 * mock results render a branded, deterministic placeholder instead of trying to
 * load an SVG data URL (which native image loaders don't reliably support). This
 * keeps the demo flow fully visual with zero keys (docs/05 §8, docs/06 §10).
 */
type Props = {
  url?: string | null;
  demo?: boolean;
  kind: 'image' | 'lineart';
  /** Prompt text → deterministic placeholder color/subject. */
  seed: string;
  label?: string;
  height?: number;
};

const PALETTES: readonly [string, string][] = [
  ['#7C5CFC', '#B79CFF'],
  ['#FF7E6B', '#FFD1DC'],
  ['#FFC93C', '#FFE3A3'],
  ['#3FD6B0', '#BDF3E6'],
  ['#5FC9F3', '#BFE4FF'],
];

function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function firstWords(input: string): string {
  const words = input.trim().split(/\s+/).slice(0, 3).join(' ');
  return words || 'your idea';
}

function isHttp(url?: string | null): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

export function AiArtView({ url, demo, kind, seed, label, height = 260 }: Props) {
  const showReal = isHttp(url) && !demo;

  if (showReal) {
    return (
      <View style={[styles.frame, { height }]}>
        <Image
          source={{ uri: url }}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={label ?? 'Generated drawing'}
        />
      </View>
    );
  }

  // Demo / placeholder rendering.
  if (kind === 'lineart') {
    return (
      <View style={[styles.frame, styles.lineArt, { height }]} accessibilityLabel={label ?? 'Line art'}>
        <View style={styles.lineArtCircle} />
        <AppText variant="caption" color={theme.color.ink.muted} center style={styles.lineArtCaption}>
          {firstWords(seed)}
        </AppText>
      </View>
    );
  }

  const [a, b] = PALETTES[hash(seed) % PALETTES.length];
  return (
    <LinearGradient
      colors={[a, b]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.frame, styles.center, { height }]}
    >
      <AppText style={styles.star}>★</AppText>
      <AppText variant="bodyStrong" color={theme.color.ink.onBrand} center>
        {firstWords(seed)}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.surface.card,
    ...theme.shadow.e1,
  },
  image: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center', gap: theme.space.sm },
  star: { fontSize: 96, color: theme.color.ink.onBrand },
  lineArt: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    borderWidth: 2,
    borderColor: theme.color.line.hairline,
  },
  lineArtCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: theme.color.ink.strong,
  },
  lineArtCaption: { paddingHorizontal: theme.space.base },
});
