import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, BackHeader, DrawingCard, EmptyState, Screen } from '@/components';
import { getItemBySlug } from '@/content';
import { strings } from '@/lib/strings';
import { useFavoritesStore } from '@/state';
import { theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';
import type { DrawingItem } from '@/types';

/** Favorites — the user's saved preloaded drawings (local only). Reached from Home. */
export default function FavoritesScreen() {
  const router = useRouter();
  const { isTablet } = useTheme();
  const favorites = useFavoritesStore((s) => s.favorites);
  const items = favorites
    .map((slug) => getItemBySlug(slug))
    .filter((i): i is DrawingItem => Boolean(i));

  const cardWidth = isTablet ? '31.5%' : '47.5%';

  return (
    <Screen scroll>
      <BackHeader title={strings.home.favorites} />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState emoji="❤️" message={strings.empty.favorites} />
        </View>
      ) : (
        <>
          <AppText variant="caption" color={theme.color.ink.muted}>
            {items.length} {items.length === 1 ? 'favorite' : 'favorites'}
          </AppText>
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.slug} style={{ width: cardWidth }}>
                <DrawingCard item={item} onPress={() => router.push(`/drawing/${item.slug}`)} />
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', paddingTop: theme.space.huge },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'space-between' },
});
