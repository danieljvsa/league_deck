import { ProviderAdapter, ProviderMetadata } from './types';
import { ProviderConfig } from '../core/package/schema';
import { TheSportsDBAdapter } from './thesportsdb/adapter';
import { StaticJsonAdapter } from './static-json/adapter';
import { SportScoreAdapter } from './sportscore/adapter';

const providerRegistry = new Map<string, () => ProviderAdapter>();

providerRegistry.set('thesportsdb', () => new TheSportsDBAdapter());
providerRegistry.set('static-json', () => new StaticJsonAdapter());
providerRegistry.set('sportscore', () => new SportScoreAdapter());
providerRegistry.set('generic-rest', () => new StaticJsonAdapter());

const providerMetadata: Record<string, ProviderMetadata> = {
  thesportsdb: {
    id: 'thesportsdb',
    name: 'TheSportsDB',
    requiresApiKey: false,
    capabilities: ['metadata', 'participants', 'events', 'standings'],
    attribution: 'Data provided by TheSportsDB',
    website: 'https://www.thesportsdb.com',
  },
  'static-json': {
    id: 'static-json',
    name: 'Static JSON',
    requiresApiKey: false,
    capabilities: ['participants', 'events'],
    attribution: undefined,
    website: undefined,
  },
  sportscore: {
    id: 'sportscore',
    name: 'SportScore',
    requiresApiKey: false,
    capabilities: ['live', 'events', 'standings'],
    attribution: 'Live data provided by SportScore',
    website: undefined,
  },
  'generic-rest': {
    id: 'generic-rest',
    name: 'Generic REST',
    requiresApiKey: true,
    capabilities: ['metadata', 'participants', 'events', 'standings'],
    attribution: undefined,
    website: undefined,
  },
};

export function createProvider(config: ProviderConfig): ProviderAdapter | null {
  const factory = providerRegistry.get(config.type);
  if (!factory) {
    if (__DEV__) console.warn(`Unknown provider type: ${config.type}`);
    return null;
  }
  return factory();
}

export function getProviderMetadata(type: string): ProviderMetadata | null {
  return providerMetadata[type] || null;
}

export function getAllProviderMetadata(): ProviderMetadata[] {
  return Object.values(providerMetadata);
}

export function registerProvider(type: string, factory: () => ProviderAdapter, metadata: ProviderMetadata): void {
  providerRegistry.set(type, factory);
  providerMetadata[type] = metadata;
}

export function isProviderSupported(type: string): boolean {
  return providerRegistry.has(type);
}

export function getSupportedProviders(): string[] {
  return Array.from(providerRegistry.keys());
}

export function getProvidersForCapability(capability: string): ProviderMetadata[] {
  return Object.values(providerMetadata).filter((p) => p.capabilities.includes(capability));
}
