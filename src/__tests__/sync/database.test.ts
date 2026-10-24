import { createCatalogRepository } from '@/db/catalogRepository';
import { migrate, SCHEMA_VERSION, serializeTransactions, type SqlDatabase, type SqlValue } from '@/db/database';

import { makeBreed } from '../helpers/factories';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const fakeDatabase = (userVersion: number, rows: Record<string, unknown[]> = {}) => {
  const executed: string[] = [];
  const runs: { sql: string; params: SqlValue[] }[] = [];
  const db: SqlDatabase = {
    execAsync: jest.fn(async (sql: string) => {
      executed.push(sql.trim());
    }),
    runAsync: jest.fn(async (sql: string, params: SqlValue[]) => {
      runs.push({ sql, params });
    }),
    getAllAsync: async <T>(sql: string): Promise<T[]> => (rows[sql] ?? []) as T[],
    getFirstAsync: async <T>(sql: string): Promise<T | null> =>
      (sql.startsWith('PRAGMA user_version') ? { user_version: userVersion } : null) as T | null,
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  };
  return { db, executed, runs };
};

describe('migrate', () => {
  it('runs every migration on a fresh database and bumps user_version', async () => {
    const { db, executed } = fakeDatabase(0);
    await migrate(db);
    expect(executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS breeds'))).toBe(true);
    expect(executed).toContain(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });

  it('is a no-op when the schema is current', async () => {
    const { db, executed } = fakeDatabase(SCHEMA_VERSION);
    await migrate(db);
    expect(executed).toEqual([]);
  });
});

describe('serializeTransactions', () => {
  it('never lets two transactions overlap, even when one fails', async () => {
    const { db } = fakeDatabase(SCHEMA_VERSION);
    let open = 0;
    let maxOpen = 0;
    db.withTransactionAsync = async (task) => {
      open += 1;
      maxOpen = Math.max(maxOpen, open);
      try {
        await task();
      } finally {
        open -= 1;
      }
    };
    const safe = serializeTransactions(db);
    const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));

    const results = await Promise.allSettled([
      safe.withTransactionAsync(tick),
      safe.withTransactionAsync(async () => {
        await tick();
        throw new Error('boom');
      }),
      safe.withTransactionAsync(tick),
    ]);

    expect(maxOpen).toBe(1);
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled']);
  });
});

describe('catalogRepository', () => {
  it('round-trips breeds and drops payloads from an older format', async () => {
    const good = JSON.stringify({ v: 1, breed: makeBreed({ id: 'keep' }) });
    const stale = JSON.stringify({ v: 0, breed: { id: 'old' } });
    const { db } = fakeDatabase(SCHEMA_VERSION, {
      'SELECT payload FROM breeds ORDER BY name': [{ payload: good }, { payload: stale }, { payload: '{not json' }],
    });

    const loaded = await createCatalogRepository(db).loadBreeds();

    expect(loaded.map((breed) => breed.id)).toEqual(['keep']);
  });

  it('upserts inside a single transaction', async () => {
    const { db, runs } = fakeDatabase(SCHEMA_VERSION);
    await createCatalogRepository(db).upsertBreeds([makeBreed({ id: 'a' }), makeBreed({ id: 'b' })], 42);
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(runs.map((run) => run.params[0])).toEqual(['a', 'b']);
  });

  it('parses persisted sync state defensively', async () => {
    const { db } = fakeDatabase(SCHEMA_VERSION, {
      'SELECT key, value FROM sync_state': [
        { key: 'lastSuccessAt', value: '1700000000000' },
        { key: 'lastOutcome', value: 'bogus' },
      ],
    });
    await expect(createCatalogRepository(db).loadSyncState()).resolves.toEqual({
      lastSuccessAt: 1700000000000,
      lastAttemptAt: null,
      lastOutcome: null,
      lastError: null,
    });
  });
});
