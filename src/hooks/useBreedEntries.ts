import { useMemo } from 'react';

import { buildGroupedEntries, filterItems } from '@/domain/filters';
import { selectGroups, useCatalogStore } from '@/store/catalogStore';
import { useFilterStore } from '@/store/filterStore';
import { useShallow } from 'zustand/react/shallow';

import { useDebouncedValue } from './useDebouncedValue';

export const SEARCH_DEBOUNCE_MS = 250;

export const useBreedEntries = () => {
  const items = useCatalogStore((state) => state.listItems);
  const groups = useCatalogStore(useShallow(selectGroups));
  const criteria = useFilterStore((state) => state.criteria);
  const query = useDebouncedValue(
    useFilterStore((state) => state.query),
    SEARCH_DEBOUNCE_MS,
  );

  return useMemo(() => {
    const matches = filterItems(items, criteria, query);
    return { ...buildGroupedEntries(matches, groups), matchCount: matches.length, totalCount: items.length };
  }, [items, groups, criteria, query]);
};
