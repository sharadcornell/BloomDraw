import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  BackHeader,
  Button,
  Card,
  Chip,
  DifficultyDots,
  DrawingThumbnail,
  EmptyState,
  Screen,
  SectionHeader,
} from '@/components';
import { getCategory, getItemBySlug } from '@/content';
import { useFavoritesStore, useIsFavorite } from '@/state';
import { getCategoryAccent, theme } from '@/theme/theme';

/** Drawing Detail — final/trace placeholders, meta, and tutorial entry (docs/02 §3). */
export default function DrawingDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const item = slug ? getItemBySlug(slug) : undefined;
  // Hooks must run unconditionally (before the not-found early return).
  const faved = useIsFavorite(slug ?? '');
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  if (!item) {
    return (
      <Screen>
        <BackHeader title="Drawing" />
        <View style={styles.notFound}>
          <EmptyState
            emoji="🔍"
            message="We couldn't find that drawing."
            actionLabel="Back to Explore"
            onAction={() => router.replace('/explore')}
          />
        </View>
      </Screen>
    );
  }

  const accent = getCategoryAccent(item.categorySlug);
  const category = getCategory(item.categorySlug);

  return (
    <Screen scroll>
      <BackHeader
        title={item.title}
        right={
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              toggleFavorite(item.slug);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={faved ? 'Remove favorite' : 'Add favorite'}
          >
            <Ionicons
              name={faved ? 'heart' : 'heart-outline'}
              size={26}
              color={faved ? theme.color.brand.coral : theme.color.ink.muted}
            />
          </Pressable>
        }
      />

      <Animated.View entering={FadeInDown.duration(400)}>
        <DrawingThumbnail emoji={item.emoji} accent={accent} height={220} emojiSize={104} label="Final art" />
      </Animated.View>

      <View style={styles.metaRow}>
        {category ? <Chip label={category.name} emoji={category.emoji} accent={accent} /> : null}
        <DifficultyDots difficulty={item.difficulty} showLabel accent={accent} />
        <AppText variant="caption" color={theme.color.ink.muted}>
          Ages {item.ageMin}–{item.ageMax}
        </AppText>
      </View>

      <AppText variant="body" color={theme.color.ink.body}>
        {item.description}
      </AppText>

      <View style={styles.section}>
        <SectionHeader title="Trace-ready version" />
        <DrawingThumbnail emoji={item.emoji} accent={accent} height={140} emojiSize={64} label="Trace version" />
      </View>

      <View style={styles.actions}>
        <Button
          label="Start tutorial"
          icon="play"
          onPress={() => router.push(`/tutorial/${item.slug}`)}
        />
        <Card>
          <View style={styles.projectorRow}>
            <AppText variant="h3">📽️</AppText>
            <AppText variant="bodyStrong" color={theme.color.ink.muted} style={styles.flex}>
              Projector Preview
            </AppText>
            <Chip label="Coming soon" accent={theme.color.brand.sky} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFound: { flex: 1, justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, flexWrap: 'wrap' },
  section: { gap: theme.space.md },
  actions: { gap: theme.space.md },
  projectorRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
});
