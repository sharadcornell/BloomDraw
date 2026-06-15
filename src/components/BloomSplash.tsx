import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = { onFinish: () => void };

/**
 * In-app animated splash shown after the native splash hides, while the app
 * settles. The flower "blooms" (scale + spin-settle) and gently pulses, then the
 * whole overlay fades out (docs/06 §9). Reanimated direct (not Moti) for
 * guaranteed Reanimated-4 stability — see docs/10 M2 decision.
 */
export function BloomSplash({ onFinish }: Props) {
  const overlayOpacity = useSharedValue(1);
  const bloom = useSharedValue(0);

  useEffect(() => {
    // Bloom in, then a soft idle pulse.
    bloom.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.6)) }),
      withRepeat(withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    // Hold ~1.2s, then fade the overlay out and hand control to the app.
    overlayOpacity.value = withDelay(
      1200,
      withTiming(0, { duration: 450, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [bloom, overlayOpacity, onFinish]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bloom.value }, { rotate: `${(1 - bloom.value) * -25}deg` }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} pointerEvents="none">
      <LinearGradient
        colors={theme.gradient.bloom as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Text style={[styles.flower, flowerStyle]}>🌸</Animated.Text>
      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <AppText variant="display" color={theme.color.ink.onBrand} center>
          {strings.app.name}
        </AppText>
        <AppText variant="body" color={theme.color.ink.onBrand} center style={styles.tagline}>
          {strings.splash.tagline}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center', gap: theme.space.base },
  flower: { fontSize: 88 },
  tagline: { marginTop: theme.space.xs, opacity: 0.95 },
});
