import { useEffect } from 'react';
import { type DimensionValue, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/theme/theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
};

/** Pulsing placeholder used while content loads (docs/06 §10). */
export function SkeletonCard({ width = '100%', height = 120, radius = theme.radius.lg }: Props) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.skeleton, { width, height, borderRadius: radius }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: theme.color.bg.subtle },
});
