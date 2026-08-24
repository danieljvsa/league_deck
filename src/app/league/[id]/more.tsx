import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLeagueStore } from '@/store/leagues';
import { useColors } from '@/constants/theme';
import { SideMenuItem } from '@/components/SideMenuItem';

export default function MoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();

  if (!league) {
    return null;
  }

  const { package: pkg, capabilities } = league;
  const hasCapability = (capId: string) => {
    return capabilities.some(c => c.id === capId && c.enabled && c.available) || false;
  };

  const hasNews = pkg.news && pkg.news.length > 0;
  const hasMedia = hasCapability('streams') || hasCapability('podcasts');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>More</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {pkg.league.name}
        </Text>
      </View>

      {/* Menu Items */}
      <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {hasCapability('participants') && (
          <SideMenuItem
            label="Teams"
            icon="people-outline"
            onPress={() => router.push(`/league/${id}/participants`)}
          />
        )}

        {hasMedia && (
          <SideMenuItem
            label="Media"
            icon="play-circle-outline"
            onPress={() => router.push(`/league/${id}/media`)}
          />
        )}

        {hasNews && (
          <SideMenuItem
            label="News"
            icon="newspaper-outline"
            onPress={() => router.push(`/league/${id}/news`)}
            badge={pkg.news?.length}
          />
        )}
      </View>

      {/* About Section */}
      <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SideMenuItem
          label="About"
          icon="information-circle-outline"
          onPress={() => router.push(`/league/${id}`)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
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
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});
