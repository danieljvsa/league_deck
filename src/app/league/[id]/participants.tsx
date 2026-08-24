import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, 
  StyleSheet, RefreshControl 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { providerService } from '@/providers/service';
import { Loading, Error, Empty } from '@/components/ui';
import { ParticipantCard } from '@/components/ParticipantCard';
import { Participant } from '@/domain';
import { useColors } from '@/constants/theme';

type SortType = 'name' | 'country' | 'sport';

const PARTICIPANT_CARD_HEIGHT = 72;

export default function ParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const loadDataRef = useRef<(() => Promise<void>) | null>(null);

  const loadData = useCallback(async () => {
    if (!league) return;

    setIsLoading(true);
    setError(null);

    try {
      const participantsConfig = league.package.providers?.participants;
      
      if (!participantsConfig) {
        setParticipants([]);
        setIsLoading(false);
        return;
      }

      const fetchedParticipants = await providerService.fetchParticipants(
        league.id, 
        participantsConfig
      );
      
      setParticipants(fetchedParticipants);
    } catch (err: any) {
      setError(err?.message || 'Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  }, [league]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    loadDataRef.current?.().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDataRef.current?.();
    setRefreshing(false);
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...participants];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.shortName?.toLowerCase().includes(query) ||
        p.country?.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'country':
          return (a.country || 'ZZZ').localeCompare(b.country || 'ZZZ');
        case 'sport':
          return (a.sport || 'ZZZ').localeCompare(b.sport || 'ZZZ');
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return result;
  }, [participants, searchQuery, sortBy]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(participants.map(p => p.country).filter(Boolean));
    return Array.from(countries).sort();
  }, [participants]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleSortName = useCallback(() => setSortBy('name'), []);
  const handleSortCountry = useCallback(() => setSortBy('country'), []);
  const handleSortSport = useCallback(() => setSortBy('sport'), []);

  const keyExtractor = useCallback((item: Participant) => item.id, []);

  const renderItem = useCallback(({ item }: { item: Participant }) => (
    <ParticipantCard participant={item} />
  ), []);

  const getItemLayout = useCallback((_data: ArrayLike<Participant> | null | undefined, index: number) => ({
    length: PARTICIPANT_CARD_HEIGHT,
    offset: PARTICIPANT_CARD_HEIGHT * index,
    index,
  }), []);

  const listHeader = useMemo(() => (
    <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
      {filteredAndSorted.length} team{filteredAndSorted.length !== 1 ? 's' : ''}
    </Text>
  ), [filteredAndSorted.length, colors.textSecondary]);

  const listEmpty = useMemo(() => (
    <View style={styles.emptySearchContainer}>
      <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
        No teams matching "{searchQuery}"
      </Text>
    </View>
  ), [searchQuery, colors.textSecondary]);

  if (isLoading && !refreshing) {
    return <Loading message="Loading participants..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadData} />;
  }

  if (participants.length === 0) {
    return <Empty message="No participants available" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search teams..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={100}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearSearch}
          >
            <Text style={[styles.clearText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: sortBy === 'name' ? colors.primary : colors.surface }]}
          onPress={handleSortName}
        >
          <Text style={[styles.sortText, { color: sortBy === 'name' ? '#FFF' : colors.textSecondary }]}>
            Name
          </Text>
        </TouchableOpacity>
        {uniqueCountries.length > 0 && (
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: sortBy === 'country' ? colors.primary : colors.surface }]}
            onPress={handleSortCountry}
          >
            <Text style={[styles.sortText, { color: sortBy === 'country' ? '#FFF' : colors.textSecondary }]}>
              Country
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: sortBy === 'sport' ? colors.primary : colors.surface }]}
          onPress={handleSortSport}
        >
          <Text style={[styles.sortText, { color: sortBy === 'sport' ? '#FFF' : colors.textSecondary }]}>
            Sport
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAndSorted}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={5}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sortButtonActive: {},
  sortText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortTextActive: {},
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 8,
  },
  emptySearchContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 15,
  },
});
