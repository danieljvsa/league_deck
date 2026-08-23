import { LeaguePackage } from './schema';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validatePackage(pkg: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Package must be an object' }] };
  }

  const p = pkg as Record<string, unknown>;

  if (!p.schemaVersion || typeof p.schemaVersion !== 'string') {
    errors.push({ field: 'schemaVersion', message: 'schemaVersion is required and must be a string' });
  }

  if (!p.league || typeof p.league !== 'object') {
    errors.push({ field: 'league', message: 'league is required and must be an object' });
  } else {
    const league = p.league as Record<string, unknown>;
    if (!league.id || typeof league.id !== 'string') {
      errors.push({ field: 'league.id', message: 'league.id is required' });
    }
    if (!league.name || typeof league.name !== 'string') {
      errors.push({ field: 'league.name', message: 'league.name is required' });
    }
    if (!league.sport || typeof league.sport !== 'string') {
      errors.push({ field: 'league.sport', message: 'league.sport is required' });
    }
  }

  if (p.branding && typeof p.branding === 'object') {
    const branding = p.branding as Record<string, unknown>;
    if (branding.logo && typeof branding.logo !== 'string') {
      errors.push({ field: 'branding.logo', message: 'branding.logo must be a string' });
    }
    if (branding.primaryColor && typeof branding.primaryColor !== 'string') {
      errors.push({ field: 'branding.primaryColor', message: 'branding.primaryColor must be a string' });
    }
  }

  if (p.providers && typeof p.providers === 'object') {
    const providers = p.providers as Record<string, unknown>;
    for (const [key, value] of Object.entries(providers)) {
      if (typeof value !== 'object' || value === null) {
        errors.push({ field: `providers.${key}`, message: `providers.${key} must be an object` });
      } else {
        const provider = value as Record<string, unknown>;
        if (!provider.type || typeof provider.type !== 'string') {
          errors.push({ field: `providers.${key}.type`, message: `providers.${key}.type is required` });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSchemaVersion(version: string): boolean {
  const major = parseInt(version.split('.')[0], 10);
  return major === 1;
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
