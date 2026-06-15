import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = {
  emoji: string;
  accent: string;
  height?: number;
  emojiSize?: number;
  /** Optional caption overlay (e.g. "Trace version") for final/trace placeholders. */
  label?: string;
};

/**
 * Branded placeholder thumbnail used until real art exists (docs/04 §7 assets).
 * A soft accent-tinted gradient with the item's emoji — never a broken image.
 */
export function DrawingThumbnail({ emoji, accent, height = 120, emojiSize = 48, label }: Props) {
  return (
    <LinearGradient
      colors={[`${accent}33`, `${accent}14`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.thumb, { height }]}
    >
      <Text style={{ fontSize: emojiSize }} accessibilityElementsHidden>
        {emoji}
      </Text>
      {label ? (
        <View style={styles.labelWrap}>
          <AppText variant="caption" color={theme.color.ink.body}>
            {label}
          </AppText>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  thumb: { alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.lg },
  labelWrap: {
    position: 'absolute',
    bottom: theme.space.sm,
    backgroundColor: theme.color.surface.card,
    paddingHorizontal: theme.space.md,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
});
