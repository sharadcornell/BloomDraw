import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AgeFilter,
  AppText,
  Button,
  Card,
  Chip,
  DemoModeBadge,
  SectionHeader,
  Screen,
} from '@/components';
import { strings } from '@/lib/strings';
import { useAppStore, useFavoritesStore, useRecentsStore } from '@/state';
import { theme } from '@/theme/theme';

/** Settings. Age band + data maintenance are functional; account/privacy are future placeholders. */
export default function SettingsScreen() {
  const router = useRouter();
  const selectedAgeRange = useAppStore((s) => s.selectedAgeRange);
  const setAgeRange = useAppStore((s) => s.setAgeRange);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);

  const favoritesCount = useFavoritesStore((s) => s.favorites.length);
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const recentsCount = useRecentsStore((s) => s.recents.length);
  const clearRecents = useRecentsStore((s) => s.clearRecents);
  const addRecentCreation = useRecentsStore((s) => s.addRecentCreation);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleReset = () => {
    resetOnboarding();
    router.replace('/onboarding');
  };

  const confirm = (title: string, message: string, onConfirm: () => void) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onConfirm },
    ]);

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(400)}>
        <AppText variant="h1" color={theme.color.ink.strong}>
          {strings.settings.title}
        </AppText>
      </Animated.View>

      {/* Artist age (functional) */}
      <View style={styles.section}>
        <SectionHeader title={strings.settings.ageTitle} />
        <Card>
          <AppText variant="caption" color={theme.color.ink.muted} style={styles.cardCaption}>
            {strings.settings.ageSubtitle}
          </AppText>
          <AgeFilter value={selectedAgeRange} onChange={setAgeRange} />
        </Card>
      </View>

      {/* Kid-safe AI note */}
      <View style={styles.section}>
        <SectionHeader title={strings.settings.safetyTitle} />
        <Card>
          <View style={styles.safetyRow}>
            <AppText variant="h2">🛡️</AppText>
            <AppText variant="body" color={theme.color.ink.body} style={styles.flex}>
              {strings.settings.safetyNote}
            </AppText>
          </View>
          <View style={styles.demoRow}>
            <DemoModeBadge force />
          </View>
        </Card>
      </View>

      {/* Future placeholders */}
      <View style={styles.section}>
        {[strings.settings.account, strings.settings.privacy].map((label) => (
          <Card key={label}>
            <View style={styles.placeholderRow}>
              <AppText variant="h3" color={theme.color.ink.muted}>
                {label}
              </AppText>
              <Chip label={strings.settings.comingSoon} />
            </View>
          </Card>
        ))}
      </View>

      {/* Manage local data */}
      <View style={styles.section}>
        <SectionHeader title="Manage" />
        <Card>
          <View style={styles.manageRow}>
            <AppText variant="bodyStrong" color={theme.color.ink.body} style={styles.flex}>
              Favorites ({favoritesCount})
            </AppText>
            <Button
              label="Clear"
              variant="ghost"
              fullWidth={false}
              disabled={favoritesCount === 0}
              onPress={() => confirm('Clear favorites?', 'This removes all saved favorites on this device.', clearFavorites)}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.manageRow}>
            <AppText variant="bodyStrong" color={theme.color.ink.body} style={styles.flex}>
              Recents ({recentsCount})
            </AppText>
            <Button
              label="Clear"
              variant="ghost"
              fullWidth={false}
              disabled={recentsCount === 0}
              onPress={() => confirm('Clear recents?', 'This removes your recent creations on this device.', clearRecents)}
            />
          </View>
        </Card>
      </View>

      {/* About */}
      <View style={styles.aboutRow}>
        <AppText variant="caption" color={theme.color.ink.muted}>
          {strings.app.name} · {strings.settings.version} {version}
        </AppText>
      </View>

      {__DEV__ ? (
        <View style={styles.devRow}>
          <Button label="Reset onboarding (dev)" variant="ghost" onPress={handleReset} />
          <Button
            label="Add demo recent (dev)"
            variant="ghost"
            onPress={() =>
              addRecentCreation({ type: 'preloaded_drawing', title: 'Demo creation', emoji: '🧪', slug: 'cat-face' })
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: theme.space.md },
  cardCaption: { marginBottom: theme.space.md },
  safetyRow: { flexDirection: 'row', gap: theme.space.md, alignItems: 'flex-start' },
  demoRow: { marginTop: theme.space.md },
  placeholderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: theme.color.line.hairline, marginVertical: theme.space.sm },
  aboutRow: { alignItems: 'center', paddingVertical: theme.space.md },
  devRow: { gap: theme.space.sm },
});

