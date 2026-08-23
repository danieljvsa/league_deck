import { 
  normalizeEventStatus, 
  normalizeScore, 
  normalizeParticipant, 
  normalizeEvent, 
  normalizeStanding 
} from '../types';

export const Normalizer = {
  eventStatus: normalizeEventStatus,
  score: normalizeScore,
  participant: normalizeParticipant,
  event: normalizeEvent,
  standing: normalizeStanding,

  participants<T extends Record<string, unknown>>(
    rawParticipants: T[],
    mapper: (item: T) => {
      id: string;
      name: string;
      shortName?: string;
      logo?: string;
      sport?: string;
      country?: string;
    }
  ) {
    return rawParticipants.map((item) => normalizeParticipant(mapper(item)));
  },

  events<T extends Record<string, unknown>>(
    rawEvents: T[],
    competitionId: string,
    mapper: (item: T) => {
      id: string;
      name: string;
      date: string;
      time?: string;
      status: string;
      homeParticipantId?: string;
      awayParticipantId?: string;
      homeScore?: number | null;
      awayScore?: number | null;
      venue?: string;
    }
  ) {
    return rawEvents.map((item) => {
      const mapped = mapper(item);
      return normalizeEvent({
        ...mapped,
        competitionId,
      });
    });
  },

  standings<T extends Record<string, unknown>>(
    rawStandings: T[],
    competitionId: string,
    seasonId: string,
    mapper: (item: T) => {
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
      }>;
    }
  ) {
    return rawStandings.map((item) => {
      const mapped = mapper(item);
      return normalizeStanding({
        id: `standings-${competitionId}`,
        competitionId,
        seasonId,
        type: 'table',
        entries: mapped.entries,
      });
    });
  },

  mapIds<T>(
    items: T[],
    idField: keyof T,
    mapping: Record<string, string>
  ): T[] {
    return items.map((item) => {
      const id = String(item[idField]);
      const mappedId = mapping[id] || id;
      return { ...item, [idField]: mappedId };
    });
  },

  mergeProviders<T>(
    primary: T[],
    secondary: T[],
    idField: keyof T,
    strategy: 'primary' | 'secondary' | 'merge' = 'primary'
  ): T[] {
    const merged = new Map<string, T>();
    
    for (const item of primary) {
      merged.set(String(item[idField]), item);
    }
    
    for (const item of secondary) {
      const id = String(item[idField]);
      if (!merged.has(id)) {
        merged.set(id, item);
      } else if (strategy === 'merge') {
        merged.set(id, { ...merged.get(id), ...item });
      }
    }
    
    return Array.from(merged.values());
  },
};

export default Normalizer;
