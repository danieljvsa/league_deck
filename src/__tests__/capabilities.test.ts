import { deriveCapabilities, getEnabledCapabilities, hasCapability } from '../core/capabilities/derive';
import { LeaguePackage } from '../core/package/schema';

function makePackage(overrides: Partial<LeaguePackage> = {}): LeaguePackage {
  return {
    schemaVersion: '1.0',
    league: { id: 'test', name: 'Test', sport: 'football' },
    ...overrides,
  };
}

describe('deriveCapabilities', () => {
  it('always includes overview', () => {
    const caps = deriveCapabilities(makePackage());
    expect(caps.some(c => c.id === 'overview')).toBe(true);
  });

  it('derives events from providers.events', () => {
    const pkg = makePackage({
      providers: { events: { type: 'thesportsdb', leagueId: '123' } },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'events')).toBe(true);
  });

  it('derives participants from providers.participants', () => {
    const pkg = makePackage({
      providers: { participants: { type: 'thesportsdb', leagueId: '123' } },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'participants')).toBe(true);
  });

  it('derives standings from providers.standings', () => {
    const pkg = makePackage({
      providers: { standings: { type: 'thesportsdb', leagueId: '123' } },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'standings')).toBe(true);
  });

  it('derives streams from non-empty media.streams', () => {
    const pkg = makePackage({
      media: { streams: [{ id: '1', name: 'YouTube', provider: 'youtube', channelId: 'UC123' }] },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'streams')).toBe(true);
  });

  it('does not derive streams from empty media.streams', () => {
    const pkg = makePackage({
      media: { streams: [] },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'streams')).toBe(false);
  });

  it('derives podcasts from non-empty media.podcasts', () => {
    const pkg = makePackage({
      media: { podcasts: [{ id: '1', name: 'Spotify', provider: 'spotify' }] },
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'podcasts')).toBe(true);
  });

  it('derives news from non-empty news array', () => {
    const pkg = makePackage({
      news: [{ type: 'rss', url: 'https://example.com/feed.xml' }],
    });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'news')).toBe(true);
  });

  it('does not derive news from empty news array', () => {
    const pkg = makePackage({ news: [] });
    const caps = deriveCapabilities(pkg);
    expect(caps.some(c => c.id === 'news')).toBe(false);
  });

  it('live capability checks missing requirements', () => {
    const pkg = makePackage({
      providers: { live: { type: 'sportscore', leagueId: '123' } },
      requirements: {
        'api-key': { type: 'api-key', requiredFor: ['live'] },
      },
    });
    const caps = deriveCapabilities(pkg);
    const live = caps.find(c => c.id === 'live');
    expect(live).toBeDefined();
    expect(live!.available).toBe(false);
    expect(live!.missingRequirements).toHaveLength(1);
  });

  it('live capability is available when no requirements', () => {
    const pkg = makePackage({
      providers: { live: { type: 'sportscore', leagueId: '123' } },
    });
    const caps = deriveCapabilities(pkg);
    const live = caps.find(c => c.id === 'live');
    expect(live).toBeDefined();
    expect(live!.available).toBe(true);
  });
});

describe('getEnabledCapabilities', () => {
  it('returns only enabled and available capability ids', () => {
    const pkg = makePackage({
      providers: {
        events: { type: 'thesportsdb', leagueId: '123' },
        standings: { type: 'thesportsdb', leagueId: '123' },
      },
    });
    const caps = deriveCapabilities(pkg);
    const enabled = getEnabledCapabilities(caps);
    expect(enabled).toContain('overview');
    expect(enabled).toContain('events');
    expect(enabled).toContain('standings');
  });
});

describe('hasCapability', () => {
  it('returns true for enabled and available capability', () => {
    const pkg = makePackage({
      providers: { events: { type: 'thesportsdb', leagueId: '123' } },
    });
    const caps = deriveCapabilities(pkg);
    expect(hasCapability(caps, 'events')).toBe(true);
  });

  it('returns false for missing capability', () => {
    const caps = deriveCapabilities(makePackage());
    expect(hasCapability(caps, 'events')).toBe(false);
  });

  it('returns false for unavailable capability', () => {
    const pkg = makePackage({
      providers: { live: { type: 'sportscore', leagueId: '123' } },
      requirements: {
        'api-key': { type: 'api-key', requiredFor: ['live'] },
      },
    });
    const caps = deriveCapabilities(pkg);
    expect(hasCapability(caps, 'live')).toBe(false);
  });
});
