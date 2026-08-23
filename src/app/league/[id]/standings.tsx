import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, FlatList, ScrollView, TouchableOpacity, 
  StyleSheet, RefreshControl 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { providerService } from '@/providers/service';
import { Loading, Error, Empty } from '@/components/ui';
import { StandingTable } from '@/components/StandingTable';
import { Standing, Participant } from '@/domain';
import { useColors } from '@/constants/theme';

export default function StandingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  
  const [standings, setStandings] = useState<Standing[]>([]);
  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return <Loading message="Loading standings..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />;
  }

  if (standings.length === 0) {
    return <Empty message="No standings available" />;
  }

  const currentStanding = standings[activeTableIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        {standings.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.tableSelector, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
          contentContainerStyle={styles.tableSelectorContent}
        >
          {standings.map((standing, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tableButton,
                { backgroundColor: colors.muted },
                activeTableIndex === index && [styles.tableButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setActiveTableIndex(index)}
            >
              <Text style={[
                styles.tableButtonText,
                { color: colors.textSecondary },
                activeTableIndex === index && [styles.tableButtonTextActive, { color: '#FFF' }]
              ]}>
                {standing.type === 'table' ? `Table ${index + 1}` : `Ranking ${index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={[currentStanding]}
        keyExtractor={(_, index) => String(index)}
        renderItem={() => (
          <StandingTable
            standings={[currentStanding]}
            participants={participants}
            showGoalDifference={currentStanding.entries.some(e => e.goalDifference !== undefined)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableSelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
  },
  tableSelectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tableButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tableButtonActive: {},
  tableButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableButtonTextActive: {},
  list: {
    padding: 12,
    paddingBottom: 20,
  },
});
