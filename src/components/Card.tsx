import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme/theme';

type Props = ViewProps & {
  onPress?: () => void;
  padded?: boolean;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * White rounded surface with a soft violet-tinted shadow. Optional left accent
 * stripe (e.g. category color) and press scale when interactive. (docs/06 §6)
 */
export function Card({ children, onPress, padded = true, accent, style, ...rest }: Props) {
  const content = (
    <View
      style={[styles.card, padded && styles.padded, accent ? styles.withAccent : null, style]}
      {...rest}
    >
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.98 }] },
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.e1,
  },
  padded: { padding: theme.space.base },
  withAccent: { paddingLeft: theme.space.lg },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.lg,
  },
});
