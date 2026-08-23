import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  RefreshControl, Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { Loading, Error } from '@/components/ui';
import { Capability } from '@/domain';
import { providerService } from '@/providers/service';
import { useColors } from '@/constants/theme';

export default function LeagueOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague, refreshLeague, isLoading } = useLeagueStore();
  const league = getLeague(id);
  const [refreshing, setRefreshing] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const colors = useColors();

  useEffect(() => {
    let cancelled = false;
    checkProviderStatus().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [league]);

  const checkProviderStatus = async () => {
    if (!league?.package.providers) return;

    const status: Record<string, boolean> = {};
    const checks = Object.entries(league.package.providers).map(async ([key, config]) => {
      status[key] = await providerService.checkProviderAvailability(config);
    });
    await Promise.allSettled(checks);
    setProviderStatus(status);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLeague(id);
    await checkProviderStatus();
    setRefreshing(false);
  }, []);

  if (isLoading && !refreshing) {
    return <Loading message="Loading league..." />;
  }

  if (!league) {
    return (
      <Error 
        message="League not found" 
        onRetry={() => router.back()} 
      />
    );
  }

  const { package: pkg, capabilities } = league;
  const enabledCapabilities = capabilities.filter(c => c.enabled && c.available);
  const missingCapabilities = capabilities.filter(c => c.enabled && !c.available);

  const getCapabilityIcon = (capId: string) => {
    switch (capId) {
      case 'overview': return '📊';
      case 'events': return '📅';
      case 'live': return '🔴';
      case 'participants': return '👥';
      case 'standings': return '🏆';
      case 'streams': return '📺';
      case 'podcasts': return '🎧';
      case 'news': return '📰';
      default: return '📌';
    }
  };

  const handleCapabilityPress = (capId: string) => {
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
  };

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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        {pkg.branding?.logo ? (
          <Image source={{ uri: pkg.branding.logo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: pkg.branding?.primaryColor || colors.muted }]}>
            <Text style={[styles.logoText, { color: pkg.branding?.primaryColor ? '#FFF' : colors.textSecondary }]}>
              {pkg.league.name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{pkg.league.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {pkg.league.sport.charAt(0).toUpperCase() + pkg.league.sport.slice(1)}
            {pkg.league.country ? ` · ${pkg.league.country}` : ''}
          </Text>
          {pkg.season && (
            <Text style={[styles.season, { color: colors.primary }]} numberOfLines={1}>Season {pkg.season.name}</Text>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
        {enabledCapabilities.length === 0 ? (
          <Text style={[styles.noFeatures, { color: colors.textSecondary }]}>No features available</Text>
        ) : (
          enabledCapabilities.map((cap) => (
            <TouchableOpacity 
              key={cap.id} 
              style={[styles.featureItem, { borderBottomColor: colors.borderLight }]}
              onPress={() => handleCapabilityPress(cap.id)}
            >
              <Text style={styles.featureIcon}>{getCapabilityIcon(cap.id)}</Text>
              <Text style={[styles.featureName, { color: colors.primary }]}>
                {cap.id.charAt(0).toUpperCase() + cap.id.slice(1)}
              </Text>
              <Text style={[styles.featureArrow, { color: colors.disabled }]}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {missingCapabilities.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Unavailable Features</Text>
          {missingCapabilities.map((cap) => (
            <View key={cap.id} style={[styles.featureItem, styles.featureDisabled, { borderBottomColor: colors.borderLight }]}>
              <Text style={styles.featureIcon}>{getCapabilityIcon(cap.id)}</Text>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureName, { color: colors.textMuted }]}>
                  {cap.id.charAt(0).toUpperCase() + cap.id.slice(1)}
                </Text>
                {cap.missingRequirements.length > 0 && (
                  <Text style={[styles.requirementText, { color: colors.warning }]}>
                    Requires: {cap.missingRequirements.map(r => r.provider).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {pkg.providers && Object.keys(pkg.providers).length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Providers</Text>
          {Object.entries(pkg.providers).map(([key, config]) => (
            <View key={key} style={[styles.providerRow, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.text }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={[styles.providerType, { color: colors.textSecondary }]}>{config.type}</Text>
              </View>
              <View style={[
                styles.providerStatus,
                providerStatus[key] ? [styles.providerOnline, { backgroundColor: colors.successLight }] : [styles.providerOffline, { backgroundColor: colors.dangerLight }]
              ]}>
                <Text style={[styles.providerStatusText, { color: providerStatus[key] ? colors.success : colors.danger }]}>
                  {providerStatus[key] ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {pkg.league.description && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={4}>{pkg.league.description}</Text>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Package Info</Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Schema Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{pkg.schemaVersion}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Installed</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(league.installedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Updated</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(league.lastUpdated).toLocaleDateString()}
          </Text>
        </View>
        {league.manifestUrl && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Source</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1}>
              {league.manifestUrl}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.removeButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        onPress={() => {
          Alert.alert(
            'Remove League',
            `Are you sure you want to remove ${pkg.league.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                style: 'destructive',
                onPress: async () => {
                  await useLeagueStore.getState().removeLeague(id);
                  router.back();
                }
              },
            ]
          );
        }}
      >
        <Text style={[styles.removeButtonText, { color: colors.danger }]}>Remove League</Text>
      </TouchableOpacity>
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
    borderRadius: 40,
    marginRight: 16,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
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
    marginBottom: 4,
  },
  season: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  noFeatures: {
    fontSize: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  featureDisabled: {
    opacity: 0.6,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
  },
  requirementText: {
    fontSize: 12,
    marginTop: 2,
  },
  featureArrow: {
    fontSize: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerOnline: {},
  providerOffline: {},
  providerStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
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
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
