import { ProviderAdapter, ProviderMetadata } from './types';
import { ProviderConfig } from '../core/package/schema';
import { createProvider, getProviderMetadata } from './registry';
import { getCachedData, setCachedData } from '../core/storage/cache';
import { getApiKey } from '../core/storage/settings';
import { Event, Participant, Standing } from '../domain';

const CACHE_TTL = {
  participants: 24 * 60 * 60 * 1000, // 24 hours
  events: 5 * 60 * 1000, // 5 minutes
  standings: 15 * 60 * 1000, // 15 minutes
};

const FETCH_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), FETCH_TIMEOUT_MS);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  
  throw lastError;
}

export class ProviderService {
  private adapters = new Map<string, ProviderAdapter>();

  private getAdapter(config: ProviderConfig): ProviderAdapter | null {
    const cacheKey = `${config.type}-${config.leagueId || config.source || 'default'}`;
    
    if (this.adapters.has(cacheKey)) {
      return this.adapters.get(cacheKey)!;
    }

    const adapter = createProvider(config);
    if (adapter) {
      this.adapters.set(cacheKey, adapter);
    }
    return adapter;
  }

  async fetchParticipants(
    packageId: string,
    config: ProviderConfig
  ): Promise<Participant[]> {
    const adapter = this.getAdapter(config);
    if (!adapter?.fetchParticipants) return [];

    const cacheKey = `participants-${config.leagueId || config.source || 'default'}`;

    try {
      const cached = await getCachedData<Participant[]>(packageId, adapter.id, cacheKey);
      if (cached) return cached;

      let participants: Participant[];
      
      if (config.type === 'static-json' && config.source) {
        participants = await fetchWithRetry(() => adapter.fetchParticipants!(config.source!));
      } else {
        participants = await fetchWithRetry(() => adapter.fetchParticipants!(config.leagueId || ''));
      }

      if (Array.isArray(participants)) {
        await setCachedData(packageId, adapter.id, cacheKey, participants, CACHE_TTL.participants);
        return participants;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('Failed to fetch participants:', error);
      return [];
    }
  }

  async fetchEvents(
    packageId: string,
    config: ProviderConfig
  ): Promise<Event[]> {
    const adapter = this.getAdapter(config);
    if (!adapter?.fetchEvents) return [];

    const cacheKey = `events-${config.leagueId || config.source || 'default'}`;

    try {
      const cached = await getCachedData<Event[]>(packageId, adapter.id, cacheKey);
      if (cached) return cached;

      let events: Event[];
      
      if (config.type === 'static-json' && config.source) {
        events = await fetchWithRetry(() => adapter.fetchEvents!(config.source!));
      } else {
        events = await fetchWithRetry(() => adapter.fetchEvents!(config.leagueId || ''));
      }

      if (Array.isArray(events)) {
        await setCachedData(packageId, adapter.id, cacheKey, events, CACHE_TTL.events);
        return events;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('Failed to fetch events:', error);
      return [];
    }
  }

  async fetchStandings(
    packageId: string,
    config: ProviderConfig
  ): Promise<Standing[]> {
    const adapter = this.getAdapter(config);
    if (!adapter?.fetchStandings) return [];

    const cacheKey = `standings-${config.leagueId || 'default'}`;

    try {
      const cached = await getCachedData<Standing[]>(packageId, adapter.id, cacheKey);
      if (cached) return cached;

      const standings = await fetchWithRetry(() => adapter.fetchStandings!(config.leagueId || ''));
      
      if (Array.isArray(standings)) {
        await setCachedData(packageId, adapter.id, cacheKey, standings, CACHE_TTL.standings);
        return standings;
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('Failed to fetch standings:', error);
      return [];
    }
  }

  async checkProviderAvailability(config: ProviderConfig): Promise<boolean> {
    const adapter = this.getAdapter(config);
    if (!adapter) return false;

    try {
      if (adapter.isAvailable) {
        return await withTimeout(adapter.isAvailable(), 5000);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getProviderAttribution(config: ProviderConfig): Promise<string | undefined> {
    const metadata = getProviderMetadata(config.type);
    return metadata?.attribution;
  }

  async requiresApiKey(config: ProviderConfig): Promise<boolean> {
    const metadata = getProviderMetadata(config.type);
    return metadata?.requiresApiKey ?? false;
  }

  async hasApiKey(providerType: string): Promise<boolean> {
    try {
      const key = await getApiKey(providerType);
      return key !== null;
    } catch {
      return false;
    }
  }
}

export const providerService = new ProviderService();
