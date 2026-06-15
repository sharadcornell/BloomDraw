import { StyleSheet, View } from 'react-native';

import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  message?: string;
  onRetry?: () => void;
};

/**
 * Child-safe error state. Never shows codes/stack/provider detail — only kind
 * copy + a Retry (docs/01 §9, CLAUDE.md AI safety rules).
 */
export function ErrorState({ message = strings.errors.generic, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="display" center>
        🎨
      </AppText>
      <AppText variant="body" color={theme.color.ink.body} center>
        {message}
      </AppText>
      {onRetry ? (
        <View style={styles.action}>
          <Button label={strings.errors.retry} onPress={onRetry} fullWidth={false} />
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
