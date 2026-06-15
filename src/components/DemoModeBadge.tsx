import { StyleSheet, View } from 'react-native';

import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * Detects whether the app is running without a configured Supabase backend.
 * When unconfigured, AI/upload flows fall back to mock outputs (docs/03 §11,
 * docs/05 §8) — so the badge signals "sample art, not a real model".
 */
export function useIsDemoMode(): boolean {
  return !process.env.EXPO_PUBLIC_SUPABASE_URL;
}

type Props = { force?: boolean };

/** Small info-tinted "Demo mode" pill. Renders nothing when fully configured. */
export function DemoModeBadge({ force }: Props) {
  const isDemo = useIsDemoMode();
  if (!isDemo && !force) return null;

  return (
    <View style={styles.badge} accessibilityRole="text">
      <AppText variant="caption" color={theme.color.brand.violetDeep}>
        ✨ {strings.demoMode}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.bg.subtle,
  },
});
