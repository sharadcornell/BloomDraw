import { Pressable, StyleSheet } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  accent?: string;
};

/**
 * Selectable pill (age / difficulty / category filters). Selected = accent-tinted
 * fill + accent text; unselected = subtle surface. (docs/06 §7)
 */
export function Chip({ label, emoji, selected = false, onPress, accent = theme.color.brand.violet }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accent : theme.color.bg.subtle,
          borderColor: selected ? accent : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? theme.color.ink.onBrand : theme.color.ink.body}
      >
        {emoji ? `${emoji}  ` : ''}
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: theme.space.base,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
});
