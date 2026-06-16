import { StyleSheet, View } from 'react-native';

import { strings } from '@/lib/strings';
import { isSupabaseConfigured } from '@/services/supabase';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';

/**
 * Detects whether the app is running without a configured Supabase backend.
 * When unconfigured, AI/upload flows fall back to mock outputs (docs/03 §11,
 * docs/05 §8) — so the badge signals "sample art, not a real model".
 *
 * Mirrors `isSupabaseConfigured` exactly (URL **and** anon key present, and
 * FORCE_MOCK off) so the badge can never disagree with the transport the flows
 * actually use — e.g. EXPO_PUBLIC_FORCE_MOCK=true or a missing anon key both
 * mean demo mode even when a URL is set.
 */
export function useIsDemoMode(): boolean {
  return !isSupabaseConfigured;
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
