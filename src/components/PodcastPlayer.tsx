import React, { useState, useRef } from 'react';
import { 
  View, Text, Image, TouchableOpacity, StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { MediaItem } from '@/domain';
import { useColors } from '@/constants/theme';

interface PodcastPlayerProps {
  item: MediaItem;
  isPlaying?: boolean;
  onPlay?: (item: MediaItem) => void;
  onPause?: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function PodcastPlayer({ item, isPlaying = false, onPlay, onPause }: PodcastPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const colors = useColors();

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      setIsLoading(true);
      onPlay?.(item);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={styles.thumbnailText}>🎧</Text>
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          {item.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
          )}
          <View style={styles.meta}>
            {item.duration && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDuration(item.duration)}</Text>
            )}
            {item.publishedAt && (
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
            )}
            {item.publishedAt && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(item.publishedAt)}</Text>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.playButton, { backgroundColor: colors.primary }, isPlaying && [styles.playButtonActive, { backgroundColor: colors.danger }]]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={[styles.playIcon, { color: '#FFF' }]}>{isPlaying ? '⏸' : '▶'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  playButtonActive: {},
  playIcon: {
    fontSize: 18,
  },
});
