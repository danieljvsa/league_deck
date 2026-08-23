import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Text, ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseProvider } from '@/components/DatabaseProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function TabBarIcon({ name, color, size }: { name: string; color: ColorValue; size: number }) {
  const icons: Record<string, string> = {
    trophy: '🏆',
    'plus-circle': '➕',
    settings: '⚙️',
  };
  
  return (
    <Text style={{ fontSize: size - 4 }}>
      {icons[name] || '📌'}
    </Text>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = useColors();
  
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <DatabaseProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontWeight: '600', color: colors.text },
              }}
            >
              <Tabs.Screen
                name="index"
                options={{
                  title: 'My Leagues',
                  headerTitle: 'OpenLeague',
                  tabBarIcon: ({ color, size }) => (
                    <TabBarIcon name="trophy" color={color} size={size} />
                  ),
                }}
              />
              <Tabs.Screen
                name="add-league"
                options={{
                  title: 'Add League',
                  tabBarIcon: ({ color, size }) => (
                    <TabBarIcon name="plus-circle" color={color} size={size} />
                  ),
                }}
              />
              <Tabs.Screen
                name="settings"
                options={{
                  title: 'Settings',
                  tabBarIcon: ({ color, size }) => (
                    <TabBarIcon name="settings" color={color} size={size} />
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
