import { validatePackage, validateSchemaVersion } from '../core/package/validator';
import { deriveCapabilities, getEnabledCapabilities, hasCapability } from '../core/capabilities/derive';
import j1Package from '../../league packages/j1-league.json';

describe('J1 League Package v1.0', () => {
  it('passes schema validation', () => {
    const result = validatePackage(j1Package);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('has schemaVersion 1.0', () => {
    expect(j1Package.schemaVersion).toBe('1.0');
    expect(validateSchemaVersion(j1Package.schemaVersion)).toBe(true);
  });

  it('uses canonical thesportsdb provider type', () => {
    const providers = j1Package.providers!;
    expect(providers.metadata?.type).toBe('thesportsdb');
    expect(providers.participants?.type).toBe('thesportsdb');
    expect(providers.events?.type).toBe('thesportsdb');
    expect(providers.standings?.type).toBe('thesportsdb');
  });

  it('has leagueId on all thesportsdb providers', () => {
    const providers = j1Package.providers!;
    expect(providers.metadata?.leagueId).toBe('4633');
    expect(providers.participants?.leagueId).toBe('4633');
    expect(providers.events?.leagueId).toBe('4633');
    expect(providers.standings?.leagueId).toBe('4633');
  });

  it('has season on all providers', () => {
    const providers = j1Package.providers!;
    expect(providers.metadata?.season).toBe('2026');
    expect(providers.participants?.season).toBe('2026');
    expect(providers.events?.season).toBe('2026');
    expect(providers.standings?.season).toBe('2026');
  });

  it('does not use thesportsdb-v1 provider type', () => {
    const providers = j1Package.providers!;
    for (const key of Object.keys(providers)) {
      const provider = (providers as Record<string, any>)[key];
      if (provider?.type) {
        expect(provider.type).not.toBe('thesportsdb-v1');
      }
    }
  });

  it('does not use leagueName field', () => {
    const providers = j1Package.providers!;
    for (const key of Object.keys(providers)) {
      const provider = (providers as Record<string, any>)[key];
      expect(provider?.leagueName).toBeUndefined();
    }
  });

  it('has correct league metadata', () => {
    expect(j1Package.league.id).toBe('j1-league');
    expect(j1Package.league.name).toBe('J1 League');
    expect(j1Package.league.sport).toBe('football');
    expect(j1Package.league.country).toBe('JP');
  });

  it('has season 2026', () => {
    expect(j1Package.season?.name).toBe('2026');
  });

  it('has navigation config', () => {
    expect(j1Package.navigation?.order).toBeDefined();
    expect(j1Package.navigation?.order).toContain('overview');
    expect(j1Package.navigation?.order).toContain('events');
    expect(j1Package.navigation?.order).toContain('standings');
    expect(j1Package.navigation?.order).toContain('participants');
  });

  it('has empty media arrays (not errors)', () => {
    expect(j1Package.media?.streams).toEqual([]);
    expect(j1Package.media?.podcasts).toEqual([]);
  });

  it('does not advertise unfinished live provider', () => {
    expect((j1Package.providers as any)?.live).toBeUndefined();
  });

  describe('capabilities', () => {
    const caps = deriveCapabilities(j1Package as any);
    const enabled = getEnabledCapabilities(caps);

    it('includes overview, events, standings, participants', () => {
      expect(enabled).toContain('overview');
      expect(enabled).toContain('events');
      expect(enabled).toContain('standings');
      expect(enabled).toContain('participants');
    });

    it('does not include live', () => {
      expect(hasCapability(caps, 'live')).toBe(false);
    });

    it('does not include news', () => {
      expect(hasCapability(caps, 'news')).toBe(false);
    });

    it('does not include streams', () => {
      expect(hasCapability(caps, 'streams')).toBe(false);
    });

    it('does not include podcasts', () => {
      expect(hasCapability(caps, 'podcasts')).toBe(false);
    });

    it('expected capability set matches definition of done', () => {
      expect(enabled.sort()).toEqual(['events', 'overview', 'participants', 'standings'].sort());
    });
  });
});
