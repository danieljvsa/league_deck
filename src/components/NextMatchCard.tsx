import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/domain';
import { useColors } from '@/constants/theme';

interface NextMatchCardProps {
  event: Event;
  homeName: string;
  awayName: string;
  onPress?: () => void;
}

export const NextMatchCard = React.memo(function NextMatchCard({ event, homeName, awayName, onPress }: NextMatchCardProps) {
  const colors = useColors();

  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeFormatted = timeStr || date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (eventDate.getTime() === today.getTime()) {
      return { date: 'Today', time: timeFormatted };
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (eventDate.getTime() === tomorrow.getTime()) {
      return { date: 'Tomorrow', time: timeFormatted };
    }
    
    return {
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      time: timeFormatted,
    };
  };

  const { date, time } = formatDate(event.date, event.time);
  const accessibilityLabel = `Next match: ${homeName} vs ${awayName}, ${date} at ${time}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="View match details"
    >
      {/* Date/Time Badge */}
      <View style={[styles.timeBadge, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="time-outline" size={14} color={colors.primary} />
        <Text style={[styles.timeText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>{date} · {time}</Text>
      </View>

      {/* Teams */}
      <View style={styles.content}>
        <Text style={[styles.vs, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>VS</Text>
        <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{homeName}</Text>
        <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{awayName}</Text>
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
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 14,
    minHeight: 28,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  vs: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  arrow: {
    marginLeft: 12,
  },
});
