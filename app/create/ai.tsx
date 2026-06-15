import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText, BackHeader, Banner, Button, Card, Chip, DemoModeBadge, Loader, Screen } from '@/components';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { strings } from '@/lib/strings';
import { isValidPrompt, PROMPT_MAX } from '@/services/ai';
import type { AgeRange } from '@/services/edge';
import { useAppStore } from '@/state';
import { coerceAgeRange } from '@/state/_helpers';
import { theme } from '@/theme/theme';

/** AI Prompt screen (docs/02 §6) — idea → safety → image. Upload/projector are M8/M9. */
export default function AiPromptScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const selectedAgeRange = useAppStore((s) => s.selectedAgeRange);
  const ageRange = coerceAgeRange(selectedAgeRange) as AgeRange;
  const ai = useAiGeneration();

  const loading = ai.status === 'moderating' || ai.status === 'generating';
  const canGenerate = isValidPrompt(prompt) && !loading;

  const onGenerate = async () => {
    const outcome = await ai.run(prompt, ageRange);
    if (outcome.status === 'done') {
      router.push({ pathname: '/create/ai-result', params: { id: outcome.recent.id } });
    }
  };

  const loadingLabel =
    ai.status === 'moderating'
      ? strings.ai.moderating
      : ai.longRunning
        ? strings.ai.longRunning
        : strings.ai.generating;

  return (
    <Screen scroll>
      <BackHeader title={strings.ai.title} right={<DemoModeBadge />} />

      {loading ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.loadingWrap}>
          {ai.rewritten ? <Banner message={strings.safety.rewritten} /> : null}
          <Loader label={loadingLabel} />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.form}>
          <AppText variant="body" color={theme.color.ink.muted}>
            {strings.ai.subtitle}
          </AppText>

          {ai.status === 'blocked' && ai.blockedMessage ? (
            <View style={styles.blocked}>
              <AppText variant="h3" center>
                🌈
              </AppText>
              <AppText variant="bodyStrong" color={theme.color.ink.strong} center>
                {ai.blockedMessage}
              </AppText>
            </View>
          ) : null}

          {ai.status === 'error' && ai.errorMessage ? (
            <Banner tone="info" emoji="🎨" message={ai.errorMessage} />
          ) : null}

          <View>
            <AppText variant="caption" color={theme.color.ink.muted} style={styles.label}>
              {strings.ai.inputLabel}
            </AppText>
            <Card>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder={strings.ai.inputPlaceholder}
                placeholderTextColor={theme.color.ink.muted}
                style={styles.input}
                multiline
                maxLength={PROMPT_MAX}
                accessibilityLabel={strings.ai.inputLabel}
                returnKeyType="done"
              />
            </Card>
            <AppText variant="caption" color={theme.color.ink.muted} style={styles.counter}>
              {prompt.trim().length}/{PROMPT_MAX}
            </AppText>
          </View>

          <View style={styles.examples}>
            <AppText variant="caption" color={theme.color.ink.muted}>
              {strings.ai.examplesLabel}
            </AppText>
            <View style={styles.chips}>
              {strings.ai.examples.map((ex) => (
                <Chip key={ex} label={ex} onPress={() => setPrompt(ex)} />
              ))}
            </View>
          </View>

          <View style={styles.ageRow}>
            <AppText variant="caption" color={theme.color.ink.muted}>
              {strings.ai.ageLabel} {ageRange}
            </AppText>
          </View>

          <Button
            label={strings.ai.generate}
            icon="sparkles"
            onPress={onGenerate}
            disabled={!canGenerate}
          />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { gap: theme.space.lg, paddingTop: theme.space.xxl },
  form: { gap: theme.space.lg },
  blocked: {
    gap: theme.space.sm,
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
  label: { marginBottom: theme.space.xs },
  input: {
    minHeight: 96,
    ...theme.typography.body,
    color: theme.color.ink.strong,
    textAlignVertical: 'top',
  },
  counter: { textAlign: 'right', marginTop: theme.space.xs },
  examples: { gap: theme.space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  ageRow: { alignItems: 'flex-start' },
});
