import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
};

/** Custom header with a large back button (we keep native headers hidden). */
export function BackHeader({ title, onBack, right }: Props) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={24} color={theme.color.ink.strong} />
      </Pressable>
      {title ? (
        <AppText variant="h3" color={theme.color.ink.strong} numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
      ) : (
        <View style={styles.title} />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, minHeight: 44 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.e1,
  },
  pressed: { transform: [{ scale: 0.94 }] },
  title: { flex: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
