import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { InstalledLeague } from '@/core/storage/packages';
import { useColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface LeagueCardProps {
  league: InstalledLeague;
  onPress: () => void;
  onLongPress?: () => void;
}

export const LeagueCard = React.memo(function LeagueCard({ league, onPress, onLongPress }: LeagueCardProps) {
  const { package: pkg, capabilities, lastUpdated } = league;
  const colors = useColors();
  
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

  const getSportIcon = (sport: string): keyof typeof Ionicons.glyphMap => {
    switch (sport.toLowerCase()) {
      case 'football':
      case 'soccer':
        return 'football-outline';
      case 'basketball':
        return 'basketball-outline';
      case 'tennis':
        return 'tennisball-outline';
      case 'baseball':
        return 'baseball-outline';
      case 'hockey':
        return 'ice-cream-outline';
      default:
        return 'trophy-outline';
    }
  };

  const leagueName = pkg.league.name;
  const sport = pkg.league.sport.charAt(0).toUpperCase() + pkg.league.sport.slice(1);
  const country = pkg.league.country ? ` ${pkg.league.country}` : '';
  const accessibilityLabel = `${leagueName}, ${sport}${country}. ${enabledCount} features. Updated ${formatLastUpdated(lastUpdated)}${liveCount > 0 ? '. Live' : ''}`;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to open league. Long press to remove."
    >
      {/* League Logo */}
      <View style={styles.logoContainer}>
        {pkg.branding?.logo ? (
          <Image 
            source={{ uri: pkg.branding.logo }} 
            style={styles.logo}
            accessibilityLabel={`${leagueName} logo`}
          />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Ionicons 
              name={getSportIcon(pkg.league.sport)} 
              size={28} 
              color={colors.primary} 
              accessibilityLabel={`${sport} icon`}
            />
          </View>
        )}
      </View>

      {/* League Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text 
            style={[styles.name, { color: colors.text }]} 
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {leagueName}
          </Text>
          {liveCount > 0 && (
            <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.text }]} />
              <Text style={[styles.liveText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>LIVE</Text>
            </View>
          )}
        </View>
        
        <Text 
          style={[styles.subtitle, { color: colors.textSecondary }]} 
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {sport}{country}
        </Text>

        <View style={styles.footer}>
          <View style={[styles.featureBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
            <Text 
              style={[styles.featureCount, { color: colors.primary }]}
              maxFontSizeMultiplier={1.3}
            >
              {enabledCount} {enabledCount === 1 ? 'feature' : 'features'}
            </Text>
          </View>
          <Text 
            style={[styles.lastUpdated, { color: colors.textMuted }]}
            maxFontSizeMultiplier={1.3}
          >
            Updated {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    marginRight: 14,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  lastUpdated: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
});
