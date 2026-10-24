import { buildSearchText, matchesQuery } from './search';
import type { Breed, BreedGroup, CoatCategory, ScoreTraitKey, SizeBand } from './types';

export const THRESHOLD_TRAITS = [
  'goodWithChildren',
  'goodWithDogs',
  'goodWithStrangers',
] as const satisfies readonly ScoreTraitKey[];

export type ThresholdTrait = (typeof THRESHOLD_TRAITS)[number];

export type HypoallergenicFilter = 'any' | 'yes' | 'no';

export type FilterCriteria = {
  groupIds: string[];
  sizeBands: SizeBand[];
  coats: CoatCategory[];
  hypoallergenic: HypoallergenicFilter;
  traitMinimums: Partial<Record<ThresholdTrait, number>>;
};

export const EMPTY_CRITERIA: FilterCriteria = {
  groupIds: [],
  sizeBands: [],
  coats: [],
  hypoallergenic: 'any',
  traitMinimums: {},
};

export type BreedListItem = {
  id: string;
  name: string;
  groupId: string | null;
  thumbUrl: string | null;
  sizeBand: SizeBand;
  coats: CoatCategory[];
  hypoallergenic: boolean;
  traitScores: Record<ThresholdTrait, number | null>;
  lifeSpanLabel: string | null;
  searchText: string;
};

export const toListItem = (breed: Breed): BreedListItem => ({
  id: breed.id,
  name: breed.name,
  groupId: breed.groupId,
  thumbUrl: breed.images[0]?.thumb ?? null,
  sizeBand: breed.sizeBand,
  coats: breed.coatCategories,
  hypoallergenic: breed.hypoallergenic,
  traitScores: {
    goodWithChildren: breed.traits?.goodWithChildren ?? null,
    goodWithDogs: breed.traits?.goodWithDogs ?? null,
    goodWithStrangers: breed.traits?.goodWithStrangers ?? null,
  },
  lifeSpanLabel: breed.lifeSpan ? `${breed.lifeSpan.min}–${breed.lifeSpan.max} yrs` : null,
  searchText: buildSearchText(breed.name, breed.otherNames),
});

export const countActiveFilters = (criteria: FilterCriteria): number =>
  criteria.groupIds.length +
  criteria.sizeBands.length +
  criteria.coats.length +
  (criteria.hypoallergenic === 'any' ? 0 : 1) +
  Object.values(criteria.traitMinimums).filter((value) => typeof value === 'number').length;

const intersects = <T>(selected: readonly T[], values: readonly T[]): boolean =>
  selected.length === 0 || selected.some((value) => values.includes(value));

export const matchesCriteria = (item: BreedListItem, criteria: FilterCriteria): boolean => {
  if (criteria.groupIds.length > 0 && (!item.groupId || !criteria.groupIds.includes(item.groupId))) {
    return false;
  }
  if (!intersects(criteria.sizeBands, [item.sizeBand])) return false;
  if (!intersects(criteria.coats, item.coats)) return false;
  if (criteria.hypoallergenic !== 'any' && item.hypoallergenic !== (criteria.hypoallergenic === 'yes')) {
    return false;
  }
  return THRESHOLD_TRAITS.every((trait) => {
    const minimum = criteria.traitMinimums[trait];
    if (typeof minimum !== 'number') return true;
    const score = item.traitScores[trait];
    return score !== null && score >= minimum;
  });
};

export const filterItems = (
  items: readonly BreedListItem[],
  criteria: FilterCriteria,
  query: string,
): BreedListItem[] => {
  const trimmed = query.trim();
  return items.filter(
    (item) => (trimmed.length === 0 || matchesQuery(item.searchText, trimmed)) && matchesCriteria(item, criteria),
  );
};

export type ListEntry =
  | { kind: 'header'; key: string; title: string; count: number }
  | { kind: 'row'; key: string; item: BreedListItem; isLast: boolean };

export const UNGROUPED_ID = 'ungrouped';

export const buildGroupedEntries = (
  items: readonly BreedListItem[],
  groups: readonly BreedGroup[],
): { entries: ListEntry[]; headerIndices: number[] } => {
  const buckets = new Map<string, BreedListItem[]>();
  for (const item of items) {
    const key = item.groupId && groups.some((group) => group.id === item.groupId) ? item.groupId : UNGROUPED_ID;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  const ordered = [...groups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((group) => ({ id: group.id, title: group.name }));
  ordered.push({ id: UNGROUPED_ID, title: 'Other breeds' });

  const entries: ListEntry[] = [];
  const headerIndices: number[] = [];
  for (const { id, title } of ordered) {
    const bucket = buckets.get(id);
    if (!bucket || bucket.length === 0) continue;
    bucket.sort((a, b) => a.name.localeCompare(b.name));
    headerIndices.push(entries.length);
    entries.push({ kind: 'header', key: `header:${id}`, title, count: bucket.length });
    bucket.forEach((item, index) => {
      entries.push({ kind: 'row', key: item.id, item, isLast: index === bucket.length - 1 });
    });
  }
  return { entries, headerIndices };
};
