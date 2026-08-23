import { LeaguePackage } from './schema';
import { parsePackage } from './parser';
import { fetchJson } from '../networking';
import { getInstalledLeague, installPackage, updatePackageCapabilities } from '../storage/packages';
import { deriveCapabilities } from '../capabilities/derive';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion?: string;
  latestPackage?: LeaguePackage;
  error?: string;
}

export async function checkForUpdate(manifestUrl: string): Promise<UpdateCheckResult> {
  const result = await fetchJson<unknown>(manifestUrl, { timeout: 15000 });
  
  if (!result.success) {
    return { hasUpdate: false, error: result.error };
  }

  const parseResult = parsePackage(result.data);
  
  if (!parseResult.success || !parseResult.package) {
    return { hasUpdate: false, error: 'Invalid package format' };
  }

  return {
    hasUpdate: true,
    latestPackage: parseResult.package,
  };
}

export async function updatePackage(leagueId: string): Promise<{ success: boolean; error?: string }> {
  const installed = await getInstalledLeague(leagueId);
  
  if (!installed) {
    return { success: false, error: 'Package not installed' };
  }

  if (!installed.manifestUrl) {
    return { success: false, error: 'No manifest URL stored for this package' };
  }

  const updateResult = await checkForUpdate(installed.manifestUrl);
  
  if (updateResult.error || !updateResult.latestPackage) {
    return { success: false, error: updateResult.error || 'No package data received' };
  }

  const capabilities = deriveCapabilities(updateResult.latestPackage);
  await installPackage(updateResult.latestPackage, installed.manifestUrl);
  await updatePackageCapabilities(leagueId, capabilities);

  return { success: true };
}

export async function refreshPackage(leagueId: string): Promise<{ success: boolean; error?: string }> {
  const installed = await getInstalledLeague(leagueId);
  
  if (!installed) {
    return { success: false, error: 'Package not installed' };
  }

  if (!installed.manifestUrl) {
    return { success: false, error: 'No manifest URL stored for this package' };
  }

  const result = await fetchJson<unknown>(installed.manifestUrl, { timeout: 15000 });
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const parseResult = parsePackage(result.data);
  
  if (!parseResult.success || !parseResult.package) {
    return { success: false, error: 'Invalid package format' };
  }

  const capabilities = deriveCapabilities(parseResult.package);
  await installPackage(parseResult.package, installed.manifestUrl);
  await updatePackageCapabilities(leagueId, capabilities);

  return { success: true };
}
