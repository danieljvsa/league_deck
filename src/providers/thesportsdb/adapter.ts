import { ProviderAdapter, ProviderResponse, normalizeEventStatus, normalizeScore } from '../types';
import { Participant, Event, Standing } from '../../domain';
import { fetchJson } from '../../core/networking/fetch';

const THESPORTSDB_API_KEY = '123';
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}`;

interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strTeamBadge: string;
  strCountry: string;
  strSport: string;
}

interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  dateEvent: string;
  dateEventLocal?: string | null;
  strTime: string;
  strTimeLocal?: string | null;
  strVenue: string;
  idHomeTeam: string;
  idAwayTeam: string;
}

interface TheSportsDBResponse {
  teams?: TheSportsDBTeam[];
  events?: TheSportsDBEvent[];
  table?: Array<{
    intRank: string;
    idTeam: string;
    strTeam: string;
    intPlayed: string;
    intWin: string;
    intDraw: string;
    intLoss: string;
    intGoalsFor: string;
    intGoalsAgainst: string;
    intGoalDifference: string;
    intPoints: string;
  }>;
}

export class TheSportsDBAdapter implements ProviderAdapter {
  id = 'thesportsdb';
  name = 'TheSportsDB';

  async fetchParticipants(leagueId: string, _season?: string): Promise<Participant[]> {
    const result = await fetchJson<TheSportsDBResponse>(
      `${BASE_URL}/lookup_all_teams.php?id=${leagueId}`
    );

    if (!result.success || !result.data?.teams) return [];

    return result.data.teams.map((team) => ({
      id: team.idTeam,
      name: team.strTeam,
      shortName: team.strTeamShort || team.strTeam,
      logo: team.strTeamBadge,
      sport: team.strSport,
      country: team.strCountry,
    }));
  }

  async fetchEvents(leagueId: string, season?: string): Promise<Event[]> {
    let url = `${BASE_URL}/eventsseason.php?id=${leagueId}`;
    if (season) {
      url += `&s=${season}`;
    }

    const result = await fetchJson<TheSportsDBResponse>(url);

    if (!result.success || !result.data?.events) return [];

    return result.data.events.map((event) => ({
      id: event.idEvent,
      name: event.strEvent,
      competitionId: leagueId,
      seasonId: season || undefined,
      date: event.dateEvent,
      time: event.strTime,
      status: normalizeEventStatus(event.strStatus),
      homeParticipantId: event.idHomeTeam,
      awayParticipantId: event.idAwayTeam,
      score: normalizeScore(
        event.intHomeScore ? parseInt(event.intHomeScore, 10) : null,
        event.intAwayScore ? parseInt(event.intAwayScore, 10) : null
      ),
      venue: event.strVenue,
    }));
  }

  async fetchStandings(leagueId: string, season?: string): Promise<Standing[]> {
    let url = `${BASE_URL}/lookuptable.php?l=${leagueId}`;
    if (season) {
      url += `&s=${season}`;
    }

    const result = await fetchJson<TheSportsDBResponse>(url);

    if (!result.success || !result.data?.table) return [];

    return [{
      id: `standings-${leagueId}${season ? `-${season}` : ''}`,
      competitionId: leagueId,
      seasonId: season || '',
      type: 'table',
      entries: result.data.table.map((row) => ({
        position: parseInt(row.intRank, 10),
        participantId: row.idTeam,
        played: parseInt(row.intPlayed, 10),
        won: parseInt(row.intWin, 10),
        drawn: parseInt(row.intDraw, 10),
        lost: parseInt(row.intLoss, 10),
        goalsFor: parseInt(row.intGoalsFor, 10),
        goalsAgainst: parseInt(row.intGoalsAgainst, 10),
        goalDifference: parseInt(row.intGoalDifference, 10),
        points: parseInt(row.intPoints, 10),
      })),
    }];
  }
}
