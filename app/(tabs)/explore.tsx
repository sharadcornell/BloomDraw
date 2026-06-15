import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Chip, EmptyState, Screen, SkeletonCard } from '@/components';
import { CATEGORY_PLACEHOLDERS } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

/** Explore / Library (Milestone 2 scaffold). Real grid + filters land in Milestone 3. */
export default function ExploreScreen() {
  const { isTablet } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const cardWidth = isTablet ? '31%' : '47%';

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

      {/* Category filter chips (placeholder) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORY_PLACEHOLDERS.map((cat) => (
          <Chip
            key={cat.slug}
            label={cat.name}
            emoji={cat.emoji}
            accent={theme.getCategoryAccent(cat.slug)}
            selected={activeCategory === cat.slug}
            onPress={() => setActiveCategory((c) => (c === cat.slug ? null : cat.slug))}
          />
        ))}
      </ScrollView>

      {/* Skeleton grid placeholder */}
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ width: cardWidth }}>
            <SkeletonCard height={140} />
          </View>
        ))}
      </View>

      <EmptyState emoji="📚" message={strings.empty.library} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: theme.space.sm, paddingRight: theme.space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
});
