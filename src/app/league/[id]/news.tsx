import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, RefreshControl, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { Loading, Error, Empty } from '@/components/ui';
import { NewsCard } from '@/components/NewsCard';
import { NewsArticle } from '@/domain';
import { fetchText } from '@/core/networking/fetch';
import { useColors } from '@/constants/theme';

export default function NewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLeague } = useLeagueStore();
  const league = getLeague(id);
  const colors = useColors();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadNews().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [id]);

  const loadNews = async () => {
    if (!league) return;

    setIsLoading(true);
    setError(null);

    try {
      const newsSources = league.package.news || [];
      
      if (newsSources.length === 0) {
        setArticles([]);
        setIsLoading(false);
        return;
      }

      const fetchPromises = newsSources.map(async (source) => {
        try {
          const result = await fetchText(source.url);
          
          if (result.success && result.data) {
            return parseNewsFeed(result.data, source.type, source.url);
          } else {
            console.warn(`Failed to fetch news from ${source.url}: ${result.error}`);
            return [];
          }
        } catch (err) {
          console.warn(`Failed to fetch news from ${source.url}:`, err);
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      const allArticles: NewsArticle[] = results
        .filter((result): result is PromiseFulfilledResult<NewsArticle[]> => result.status === 'fulfilled')
        .flatMap((result) => result.value);

      allArticles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setArticles(allArticles);
    } catch (err: any) {
      setError(err?.message || 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  const parseNewsFeed = (xml: string, type: string, sourceUrl: string): NewsArticle[] => {
    const articles: NewsArticle[] = [];
    
    const sourceName = new URL(sourceUrl).hostname.replace('www.', '');

    const titleMatches = xml.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
    const linkMatches = xml.match(/<link[^>]*>([^<]+)<\/link>/gi) || 
                       xml.match(/<link[^>]*href="([^"]+)"/gi) || [];
    const descriptionMatches = xml.match(/<description[^>]*>([^<]+)<\/description>/gi) || 
                              xml.match(/<summary[^>]*>([^<]+)<\/summary>/gi) || [];
    const pubDateMatches = xml.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/gi) || 
                          xml.match(/<updated[^>]*>([^<]+)<\/updated>/gi) || [];
    const imageMatches = xml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image\/[^"]+"/gi) || [];

    const count = Math.min(
      titleMatches.length,
      linkMatches.length
    );

    for (let i = 0; i < count; i++) {
      const title = extractTagContent(titleMatches[i]);
      const link = extractAttribute(linkMatches[i], 'href') || extractTagContent(linkMatches[i]);
      const description = descriptionMatches[i] ? extractTagContent(descriptionMatches[i]) : undefined;
      const pubDate = pubDateMatches[i] ? extractTagContent(pubDateMatches[i]) : new Date().toISOString();
      const imageUrl = imageMatches[i] ? extractAttribute(imageMatches[i], 'url') : undefined;

      if (title && link) {
        articles.push({
          id: `news-${Date.now()}-${i}`,
          title,
          description,
          url: link,
          imageUrl,
          publishedAt: pubDate,
          source: sourceName,
        });
      }
    }

    return articles;
  };

  const extractTagContent = (tag: string): string => {
    const match = tag.match(/<[^>]*>([^<]*)<\/[^>]*>/i);
    return match ? match[1].trim() : '';
  };

  const extractAttribute = (tag: string, attr: string): string | undefined => {
    const match = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
    return match ? match[1] : undefined;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  }, []);

  const handleArticlePress = (article: NewsArticle) => {
    setSelectedArticle(article);
    router.push({
      pathname: '/league/[id]/article',
      params: { id, url: article.url, title: article.title }
    });
  };

  if (isLoading && !refreshing) {
    return <Loading message="Loading news..." />;
  }

  if (error) {
    return <Error message={error} onRetry={loadNews} />;
  }

  if (articles.length === 0) {
    return <Empty message="No news available" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            article={item}
            onPress={() => handleArticlePress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </Text>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={6}
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
    paddingBottom: 20,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
});
