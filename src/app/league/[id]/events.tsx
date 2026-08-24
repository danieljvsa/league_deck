import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  RefreshControl 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { providerService } from '@/providers/service';
import { Loading, Error, Empty } from '@/components/ui';
import { EventCard } from '@/components/EventCard';
import { FilterTabs, FilterTab } from '@/components/FilterTabs';
import { Event, EventStatus } from '@/domain';
import { useColors } from '@/constants/theme';
import { useResponsiveColumns } from '@/hooks/use-breakpoint';

type FilterType = 'all' | 'live' | 'today' | 'upcoming' | 'results';

const FILTERS: FilterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
];

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isFuture(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

export default function EventsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const numColumns = useResponsiveColumns(1, 2, 2);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    let cancelled = false;
    loadData().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [id]);

  const loadData = async () => {
    if (!league) return;

    setIsLoading(true);
    setError(null);

    try {
      const eventsConfig = league.package.providers?.events;
      
      if (!eventsConfig) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const [fetchedEvents, fetchedParticipants] = await Promise.all([
        providerService.fetchEvents(league.id, eventsConfig),
        providerService.fetchParticipants(league.id, 
          league.package.providers?.participants || eventsConfig
        ),
      ]);
      
      setEvents(fetchedEvents);
      
      const participantMap = new Map<string, string>();
      fetchedParticipants.forEach(p => participantMap.set(p.id, p.name));
      setParticipants(participantMap);
    } catch (err: any) {
      setError(err?.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTabPress = useCallback((tabId: string) => {
    setActiveFilter(tabId as FilterType);
  }, []);

  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard
      event={item}
      homeName={participants.get(item.homeParticipantId || '') || 'Home'}
      awayName={participants.get(item.awayParticipantId || '') || 'Away'}
      compact={activeFilter === 'today'}
    />
  ), [participants, activeFilter]);

  const keyExtractor = useCallback((item: Event) => item.id, []);

  const filteredEvents = useMemo(() => {
    switch (activeFilter) {
      case 'live':
        return events.filter(e => 
          e.status === 'live' || e.status === 'in_play' || e.status === 'halftime'
        );
      case 'today':
        return events.filter(e => isToday(e.date));
      case 'upcoming':
        return events.filter(e => 
          isFuture(e.date) && (e.status === 'scheduled' || e.status === 'postponed')
        );
      case 'results':
        return events.filter(e => 
          e.status === 'finished' || (isPast(e.date) && e.status !== 'postponed')
        );
      default:
        return events;
    }
  }, [events, activeFilter]);

  const filterCounts = useMemo(() => {
    const counts = { all: 0, live: 0, today: 0, upcoming: 0, results: 0 };
    for (const e of events) {
      counts.all++;
      if (e.status === 'live' || e.status === 'in_play' || e.status === 'halftime') counts.live++;
      if (isToday(e.date)) counts.today++;
      if (isFuture(e.date) && (e.status === 'scheduled' || e.status === 'postponed')) counts.upcoming++;
      if (e.status === 'finished' || (isPast(e.date) && e.status !== 'postponed')) counts.results++;
    }
    return counts;
  }, [events]);

  const availableFilters = useMemo(() => 
    FILTERS.filter(filter => 
      filter.id === 'all' || filterCounts[filter.id as FilterType] > 0
    ),
    [filterCounts]
  );

  if (isLoading && !refreshing) {
    return <Loading message="Loading events..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />;
  }

  if (events.length === 0) {
    return <Empty message="No events available" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <FilterTabs
          tabs={availableFilters}
          activeTab={activeFilter}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={`events-${numColumns}`}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyFilterContainer}>
            <Text style={[styles.emptyFilterText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              No {activeFilter} events
            </Text>
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyFilterContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 15,
  },
});
