import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout = the app's provider shell.
 *
 * Milestone 1 keeps this intentionally minimal: gesture + safe-area providers,
 * a status bar, and a headerless Stack. Theme, fonts, splash gating, and the
 * (tabs) navigator are added in Milestone 2 (see docs/03 §4 and docs/07 M2).
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
