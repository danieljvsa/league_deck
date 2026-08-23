import { LeaguePackage } from '../package/schema';
import { Capability, Requirement } from '../../domain';

export type { Capability };

export function deriveCapabilities(pkg: LeaguePackage): Capability[] {
  const capabilities: Capability[] = [];

  capabilities.push({
    id: 'overview',
    enabled: true,
    available: true,
    missingRequirements: [],
  });

  if (pkg.events || pkg.providers?.events) {
    capabilities.push({
      id: 'events',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  if (pkg.providers?.live) {
    const missingReqs = getMissingRequirements(pkg, 'live');
    capabilities.push({
      id: 'live',
      enabled: true,
      available: missingReqs.length === 0,
      missingRequirements: missingReqs,
    });
  }

  if (pkg.participants || pkg.providers?.participants) {
    capabilities.push({
      id: 'participants',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  if (pkg.providers?.standings) {
    capabilities.push({
      id: 'standings',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  if (pkg.media?.streams && pkg.media.streams.length > 0) {
    capabilities.push({
      id: 'streams',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  if (pkg.media?.podcasts && pkg.media.podcasts.length > 0) {
    capabilities.push({
      id: 'podcasts',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  if (pkg.news && pkg.news.length > 0) {
    capabilities.push({
      id: 'news',
      enabled: true,
      available: true,
      missingRequirements: [],
    });
  }

  return capabilities;
}

function getMissingRequirements(pkg: LeaguePackage, capability: string): Requirement[] {
  if (!pkg.requirements) return [];

  const missing: Requirement[] = [];

  for (const [key, req] of Object.entries(pkg.requirements)) {
    if (req.requiredFor.includes(capability)) {
      missing.push({
        type: req.type,
        provider: key,
        description: req.setupUrl ? `Visit ${req.setupUrl} for setup instructions` : undefined,
      });
    }
  }

  return missing;
}

export function getEnabledCapabilities(capabilities: Capability[]): string[] {
  return capabilities.filter((c) => c.enabled && c.available).map((c) => c.id);
}

export function hasCapability(capabilities: Capability[], capabilityId: string): boolean {
  const cap = capabilities.find((c) => c.id === capabilityId);
  return cap?.enabled === true && cap?.available === true;
}
