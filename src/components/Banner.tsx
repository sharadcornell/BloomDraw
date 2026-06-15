import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * Soft inline banner for gentle notices (e.g., the kid-friendly rewrite notice).
 * Warm, never alarming (docs/06 §10, §12).
 */
type Tone = 'info' | 'success';

type Props = {
  message: string;
  emoji?: string;
  tone?: Tone;
};

const TONES: Record<Tone, { bg: string; text: string }> = {
  info: { bg: theme.color.bg.subtle, text: theme.color.brand.violetDeep },
  success: { bg: '#E6F8F1', text: theme.color.state.success },
};

export function Banner({ message, emoji = '✨', tone = 'info' }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]} accessibilityRole="text">
      <AppText variant="caption" color={palette.text}>
        {emoji} {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: theme.space.base,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
  },
});
