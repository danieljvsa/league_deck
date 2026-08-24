import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, EventStatus } from '@/domain';
import { useColors } from '@/constants/theme';

interface EventCardProps {
  event: Event;
  homeName: string;
  awayName: string;
  onPress?: () => void;
  compact?: boolean;
}

function getStatusColor(status: EventStatus, colors: ReturnType<typeof useColors>): string {
  switch (status) {
    case 'live':
    case 'in_play':
      return colors.live;
    case 'halftime':
      return colors.warning;
    case 'finished':
      return colors.success;
    case 'postponed':
      return '#FFCC00';
    case 'cancelled':
      return colors.textMuted;
    default:
      return colors.primary;
  }
}

function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case 'live':
      return 'LIVE';
    case 'in_play':
      return 'IN PLAY';
    case 'halftime':
      return 'HT';
    case 'finished':
      return 'FT';
    case 'postponed':
      return 'POSTPONED';
    case 'cancelled':
      return 'CANCELLED';
    case 'scheduled':
      return 'SCHEDULED';
  }
}

function formatDate(dateStr: string, timeStr?: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStrFormatted = timeStr || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (eventDate.getTime() === today.getTime()) {
    return `Today · ${timeStrFormatted}`;
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (eventDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${timeStrFormatted}`;
  }
  
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStrFormatted}`;
}

export const EventCard = React.memo(function EventCard({ event, homeName, awayName, onPress, compact = false }: EventCardProps) {
  const colors = useColors();
  const statusColor = getStatusColor(event.status, colors);
  const isLive = event.status === 'live' || event.status === 'in_play';
  const hasScore = event.score && event.score.home !== null && event.score.away !== null;
  const statusLabel = getStatusLabel(event.status);
  const dateLabel = formatDate(event.date, event.time);
  
  const scoreText = hasScore ? `${event.score!.home} - ${event.score!.away}` : 'vs';
  const accessibilityLabel = `${homeName} vs ${awayName}, ${statusLabel}, ${dateLabel}${hasScore ? `, Score: ${scoreText}` : ''}${event.venue ? `, at ${event.venue}` : ''}`;

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} 
        onPress={onPress} 
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="View match details"
      >
        <View style={styles.compactHeader}>
          <Text style={[styles.compactDate, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{dateLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            {isLive && <View style={[styles.liveIndicator, { backgroundColor: colors.text }]} />}
            <Text style={[styles.statusText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.compactTeams}>
          <Text style={[styles.compactTeamName, { color: colors.text }, hasScore && styles.teamBold]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {homeName}
          </Text>
          {hasScore ? (
            <Text style={[styles.compactScore, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
              {event.score!.home} - {event.score!.away}
            </Text>
          ) : (
            <Text style={[styles.vs, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>vs</Text>
          )}
          <Text style={[styles.compactTeamName, { color: colors.text }, styles.awayTeam, hasScore && styles.teamBold]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {awayName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} 
      onPress={onPress} 
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="View match details"
    >
      {/* Header with date and status */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.date, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{dateLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          {isLive && <View style={[styles.liveIndicator, { backgroundColor: colors.text }]} />}
          <Text style={[styles.statusText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{statusLabel}</Text>
        </View>
      </View>
      
      {/* Teams and Score */}
      <View style={styles.teams}>
        <View style={styles.teamContainer}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{homeName}</Text>
          <Text style={[styles.teamLabel, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>Home</Text>
        </View>
        
        {hasScore ? (
          <View style={[styles.scoreContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.score, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{event.score!.home}</Text>
            <Text style={[styles.scoreDivider, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>-</Text>
            <Text style={[styles.score, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{event.score!.away}</Text>
          </View>
        ) : (
          <View style={[styles.vsContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.vsText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>VS</Text>
          </View>
        )}
        
        <View style={styles.teamContainer}>
          <Text style={[styles.teamName, { color: colors.text }, styles.awayTeamName]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{awayName}</Text>
          <Text style={[styles.teamLabel, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>Away</Text>
        </View>
      </View>

      {/* Venue */}
      {event.venue && (
        <View style={[styles.venueContainer, { borderTopColor: colors.borderLight }]}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.venueText, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{event.venue}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minHeight: 24,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  awayTeamName: {
    textAlign: 'center',
  },
  teamLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreDivider: {
    fontSize: 20,
    marginHorizontal: 6,
  },
  vsContainer: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  venueText: {
    fontSize: 13,
    flex: 1,
    marginLeft: 6,
  },
  
  compactCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactDate: {
    fontSize: 12,
  },
  compactTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTeamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  awayTeam: {
    textAlign: 'right',
  },
  teamBold: {
    fontWeight: '700',
  },
  compactScore: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  vs: {
    fontSize: 12,
    marginHorizontal: 12,
  },
});
