import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, RecentCard, Screen, SectionHeader } from '@/components';
import { strings } from '@/lib/strings';
import { useRecentsStore } from '@/state';
import { theme } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

/** Recents — local creations (AI/upload flows populate this in M7–M8). */
export default function RecentsScreen() {
  const router = useRouter();
  const { isTablet } = useTheme();
  const recents = useRecentsStore((s) => s.recents);
  const removeRecentCreation = useRecentsStore((s) => s.removeRecentCreation);
  const clearRecents = useRecentsStore((s) => s.clearRecents);
  const cardWidth = isTablet ? '31.5%' : '47.5%';

  const confirmClear = () => {
    Alert.alert('Clear recents?', 'This removes your recent creations from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearRecents() },
    ]);
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(400)}>
        <SectionHeader
          title={strings.recents.title}
          actionLabel={recents.length > 0 ? 'Clear' : undefined}
          onAction={recents.length > 0 ? confirmClear : undefined}
        />
      </Animated.View>

      {recents.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState emoji="🌱" message={strings.empty.recents} />
        </View>
      ) : (
        <View style={styles.grid}>
          {recents.map((item) => (
            <View key={item.id} style={{ width: cardWidth }}>
              <RecentCard
                item={item}
                onPress={() => item.slug && router.push(`/drawing/${item.slug}`)}
                onRemove={() => removeRecentCreation(item.id)}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', paddingTop: theme.space.huge },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.md, justifyContent: 'space-between' },
});
