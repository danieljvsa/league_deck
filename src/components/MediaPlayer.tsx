import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MediaSource } from '@/domain';
import { useColors } from '@/constants/theme';
import { ErrorBoundary } from './ErrorBoundary';

interface MediaPlayerProps {
  source: MediaSource;
  url: string;
  onError?: (error: string) => void;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
}

function getSpotifyEmbedUrl(url: string): string {
  const spotifyUrl = url.replace('open.spotify.com', 'open.spotify.com');
  return `https://open.spotify.com/embed/${spotifyUrl.split('/').slice(-2).join('/')}?theme=0`;
}

export function MediaPlayer({ source, url, onError }: MediaPlayerProps) {
  return (
    <ErrorBoundary fallback={
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: '#8E8E93' }]}>Media player failed to load</Text>
      </View>
    }>
      <MediaPlayerInner source={source} url={url} onError={onError} />
    </ErrorBoundary>
  );
}

function MediaPlayerInner({ source, url, onError }: MediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const colors = useColors();

  const getEmbedUrl = (): string | null => {
    if (source.provider === 'youtube') {
      const videoId = source.providerId || extractYouTubeId(url);
      if (videoId) {
        return getYouTubeEmbedUrl(videoId);
      }
    }
    
    if (source.provider === 'spotify') {
      return getSpotifyEmbedUrl(url);
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Unable to play this media</Text>
        <TouchableOpacity 
          style={[styles.openButton, { borderColor: colors.primary }]}
          onPress={() => {
            // Would use Linking.openURL in real app
          }}
        >
          <Text style={[styles.openButtonText, { color: colors.primary }]}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Failed to load media</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setHasError(false);
            setIsLoading(true);
          }}
        >
          <Text style={[styles.retryButtonText, { color: '#FFF' }]}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.openButton, { borderColor: colors.primary }]}
          onPress={() => {
            // Would use Linking.openURL in real app
          }}
        >
          <Text style={[styles.openButtonText, { color: colors.primary }]}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading media...</Text>
        </View>
      )}
      <WebView
        source={{ uri: embedUrl }}
        style={[styles.webview, isLoading && styles.webviewHidden]}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          onError?.('Failed to load media');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    marginBottom: 12,
  },
  webview: {
    flex: 1,
  },
  webviewHidden: {
    opacity: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  openButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  openButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
});
