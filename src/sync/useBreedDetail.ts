import { useQuery } from '@tanstack/react-query';

import { useCatalogStore } from '@/store/catalogStore';

import { getSyncEngine } from './services';

const DETAIL_STALE_MS = 60 * 60_000;

export const useBreedDetail = (id: string) => {
  const breed = useCatalogStore((state) => state.breedsById[id]);

  const query = useQuery({
    queryKey: ['breed', id],
    queryFn: async ({ signal }) => (await getSyncEngine()).refreshBreed(id, signal),
    staleTime: DETAIL_STALE_MS,
    enabled: id.length > 0,
  });

  return {
    breed,
    isRefreshing: query.fetchStatus === 'fetching',
    refreshError: query.error,
  };
};
