import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useFavoritesStore, useIsFavorite } from '@/state';
import { getCategoryAccent, theme } from '@/theme/theme';
import type { DrawingItem } from '@/types';

import { AppText } from './AppText';
import { Card } from './Card';
import { DifficultyDots } from './DifficultyDots';
import { DrawingThumbnail } from './DrawingThumbnail';

type Props = {
  item: DrawingItem;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Grid/row card for a drawing item: placeholder thumbnail + title + meta.
 *
 * The heart toggles a persisted local favorite (Milestone 4).
 */
export function DrawingCard({ item, onPress, style }: Props) {
  const accent = getCategoryAccent(item.categorySlug);
  const faved = useIsFavorite(item.slug);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const onToggleFav = () => {
    Haptics.selectionAsync().catch(() => {});
    toggleFavorite(item.slug);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.difficulty}`}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      <Card padded={false}>
        <View>
          <DrawingThumbnail emoji={item.emoji} accent={accent} height={110} />
          <Pressable
            onPress={onToggleFav}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={faved ? 'Remove favorite' : 'Add favorite'}
            style={styles.heart}
          >
            <Ionicons
              name={faved ? 'heart' : 'heart-outline'}
              size={20}
              color={faved ? theme.color.brand.coral : theme.color.ink.muted}
            />
          </Pressable>
        </View>
        <View style={styles.body}>
          <AppText variant="h3" color={theme.color.ink.strong} numberOfLines={1}>
            {item.title}
          </AppText>
          <View style={styles.meta}>
            <AppText variant="caption" color={theme.color.ink.muted}>
              Ages {item.ageMin}–{item.ageMax}
            </AppText>
            <DifficultyDots difficulty={item.difficulty} accent={accent} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  heart: {
    position: 'absolute',
    top: theme.space.sm,
    right: theme.space.sm,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.pill,
    padding: 6,
    ...theme.shadow.e1,
  },
  body: { padding: theme.space.md, gap: theme.space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
