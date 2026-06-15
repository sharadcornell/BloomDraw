import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Card, Chip, DemoModeBadge, Screen } from '@/components';
import { CREATE_OPTIONS } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

/**
 * Create hub (Milestone 2 scaffold). The AI prompt, upload/camera, and variant
 * flows are built in Milestones 7–8 — these are non-functional placeholders.
 */
export default function CreateScreen() {
  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="h1" color={theme.color.ink.strong}>
            {strings.create.title}
          </AppText>
          <AppText variant="body" color={theme.color.ink.muted}>
            {strings.create.subtitle}
          </AppText>
        </View>
        <DemoModeBadge />
      </Animated.View>

      <View style={styles.options}>
        {CREATE_OPTIONS.map((opt, index) => (
          <Animated.View key={opt.id} entering={FadeInDown.delay(80 + index * 80).duration(400)}>
            <Card padded={false}>
              <LinearGradient
                colors={theme.gradient[opt.gradient] as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <AppText variant="display">{opt.emoji}</AppText>
              </LinearGradient>
              <View style={styles.optionBody}>
                <View style={styles.flex}>
                  <AppText variant="h3" color={theme.color.ink.strong}>
                    {opt.title}
                  </AppText>
                  <AppText variant="caption" color={theme.color.ink.muted}>
                    {opt.subtitle}
                  </AppText>
                </View>
                <Chip label={strings.create.comingSoon} />
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  options: { gap: theme.space.base },
  optionGradient: { height: 110, alignItems: 'center', justifyContent: 'center' },
  optionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.base,
    padding: theme.space.base,
  },
});
