import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';

type Props = {
  current: number; // 1-based
  total: number;
  accent?: string;
};

/** Tutorial progress: "Step X of N" + a dot track. (docs/02 §4, docs/06 §10) */
export function StepProgress({ current, total, accent = theme.color.brand.violet }: Props) {
  return (
    <View style={styles.container} accessibilityLabel={`Step ${current} of ${total}`}>
      <AppText variant="caption" color={theme.color.ink.muted}>
        Step {current} of {total}
      </AppText>
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < current ? accent : theme.color.line.hairline },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.space.sm },
  track: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
