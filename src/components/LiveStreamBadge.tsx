import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/constants/theme';

interface LiveStreamBadgeProps {
  isLive: boolean;
  viewerCount?: number;
  quality?: 'HD' | 'FHD' | '4K';
  compact?: boolean;
}

export function LiveStreamBadge({ 
  isLive, 
  viewerCount, 
  quality, 
  compact = false 
}: LiveStreamBadgeProps) {
  const colors = useColors();

  if (!isLive) return null;

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: colors.live }]}>
        <View style={[styles.liveIndicator, { backgroundColor: '#FFF' }]} />
        <Text style={[styles.compactText, { color: '#FFF' }]}>LIVE</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.live }]}>
      <View style={[styles.liveIndicator, { backgroundColor: '#FFF' }]} />
      <Text style={[styles.liveText, { color: '#FFF' }]}>LIVE</Text>
      {quality && (
        <View style={[styles.qualityBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={[styles.qualityText, { color: '#FFF' }]}>{quality}</Text>
        </View>
      )}
      {viewerCount !== undefined && (
        <Text style={[styles.viewerText, { color: '#FFF' }]}>
          {viewerCount >= 1000 
            ? `${(viewerCount / 1000).toFixed(1)}K watching`
            : `${viewerCount} watching`
          }
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  viewerText: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.9,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
