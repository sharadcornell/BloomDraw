import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  /** Extra bottom padding so content clears the tab bar when scrolling. */
  contentBottomPadding?: number;
};

/**
 * Standard screen wrapper: bright base background + safe-area handling, with an
 * optional scroll container. Keeps screens consistent (docs/06 §4).
 */
export function Screen({ children, scroll = false, edges = ['top'], contentBottomPadding = theme.space.xxl }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.padded]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg.base },
  flex: { flex: 1 },
  padded: { flex: 1, paddingHorizontal: theme.space.lg },
  scrollContent: { paddingHorizontal: theme.space.lg, gap: theme.space.xl },
});
