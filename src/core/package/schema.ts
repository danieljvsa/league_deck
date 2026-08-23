export interface LeaguePackage {
  schemaVersion: string;
  league: {
    id: string;
    name: string;
    sport: string;
    country?: string;
    description?: string;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    cover?: string;
  };
  season?: {
    name: string;
  };
  providers?: {
    metadata?: ProviderConfig;
    participants?: ProviderConfig;
    events?: ProviderConfig;
    standings?: ProviderConfig;
    live?: ProviderConfig;
  };
  participants?: StaticSource;
  events?: StaticSource;
  media?: {
    streams?: MediaSourceConfig[];
    podcasts?: MediaSourceConfig[];
  };
  news?: NewsSource[];
  navigation?: {
    order?: string[];
    labels?: Record<string, string>;
  };
  mappings?: {
    participants?: Record<string, Record<string, string>>;
    events?: Record<string, Record<string, string>>;
  };
  requirements?: Record<string, RequirementConfig>;
}

export interface ProviderConfig {
  type: 'thesportsdb' | 'sportscore' | 'static-json' | 'generic-rest';
  leagueId?: string;
  apiUrl?: string;
  source?: string;
}

export interface StaticSource {
  source: string;
}

export interface MediaSourceConfig {
  id: string;
  name: string;
  provider: 'youtube' | 'spotify' | 'rss' | 'generic-web';
  channelId?: string;
  showId?: string;
  url?: string;
}

export interface NewsSource {
  type: 'rss' | 'atom';
  url: string;
}

export interface RequirementConfig {
  type: 'api-key' | 'oauth';
  requiredFor: string[];
  setupUrl?: string;
}
