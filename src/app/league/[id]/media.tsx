import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { Empty } from '@/components/ui';
import { MediaPlayer } from '@/components/MediaPlayer';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { MediaSourceConfig } from '@/core/package/schema';
import { MediaItem, MediaSource } from '@/domain';
import { useColors } from '@/constants/theme';

type MediaSection = {
  title: string;
  data: MediaSourceConfig[];
  key: string;
  icon: 'play-circle-outline' | 'headset-outline';
};

const PROVIDER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  youtube: 'logo-youtube',
  spotify: 'musical-notes-outline',
  rss: 'logo-rss',
};

const PROVIDER_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  spotify: '#1DB954',
};

const MEDIA_SECTION_HEIGHT = 60;

export default function MediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [activePlayer, setActivePlayer] = useState<MediaSourceConfig | null>(null);
  const [playingPodcast, setPlayingPodcast] = useState<MediaItem | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);

  const getProviderIcon = useCallback((provider: string): keyof typeof Ionicons.glyphMap => {
    return PROVIDER_ICONS[provider] || 'link-outline';
  }, []);

  const getProviderColor = useCallback((provider: string) => {
    return PROVIDER_COLORS[provider] || colors.primary;
  }, [colors.primary]);

  const convertToMediaSource = useCallback((config: MediaSourceConfig): MediaSource => ({
    id: config.id,
    type: config.provider === 'youtube' ? 'stream' : 'podcast',
    provider: config.provider,
    title: config.name,
    url: config.url,
    providerId: config.channelId || config.showId,
  }), []);

  const handleStreamPress = useCallback((source: MediaSourceConfig) => {
    setActivePlayer(source);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setActivePlayer(null);
  }, []);

  const handlePodcastPlay = useCallback((item: MediaItem) => {
    setPlayingPodcast(item);
    setIsPodcastPlaying(true);
  }, []);

  const handlePodcastPause = useCallback(() => {
    setIsPodcastPlaying(false);
  }, []);

  const handleMediaError = useCallback((error: string) => {
    Alert.alert('Error', error);
  }, []);

  const mediaSections = useMemo<MediaSection[]>(() => {
    if (!league) return [];
    const streams = league.package.media?.streams || [];
    const podcasts = league.package.media?.podcasts || [];
    return [
      { title: 'Live Streams', data: streams, key: 'streams', icon: 'play-circle-outline' },
      { title: 'Podcasts', data: podcasts, key: 'podcasts', icon: 'headset-outline' },
    ];
  }, [league]);

  const keyExtractor = useCallback((item: MediaSection) => item.key, []);

  const renderItem = useCallback(({ item }: { item: MediaSection }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={item.icon} size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{item.title}</Text>
      </View>
      {item.data.length === 0 ? (
        <Text style={[styles.noItems, { color: colors.textSecondary }]}>
          No {item.title.toLowerCase()} available
        </Text>
      ) : (
        item.data.map((source: MediaSourceConfig) => (
          <TouchableOpacity
            key={source.id}
            style={[styles.mediaCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            onPress={() => handleStreamPress(source)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${source.name}, ${source.provider}`}
            accessibilityHint="Opens media player"
          >
            <View style={[styles.mediaThumbnail, { backgroundColor: getProviderColor(source.provider) + '20' }]}>
              <Ionicons 
                name={getProviderIcon(source.provider)} 
                size={24} 
                color={getProviderColor(source.provider)} 
              />
            </View>
            <View style={styles.mediaInfo}>
              <Text style={[styles.mediaTitle, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {source.name}
              </Text>
              <Text style={[styles.mediaProvider, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {source.provider.charAt(0).toUpperCase() + source.provider.slice(1)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </View>
  ), [colors, handleStreamPress, getProviderIcon, getProviderColor]);

  const getItemLayout = useCallback((_data: ArrayLike<MediaSection> | null | undefined, index: number) => ({
    length: MEDIA_SECTION_HEIGHT,
    offset: MEDIA_SECTION_HEIGHT * index,
    index,
  }), []);

  const listHeader = useMemo(() => {
    if (!activePlayer) return null;
    return (
      <View style={styles.playerContainer}>
        <MediaPlayer
          source={convertToMediaSource(activePlayer)}
          url={activePlayer.url || ''}
          onError={handleMediaError}
        />
        <TouchableOpacity 
          style={[styles.closePlayer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={handleClosePlayer}
          accessibilityRole="button"
          accessibilityLabel="Close media player"
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }, [activePlayer, convertToMediaSource, handleMediaError, handleClosePlayer, colors]);

  const listFooter = useMemo(() => {
    if (!playingPodcast) return null;
    return (
      <View style={styles.podcastPlayerContainer}>
        <PodcastPlayer
          item={playingPodcast}
          isPlaying={isPodcastPlaying}
          onPlay={handlePodcastPlay}
          onPause={handlePodcastPause}
        />
      </View>
    );
  }, [playingPodcast, isPodcastPlaying, handlePodcastPlay, handlePodcastPause]);

  const contentContainerStyle = useMemo(() => 
    [styles.list, { paddingBottom: insets.bottom + 100 }],
    [insets.bottom]
  );

  if (!league) {
    return <Empty message="League not found" />;
  }

  const streams = league.package.media?.streams || [];
  const podcasts = league.package.media?.podcasts || [];

  if (streams.length === 0 && podcasts.length === 0) {
    return <Empty message="No media available" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={mediaSections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  noItems: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  mediaCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  playerContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  closePlayer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  podcastPlayerContainer: {
    marginTop: 16,
  },
});
