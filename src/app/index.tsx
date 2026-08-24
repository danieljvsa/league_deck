import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  RefreshControl, Alert 
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLeagueStore } from '@/store/leagues';
import { Loading, Error, Empty } from '@/components/ui';
import { InstalledLeague } from '@/core/storage/packages';
import { useColors } from '@/constants/theme';
import { useBreakpoint, useResponsiveColumns } from '@/hooks/use-breakpoint';
import { LeagueCard } from '@/components/LeagueCard';

const LEAGUE_CARD_HEIGHT = 88;

export default function MyLeaguesScreen() {
  const { leagues, isLoading, error, loadLeagues, removeLeague } = useLeagueStore();
  const [refreshing, setRefreshing] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const numColumns = useResponsiveColumns(1, 2, 3);

  useEffect(() => {
    loadLeagues();
  }, [loadLeagues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeagues();
    setRefreshing(false);
  }, [loadLeagues]);

  const confirmRemove = useCallback((league: InstalledLeague) => {
    Alert.alert(
      'Remove League',
      `Are you sure you want to remove ${league.package.league.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeLeague(league.id)
        },
      ]
    );
  }, [removeLeague]);

  const handleLongPress = useCallback((league: InstalledLeague) => {
    Alert.alert(
      league.package.league.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => confirmRemove(league)
        },
      ]
    );
  }, [confirmRemove]);

  const handleNavigateToAdd = useCallback(() => {
    router.push('/add-league');
  }, []);

  const keyExtractor = useCallback((item: InstalledLeague) => item.id, []);

  const renderItem = useCallback(({ item }: { item: InstalledLeague }) => (
    <LeagueCard
      league={item}
      onPress={() => router.push(`/league/${item.id}`)}
      onLongPress={() => handleLongPress(item)}
    />
  ), [handleLongPress]);

  const getItemLayout = useCallback((_data: ArrayLike<InstalledLeague> | null | undefined, index: number) => ({
    length: LEAGUE_CARD_HEIGHT,
    offset: LEAGUE_CARD_HEIGHT * index,
    index,
  }), []);

  const contentContainerStyle = useMemo(() => 
    [styles.list, { paddingBottom: insets.bottom + 80 }], 
    [insets.bottom]
  );

  const listHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>My Leagues</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        {leagues.length} {leagues.length === 1 ? 'league' : 'leagues'} installed
      </Text>
    </View>
  ), [leagues.length, colors.text, colors.textSecondary]);

  const fabStyle = useMemo(() => 
    StyleSheet.flatten([styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary, bottom: insets.bottom + 20 }]),
    [colors.primary, insets.bottom]
  );

  if (isLoading && !refreshing) {
    return <Loading message="Loading leagues..." />;
  }

  if (error && leagues.length === 0) {
    return <Error message={error} onRetry={loadLeagues} />;
  }

  if (leagues.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Empty
          message="No leagues installed yet"
          actionLabel="Add Your First League"
          onAction={handleNavigateToAdd}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={leagues}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={`leagues-${numColumns}`}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={listHeader}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
      <Link href="/add-league" asChild>
        <TouchableOpacity style={fabStyle}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
