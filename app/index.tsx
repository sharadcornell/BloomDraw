import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Placeholder Home screen (Milestone 1).
 *
 * Confirms the app boots through Expo Router. The real Home — hero, age filter,
 * featured/categories, create + projector entry points — lands in Milestone 2/3.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌸✏️</Text>
        <Text style={styles.title}>BloomDraw</Text>
        <Text style={styles.subtitle}>Project setup complete — Milestone 1</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8FF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2B2350',
  },
  subtitle: {
    fontSize: 16,
    color: '#857FA6',
    textAlign: 'center',
  },
});
