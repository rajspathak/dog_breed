import type { CatalogFetchResult, PageResult } from '@/api/dogApi';
import { describeError } from '@/api/http';
import type { CatalogRepository, SyncOutcome } from '@/db/catalogRepository';
import type { Breed, BreedGroup } from '@/domain/types';
import type { SyncStatus } from '@/store/catalogStore';

export type SyncReport = {
  outcome: SyncOutcome;
  syncedAt: number;
  breedCount: number;
  failedPages: number[];
  pruned: number;
  groupsRefreshed: boolean;
};

export type SyncDependencies = {
  repository: Pick<
    CatalogRepository,
    'upsertBreeds' | 'pruneBreedsNotIn' | 'replaceGroups' | 'saveSyncState' | 'upsertBreedDetail'
  >;
  fetchCatalog(onPage: (page: PageResult) => void, signal?: AbortSignal): Promise<CatalogFetchResult>;
  fetchGroups(signal?: AbortSignal): Promise<BreedGroup[]>;
  fetchBreed(id: string, signal?: AbortSignal): Promise<Breed | null>;
  store: {
    upsertBreeds(breeds: readonly Breed[]): void;
    removeBreedsNotIn(ids: ReadonlySet<string>): void;
    setGroups(groups: readonly BreedGroup[]): void;
    updateSync(patch: Partial<SyncStatus>): void;
  };
  now?: () => number;
};

export class SyncFailedError extends Error {
  constructor(override readonly cause: unknown) {
    super(describeError(cause));
    this.name = 'SyncFailedError';
  }
}

export const createSyncEngine = (deps: SyncDependencies) => {
  const now = deps.now ?? Date.now;
  let running: Promise<SyncReport> | null = null;

  const run = async (signal?: AbortSignal): Promise<SyncReport> => {
    const startedAt = now();
    deps.store.updateSync({ phase: 'syncing', pagesDone: 0, pagesTotal: 0 });
    await deps.repository.saveSyncState({ lastAttemptAt: startedAt });

    const groupsTask = deps
      .fetchGroups(signal)
      .then(async (groups) => {
        if (groups.length === 0) return false;
        deps.store.setGroups(groups);
        await deps.repository.replaceGroups(groups, startedAt);
        return true;
      })
      .catch(() => false);

    const writes: Promise<void>[] = [];
    let pagesDone = 0;

    try {
      const result = await deps.fetchCatalog((page) => {
        pagesDone += 1;
        deps.store.upsertBreeds(page.breeds);
        deps.store.updateSync({ pagesDone, pagesTotal: page.totalPages });
        writes.push(deps.repository.upsertBreeds(page.breeds, startedAt));
      }, signal);

      await Promise.all(writes);
      const groupsRefreshed = await groupsTask;

      const complete = result.failedPages.length === 0 && result.breeds.length >= result.totalRecords;
      let pruned = 0;
      if (complete) {
        const ids = result.breeds.map((breed) => breed.id);
        pruned = await deps.repository.pruneBreedsNotIn(ids);
        if (pruned > 0) deps.store.removeBreedsNotIn(new Set(ids));
      }

      const outcome: SyncOutcome = complete ? 'complete' : 'partial';
      const syncedAt = now();
      const lastError = complete
        ? null
        : `Couldn't refresh ${result.failedPages.length} of ${result.totalPages} pages. ${describeError(result.firstError)}`;

      await deps.repository.saveSyncState({
        lastOutcome: outcome,
        lastError,
        ...(complete ? { lastSuccessAt: syncedAt } : {}),
      });
      deps.store.updateSync({
        phase: 'idle',
        lastOutcome: outcome,
        lastError,
        failedPages: result.failedPages,
        ...(complete ? { lastSuccessAt: syncedAt } : {}),
      });

      return {
        outcome,
        syncedAt,
        breedCount: result.breeds.length,
        failedPages: result.failedPages,
        pruned,
        groupsRefreshed,
      };
    } catch (error) {
      await Promise.allSettled(writes);
      await groupsTask;
      const lastError = describeError(error);
      await deps.repository.saveSyncState({ lastOutcome: 'failed', lastError }).catch(() => undefined);
      deps.store.updateSync({ phase: 'idle', lastOutcome: 'failed', lastError });
      throw new SyncFailedError(error);
    }
  };

  return {
    syncCatalog(signal?: AbortSignal): Promise<SyncReport> {
      running ??= run(signal).finally(() => {
        running = null;
      });
      return running;
    },

    async refreshBreed(id: string, signal?: AbortSignal): Promise<Breed | null> {
      const breed = await deps.fetchBreed(id, signal);
      if (!breed) return null;
      await deps.repository.upsertBreedDetail(breed, now());
      deps.store.upsertBreeds([breed]);
      return breed;
    },
  };
};

export type SyncEngine = ReturnType<typeof createSyncEngine>;
