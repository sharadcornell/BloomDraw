import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Card } from '@/components';
import { AGE_RANGES } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { useAppStore } from '@/state/useAppStore';
import { theme } from '@/theme/theme';
import type { AgeRangeId } from '@/types';

/**
 * First-run age picker (docs/02 §1). Lightweight: choose a band or skip
 * (defaults to 6–8). Persists locally via the app store; no backend, no profiles.
 */
export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);

  const choose = (id: AgeRangeId) => {
    completeOnboarding(id);
    router.replace('/');
  };

  const skip = () => {
    skipOnboarding();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <AppText variant="display" center>
            🌸
          </AppText>
          <AppText variant="h1" color={theme.color.ink.strong} center>
            {strings.onboarding.title}
          </AppText>
          <AppText variant="body" color={theme.color.ink.muted} center style={styles.subtitle}>
            {strings.onboarding.subtitle}
          </AppText>
        </Animated.View>

        <View style={styles.cards}>
          {AGE_RANGES.map((range, index) => (
            <Animated.View key={range.id} entering={FadeInDown.delay(120 + index * 80).duration(450)}>
              <Card onPress={() => choose(range.id)} accent={theme.getCategoryAccent('animals')}>
                <View style={styles.cardRow}>
                  <AppText variant="h1">{range.emoji}</AppText>
                  <View style={styles.cardText}>
                    <AppText variant="h3" color={theme.color.ink.strong}>
                      {range.label} · {range.name}
                    </AppText>
                    <AppText variant="caption" color={theme.color.ink.muted}>
                      {range.blurb}
                    </AppText>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <Button label={strings.onboarding.skip} variant="ghost" onPress={skip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg.base },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: theme.space.xl, gap: theme.space.xl },
  subtitle: { marginTop: theme.space.xs },
  cards: { gap: theme.space.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.base },
  cardText: { flex: 1, gap: 2 },
});
