import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AiArtView,
  AppText,
  BackHeader,
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  SectionHeader,
} from '@/components';
import { strings } from '@/lib/strings';
import { useRecentsStore } from '@/state';
import { theme } from '@/theme/theme';

/** AI Result (docs/02 §6) — image + line art + safety context, saved to recents. */
export default function AiResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useRecentsStore((s) => s.recents.find((r) => r.id === id));

  if (!item || item.type !== 'ai_generation') {
    return (
      <Screen>
        <BackHeader title={strings.ai.resultTitle} />
        <View style={styles.notFound}>
          <EmptyState
            emoji="🎨"
            message={strings.ai.notFound}
            actionLabel={strings.ai.tryAgain}
            onAction={() => router.replace('/create/ai')}
          />
        </View>
      </Screen>
    );
  }

  const seed = item.safePrompt || item.prompt || item.title;

  return (
    <Screen scroll>
      <BackHeader
        title={strings.ai.resultTitle}
        right={item.demo ? <Chip label={strings.demoMode} emoji="✨" accent={theme.color.brand.violetDeep} /> : null}
      />

      <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
        <AiArtView url={item.imageUrl} demo={item.demo} kind="image" seed={seed} height={280} />
        <AppText variant="caption" color={theme.color.state.success}>
          ✓ {strings.ai.saved}
        </AppText>
      </Animated.View>

      <View style={styles.section}>
        <SectionHeader title={strings.ai.lineArtTitle} />
        <AiArtView url={item.lineArtUrl} demo={item.demo} kind="lineart" seed={seed} height={180} />
      </View>

      {item.rewritten ? <Banner message={strings.safety.rewritten} /> : null}

      <Card>
        <View style={styles.prompts}>
          <View>
            <AppText variant="caption" color={theme.color.ink.muted}>
              {strings.ai.yourIdea}
            </AppText>
            <AppText variant="bodyStrong" color={theme.color.ink.strong}>
              {item.prompt}
            </AppText>
          </View>
          {item.rewritten && item.safePrompt ? (
            <View>
              <AppText variant="caption" color={theme.color.ink.muted}>
                {strings.ai.kidFriendlyIdea}
              </AppText>
              <AppText variant="bodyStrong" color={theme.color.brand.violetDeep}>
                {item.safePrompt}
              </AppText>
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <View style={styles.projectorRow}>
          <AppText variant="h3">📽️</AppText>
          <AppText variant="bodyStrong" color={theme.color.ink.muted} style={styles.flex}>
            {strings.ai.projectorCta}
          </AppText>
          <Chip label={strings.create.comingSoon} accent={theme.color.brand.sky} />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button label={strings.ai.tryAgain} icon="refresh" onPress={() => router.replace('/create/ai')} />
        <Button
          label="Back to Create"
          variant="secondary"
          icon="grid-outline"
          onPress={() => router.replace('/create')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, justifyContent: 'center' },
  section: { gap: theme.space.md },
  flex: { flex: 1 },
  prompts: { gap: theme.space.md },
  projectorRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  actions: { gap: theme.space.md },
});
