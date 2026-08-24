import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { preventAutoHideAsync } from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseProvider } from '@/components/DatabaseProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/constants/theme';

preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = useColors();

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontWeight: '600' as const, color: colors.text },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.cardBorder,
    },
  }), [colors]);
  
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DatabaseProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Tabs screenOptions={screenOptions}>
              <Tabs.Screen
                name="index"
                options={{
                  title: 'My Leagues',
                  headerTitle: 'OpenLeague',
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="trophy-outline" size={size} color={color} />
                  ),
                }}
              />
              <Tabs.Screen
                name="add-league"
                options={{
                  title: 'Add League',
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="add-circle-outline" size={size} color={color} />
                  ),
                }}
              />
              <Tabs.Screen
                name="settings"
                options={{
                  title: 'Settings',
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="settings-outline" size={size} color={color} />
                  ),
                }}
              />
            </Tabs>
          </ThemeProvider>
        </DatabaseProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
