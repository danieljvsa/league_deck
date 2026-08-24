import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
  const dateLabel = formatDate(article.publishedAt);
  const accessibilityLabel = `${article.title}, by ${article.author || article.source}, ${dateLabel}`;

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} 
        onPress={onPress} 
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens article in browser"
      >
        <View style={styles.compactContent}>
          <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>{article.title}</Text>
          <View style={styles.compactMeta}>
            <Text style={[styles.compactSource, { color: colors.primary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{article.source}</Text>
            <Text style={[styles.compactDot, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>·</Text>
            <Text style={[styles.compactDate, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>{dateLabel}</Text>
          </View>
        </View>
        {article.imageUrl && (
          <Image source={{ uri: article.imageUrl }} style={styles.compactImage} accessibilityLabel={`Article image for ${article.title}`} />
        )}
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
      accessibilityHint="Opens article in browser"
    >
      {/* Hero Image */}
      {article.imageUrl && (
        <Image source={{ uri: article.imageUrl }} style={styles.image} accessibilityLabel={`Article image for ${article.title}`} />
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={3} maxFontSizeMultiplier={1.3}>{article.title}</Text>
        
        {article.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {article.description}
          </Text>
        )}

        {/* Meta Row */}
        <View style={styles.meta}>
          <View style={[styles.sourceBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="newspaper-outline" size={12} color={colors.primary} />
            <Text style={[styles.source, { color: colors.primary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{article.source}</Text>
          </View>
          
          {article.author && (
            <View style={styles.authorContainer}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{article.author}</Text>
            </View>
          )}

          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.date, { color: colors.textMuted }]} maxFontSizeMultiplier={1.3}>{dateLabel}</Text>
          </View>
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tags}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{tag}</Text>
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
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    marginLeft: 4,
    maxWidth: 120,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 48,
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
    marginBottom: 8,
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
