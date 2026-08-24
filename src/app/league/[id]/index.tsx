import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  RefreshControl, Alert 
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { Loading, Error } from '@/components/ui';
import { providerService } from '@/providers/service';
import { useColors } from '@/constants/theme';
import { QuickActionGrid, QuickAction } from '@/components/QuickActionGrid';
import { LiveMatchCard } from '@/components/LiveMatchCard';
import { NextMatchCard } from '@/components/NextMatchCard';
import { Event } from '@/domain';

const CAPABILITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  overview: 'stats-chart-outline',
  events: 'calendar-outline',
  live: 'radio-outline',
  participants: 'people-outline',
  standings: 'trophy-outline',
  streams: 'play-circle-outline',
  podcasts: 'headset-outline',
  news: 'newspaper-outline',
};

const QUICK_ACTION_CAPS = ['events', 'standings', 'participants', 'streams', 'podcasts'];

export default function LeagueOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague, refreshLeague, isLoading } = useLeagueStore();
  const league = getLeague(id);
  const [refreshing, setRefreshing] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [liveMatches, setLiveMatches] = useState<Event[]>([]);
  const [nextMatch, setNextMatch] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const checkProviderStatusRef = useRef<(() => Promise<void>) | null>(null);

  const checkProviderStatus = useCallback(async () => {
    if (!league?.package.providers) return;

    const status: Record<string, boolean> = {};
    const checks = Object.entries(league.package.providers).map(async ([key, config]) => {
      status[key] = await providerService.checkProviderAvailability(config);
    });
    await Promise.allSettled(checks);
    setProviderStatus(status);
  }, [league]);

  useEffect(() => {
    checkProviderStatusRef.current = checkProviderStatus;
  }, [checkProviderStatus]);

  useEffect(() => {
    let cancelled = false;
    checkProviderStatusRef.current?.().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [league]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshing(true);
    await refreshLeague(id);
    await checkProviderStatusRef.current?.();
    setRefreshing(false);
    setIsRefreshing(false);
  }, [id, isRefreshing, refreshLeague]);

  const handleRemove = useCallback(() => {
    if (!league) return;
    
    Alert.alert(
      'Remove League',
      `Are you sure you want to remove ${league.package.league.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const success = await useLeagueStore.getState().removeLeague(id);
            if (success) {
              router.back();
            }
          }
        },
      ]
    );
  }, [id, league]);

  const handleCapabilityPress = useCallback((capId: string) => {
    switch (capId) {
      case 'events':
        router.push(`/league/${id}/events`);
        break;
      case 'standings':
        router.push(`/league/${id}/standings`);
        break;
      case 'participants':
        router.push(`/league/${id}/participants`);
        break;
      case 'streams':
      case 'podcasts':
        router.push(`/league/${id}/media`);
        break;
      default:
        break;
    }
  }, [id]);

  const handleBackRetry = useCallback(() => {
    router.back();
  }, []);

  const enabledCapabilities = useMemo(() => {
    if (!league) return [];
    return league.capabilities.filter(c => c.enabled && c.available);
  }, [league]);

  const quickActions = useMemo<QuickAction[]>(() => {
    return enabledCapabilities
      .filter(cap => QUICK_ACTION_CAPS.includes(cap.id))
      .map(cap => ({
        id: cap.id,
        label: cap.id.charAt(0).toUpperCase() + cap.id.slice(1),
        icon: CAPABILITY_ICONS[cap.id] || 'pricetag-outline',
        onPress: () => handleCapabilityPress(cap.id),
      }));
  }, [enabledCapabilities, handleCapabilityPress]);

  const containerStyle = useMemo(() => 
    [styles.container, { backgroundColor: colors.background }],
    [colors.background]
  );

  const bottomSpacerStyle = useMemo(() => 
    ({ height: insets.bottom + 20 }),
    [insets.bottom]
  );

  if (isLoading && !refreshing) {
    return <Loading message="Loading league..." />;
  }

  if (!league) {
    return (
      <Error 
        message="League not found. It may have been removed." 
        onRetry={handleBackRetry} 
      />
    );
  }

  const { package: pkg } = league;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* League Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        {pkg.branding?.logo ? (
          <Image source={{ uri: pkg.branding.logo }} style={styles.logo} accessibilityLabel={`${pkg.league.name} logo`} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="trophy-outline" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>{pkg.league.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {pkg.league.sport.charAt(0).toUpperCase() + pkg.league.sport.slice(1)}
            {pkg.league.country ? ` · ${pkg.league.country}` : ''}
          </Text>
          {pkg.season && (
            <View style={[styles.seasonBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-outline" size={12} color={colors.primary} />
              <Text style={[styles.season, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>Season {pkg.season.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.liveIndicator, { backgroundColor: colors.live }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.text }]} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Live Now</Text>
          </View>
          {liveMatches.map((match) => (
            <LiveMatchCard
              key={match.id}
              event={match}
              homeName={`Team ${match.homeParticipantId || 'Home'}`}
              awayName={`Team ${match.awayParticipantId || 'Away'}`}
              onPress={() => router.push(`/league/${id}/event/${match.id}`)}
            />
          ))}
        </View>
      )}

      {/* Next Match Section */}
      {nextMatch && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Next Match</Text>
          <NextMatchCard
            event={nextMatch}
            homeName={`Team ${nextMatch.homeParticipantId || 'Home'}`}
            awayName={`Team ${nextMatch.awayParticipantId || 'Away'}`}
            onPress={() => router.push(`/league/${id}/event/${nextMatch.id}`)}
          />
        </View>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Quick Actions</Text>
          <QuickActionGrid actions={quickActions} />
        </View>
      )}

      {/* Data Providers Status */}
      {pkg.providers && Object.keys(pkg.providers).length > 0 && (
        <View style={[styles.section, styles.providersSection, { borderTopColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Data Providers</Text>
          {Object.entries(pkg.providers).map(([key, config]) => (
            <View key={key} style={[styles.providerRow, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={[styles.providerType, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{config.type}</Text>
              </View>
              <View style={[
                styles.providerStatus,
                providerStatus[key] ? { backgroundColor: colors.successLight } : { backgroundColor: colors.dangerLight }
              ]}>
                <View style={[
                  styles.providerDot,
                  { backgroundColor: providerStatus[key] ? colors.success : colors.danger }
                ]} />
                <Text style={[styles.providerStatusText, { color: providerStatus[key] ? colors.success : colors.danger }]} maxFontSizeMultiplier={1.3}>
                  {providerStatus[key] ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* About Section */}
      {pkg.league.description && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>About</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={4} maxFontSizeMultiplier={1.3}>
            {pkg.league.description}
          </Text>
        </View>
      )}

      {/* Package Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Package Info</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Schema Version</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{pkg.schemaVersion}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Installed</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
              {new Date(league.installedAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Last Updated</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
              {new Date(league.lastUpdated).toLocaleDateString()}
            </Text>
          </View>
          {league.manifestUrl && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Source</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {league.manifestUrl}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity 
        style={[styles.removeButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        onPress={handleRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${pkg.league.name}`}
        accessibilityHint="This action cannot be undone"
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
        <Text style={[styles.removeButtonText, { color: colors.danger }]} maxFontSizeMultiplier={1.3}>Remove League</Text>
      </TouchableOpacity>
      <View style={bottomSpacerStyle} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginRight: 16,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  season: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  providersSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  providerType: {
    fontSize: 13,
    marginTop: 2,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  providerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    maxWidth: '60%',
    textAlign: 'right',
  },
  removeButton: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
    minHeight: 52,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
