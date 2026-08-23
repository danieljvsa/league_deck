import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, 
  RefreshControl, Alert 
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { Loading, Error, Empty } from '@/components/ui';
import { Capability } from '@/domain';
import { InstalledLeague } from '@/core/storage/packages';
import { useColors } from '@/constants/theme';
import { useBreakpoint, useResponsiveColumns } from '@/hooks/use-breakpoint';

interface LeagueCardProps {
  league: InstalledLeague;
  onPress: () => void;
  onLongPress: () => void;
  colors: ReturnType<typeof useColors>;
}

const LeagueCard = React.memo(function LeagueCard({ league, onPress, onLongPress, colors }: LeagueCardProps) {
  const { package: pkg, capabilities, lastUpdated } = league;
  const liveCount = capabilities.filter(c => c.id === 'live' && c.enabled && c.available).length;
  const enabledCount = capabilities.filter(c => c.enabled && c.available).length;
  
  const formatLastUpdated = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {pkg.branding?.logo ? (
        <Image source={{ uri: pkg.branding.logo }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: pkg.branding?.primaryColor || colors.muted }]}>
          <Text style={[styles.logoText, { color: pkg.branding?.primaryColor ? '#FFF' : colors.textSecondary }]}>
            {pkg.league.name.charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{pkg.league.name}</Text>
          {liveCount > 0 && (
            <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
              <View style={[styles.liveDot, { backgroundColor: '#FFF' }]} />
              <Text style={[styles.liveText, { color: '#FFF' }]}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {pkg.league.sport.charAt(0).toUpperCase() + pkg.league.sport.slice(1)}
          {pkg.league.country ? ` · ${pkg.league.country}` : ''}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.featureCount, { color: colors.primary }]}>{enabledCount} features</Text>
          <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Updated {formatLastUpdated(lastUpdated)}</Text>
        </View>
      </View>
      <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
    </TouchableOpacity>
  );
});

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

  const handleLongPress = (league: InstalledLeague) => {
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
  };

  const confirmRemove = (league: InstalledLeague) => {
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
  };

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
          onAction={() => router.push('/add-league')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        key={`leagues-${numColumns}`}
        renderItem={({ item }) => (
          <LeagueCard
            league={item}
            onPress={() => router.push(`/league/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
            colors={colors}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Leagues</Text>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
      <Link href="/add-league" asChild>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary, bottom: insets.bottom + 20 }]}>
          <Text style={[styles.fabText, { color: '#FFF' }]}>+</Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
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
  fabText: {
    fontSize: 28,
    lineHeight: 30,
  },
});
