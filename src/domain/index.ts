export interface Competition {
  id: string;
  name: string;
  sport: string;
  country?: string;
  description?: string;
}

export interface Season {
  id: string;
  name: string;
  competitionId: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Stage {
  id: string;
  name: string;
  seasonId: string;
  type: 'group' | 'knockout' | 'round' | 'other';
  order: number;
}

export interface Participant {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  sport?: string;
  country?: string;
  metadata?: Record<string, unknown>;
}

export interface Event {
  id: string;
  name: string;
  competitionId: string;
  seasonId?: string;
  stageId?: string;
  date: string;
  time?: string;
  status: EventStatus;
  homeParticipantId?: string;
  awayParticipantId?: string;
  score?: Score;
  venue?: string;
  metadata?: Record<string, unknown>;
}

export type EventStatus = 
  | 'scheduled' 
  | 'live' 
  | 'in_play' 
  | 'halftime' 
  | 'finished' 
  | 'postponed' 
  | 'cancelled';

export interface Score {
  home: number | null;
  away: number | null;
  display?: string;
  HT?: { home: number; away: number };
  metadata?: Record<string, unknown>;
}

export interface Standing {
  id: string;
  competitionId: string;
  seasonId: string;
  type: 'table' | 'ranking';
  entries: StandingEntry[];
  columns?: StandingColumn[];
}

export interface StandingEntry {
  position: number;
  participantId: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
  metadata?: Record<string, unknown>;
}

export interface StandingColumn {
  key: string;
  label: string;
  type: 'number' | 'string' | 'difference';
  sortOrder?: 'asc' | 'desc';
}

export interface Ranking {
  id: string;
  competitionId: string;
  seasonId: string;
  type: 'individual' | 'team';
  entries: RankingEntry[];
}

export interface RankingEntry {
  position: number;
  participantId: string;
  points: number;
  change?: number;
  metadata?: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  eventId: string;
  type: string;
  minute?: number;
  participantId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export type MediaType = 'podcast' | 'stream';

export type MediaProvider = 'youtube' | 'spotify' | 'rss' | 'generic-web';

export interface MediaSource {
  id: string;
  type: MediaType;
  provider: MediaProvider;
  title: string;
  url?: string;
  providerId?: string;
  image?: string;
}

export interface MediaItem {
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  duration?: number;
  publishedAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  source: string;
  tags?: string[];
}

export interface Capability {
  id: string;
  enabled: boolean;
  available: boolean;
  missingRequirements: Requirement[];
}

export interface Requirement {
  type: 'api-key' | 'oauth';
  provider: string;
  description?: string;
}
