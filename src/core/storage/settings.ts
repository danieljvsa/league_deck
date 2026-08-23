import { getDatabase } from './database';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  autoRefresh: true,
  refreshIntervalMinutes: 5,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM user_settings'
  );

  const settings = { ...DEFAULT_SETTINGS };
  
  for (const row of rows) {
    const key = row.key as keyof AppSettings;
    if (key in settings) {
      try {
        (settings as any)[key] = JSON.parse(row.value);
      } catch {
        (settings as any)[key] = row.value;
      }
    }
  }

  return settings;
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(value), now]
  );
}

export async function resetSettings(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM user_settings');
}

// API Keys management
export interface ApiKeyEntry {
  providerId: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export async function getApiKey(providerId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ api_key: string }>(
    'SELECT api_key FROM api_keys WHERE provider_id = ?',
    [providerId]
  );
  return row?.api_key || null;
}

export async function setApiKey(providerId: string, apiKey: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO api_keys (provider_id, api_key, created_at, updated_at)
     VALUES (?, ?, COALESCE((SELECT created_at FROM api_keys WHERE provider_id = ?), ?), ?)`,
    [providerId, apiKey, providerId, now, now]
  );
}

export async function removeApiKey(providerId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM api_keys WHERE provider_id = ?', [providerId]);
  return result.changes > 0;
}

export async function getAllApiKeys(): Promise<ApiKeyEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    provider_id: string;
    api_key: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM api_keys ORDER BY provider_id');

  return rows.map((row) => ({
    providerId: row.provider_id,
    apiKey: row.api_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
