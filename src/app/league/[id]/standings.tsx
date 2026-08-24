import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, RefreshControl 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { providerService } from '@/providers/service';
import { Loading, Error, Empty } from '@/components/ui';
import { StandingTable } from '@/components/StandingTable';
import { FilterTabs, FilterTab } from '@/components/FilterTabs';
import { Standing } from '@/domain';
import { useColors } from '@/constants/theme';

export default function StandingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [standings, setStandings] = useState<Standing[]>([]);
  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);

  const loadData = useCallback(async () => {
    if (!league) return;

    setIsLoading(true);
    setError(null);

    try {
      const standingsConfig = league.package.providers?.standings;
      
      if (!standingsConfig) {
        setStandings([]);
        setIsLoading(false);
        return;
      }

      const [fetchedStandings, fetchedParticipants] = await Promise.all([
        providerService.fetchStandings(league.id, standingsConfig),
        providerService.fetchParticipants(league.id, 
          league.package.providers?.participants || standingsConfig
        ),
      ]);
      
      setStandings(fetchedStandings);
      
      const participantMap = new Map<string, string>();
      fetchedParticipants.forEach(p => participantMap.set(p.id, p.name));
      setParticipants(participantMap);
    } catch (err: any) {
      setError(err?.message || 'Failed to load standings');
    } finally {
      setIsLoading(false);
    }
  }, [league, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTabPress = useCallback((tabId: string) => {
    setActiveTableIndex(parseInt(tabId, 10));
  }, []);

  const tableFilters = useMemo(() => 
    standings.map((standing, index) => ({
      id: String(index),
      label: standing.type === 'table' ? `Table ${index + 1}` : `Ranking ${index + 1}`,
    })),
    [standings]
  );

  const currentStanding = standings[activeTableIndex];

  const showGoalDifference = useMemo(() => 
    currentStanding?.entries.some(e => e.goalDifference !== undefined) ?? false,
    [currentStanding]
  );

  if (isLoading && !refreshing) {
    return <Loading message="Loading standings..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />;
  }

  if (standings.length === 0) {
    return <Empty message="No standings available" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Table Selector */}
      {standings.length > 1 && (
        <View style={[styles.tableSelector, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
          <FilterTabs
            tabs={tableFilters}
            activeTab={String(activeTableIndex)}
            onTabPress={handleTabPress}
          />
        </View>
      )}

      {/* Standing Table */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {currentStanding && (
          <StandingTable
            standings={[currentStanding]}
            participants={participants}
            showGoalDifference={showGoalDifference}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableSelector: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  list: {
    padding: 16,
  },
});
