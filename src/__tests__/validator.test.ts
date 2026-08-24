import { validatePackage, validateSchemaVersion, validateUrl } from '../core/package/validator';

describe('validatePackage', () => {
  it('rejects non-object input', () => {
    const result = validatePackage(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('root');
  });

  it('requires schemaVersion', () => {
    const result = validatePackage({ league: { id: 'a', name: 'b', sport: 'c' } });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'schemaVersion')).toBe(true);
  });

  it('requires league object', () => {
    const result = validatePackage({ schemaVersion: '1.0' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'league')).toBe(true);
  });

  it('requires league.id, league.name, league.sport', () => {
    const result = validatePackage({ schemaVersion: '1.0', league: {} });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'league.id')).toBe(true);
    expect(result.errors.some(e => e.field === 'league.name')).toBe(true);
    expect(result.errors.some(e => e.field === 'league.sport')).toBe(true);
  });

  it('accepts valid minimal package', () => {
    const result = validatePackage({
      schemaVersion: '1.0',
      league: { id: 'j1', name: 'J1 League', sport: 'football' },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects unknown provider type', () => {
    const result = validatePackage({
      schemaVersion: '1.0',
      league: { id: 'j1', name: 'J1', sport: 'football' },
      providers: {
        events: { type: 'unknown-provider' },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'providers.events.type')).toBe(true);
  });

  it('requires leagueId for thesportsdb provider', () => {
    const result = validatePackage({
      schemaVersion: '1.0',
      league: { id: 'j1', name: 'J1', sport: 'football' },
      providers: {
        events: { type: 'thesportsdb' },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'providers.events.leagueId')).toBe(true);
  });

  it('accepts valid thesportsdb provider with leagueId', () => {
    const result = validatePackage({
      schemaVersion: '1.0',
      league: { id: 'j1', name: 'J1', sport: 'football' },
      providers: {
        events: { type: 'thesportsdb', leagueId: '4633', season: '2026' },
      },
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateSchemaVersion', () => {
  it('accepts version 1.0', () => {
    expect(validateSchemaVersion('1.0')).toBe(true);
  });

  it('accepts version 1.2.3', () => {
    expect(validateSchemaVersion('1.2.3')).toBe(true);
  });

  it('rejects version 0.1', () => {
    expect(validateSchemaVersion('0.1')).toBe(false);
  });

  it('rejects version 2.0', () => {
    expect(validateSchemaVersion('2.0')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('accepts valid https url', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('accepts valid http url', () => {
    expect(validateUrl('http://example.com/path')).toBe(true);
  });

  it('rejects invalid url', () => {
    expect(validateUrl('not-a-url')).toBe(false);
  });

  it('rejects ftp protocol', () => {
    expect(validateUrl('ftp://example.com')).toBe(false);
  });
});
