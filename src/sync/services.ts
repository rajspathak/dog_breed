import { fetchBreed, fetchBreedCatalog, fetchGroups } from '@/api/dogApi';
import { createCatalogRepository, type CatalogRepository } from '@/db/catalogRepository';
import { getDatabase } from '@/db/database';
import { useCatalogStore } from '@/store/catalogStore';

import { createSyncEngine, type SyncEngine } from './syncEngine';

let repositoryPromise: Promise<CatalogRepository> | null = null;
let enginePromise: Promise<SyncEngine> | null = null;

export const getCatalogRepository = (): Promise<CatalogRepository> => {
  repositoryPromise ??= getDatabase()
    .then(createCatalogRepository)
    .catch((error: unknown) => {
      repositoryPromise = null;
      throw error;
    });
  return repositoryPromise;
};

export const getSyncEngine = (): Promise<SyncEngine> => {
  enginePromise ??= getCatalogRepository().then((repository) => {
    const store = useCatalogStore.getState();
    return createSyncEngine({
      repository,
      fetchCatalog: (onPage, signal) => fetchBreedCatalog(onPage, signal),
      fetchGroups: (signal) => fetchGroups(signal),
      fetchBreed: (id, signal) => fetchBreed(id, signal),
      store: {
        upsertBreeds: store.upsertBreeds,
        removeBreedsNotIn: store.removeBreedsNotIn,
        setGroups: store.setGroups,
        updateSync: store.updateSync,
      },
    });
  });
  return enginePromise;
};

export const hydrateCatalog = async (): Promise<void> => {
  const repository = await getCatalogRepository();
  const [breeds, groups, state] = await Promise.all([
    repository.loadBreeds(),
    repository.loadGroups(),
    repository.loadSyncState(),
  ]);
  useCatalogStore.getState().hydrate({
    breeds,
    groups,
    sync: {
      lastSuccessAt: state.lastSuccessAt,
      lastOutcome: state.lastOutcome,
      lastError: state.lastError,
    },
  });
};
