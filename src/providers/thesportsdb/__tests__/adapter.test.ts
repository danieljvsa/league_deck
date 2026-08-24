/* eslint-disable import/first */
jest.mock('../../../core/networking/fetch', () => ({
  fetchJson: jest.fn(),
}));

import { TheSportsDBAdapter } from '../adapter';
import teamsResponse from './fixtures/teams-response.json';
import eventResponse from './fixtures/event-season-response.json';
import standingsResponse from './fixtures/standings-response.json';
import { fetchJson } from '../../../core/networking/fetch';

const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;
const adapter = new TheSportsDBAdapter();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TheSportsDBAdapter', () => {
  describe('fetchParticipants', () => {
    it('returns normalized participants from teams response', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: teamsResponse });

      const participants = await adapter.fetchParticipants('4633');

      expect(participants).toHaveLength(2);
      expect(participants[0].id).toBe('133923');
      expect(participants[0].name).toBe('Urawa Red Diamonds');
      expect(participants[0].shortName).toBe('Urawa');
      expect(participants[0].logo).toBe('https://www.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png');
      expect(participants[0].sport).toBe('Soccer');
      expect(participants[0].country).toBe('Japan');
    });

    it('calls correct endpoint with leagueId', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: teamsResponse });

      await adapter.fetchParticipants('4633');

      expect(mockFetchJson).toHaveBeenCalledWith(
        expect.stringContaining('lookup_all_teams.php?id=4633')
      );
    });

    it('returns empty array on failure', async () => {
      mockFetchJson.mockResolvedValue({ success: false, error: 'Not found' });

      const participants = await adapter.fetchParticipants('99999');

      expect(participants).toEqual([]);
    });
  });

  describe('fetchEvents', () => {
    it('returns normalized events using dateEvent field', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: eventResponse });

      const events = await adapter.fetchEvents('4633', '2026');

      expect(events).toHaveLength(2);

      const match1 = events[0];
      expect(match1.id).toBe('1234567');
      expect(match1.name).toBe('Urawa Red Diamonds vs Yokohama F. Marinos');
      expect(match1.competitionId).toBe('4633');
      expect(match1.seasonId).toBe('2026');
      expect(match1.date).toBe('2026-08-24');
      expect(match1.time).toBe('10:00:00');
      expect(match1.homeParticipantId).toBe('133923');
      expect(match1.awayParticipantId).toBe('133647');
      expect(match1.score?.home).toBe(2);
      expect(match1.score?.away).toBe(1);
      expect(match1.venue).toBe('Saitama Stadium 2002');
    });

    it('passes season parameter in URL', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: eventResponse });

      await adapter.fetchEvents('4633', '2026');

      expect(mockFetchJson).toHaveBeenCalledWith(
        expect.stringContaining('eventsseason.php?id=4633&s=2026')
      );
    });

    it('omits season parameter when not provided', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: eventResponse });

      await adapter.fetchEvents('4633');

      expect(mockFetchJson).toHaveBeenCalledWith(
        expect.stringContaining('eventsseason.php?id=4633')
      );
      expect(mockFetchJson).not.toHaveBeenCalledWith(
        expect.stringContaining('&s=')
      );
    });

    it('normalizes scheduled events with null scores', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: eventResponse });

      const events = await adapter.fetchEvents('4633', '2026');
      const match2 = events[1];

      expect(match2.id).toBe('1234568');
      expect(match2.date).toBe('2026-09-14');
      expect(match2.score?.home).toBeNull();
      expect(match2.score?.away).toBeNull();
      expect(match2.homeParticipantId).toBe('133648');
      expect(match2.awayParticipantId).toBe('133649');
    });

    it('returns empty array on failure', async () => {
      mockFetchJson.mockResolvedValue({ success: false, error: 'Not found' });

      const events = await adapter.fetchEvents('99999', '2026');

      expect(events).toEqual([]);
    });

    it('does not reference strDate field', () => {
      const event = eventResponse.events[0];
      expect(event).not.toHaveProperty('strDate');
      expect(event).toHaveProperty('dateEvent');
      expect(event.dateEvent).toBe('2026-08-24');
    });
  });

  describe('fetchStandings', () => {
    it('returns normalized standings with season', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: standingsResponse });

      const standings = await adapter.fetchStandings('4633', '2026');

      expect(standings).toHaveLength(1);
      const table = standings[0];
      expect(table.id).toBe('standings-4633-2026');
      expect(table.competitionId).toBe('4633');
      expect(table.seasonId).toBe('2026');
      expect(table.type).toBe('table');
      expect(table.entries).toHaveLength(3);
    });

    it('correctly normalizes standings entries', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: standingsResponse });

      const standings = await adapter.fetchStandings('4633', '2026');
      const entry = standings[0].entries[0];

      expect(entry.position).toBe(1);
      expect(entry.participantId).toBe('133923');
      expect(entry.played).toBe(25);
      expect(entry.won).toBe(17);
      expect(entry.drawn).toBe(5);
      expect(entry.lost).toBe(3);
      expect(entry.goalsFor).toBe(48);
      expect(entry.goalsAgainst).toBe(20);
      expect(entry.goalDifference).toBe(28);
      expect(entry.points).toBe(56);
    });

    it('passes season parameter in URL', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: standingsResponse });

      await adapter.fetchStandings('4633', '2026');

      expect(mockFetchJson).toHaveBeenCalledWith(
        expect.stringContaining('lookuptable.php?l=4633&s=2026')
      );
    });

    it('does not produce empty seasonId when season is configured', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: standingsResponse });

      const standings = await adapter.fetchStandings('4633', '2026');

      expect(standings[0].seasonId).toBe('2026');
      expect(standings[0].seasonId).not.toBe('');
    });

    it('returns empty array on failure', async () => {
      mockFetchJson.mockResolvedValue({ success: false, error: 'Not found' });

      const standings = await adapter.fetchStandings('99999', '2026');

      expect(standings).toEqual([]);
    });
  });

  describe('score edge cases', () => {
    it('handles score of 0 correctly', async () => {
      mockFetchJson.mockResolvedValue({
        success: true,
        data: {
          events: [{
            ...eventResponse.events[0],
            intHomeScore: '0',
            intAwayScore: '0',
          }],
        },
      });

      const events = await adapter.fetchEvents('4633', '2026');

      expect(events[0].score?.home).toBe(0);
      expect(events[0].score?.away).toBe(0);
    });

    it('handles null scores for scheduled matches', async () => {
      mockFetchJson.mockResolvedValue({
        success: true,
        data: {
          events: [{
            ...eventResponse.events[1],
            intHomeScore: null,
            intAwayScore: null,
          }],
        },
      });

      const events = await adapter.fetchEvents('4633', '2026');

      expect(events[0].score?.home).toBeNull();
      expect(events[0].score?.away).toBeNull();
    });
  });

  describe('API configuration', () => {
    it('uses correct API key 123', async () => {
      mockFetchJson.mockResolvedValue({ success: true, data: teamsResponse });

      await adapter.fetchParticipants('4633');

      const calledUrl = mockFetchJson.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/api/v1/json/123/');
      expect(calledUrl).not.toContain('/api/v1/json/3/');
    });
  });
});
