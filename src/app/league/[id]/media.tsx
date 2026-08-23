import React, { useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Linking, Image, Alert 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { Empty } from '@/components/ui';
import { MediaPlayer } from '@/components/MediaPlayer';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { LiveStreamBadge } from '@/components/LiveStreamBadge';
import { MediaSourceConfig } from '@/core/package/schema';
import { MediaItem, MediaSource } from '@/domain';
import { useColors } from '@/constants/theme';

export default function MediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  
  const [activePlayer, setActivePlayer] = useState<MediaSourceConfig | null>(null);
  const [playingPodcast, setPlayingPodcast] = useState<MediaItem | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);

  if (!league) {
    return <Empty message="League not found" />;
  }

  const streams = league.package.media?.streams || [];
  const podcasts = league.package.media?.podcasts || [];

  if (streams.length === 0 && podcasts.length === 0) {
    return <Empty message="No media available" />;
  }

  const handleStreamPress = (source: MediaSourceConfig) => {
    setActivePlayer(source);
  };

  const handlePodcastPlay = (item: MediaItem) => {
    setPlayingPodcast(item);
    setIsPodcastPlaying(true);
  };

  const handlePodcastPause = () => {
    setIsPodcastPlaying(false);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'youtube':
        return '▶';
      case 'spotify':
        return '♫';
      case 'rss':
        return '⊞';
      default:
        return '🔗';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'youtube':
        return '#FF0000';
      case 'spotify':
        return '#1DB954';
      case 'rss':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const convertToMediaSource = (config: MediaSourceConfig): MediaSource => ({
    id: config.id,
    type: config.provider === 'youtube' ? 'stream' : 'podcast',
    provider: config.provider,
    title: config.name,
    url: config.url,
    providerId: config.channelId || config.showId,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[
          { title: 'Live Streams', data: streams, key: 'streams' },
          { title: 'Podcasts', data: podcasts, key: 'podcasts' },
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{item.title}</Text>
            {item.data.length === 0 ? (
              <Text style={[styles.noItems, { color: colors.textSecondary }]}>No {item.title.toLowerCase()} available</Text>
            ) : (
              item.data.map((source: MediaSourceConfig) => (
                <TouchableOpacity
                  key={source.id}
                  style={[styles.mediaCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleStreamPress(source)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mediaThumbnail, { backgroundColor: getProviderColor(source.provider) + '20' }]}>
                    <Text style={[styles.providerIcon, { color: getProviderColor(source.provider) }]}>
                      {getProviderIcon(source.provider)}
                    </Text>
                  </View>
                  <View style={styles.mediaInfo}>
                    <Text style={[styles.mediaTitle, { color: colors.text }]} numberOfLines={1}>{source.name}</Text>
                    <Text style={[styles.mediaProvider, { color: colors.textSecondary }]}>
                      {source.provider.charAt(0).toUpperCase() + source.provider.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.mediaChevron, { color: colors.disabled }]}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        ListHeaderComponent={
          activePlayer ? (
            <View style={styles.playerContainer}>
              <MediaPlayer
                source={convertToMediaSource(activePlayer)}
                url={activePlayer.url || ''}
                onError={(error) => Alert.alert('Error', error)}
              />
              <TouchableOpacity 
                style={[styles.closePlayer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => setActivePlayer(null)}
              >
                <Text style={[styles.closePlayerText, { color: '#FFF' }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          playingPodcast ? (
            <View style={styles.podcastPlayerContainer}>
              <PodcastPlayer
                item={playingPodcast}
                isPlaying={isPodcastPlaying}
                onPlay={handlePodcastPlay}
                onPause={handlePodcastPause}
              />
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 12,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noItems: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  mediaCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  mediaProvider: {
    fontSize: 13,
  },
  mediaChevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  playerContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  closePlayer: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePlayerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  podcastPlayerContainer: {
    marginTop: 16,
  },
});
