import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { env } from '@/config/env';
import { useCatalogStore } from '@/store/catalogStore';

import { getSyncEngine } from './services';
import type { SyncReport } from './syncEngine';

export const CATALOG_SYNC_KEY = ['catalog', 'sync'] as const;

const seedFromCache = (): { data?: SyncReport; updatedAt?: number } => {
  const { sync, listItems } = useCatalogStore.getState();
  if (sync.lastOutcome !== 'complete' || !sync.lastSuccessAt || listItems.length === 0) return {};
  return {
    data: {
      outcome: 'complete',
      syncedAt: sync.lastSuccessAt,
      breedCount: listItems.length,
      failedPages: [],
      pruned: 0,
      groupsRefreshed: true,
    },
    updatedAt: sync.lastSuccessAt,
  };
};

export const useCatalogSync = () => {
  const [seed] = useState(seedFromCache);
  const [manualRefresh, setManualRefresh] = useState(false);

  const query = useQuery({
    queryKey: CATALOG_SYNC_KEY,
    queryFn: async ({ signal }) => (await getSyncEngine()).syncCatalog(signal),
    staleTime: env.staleAfterMs,
    initialData: seed.data,
    initialDataUpdatedAt: seed.updatedAt,
  });

  const { refetch } = query;
  const refresh = useCallback(async () => {
    setManualRefresh(true);
    try {
      await refetch();
    } finally {
      setManualRefresh(false);
    }
  }, [refetch]);

  return {
    refresh,
    isManualRefreshing: manualRefresh && query.fetchStatus === 'fetching',
    isPaused: query.fetchStatus === 'paused',
    error: query.error,
  };
};
