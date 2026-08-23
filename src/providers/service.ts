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

export class ProviderService {
  private adapters = new Map<string, ProviderAdapter>();

  private getAdapter(config: ProviderConfig): ProviderAdapter | null {
    const cacheKey = `${config.type}-${config.leagueId || config.source || ''}`;
    
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

    const cacheKey = `participants-${config.leagueId || config.source}`;
    const cached = await getCachedData<Participant[]>(packageId, adapter.id, cacheKey);
    if (cached) return cached;

    let participants: Participant[];
    
    if (config.type === 'static-json' && config.source) {
      participants = await adapter.fetchParticipants(config.source);
    } else {
      participants = await adapter.fetchParticipants(config.leagueId || '');
    }

    await setCachedData(packageId, adapter.id, cacheKey, participants, CACHE_TTL.participants);
    return participants;
  }

  async fetchEvents(
    packageId: string,
    config: ProviderConfig
  ): Promise<Event[]> {
    const adapter = this.getAdapter(config);
    if (!adapter?.fetchEvents) return [];

    const cacheKey = `events-${config.leagueId || config.source}`;
    const cached = await getCachedData<Event[]>(packageId, adapter.id, cacheKey);
    if (cached) return cached;

    let events: Event[];
    
    if (config.type === 'static-json' && config.source) {
      events = await adapter.fetchEvents(config.source);
    } else {
      events = await adapter.fetchEvents(config.leagueId || '');
    }

    await setCachedData(packageId, adapter.id, cacheKey, events, CACHE_TTL.events);
    return events;
  }

  async fetchStandings(
    packageId: string,
    config: ProviderConfig
  ): Promise<Standing[]> {
    const adapter = this.getAdapter(config);
    if (!adapter?.fetchStandings) return [];

    const cacheKey = `standings-${config.leagueId}`;
    const cached = await getCachedData<Standing[]>(packageId, adapter.id, cacheKey);
    if (cached) return cached;

    const standings = await adapter.fetchStandings(config.leagueId || '');
    await setCachedData(packageId, adapter.id, cacheKey, standings, CACHE_TTL.standings);
    return standings;
  }

  async checkProviderAvailability(config: ProviderConfig): Promise<boolean> {
    const adapter = this.getAdapter(config);
    if (!adapter) return false;

    if (adapter.isAvailable) {
      return adapter.isAvailable();
    }

    return true;
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
    const key = await getApiKey(providerType);
    return key !== null;
  }
}

export const providerService = new ProviderService();
