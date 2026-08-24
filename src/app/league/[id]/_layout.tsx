import React, { useMemo } from 'react';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import { useLeagueStore } from '@/store/leagues';

const CAPABILITY_TO_TAB: Record<string, string> = {
  events: 'events',
  standings: 'standings',
  participants: 'participants',
  news: 'news',
  media: 'media',
};

const DEFAULT_TABS = ['index', 'events', 'standings', 'more'];

export default function LeagueLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();

  const visibleTabs = useMemo(() => {
    if (!league) return DEFAULT_TABS;

    const navConfig = league.package.navigation;
    const enabledCaps = league.capabilities
      .filter(c => c.enabled && c.available)
      .map(c => c.id);

    const tabs = ['index'];

    const navOrder = navConfig?.order || ['overview', 'events', 'standings', 'participants'];
    for (const capId of navOrder) {
      if (capId === 'overview') continue;
      if (enabledCaps.includes(capId) && CAPABILITY_TO_TAB[capId]) {
        tabs.push(CAPABILITY_TO_TAB[capId]);
      }
    }

    if (!tabs.includes('more')) {
      tabs.push('more');
    }

    return tabs;
  }, [league]);

  const getTabLabel = (tabName: string, defaultLabel: string): string => {
    const labels = league?.package.navigation?.labels;
    if (labels) {
      const capId = Object.entries(CAPABILITY_TO_TAB).find(([, tab]) => tab === tabName)?.[0];
      if (capId && labels[capId]) return labels[capId];
    }
    return defaultLabel;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.cardBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'League',
          href: visibleTabs.includes('index') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: getTabLabel('events', 'Matches'),
          href: visibleTabs.includes('events') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: getTabLabel('standings', 'Standings'),
          href: visibleTabs.includes('standings') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          href: visibleTabs.includes('more') ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
