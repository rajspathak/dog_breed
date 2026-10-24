import type { CatalogFetchResult, PageResult } from '@/api/dogApi';
import { HttpError, NetworkError } from '@/api/http';
import type { Breed } from '@/domain/types';
import { createSyncEngine, SyncFailedError, type SyncDependencies } from '@/sync/syncEngine';

import { makeBreed } from '../helpers/factories';

const breeds = (...ids: string[]) => ids.map((id) => makeBreed({ id, name: id }));

const setup = (fetchCatalog: SyncDependencies['fetchCatalog']) => {
  const repository = {
    upsertBreeds: jest.fn().mockResolvedValue(undefined),
    pruneBreedsNotIn: jest.fn().mockResolvedValue(2),
    replaceGroups: jest.fn().mockResolvedValue(undefined),
    saveSyncState: jest.fn().mockResolvedValue(undefined),
    upsertBreedDetail: jest.fn().mockResolvedValue(undefined),
  };
  const store = {
    upsertBreeds: jest.fn(),
    removeBreedsNotIn: jest.fn(),
    setGroups: jest.fn(),
    updateSync: jest.fn(),
  };
  const engine = createSyncEngine({
    repository,
    store,
    fetchCatalog,
    fetchGroups: jest.fn().mockResolvedValue([{ id: 'g', name: 'Group', breedIds: [] }]),
    fetchBreed: jest.fn().mockResolvedValue(makeBreed({ id: 'fresh', name: 'Fresh' })),
    now: () => 1_000,
  });
  return { engine, repository, store };
};

const catalog = (pages: Breed[][], extra: Partial<CatalogFetchResult> = {}) =>
  jest.fn(async (onPage: (page: PageResult) => void) => {
    pages.forEach((page, index) => onPage({ page: index + 1, totalPages: pages.length, breeds: page }));
    const all = pages.flat();
    return {
      breeds: all,
      totalRecords: all.length,
      totalPages: pages.length,
      failedPages: [],
      rejectedRecords: 0,
      firstError: null,
      ...extra,
    };
  });

describe('syncCatalog', () => {
  it('streams pages to the store, persists them and prunes stale rows on a complete sync', async () => {
    const { engine, repository, store } = setup(catalog([breeds('a', 'b'), breeds('c')]));

    const report = await engine.syncCatalog();

    expect(report).toMatchObject({ outcome: 'complete', breedCount: 3, pruned: 2, groupsRefreshed: true });
    expect(store.upsertBreeds).toHaveBeenCalledTimes(2);
    expect(repository.upsertBreeds).toHaveBeenCalledTimes(2);
    expect(repository.pruneBreedsNotIn).toHaveBeenCalledWith(['a', 'b', 'c']);
    expect(store.removeBreedsNotIn).toHaveBeenCalledWith(new Set(['a', 'b', 'c']));
    expect(repository.saveSyncState).toHaveBeenLastCalledWith({
      lastOutcome: 'complete',
      lastError: null,
      lastSuccessAt: 1_000,
    });
    expect(store.updateSync).toHaveBeenLastCalledWith(
      expect.objectContaining({ phase: 'idle', lastOutcome: 'complete' }),
    );
  });

  it('keeps cached rows and reports a partial sync when pages fail', async () => {
    const { engine, repository, store } = setup(
      catalog([breeds('a', 'b')], {
        totalRecords: 4,
        totalPages: 2,
        failedPages: [2],
        firstError: new HttpError(503, 'u'),
      }),
    );

    const report = await engine.syncCatalog();

    expect(report.outcome).toBe('partial');
    expect(repository.pruneBreedsNotIn).not.toHaveBeenCalled();
    expect(store.removeBreedsNotIn).not.toHaveBeenCalled();
    const saved = repository.saveSyncState.mock.calls.at(-1)?.[0];
    expect(saved).toMatchObject({ lastOutcome: 'partial' });
    expect(saved).not.toHaveProperty('lastSuccessAt');
    expect(saved.lastError).toContain("Couldn't refresh 1 of 2 pages");
  });

  it('records the failure and rethrows when nothing could be fetched', async () => {
    const { engine, store } = setup(jest.fn().mockRejectedValue(new NetworkError('u', null)));

    await expect(engine.syncCatalog()).rejects.toBeInstanceOf(SyncFailedError);
    expect(store.updateSync).toHaveBeenLastCalledWith({
      phase: 'idle',
      lastOutcome: 'failed',
      lastError: 'Unable to reach the server.',
    });
  });

  it('shares one in-flight sync between concurrent callers', async () => {
    const fetchCatalog = catalog([breeds('a')]);
    const { engine } = setup(fetchCatalog);

    const [first, second] = await Promise.all([engine.syncCatalog(), engine.syncCatalog()]);

    expect(first).toBe(second);
    expect(fetchCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('refreshBreed', () => {
  it('persists the detail payload and updates the store', async () => {
    const { engine, repository, store } = setup(catalog([]));
    const breed = await engine.refreshBreed('fresh');
    expect(breed?.id).toBe('fresh');
    expect(repository.upsertBreedDetail).toHaveBeenCalledWith(expect.objectContaining({ id: 'fresh' }), 1_000);
    expect(store.upsertBreeds).toHaveBeenCalledWith([expect.objectContaining({ id: 'fresh' })]);
  });
});
