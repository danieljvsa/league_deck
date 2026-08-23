import { getDatabase } from './database';

export interface CacheEntry<T = unknown> {
  id?: number;
  packageId: string;
  providerId: string;
  dataType: string;
  data: T;
  fetchedAt: string;
  expiresAt?: string;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCachedData<T = unknown>(
  packageId: string,
  providerId: string,
  dataType: string
): Promise<T | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    data: string;
    fetched_at: string;
    expires_at: string | null;
  }>(
    'SELECT data, fetched_at, expires_at FROM provider_cache WHERE package_id = ? AND provider_id = ? AND data_type = ?',
    [packageId, providerId, dataType]
  );

  if (!row) return null;

  if (row.expires_at) {
    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) {
      await db.runAsync(
        'DELETE FROM provider_cache WHERE package_id = ? AND provider_id = ? AND data_type = ?',
        [packageId, providerId, dataType]
      );
      return null;
    }
  }

  return JSON.parse(row.data) as T;
}

export async function setCachedData<T = unknown>(
  packageId: string,
  providerId: string,
  dataType: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  await db.runAsync(
    `INSERT OR REPLACE INTO provider_cache (package_id, provider_id, data_type, data, fetched_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      packageId,
      providerId,
      dataType,
      JSON.stringify(data),
      now.toISOString(),
      expiresAt.toISOString(),
    ]
  );
}

export async function invalidateCache(
  packageId: string,
  providerId?: string,
  dataType?: string
): Promise<void> {
  const db = await getDatabase();
  
  if (providerId && dataType) {
    await db.runAsync(
      'DELETE FROM provider_cache WHERE package_id = ? AND provider_id = ? AND data_type = ?',
      [packageId, providerId, dataType]
    );
  } else if (providerId) {
    await db.runAsync(
      'DELETE FROM provider_cache WHERE package_id = ? AND provider_id = ?',
      [packageId, providerId]
    );
  } else {
    await db.runAsync(
      'DELETE FROM provider_cache WHERE package_id = ?',
      [packageId]
    );
  }
}

export async function clearAllCache(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM provider_cache');
}
