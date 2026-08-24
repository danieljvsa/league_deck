import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Participant } from '@/domain';
import { useColors } from '@/constants/theme';

interface ParticipantCardProps {
  participant: Participant;
  onPress?: () => void;
  compact?: boolean;
}

export const ParticipantCard = React.memo(function ParticipantCard({ participant, onPress, compact = false }: ParticipantCardProps) {
  const colors = useColors();
  const countryLabel = participant.country ? `, ${participant.country}` : '';
  const sportLabel = participant.sport ? `, ${participant.sport}` : '';
  const accessibilityLabel = `${participant.name}${countryLabel}${sportLabel}`;

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} 
        onPress={onPress} 
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="View team details"
      >
        {participant.logo ? (
          <Image source={{ uri: participant.logo }} style={styles.compactLogo} accessibilityLabel={`${participant.name} logo`} />
        ) : (
          <View style={[styles.compactLogo, styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.compactLogoText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>{participant.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{participant.name}</Text>
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
      accessibilityHint="View team details"
    >
      {/* Team Logo */}
      <View style={styles.logoContainer}>
        {participant.logo ? (
          <Image source={{ uri: participant.logo }} style={styles.logo} accessibilityLabel={`${participant.name} logo`} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.logoText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>{participant.name.charAt(0)}</Text>
          </View>
        )}
      </View>

      {/* Team Info */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {participant.name}
        </Text>
        
        {participant.shortName && participant.shortName !== participant.name && (
          <Text style={[styles.shortName, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {participant.shortName}
          </Text>
        )}

        <View style={styles.metaRow}>
          {participant.country && (
            <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
              <Ionicons name="globe-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{participant.country}</Text>
            </View>
          )}
          {participant.sport && (
            <View style={[styles.metaBadge, { backgroundColor: colors.muted }]}>
              <Ionicons name="football-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{participant.sport}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
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
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  shortName: {
    fontSize: 13,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  
  compactCard: {
    alignItems: 'center',
    width: 80,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 88,
  },
  compactLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginBottom: 6,
  },
  compactLogoText: {
    fontSize: 24,
    fontWeight: '700',
  },
  compactName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
