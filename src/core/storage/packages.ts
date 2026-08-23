import { getDatabase } from './database';
import { LeaguePackage } from '../package/schema';
import { Capability } from '../../domain';

export interface InstalledLeague {
  id: string;
  package: LeaguePackage;
  capabilities: Capability[];
  installedAt: string;
  lastUpdated: string;
  manifestUrl?: string;
  manifestHash?: string;
}

export async function getInstalledLeagues(): Promise<InstalledLeague[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    manifest: string;
    capabilities: string;
    installed_at: string;
    last_updated: string;
    manifest_url: string | null;
    manifest_hash: string | null;
  }>('SELECT * FROM installed_packages ORDER BY last_updated DESC');

  return rows.map((row) => ({
    id: row.id,
    package: JSON.parse(row.manifest),
    capabilities: JSON.parse(row.capabilities),
    installedAt: row.installed_at,
    lastUpdated: row.last_updated,
    manifestUrl: row.manifest_url || undefined,
    manifestHash: row.manifest_hash || undefined,
  }));
}

export async function getInstalledLeague(id: string): Promise<InstalledLeague | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    manifest: string;
    capabilities: string;
    installed_at: string;
    last_updated: string;
    manifest_url: string | null;
    manifest_hash: string | null;
  }>('SELECT * FROM installed_packages WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    package: JSON.parse(row.manifest),
    capabilities: JSON.parse(row.capabilities),
    installedAt: row.installed_at,
    lastUpdated: row.last_updated,
    manifestUrl: row.manifest_url || undefined,
    manifestHash: row.manifest_hash || undefined,
  };
}

export async function installPackage(pkg: LeaguePackage, manifestUrl?: string): Promise<InstalledLeague> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getInstalledLeague(pkg.league.id);

  const installed: InstalledLeague = {
    id: pkg.league.id,
    package: pkg,
    capabilities: [], // Will be set by caller
    installedAt: existing?.installedAt || now,
    lastUpdated: now,
    manifestUrl,
  };

  await db.runAsync(
    `INSERT OR REPLACE INTO installed_packages (id, manifest, capabilities, installed_at, last_updated, manifest_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      installed.id,
      JSON.stringify(installed.package),
      JSON.stringify(installed.capabilities),
      installed.installedAt,
      installed.lastUpdated,
      installed.manifestUrl || null,
    ]
  );

  return installed;
}

export async function updatePackageCapabilities(id: string, capabilities: Capability[]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'UPDATE installed_packages SET capabilities = ?, last_updated = ? WHERE id = ?',
    [JSON.stringify(capabilities), now, id]
  );
}

export async function uninstallPackage(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM installed_packages WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function packageExists(id: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM installed_packages WHERE id = ?',
    [id]
  );
  return (row?.count ?? 0) > 0;
}
