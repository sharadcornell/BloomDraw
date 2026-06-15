import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAppStore } from '@/state/useAppStore';
import { fontFamily } from '@/theme/fonts';
import { theme } from '@/theme/theme';

/**
 * Bottom tab navigator: Home · Explore · Create · Recents · Settings (docs/03 §4).
 * Gated on onboarding — a first-run user is redirected to the age picker.
 */
export default function TabsLayout() {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brand.violet,
        tabBarInactiveTintColor: theme.color.ink.muted,
        tabBarStyle: {
          backgroundColor: theme.color.surface.card,
          borderTopColor: theme.color.line.hairline,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.bodySemi, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recents"
        options={{
          title: 'Recents',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
