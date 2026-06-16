import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Card, Chip, DemoModeBadge, Screen } from '@/components';
import { CREATE_OPTIONS } from '@/lib/placeholders';
import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

/**
 * Create hub. The AI prompt flow (M7) and the upload/camera flow (M8) are live;
 * each card opens its creation flow.
 */
export default function CreateScreen() {
  const router = useRouter();

  const open = (id: 'ai' | 'upload' | 'camera') => {
    if (id === 'ai') router.push('/create/ai');
    else if (id === 'upload') router.push('/create/upload');
    else router.push({ pathname: '/create/upload', params: { mode: 'camera' } });
  };

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
            <Pressable
              onPress={() => open(opt.id)}
              accessibilityRole="button"
              accessibilityLabel={opt.title}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
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
                  <Chip label="Start" emoji="✨" accent={theme.color.brand.violet} />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
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
