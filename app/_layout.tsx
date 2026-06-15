import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BloomSplash } from '@/components';
import { useAppStore, useFavoritesStore, useRecentsStore } from '@/state';
import { fontAssets } from '@/theme/fonts';
import { theme } from '@/theme/theme';

/**
 * Root layout = the app's provider shell + boot gate (docs/03 §4).
 *
 * Boot sequence:
 *  1. Native splash stays up (preventAutoHide) until fonts load AND the local
 *     store hydrates from AsyncStorage (so returning users skip onboarding).
 *  2. Native splash hides; an animated in-app BloomSplash plays, then reveals
 *     the navigator. A 2s fallback guarantees we never hang on slow/corrupt storage.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const appHydrated = useAppStore((state) => state._hasHydrated);
  const favoritesHydrated = useFavoritesStore((state) => state._hasHydrated);
  const recentsHydrated = useRecentsStore((state) => state._hasHydrated);
  const [forceReady, setForceReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const storesHydrated = appHydrated && favoritesHydrated && recentsHydrated;
  const ready = (fontsLoaded || !!fontError) && (storesHydrated || forceReady);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg.base },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
        {!splashDone ? <BloomSplash onFinish={() => setSplashDone(true)} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
