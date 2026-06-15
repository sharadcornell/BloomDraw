import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  AppText,
  BackHeader,
  Button,
  Chip,
  DrawingThumbnail,
  EmptyState,
  Screen,
  StepProgress,
} from '@/components';
import { getItemBySlug } from '@/content';
import { getCategoryAccent, theme } from '@/theme/theme';

/** Step-by-Step Tutorial — works for 4 / 6 / 8 step items (docs/02 §4). */
export default function TutorialScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const item = slug ? getItemBySlug(slug) : undefined;
  const [stepIndex, setStepIndex] = useState(0);

  if (!item) {
    return (
      <Screen>
        <BackHeader title="Tutorial" />
        <View style={styles.center}>
          <EmptyState
            emoji="🔍"
            message="We couldn't find that tutorial."
            actionLabel="Back to Explore"
            onAction={() => router.replace('/explore')}
          />
        </View>
      </Screen>
    );
  }

  const accent = getCategoryAccent(item.categorySlug);
  const total = item.steps.length;
  const step = item.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  const goNext = () => {
    if (isLast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <Screen>
      <BackHeader title={item.title} />
      <StepProgress current={stepIndex + 1} total={total} accent={accent} />

      <Animated.View key={stepIndex} entering={FadeIn.duration(250)} style={styles.content}>
        <DrawingThumbnail
          emoji={item.emoji}
          accent={accent}
          height={200}
          emojiSize={96}
          label={`Step ${step.stepNumber}`}
        />
        <View style={styles.text}>
          <AppText variant="h2" color={theme.color.ink.strong}>
            {step.title}
          </AppText>
          <AppText variant="body" color={theme.color.ink.body}>
            {step.instruction}
          </AppText>
        </View>

        {isLast ? (
          <View style={styles.finishRow}>
            <AppText variant="h3" color={theme.color.brand.violet}>
              🎉 You did it!
            </AppText>
            <Chip label="Projector Preview · soon" accent={theme.color.brand.sky} />
          </View>
        ) : null}
      </Animated.View>

      {/* Footer controls (large touch targets) */}
      <View style={styles.footer}>
        <View style={styles.flex}>
          <Button label="Back" variant="secondary" icon="chevron-back" onPress={goBack} disabled={isFirst} />
        </View>
        <View style={styles.flex}>
          <Button label={isLast ? 'Finish' : 'Next'} icon={isLast ? 'checkmark' : 'chevron-forward'} onPress={goNext} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  content: { flex: 1, gap: theme.space.lg, paddingTop: theme.space.lg },
  text: { gap: theme.space.sm },
  finishRow: { alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.md },
  footer: { flexDirection: 'row', gap: theme.space.md, paddingVertical: theme.space.base },
  flex: { flex: 1 },
});
