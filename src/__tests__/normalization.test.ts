import { normalizeEventStatus, normalizeScore, normalizeParticipant, normalizeEvent, normalizeStanding } from '../providers/types';

describe('normalizeEventStatus', () => {
  it('maps FT to finished', () => {
    expect(normalizeEventStatus('FT')).toBe('finished');
  });

  it('maps NS to scheduled', () => {
    expect(normalizeEventStatus('NS')).toBe('scheduled');
  });

  it('maps 1H to live', () => {
    expect(normalizeEventStatus('1H')).toBe('live');
  });

  it('maps 2H to live', () => {
    expect(normalizeEventStatus('2H')).toBe('live');
  });

  it('maps HT to halftime', () => {
    expect(normalizeEventStatus('HT')).toBe('halftime');
  });

  it('maps IN_PROGRESS to live', () => {
    expect(normalizeEventStatus('IN_PROGRESS')).toBe('live');
  });

  it('maps COMPLETED to finished', () => {
    expect(normalizeEventStatus('COMPLETED')).toBe('finished');
  });

  it('maps POSTPONED to postponed', () => {
    expect(normalizeEventStatus('POSTPONED')).toBe('postponed');
  });

  it('maps CANCELLED to cancelled', () => {
    expect(normalizeEventStatus('CANCELLED')).toBe('cancelled');
  });

  it('maps unknown status to scheduled', () => {
    expect(normalizeEventStatus('UNKNOWN')).toBe('scheduled');
  });

  it('is case-insensitive', () => {
    expect(normalizeEventStatus('ft')).toBe('finished');
    expect(normalizeEventStatus('Ft')).toBe('finished');
  });
});

describe('normalizeScore', () => {
  it('creates score with display', () => {
    const score = normalizeScore(2, 1);
    expect(score.home).toBe(2);
    expect(score.away).toBe(1);
    expect(score.display).toBe('2 - 1');
  });

  it('creates score without display when null values', () => {
    const score = normalizeScore(null, null);
    expect(score.home).toBeNull();
    expect(score.away).toBeNull();
    expect(score.display).toBeUndefined();
  });

  it('uses custom display when provided', () => {
    const score = normalizeScore(2, 1, '2-1');
    expect(score.display).toBe('2-1');
  });
});

describe('normalizeParticipant', () => {
  it('normalizes participant data', () => {
    const participant = normalizeParticipant({
      id: '123',
      name: 'Urawa Red Diamonds',
      shortName: 'URD',
      logo: 'https://example.com/logo.png',
      sport: 'football',
      country: 'JP',
    });
    expect(participant.id).toBe('123');
    expect(participant.name).toBe('Urawa Red Diamonds');
    expect(participant.shortName).toBe('URD');
    expect(participant.logo).toBe('https://example.com/logo.png');
    expect(participant.sport).toBe('football');
    expect(participant.country).toBe('JP');
  });

  it('handles optional fields', () => {
    const participant = normalizeParticipant({ id: '1', name: 'Test' });
    expect(participant.shortName).toBeUndefined();
    expect(participant.logo).toBeUndefined();
  });
});

describe('normalizeEvent', () => {
  it('normalizes event data with seasonId', () => {
    const event = normalizeEvent({
      id: 'evt-1',
      name: 'Urawa vs Yokohama',
      competitionId: '4633',
      seasonId: '2026',
      date: '2026-03-01',
      time: '14:00',
      status: 'NS',
      homeParticipantId: 'team-1',
      awayParticipantId: 'team-2',
      homeScore: null,
      awayScore: null,
      venue: 'Saitama Stadium',
    });
    expect(event.id).toBe('evt-1');
    expect(event.seasonId).toBe('2026');
    expect(event.status).toBe('scheduled');
    expect(event.competitionId).toBe('4633');
  });

  it('normalizes completed event with scores', () => {
    const event = normalizeEvent({
      id: 'evt-2',
      name: 'Test Match',
      competitionId: '4633',
      date: '2026-03-01',
      status: 'FT',
      homeScore: 2,
      awayScore: 1,
    });
    expect(event.status).toBe('finished');
    expect(event.score?.home).toBe(2);
    expect(event.score?.away).toBe(1);
    expect(event.score?.display).toBe('2 - 1');
  });

  it('handles missing optional fields', () => {
    const event = normalizeEvent({
      id: 'evt-3',
      name: 'Test',
      competitionId: '4633',
      date: '2026-03-01',
      status: 'NS',
    });
    expect(event.seasonId).toBeUndefined();
    expect(event.homeParticipantId).toBeUndefined();
    expect(event.venue).toBeUndefined();
  });
});

describe('normalizeStanding', () => {
  it('normalizes standing with entries', () => {
    const standing = normalizeStanding({
      id: 'standings-4633-2026',
      competitionId: '4633',
      seasonId: '2026',
      type: 'table',
      entries: [
        {
          position: 1,
          participantId: 'team-1',
          played: 10,
          won: 7,
          drawn: 2,
          lost: 1,
          goalsFor: 20,
          goalsAgainst: 8,
          goalDifference: 12,
          points: 23,
        },
      ],
    });
    expect(standing.id).toBe('standings-4633-2026');
    expect(standing.seasonId).toBe('2026');
    expect(standing.type).toBe('table');
    expect(standing.entries).toHaveLength(1);
    expect(standing.entries[0].position).toBe(1);
    expect(standing.entries[0].points).toBe(23);
  });
});
