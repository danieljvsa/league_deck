import React from 'react';
import { Tabs } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { useColors } from '@/constants/theme';

export default function LeagueLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();

  const hasCapability = (capId: string) => {
    return league?.capabilities.some(c => c.id === capId && c.enabled && c.available) || false;
  };

  const hasNews = league?.package.news && league.package.news.length > 0;

  return (
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
          title: 'Overview',
          headerTitle: league?.package.league.name || 'League',
        }}
      />
      {hasCapability('events') && (
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
          }}
        />
      )}
      {hasCapability('standings') && (
        <Tabs.Screen
          name="standings"
          options={{
            title: 'Standings',
          }}
        />
      )}
      {hasCapability('participants') && (
        <Tabs.Screen
          name="participants"
          options={{
            title: 'Teams',
          }}
        />
      )}
      {(hasCapability('streams') || hasCapability('podcasts')) && (
        <Tabs.Screen
          name="media"
          options={{
            title: 'Media',
          }}
        />
      )}
      {hasNews && (
        <Tabs.Screen
          name="news"
          options={{
            title: 'News',
          }}
        />
      )}
    </Tabs>
  );
}
