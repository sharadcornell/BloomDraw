import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme/theme';
import type { RecentCreation, RecentType } from '@/types';

import { AppText } from './AppText';
import { Card } from './Card';
import { DrawingThumbnail } from './DrawingThumbnail';

function isHttp(url?: string | null): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

const TYPE_META: Record<RecentType, { label: string; emoji: string; accent: string }> = {
  ai_generation: { label: 'AI art', emoji: '✨', accent: theme.color.brand.violet },
  uploaded_image: { label: 'Photo', emoji: '🖼️', accent: theme.color.brand.sky },
  preloaded_drawing: { label: 'Lesson', emoji: '✏️', accent: theme.color.brand.mint },
};

type Props = {
  item: RecentCreation;
  onPress?: () => void;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Card for a recent creation (used on Home preview + Recents screen). */
export function RecentCard({ item, onPress, onRemove, style }: Props) {
  const meta = TYPE_META[item.type];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${meta.label}`}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      <Card padded={false}>
        <View>
          {isHttp(item.thumbnailUrl) ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.thumb}
              contentFit="cover"
              accessibilityLabel={item.title}
            />
          ) : (
            <DrawingThumbnail emoji={item.emoji ?? meta.emoji} accent={meta.accent} height={110} />
          )}
          {onRemove ? (
            <Pressable
              onPress={onRemove}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Remove from recents"
              style={styles.remove}
            >
              <Ionicons name="close" size={18} color={theme.color.ink.muted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.body}>
          <AppText variant="h3" color={theme.color.ink.strong} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" color={meta.accent}>
            {meta.emoji} {meta.label}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  remove: {
    position: 'absolute',
    top: theme.space.sm,
    right: theme.space.sm,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.pill,
    padding: 4,
    ...theme.shadow.e1,
  },
  body: { padding: theme.space.md, gap: theme.space.xs },
  thumb: { width: '100%', height: 110, backgroundColor: theme.color.bg.subtle },
});
