import { Event, Participant, Standing, Ranking, TimelineEvent, Score, EventStatus } from '../domain';
import { ProviderConfig } from '../core/package/schema';

export interface ProviderAdapter {
  id: string;
  name: string;
  
  fetchParticipants?(leagueId: string, season?: string): Promise<Participant[]>;
  fetchEvents?(leagueId: string, season?: string): Promise<Event[]>;
  fetchStandings?(leagueId: string, season?: string): Promise<Standing[]>;
  fetchRankings?(leagueId: string, season?: string): Promise<Ranking[]>;
  fetchEvent?(eventId: string): Promise<Event | null>;
  fetchTimeline?(eventId: string): Promise<TimelineEvent[]>;
  
  isAvailable?(): Promise<boolean>;
  getAttribution?(): string;
}

export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  requiresApiKey: boolean;
  capabilities: string[];
  attribution?: string;
  website?: string;
}

// Status normalization
const STATUS_MAP: Record<string, EventStatus> = {
  // TheSportsDB statuses
  'FT': 'finished',
  'NS': 'scheduled',
  '1H': 'live',
  '2H': 'live',
  'HT': 'halftime',
  'ET': 'live',
  'P': 'live',
  'SUSP': 'postponed',
  'PST': 'postponed',
  'CANC': 'cancelled',
  'AWD': 'finished',
  'WO': 'finished',
  'PENDING': 'scheduled',
  'IN_PROGRESS': 'live',
  'COMPLETED': 'finished',
  'POSTPONED': 'postponed',
  'CANCELLED': 'cancelled',
  // Generic mappings
  'scheduled': 'scheduled',
  'live': 'live',
  'in_play': 'in_play',
  'halftime': 'halftime',
  'finished': 'finished',
  'postponed': 'postponed',
  'cancelled': 'cancelled',
};

export function normalizeEventStatus(rawStatus: string): EventStatus {
  return STATUS_MAP[rawStatus.toUpperCase()] || 'scheduled';
}

export function normalizeScore(home: number | null, away: number | null, display?: string): Score {
  return {
    home,
    away,
    display: display || (home !== null && away !== null ? `${home} - ${away}` : undefined),
  };
}

export function normalizeParticipant(data: {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  sport?: string;
  country?: string;
  metadata?: Record<string, unknown>;
}): Participant {
  return {
    id: data.id,
    name: data.name,
    shortName: data.shortName,
    logo: data.logo,
    sport: data.sport,
    country: data.country,
    metadata: data.metadata,
  };
}

export function normalizeEvent(data: {
  id: string;
  name: string;
  competitionId: string;
  seasonId?: string;
  date: string;
  time?: string;
  status: string;
  homeParticipantId?: string;
  awayParticipantId?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string;
  metadata?: Record<string, unknown>;
}): Event {
  return {
    id: data.id,
    name: data.name,
    competitionId: data.competitionId,
    seasonId: data.seasonId,
    date: data.date,
    time: data.time,
    status: normalizeEventStatus(data.status),
    homeParticipantId: data.homeParticipantId,
    awayParticipantId: data.awayParticipantId,
    score: normalizeScore(data.homeScore ?? null, data.awayScore ?? null),
    venue: data.venue,
    metadata: data.metadata,
  };
}

export function normalizeStanding(data: {
  id: string;
  competitionId: string;
  seasonId: string;
  type: 'table' | 'ranking';
  entries: Array<{
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
  }>;
}): Standing {
  return {
    id: data.id,
    competitionId: data.competitionId,
    seasonId: data.seasonId,
    type: data.type,
    entries: data.entries.map((entry) => ({
      position: entry.position,
      participantId: entry.participantId,
      played: entry.played,
      won: entry.won,
      drawn: entry.drawn,
      lost: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      points: entry.points,
      metadata: entry.metadata,
    })),
  };
}
