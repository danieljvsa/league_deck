import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { NewsArticle } from '@/domain';
import { useColors } from '@/constants/theme';

interface NewsCardProps {
  article: NewsArticle;
  onPress?: () => void;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const NewsCard = React.memo(function NewsCard({ article, onPress, compact = false }: NewsCardProps) {
  const colors = useColors();

  if (compact) {
    return (
      <TouchableOpacity style={[styles.compactCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={2}>{article.title}</Text>
          <View style={styles.compactMeta}>
            <Text style={[styles.compactSource, { color: colors.primary }]} numberOfLines={1}>{article.source}</Text>
            <Text style={[styles.compactDot, { color: colors.textMuted }]}>·</Text>
            <Text style={[styles.compactDate, { color: colors.textMuted }]}>{formatDate(article.publishedAt)}</Text>
          </View>
        </View>
        {article.imageUrl && (
          <Image source={{ uri: article.imageUrl }} style={styles.compactImage} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>{article.title}</Text>
        {article.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{article.description}</Text>
        )}
        <View style={styles.meta}>
          <Text style={[styles.source, { color: colors.primary }]} numberOfLines={1}>{article.source}</Text>
          {article.author && (
            <>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
              <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>{article.author}</Text>
            </>
          )}
          <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(article.publishedAt)}</Text>
        </View>
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tags}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  source: {
    fontSize: 13,
    fontWeight: '600',
  },
  author: {
    fontSize: 13,
    maxWidth: 120,
  },
  metaDot: {
    fontSize: 13,
    marginHorizontal: 6,
  },
  date: {
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  compactCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContent: {
    flex: 1,
    marginRight: 12,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactDot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  compactDate: {
    fontSize: 12,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
