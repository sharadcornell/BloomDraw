import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AgeFilter,
  AppText,
  Button,
  Card,
  Chip,
  DemoModeBadge,
  DrawingCard,
  EmptyState,
  Screen,
  SectionHeader,
} from '@/components';
import { CATEGORIES, getFeaturedItems, getRecommendedItems } from '@/content';
import { CREATE_OPTIONS } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { useAppStore } from '@/state/useAppStore';
import { getCategoryAccent, theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

/** Home — hero, age filter, real featured/recommended content, and create entry points. */
export default function HomeScreen() {
  const router = useRouter();
  const { isTablet } = useTheme();
  const selectedAgeRange = useAppStore((s) => s.selectedAgeRange);
  const setAgeRange = useAppStore((s) => s.setAgeRange);

  const featured = getFeaturedItems().slice(0, 10);
  const recommended = getRecommendedItems(selectedAgeRange, 8);
  const categoryWidth = isTablet ? '23%' : '47%';

  return (
    <Screen scroll>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="caption" color={theme.color.ink.muted}>
            {strings.app.tagline}
          </AppText>
          <AppText variant="h1" color={theme.color.ink.strong}>
            {strings.app.name}
          </AppText>
        </View>
        <DemoModeBadge />
      </Animated.View>

      {/* Hero */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <LinearGradient
          colors={theme.gradient.bloom as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <AppText variant="display" color={theme.color.ink.onBrand}>
            {strings.home.heroTitle}
          </AppText>
          <AppText variant="body" color={theme.color.ink.onBrand} style={styles.heroSubtitle}>
            {strings.home.heroSubtitle}
          </AppText>
          <View style={styles.heroCta}>
            <Button
              label={strings.home.heroCta}
              variant="secondary"
              fullWidth={false}
              icon="sparkles"
              onPress={() => router.push('/explore')}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Age filter */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.section}>
        <AppText variant="h3" color={theme.color.ink.strong}>
          Pick an age
        </AppText>
        <AgeFilter value={selectedAgeRange} onChange={setAgeRange} />
      </Animated.View>

      {/* Featured lessons */}
      <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.section}>
        <SectionHeader
          title={strings.home.featured}
          actionLabel={strings.home.seeAll}
          onAction={() => router.push('/explore')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {featured.map((item) => (
            <View key={item.slug} style={styles.hCard}>
              <DrawingCard item={item} onPress={() => router.push(`/drawing/${item.slug}`)} />
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Age-based recommendations */}
      <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
        <SectionHeader title={selectedAgeRange ? `Just right for ages ${selectedAgeRange}` : 'Just for you'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {recommended.map((item) => (
            <View key={item.slug} style={styles.hCard}>
              <DrawingCard item={item} onPress={() => router.push(`/drawing/${item.slug}`)} />
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Categories */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
        <SectionHeader
          title={strings.home.categories}
          actionLabel={strings.home.seeAll}
          onAction={() => router.push('/explore')}
        />
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.slug}
              onPress={() => router.push(`/explore?category=${cat.slug}`)}
              style={({ pressed }) => [{ width: categoryWidth }, pressed && styles.pressed]}
            >
              <Card accent={getCategoryAccent(cat.slug)}>
                <AppText variant="h2">{cat.emoji}</AppText>
                <AppText variant="h3" color={theme.color.ink.strong}>
                  {cat.name}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Quick create */}
      <Animated.View entering={FadeInDown.delay(360).duration(400)} style={styles.section}>
        <SectionHeader title={strings.home.quickCreate} />
        <View style={styles.createRow}>
          {CREATE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => router.push('/create')}
              style={({ pressed }) => [styles.flex, pressed && styles.pressed]}
            >
              <Card>
                <AppText variant="h2">{opt.emoji}</AppText>
                <AppText variant="caption" color={theme.color.ink.body}>
                  {opt.title}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Recents + favorites placeholders (Milestone 4) */}
      <Animated.View entering={FadeInDown.delay(420).duration(400)} style={styles.section}>
        <SectionHeader title={strings.home.recents} />
        <Card>
          <EmptyState emoji="🌱" message={strings.empty.recents} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(480).duration(400)} style={styles.section}>
        <SectionHeader title={strings.home.favorites} />
        <Card>
          <EmptyState emoji="❤️" message={strings.empty.favorites} />
        </Card>
      </Animated.View>

      {/* Projector preview entry (placeholder) */}
      <Animated.View entering={FadeInDown.delay(540).duration(400)} style={styles.section}>
        <Card accent={theme.color.brand.sky}>
          <View style={styles.projectorRow}>
            <AppText variant="h2">📽️</AppText>
            <View style={styles.flex}>
              <AppText variant="h3" color={theme.color.ink.strong}>
                {strings.home.projector}
              </AppText>
              <AppText variant="caption" color={theme.color.ink.muted}>
                Project your art onto paper to trace.
              </AppText>
            </View>
            <Chip label={strings.create.comingSoon} accent={theme.color.brand.sky} />
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  section: { gap: theme.space.md },
  hero: { borderRadius: theme.radius.xl, padding: theme.space.xl, ...theme.shadow.e2 },
  heroSubtitle: { marginTop: theme.space.sm, opacity: 0.95 },
  heroCta: { marginTop: theme.space.lg, flexDirection: 'row' },
  row: { gap: theme.space.md, paddingRight: theme.space.lg },
  hCard: { width: 160 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md },
  createRow: { flexDirection: 'row', gap: theme.space.md },
  projectorRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.base },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
