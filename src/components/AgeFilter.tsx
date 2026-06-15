import { StyleSheet, View } from 'react-native';

import { AGE_RANGES } from '@/lib/placeholders';
import { theme } from '@/theme/theme';
import type { AgeRangeId } from '@/types';

import { Chip } from './Chip';

type Props = {
  value: AgeRangeId | null;
  onChange: (range: AgeRangeId) => void;
};

/**
 * Age band selector (3–5 / 6–8 / 9–12). Drives recommendations + difficulty
 * defaults (docs/02 §2). Used on Home and in Settings.
 */
export function AgeFilter({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {AGE_RANGES.map((range) => (
        <Chip
          key={range.id}
          label={range.label}
          emoji={range.emoji}
          selected={value === range.id}
          onPress={() => onChange(range.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' },
});
