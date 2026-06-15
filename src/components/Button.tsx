import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Primary action button. `primary` is the brand gradient pill; `secondary` is a
 * bordered surface; `ghost` is text-only. Press = scale + light haptic. (docs/06 §7)
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const textColor = variant === 'primary' ? theme.color.ink.onBrand : theme.color.brand.violet;

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
          <AppText variant="button" color={textColor}>
            {label}
          </AppText>
        </View>
      )}
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={theme.gradient.bloom as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.primary]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.base, variant === 'secondary' ? styles.secondary : styles.ghost]}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touchTarget.cta,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  primary: { ...theme.shadow.e2 },
  secondary: {
    backgroundColor: theme.color.surface.card,
    borderWidth: 1.5,
    borderColor: theme.color.line.hairline,
  },
  ghost: { backgroundColor: 'transparent' },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  disabled: { opacity: 0.5 },
});
