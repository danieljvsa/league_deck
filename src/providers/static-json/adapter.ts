import { ProviderAdapter, normalizeParticipant, normalizeEvent } from '../types';
import { Participant, Event } from '../../domain';

interface StaticParticipantsFile {
  participants: Array<{
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
    sport?: string;
    country?: string;
    metadata?: Record<string, unknown>;
  }>;
}

interface StaticEventsFile {
  events: Array<{
    id: string;
    name: string;
    date: string;
    time?: string;
    status?: string;
    homeTeamId?: string;
    awayTeamId?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    venue?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export class StaticJsonAdapter implements ProviderAdapter {
  id = 'static-json';
  name = 'Static JSON';

  async fetchParticipants(source: string): Promise<Participant[]> {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        if (__DEV__) console.error(`Failed to fetch participants: ${response.status}`);
        return [];
      }
      
      const data: StaticParticipantsFile = await response.json();
      if (!data.participants) return [];

      return data.participants.map((p) => normalizeParticipant({
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        logo: p.logo,
        sport: p.sport,
        country: p.country,
        metadata: p.metadata,
      }));
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch participants from static JSON:', error);
      return [];
    }
  }

  async fetchEvents(source: string, competitionId?: string): Promise<Event[]> {
    try {
      const response = await fetch(source);
      if (!response.ok) {
        if (__DEV__) console.error(`Failed to fetch events: ${response.status}`);
        return [];
      }
      
      const data: StaticEventsFile = await response.json();
      if (!data.events) return [];

      return data.events.map((e) => normalizeEvent({
        id: e.id,
        name: e.name,
        competitionId: competitionId || '',
        date: e.date,
        time: e.time,
        status: e.status || 'scheduled',
        homeParticipantId: e.homeTeamId,
        awayParticipantId: e.awayTeamId,
        homeScore: e.homeScore,
        awayScore: e.awayScore,
        venue: e.venue,
        metadata: e.metadata,
      }));
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch events from static JSON:', error);
      return [];
    }
  }

  async fetchParticipantsFromUrl(url: string): Promise<Participant[]> {
    return this.fetchParticipants(url);
  }

  async fetchEventsFromUrl(url: string, competitionId?: string): Promise<Event[]> {
    return this.fetchEvents(url, competitionId);
  }
}
