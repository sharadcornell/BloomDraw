import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, EmptyState, Screen } from '@/components';
import { strings } from '@/lib/strings';
import { theme } from '@/theme/theme';

/** Recents (Milestone 2 scaffold). Real recents logic lands in Milestone 4. */
export default function RecentsScreen() {
  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <AppText variant="h1" color={theme.color.ink.strong}>
          {strings.recents.title}
        </AppText>
      </Animated.View>
      <View style={styles.body}>
        <EmptyState emoji="🌱" message={strings.empty.recents} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
});
