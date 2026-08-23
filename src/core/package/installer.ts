import { LeaguePackage } from './schema';
import { parsePackage, fetchPackage } from './parser';
import { validatePackage } from './validator';
import { installPackage as dbInstallPackage, updatePackageCapabilities } from '../storage/packages';
import { deriveCapabilities } from '../capabilities/derive';

export interface InstallResult {
  success: boolean;
  packageId?: string;
  errors?: string[];
}

export async function installFromUrl(url: string): Promise<InstallResult> {
  const fetchResult = await fetchPackage(url);
  
  if (!fetchResult.success || !fetchResult.package) {
    return {
      success: false,
      errors: fetchResult.errors || ['Failed to fetch package'],
    };
  }

  return installLeaguePackage(fetchResult.package, url);
}

export async function installLeaguePackage(
  pkg: LeaguePackage,
  manifestUrl?: string
): Promise<InstallResult> {
  const validation = validatePackage(pkg);
  
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
    };
  }

  try {
    const capabilities = deriveCapabilities(pkg);
    const installed = await dbInstallPackage(pkg, manifestUrl);
    installed.capabilities = capabilities;
    await updatePackageCapabilities(pkg.league.id, capabilities);

    return {
      success: true,
      packageId: pkg.league.id,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Installation failed'],
    };
  }
}

export async function uninstallLeaguePackage(packageId: string): Promise<InstallResult> {
  try {
    const { uninstallPackage } = await import('../storage/packages');
    const success = await uninstallPackage(packageId);
    
    if (success) {
      return { success: true, packageId };
    }
    
    return {
      success: false,
      errors: ['Package not found'],
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Uninstall failed'],
    };
  }
}
