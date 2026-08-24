import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (db) return db;
  
  db = await openDatabaseAsync('openleague.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS installed_packages (
      id TEXT PRIMARY KEY,
      manifest TEXT NOT NULL,
      capabilities TEXT NOT NULL,
      installed_at TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      manifest_url TEXT,
      manifest_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS provider_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      data_type TEXT NOT NULL,
      data TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT,
      FOREIGN KEY (package_id) REFERENCES installed_packages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cache_lookup 
      ON provider_cache(package_id, provider_id, data_type);

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      provider_id TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS downloaded_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id TEXT NOT NULL,
      original_url TEXT NOT NULL,
      local_path TEXT NOT NULL,
      downloaded_at TEXT NOT NULL,
      FOREIGN KEY (package_id) REFERENCES installed_packages(id) ON DELETE CASCADE
    );
  `);
}
