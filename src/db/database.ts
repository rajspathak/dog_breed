import * as SQLite from 'expo-sqlite';

export type SqlValue = string | number | null;

export type SqlDatabase = {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};

const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS breeds (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    group_id TEXT,
    payload TEXT NOT NULL,
    synced_at INTEGER NOT NULL,
    detail_synced_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_breeds_group ON breeds (group_id);
  CREATE TABLE IF NOT EXISTS breed_groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    breed_ids TEXT NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS image_cache (
    url TEXT PRIMARY KEY NOT NULL,
    bucket TEXT NOT NULL,
    file_name TEXT NOT NULL,
    bytes INTEGER NOT NULL,
    last_access INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_image_cache_lru ON image_cache (bucket, last_access);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export const migrate = async (db: SqlDatabase): Promise<void> => {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const statement = MIGRATIONS[version];
    if (!statement) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(statement);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
};

export const serializeTransactions = (db: SqlDatabase): SqlDatabase => {
  let tail: Promise<void> = Promise.resolve();
  return {
    execAsync: (source) => db.execAsync(source),
    runAsync: (source, params) => db.runAsync(source, params),
    getAllAsync: <T>(source: string, params: SqlValue[]) => db.getAllAsync<T>(source, params),
    getFirstAsync: <T>(source: string, params: SqlValue[]) => db.getFirstAsync<T>(source, params),
    withTransactionAsync: (task) => {
      const run = tail.then(() => db.withTransactionAsync(task));
      tail = run.catch(() => undefined);
      return run;
    },
  };
};

let connection: Promise<SqlDatabase> | null = null;

export const getDatabase = (): Promise<SqlDatabase> => {
  connection ??= (async () => {
    const db = await SQLite.openDatabaseAsync('dog-breeds.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(db);
    return serializeTransactions(db);
  })().catch((error: unknown) => {
    connection = null;
    throw error;
  });
  return connection;
};
