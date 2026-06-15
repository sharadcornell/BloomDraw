import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  emoji?: string;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Warm, friendly empty state (docs/01 §8, docs/06 §10). */
export function EmptyState({ emoji = '🌱', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="display" center>
        {emoji}
      </AppText>
      {title ? (
        <AppText variant="h3" color={theme.color.ink.strong} center>
          {title}
        </AppText>
      ) : null}
      <AppText variant="body" color={theme.color.ink.muted} center>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.xxl,
    paddingHorizontal: theme.space.xl,
  },
  action: { marginTop: theme.space.md },
});
