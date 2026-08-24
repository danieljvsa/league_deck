import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/domain';
import { useColors } from '@/constants/theme';

interface LiveMatchCardProps {
  event: Event;
  homeName: string;
  awayName: string;
  onPress?: () => void;
}

export const LiveMatchCard = React.memo(function LiveMatchCard({ event, homeName, awayName, onPress }: LiveMatchCardProps) {
  const colors = useColors();
  const hasScore = event.score && event.score.home !== null && event.score.away !== null;
  const scoreText = hasScore ? `${event.score!.home} - ${event.score!.away}` : '';
  const accessibilityLabel = `Live match: ${homeName} vs ${awayName}${hasScore ? `, Score: ${scoreText}` : ''}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="View live match details"
    >
      {/* Live Badge */}
      <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
        <View style={[styles.liveDot, { backgroundColor: colors.text }]} />
        <Text style={[styles.liveText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>LIVE</Text>
      </View>

      {/* Teams and Score */}
      <View style={styles.content}>
        <View style={styles.teamRow}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{homeName}</Text>
          {hasScore && (
            <Text style={[styles.score, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{event.score!.home}</Text>
          )}
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        
        <View style={styles.teamRow}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{awayName}</Text>
          {hasScore && (
            <Text style={[styles.score, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{event.score!.away}</Text>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.arrow} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 14,
    minHeight: 28,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  arrow: {
    marginLeft: 12,
  },
});
