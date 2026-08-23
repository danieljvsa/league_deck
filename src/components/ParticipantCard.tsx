import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Participant } from '@/domain';
import { useColors } from '@/constants/theme';

interface ParticipantCardProps {
  participant: Participant;
  onPress?: () => void;
  compact?: boolean;
}

export const ParticipantCard = React.memo(function ParticipantCard({ participant, onPress, compact = false }: ParticipantCardProps) {
  const colors = useColors();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        {participant.logo ? (
          <Image source={{ uri: participant.logo }} style={styles.compactLogo} />
        ) : (
          <View style={[styles.compactLogo, styles.logoPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={[styles.compactLogoText, { color: colors.textSecondary }]}>{participant.name.charAt(0)}</Text>
          </View>
        )}
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>{participant.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {participant.logo ? (
        <Image source={{ uri: participant.logo }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: colors.muted }]}>
          <Text style={[styles.logoText, { color: colors.textSecondary }]}>{participant.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{participant.name}</Text>
        {participant.shortName && participant.shortName !== participant.name && (
          <Text style={[styles.shortName, { color: colors.textSecondary }]}>{participant.shortName}</Text>
        )}
        <View style={styles.metaRow}>
          {participant.country && (
            <Text style={[styles.metaItem, { color: colors.textSecondary, backgroundColor: colors.muted }]}>{participant.country}</Text>
          )}
          {participant.sport && (
            <Text style={[styles.metaItem, { color: colors.textSecondary, backgroundColor: colors.muted }]}>{participant.sport}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  shortName: {
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaItem: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  compactCard: {
    alignItems: 'center',
    width: 80,
  },
  compactLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
