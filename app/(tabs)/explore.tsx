import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText, Chip, DrawingCard, EmptyState, Screen } from '@/components';
import { CATEGORIES, filterItems } from '@/content';
import { AGE_RANGES } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { useAppStore } from '@/state/useAppStore';
import { getCategoryAccent, theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';
import type { AgeRangeId, CategorySlug, Difficulty } from '@/types';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

/** Explore / Library — browse the preloaded content with filters (docs/02 §3). */
export default function ExploreScreen() {
  const router = useRouter();
  const { isTablet } = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();
  const storeAge = useAppStore((s) => s.selectedAgeRange);

  const initialCategory = CATEGORIES.some((c) => c.slug === params.category)
    ? (params.category as CategorySlug)
    : null;

  const [category, setCategory] = useState<CategorySlug | null>(initialCategory);
  const [age, setAge] = useState<AgeRangeId | null>(storeAge);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const results = useMemo(
    () => filterItems({ category, age, difficulty }),
    [category, age, difficulty],
  );
  const hasFilters = category !== null || age !== null || difficulty !== null;
  const cardWidth = isTablet ? '31.5%' : '47.5%';

  const resetFilters = () => {
    setCategory(null);
    setAge(null);
    setDifficulty(null);
  };

  const toggle = <T,>(value: T, current: T | null, set: (v: T | null) => void) =>
    set(current === value ? null : value);

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(400)}>
        <AppText variant="h1" color={theme.color.ink.strong}>
          {strings.explore.title}
        </AppText>
        <AppText variant="body" color={theme.color.ink.muted}>
          {strings.explore.subtitle}
        </AppText>
      </Animated.View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.slug}
            label={cat.name}
            emoji={cat.emoji}
            accent={getCategoryAccent(cat.slug)}
            selected={category === cat.slug}
            onPress={() => toggle(cat.slug, category, setCategory)}
          />
        ))}
      </ScrollView>

      {/* Age + difficulty filters */}
      <View style={styles.filterGroup}>
        <AppText variant="caption" color={theme.color.ink.muted}>
          Age
        </AppText>
        <View style={styles.chipWrap}>
          {AGE_RANGES.map((band) => (
            <Chip
              key={band.id}
              label={band.label}
              emoji={band.emoji}
              selected={age === band.id}
              onPress={() => toggle(band.id, age, setAge)}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <AppText variant="caption" color={theme.color.ink.muted}>
          Difficulty
        </AppText>
        <View style={styles.chipWrap}>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d.id}
              label={d.label}
              selected={difficulty === d.id}
              onPress={() => toggle(d.id, difficulty, setDifficulty)}
            />
          ))}
          {hasFilters ? (
            <Pressable onPress={resetFilters} hitSlop={8} style={styles.reset} accessibilityRole="button">
              <AppText variant="caption" color={theme.color.brand.violet}>
                Reset
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Results */}
      <AppText variant="caption" color={theme.color.ink.muted}>
        {results.length} {results.length === 1 ? 'drawing' : 'drawings'}
      </AppText>

      {results.length === 0 ? (
        <EmptyState
          emoji="🔍"
          message={strings.empty.explore}
          actionLabel="Reset filters"
          onAction={resetFilters}
        />
      ) : (
        <View style={styles.grid}>
          {results.map((item, i) => (
            <Animated.View
              key={item.slug}
              entering={FadeIn.delay(Math.min(i, 12) * 35).duration(300)}
              style={{ width: cardWidth }}
            >
              <DrawingCard item={item} onPress={() => router.push(`/drawing/${item.slug}`)} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { gap: theme.space.sm, paddingRight: theme.space.lg },
  filterGroup: { gap: theme.space.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, alignItems: 'center' },
  reset: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'space-between' },
});
