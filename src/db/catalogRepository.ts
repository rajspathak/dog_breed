import { isRecord, readStringArray } from '@/api/guards';
import type { Breed, BreedGroup } from '@/domain/types';

import type { SqlDatabase } from './database';

const PAYLOAD_VERSION = 1;

type BreedRow = { payload: string };
type GroupRow = { id: string; name: string; breed_ids: string };
type StateRow = { key: string; value: string };

export type SyncOutcome = 'complete' | 'partial' | 'failed';

export type SyncState = {
  lastSuccessAt: number | null;
  lastAttemptAt: number | null;
  lastOutcome: SyncOutcome | null;
  lastError: string | null;
};

const isPersistedBreed = (value: unknown): value is { v: number; breed: Breed } =>
  isRecord(value) &&
  value.v === PAYLOAD_VERSION &&
  isRecord(value.breed) &&
  typeof value.breed.id === 'string' &&
  typeof value.breed.name === 'string' &&
  Array.isArray(value.breed.images) &&
  Array.isArray(value.breed.coatCategories);

const parsePayload = (payload: string): Breed | null => {
  try {
    const parsed: unknown = JSON.parse(payload);
    return isPersistedBreed(parsed) ? parsed.breed : null;
  } catch {
    return null;
  }
};

const serialize = (breed: Breed) => JSON.stringify({ v: PAYLOAD_VERSION, breed });

export const createCatalogRepository = (db: SqlDatabase) => ({
  async loadBreeds(): Promise<Breed[]> {
    const rows = await db.getAllAsync<BreedRow>('SELECT payload FROM breeds ORDER BY name', []);
    return rows.map((row) => parsePayload(row.payload)).filter((breed): breed is Breed => breed !== null);
  },

  async loadGroups(): Promise<BreedGroup[]> {
    const rows = await db.getAllAsync<GroupRow>('SELECT id, name, breed_ids FROM breed_groups', []);
    return rows.map((row) => {
      let breedIds: string[] = [];
      try {
        breedIds = readStringArray(JSON.parse(row.breed_ids));
      } catch {
        breedIds = [];
      }
      return { id: row.id, name: row.name, breedIds };
    });
  },

  async upsertBreeds(breeds: readonly Breed[], syncedAt: number): Promise<void> {
    if (breeds.length === 0) return;
    await db.withTransactionAsync(async () => {
      for (const breed of breeds) {
        await db.runAsync(
          `INSERT INTO breeds (id, name, group_id, payload, synced_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name, group_id = excluded.group_id,
           payload = excluded.payload, synced_at = excluded.synced_at`,
          [breed.id, breed.name, breed.groupId, serialize(breed), syncedAt],
        );
      }
    });
  },

  async upsertBreedDetail(breed: Breed, syncedAt: number): Promise<void> {
    await db.runAsync(
      `INSERT INTO breeds (id, name, group_id, payload, synced_at, detail_synced_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, group_id = excluded.group_id,
       payload = excluded.payload, detail_synced_at = excluded.detail_synced_at`,
      [breed.id, breed.name, breed.groupId, serialize(breed), syncedAt, syncedAt],
    );
  },

  async pruneBreedsNotIn(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const before = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM breeds', []);
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM breeds WHERE id NOT IN (${placeholders})`, [...ids]);
    const after = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM breeds', []);
    return (before?.total ?? 0) - (after?.total ?? 0);
  },

  async replaceGroups(groups: readonly BreedGroup[], syncedAt: number): Promise<void> {
    if (groups.length === 0) return;
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM breed_groups', []);
      for (const group of groups) {
        await db.runAsync('INSERT INTO breed_groups (id, name, breed_ids, synced_at) VALUES (?, ?, ?, ?)', [
          group.id,
          group.name,
          JSON.stringify(group.breedIds),
          syncedAt,
        ]);
      }
    });
  },

  async loadSyncState(): Promise<SyncState> {
    const rows = await db.getAllAsync<StateRow>('SELECT key, value FROM sync_state', []);
    const map = new Map(rows.map((row) => [row.key, row.value]));
    const numberOf = (key: string) => {
      const value = Number(map.get(key));
      return Number.isFinite(value) && value > 0 ? value : null;
    };
    const outcome = map.get('lastOutcome');
    return {
      lastSuccessAt: numberOf('lastSuccessAt'),
      lastAttemptAt: numberOf('lastAttemptAt'),
      lastOutcome: outcome === 'complete' || outcome === 'partial' || outcome === 'failed' ? outcome : null,
      lastError: map.get('lastError') ?? null,
    };
  },

  async saveSyncState(state: Partial<SyncState>): Promise<void> {
    await db.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(state)) {
        if (value === undefined) continue;
        if (value === null) {
          await db.runAsync('DELETE FROM sync_state WHERE key = ?', [key]);
        } else {
          await db.runAsync(
            'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            [key, String(value)],
          );
        }
      }
    });
  },
});

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
