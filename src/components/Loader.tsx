import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = { label?: string };

/**
 * Branded "blooming" loader — a gently pulsing flower, not a bare spinner
 * (docs/06 §10). Uses Reanimated directly for stability with Reanimated 4.
 */
export function Loader({ label }: Props) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <Animated.Text style={[styles.emoji, animatedStyle]}>🌸</Animated.Text>
      {label ? (
        <AppText variant="caption" color={theme.color.ink.muted} center>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: theme.space.md, padding: theme.space.xl },
  emoji: { fontSize: 44 },
});
