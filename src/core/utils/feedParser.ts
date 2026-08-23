import { NewsArticle } from '@/domain';

interface ParsedFeed {
  title: string;
  description?: string;
  articles: NewsArticle[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractText(element: string | null | undefined): string {
  if (!element) return '';
  return element.replace(/<[^>]*>/g, '').trim();
}

export function parseRSSFeed(xml: string): ParsedFeed {
  const parser = require('react-native-rss-parser');
  
  try {
    const parsed = parser.parse(xml);
    
    const feed: ParsedFeed = {
      title: parsed.title || 'Unknown Feed',
      description: parsed.description,
      articles: [],
    };

    if (parsed.items && Array.isArray(parsed.items)) {
      feed.articles = parsed.items.map((item: any) => ({
        id: item.id || generateId(),
        title: item.title || 'Untitled',
        description: item.description ? extractText(item.description) : undefined,
        url: item.links?.[0]?.url || item.enclosures?.[0]?.url || '',
        imageUrl: item.enclosures?.find((e: any) => e.mimeType?.startsWith('image/'))?.url ||
                  item.image?.url,
        author: item.authors?.[0]?.name || item.authors?.[0]?.name,
        publishedAt: parseDate(item.published || item.updated || new Date().toISOString()),
        source: feed.title,
        tags: item.categories?.map((c: any) => c.value) || [],
      }));
    }

    return feed;
  } catch (error) {
    console.error('Failed to parse RSS feed:', error);
    return {
      title: 'Unknown Feed',
      articles: [],
    };
  }
}

export function parseAtomFeed(xml: string): ParsedFeed {
  const parser = require('react-native-rss-parser');
  
  try {
    const parsed = parser.parse(xml);
    
    const feed: ParsedFeed = {
      title: parsed.title || 'Unknown Feed',
      description: parsed.description,
      articles: [],
    };

    if (parsed.items && Array.isArray(parsed.items)) {
      feed.articles = parsed.items.map((item: any) => ({
        id: item.id || generateId(),
        title: item.title || 'Untitled',
        description: item.summary ? extractText(item.summary) : 
                    item.content ? extractText(item.content) : undefined,
        url: item.links?.[0]?.url || '',
        imageUrl: item.enclosures?.find((e: any) => e.mimeType?.startsWith('image/'))?.url ||
                  item.image?.url,
        author: item.authors?.[0]?.name,
        publishedAt: parseDate(item.published || item.updated || new Date().toISOString()),
        source: feed.title,
        tags: item.categories?.map((c: any) => c.value) || [],
      }));
    }

    return feed;
  } catch (error) {
    console.error('Failed to parse Atom feed:', error);
    return {
      title: 'Unknown Feed',
      articles: [],
    };
  }
}

export function parseFeed(xml: string, type: 'rss' | 'atom'): ParsedFeed {
  if (type === 'atom') {
    return parseAtomFeed(xml);
  }
  return parseRSSFeed(xml);
}
