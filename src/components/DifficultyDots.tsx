import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';
import type { Difficulty } from '@/types';

import { AppText } from './AppText';

const LEVEL: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };
const LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

type Props = {
  difficulty: Difficulty;
  showLabel?: boolean;
  accent?: string;
};

/** Three dots filled to the difficulty level (+ optional label). (docs/06 §6) */
export function DifficultyDots({ difficulty, showLabel = false, accent = theme.color.brand.violet }: Props) {
  const level = LEVEL[difficulty];
  return (
    <View style={styles.row} accessibilityLabel={`Difficulty: ${LABEL[difficulty]}`}>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i < level ? accent : theme.color.line.hairline }]}
          />
        ))}
      </View>
      {showLabel ? (
        <AppText variant="caption" color={theme.color.ink.muted}>
          {LABEL[difficulty]}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
