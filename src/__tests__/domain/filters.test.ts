import {
  buildGroupedEntries,
  countActiveFilters,
  EMPTY_CRITERIA,
  filterItems,
  type FilterCriteria,
} from '@/domain/filters';
import type { BreedGroup } from '@/domain/types';

import { makeItem } from '../helpers/factories';

const traits = (goodWithChildren: number, goodWithDogs: number) => ({
  energy: 3,
  barking: 3,
  drooling: 1,
  grooming: 2,
  shedding: 2,
  trainability: 3,
  goodWithDogs,
  apartmentFriendly: 3,
  goodWithChildren,
  goodWithStrangers: 3,
  exerciseMinutes: 45,
  temperament: [],
});

const items = [
  makeItem({
    id: 'poodle',
    name: 'Poodle',
    groupId: 'non',
    sizeBand: 'medium',
    coatCategories: ['long'],
    hypoallergenic: true,
    otherNames: ['Caniche'],
    traits: traits(5, 4),
  }),
  makeItem({
    id: 'beagle',
    name: 'Beagle',
    groupId: 'hound',
    sizeBand: 'small',
    coatCategories: ['short'],
    traits: traits(5, 5),
  }),
  makeItem({
    id: 'airedale',
    name: 'Airedale Terrier',
    groupId: 'terrier',
    sizeBand: 'large',
    coatCategories: ['short', 'wire'],
    traits: traits(3, 2),
  }),
  makeItem({
    id: 'mastiff',
    name: 'Mastiff',
    groupId: 'working',
    sizeBand: 'giant',
    coatCategories: ['short'],
    traits: null,
  }),
  makeItem({
    id: 'stray',
    name: 'Mystery Dog',
    groupId: 'missing-group',
    sizeBand: 'unknown',
    coatCategories: [],
    traits: null,
  }),
];

const groups: BreedGroup[] = [
  { id: 'working', name: 'Working Group', breedIds: [] },
  { id: 'hound', name: 'Hound Group', breedIds: [] },
  { id: 'terrier', name: 'Terrier Group', breedIds: [] },
  { id: 'non', name: 'Non-Sporting Group', breedIds: [] },
];

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({ ...EMPTY_CRITERIA, ...overrides });
const ids = (result: { id: string }[]) => result.map((item) => item.id).sort();

describe('filterItems', () => {
  it('returns everything with no query or criteria', () => {
    expect(filterItems(items, EMPTY_CRITERIA, '')).toHaveLength(items.length);
  });

  it('searches names and other_names, ignoring case and accents', () => {
    expect(ids(filterItems(items, EMPTY_CRITERIA, 'caniche'))).toEqual(['poodle']);
    expect(ids(filterItems(items, EMPTY_CRITERIA, 'AIREDÁLE ter'))).toEqual(['airedale']);
    expect(filterItems(items, EMPTY_CRITERIA, 'zzz')).toHaveLength(0);
  });

  it('ORs values within a facet and ANDs across facets', () => {
    expect(ids(filterItems(items, criteria({ sizeBands: ['small', 'giant'] }), ''))).toEqual(['beagle', 'mastiff']);
    expect(ids(filterItems(items, criteria({ sizeBands: ['small', 'giant'], groupIds: ['hound'] }), ''))).toEqual([
      'beagle',
    ]);
  });

  it('matches wire as a texture independent of length', () => {
    expect(ids(filterItems(items, criteria({ coats: ['wire'] }), ''))).toEqual(['airedale']);
    expect(ids(filterItems(items, criteria({ coats: ['short'] }), ''))).toEqual(['airedale', 'beagle', 'mastiff']);
  });

  it('filters hypoallergenic yes and no', () => {
    expect(ids(filterItems(items, criteria({ hypoallergenic: 'yes' }), ''))).toEqual(['poodle']);
    expect(filterItems(items, criteria({ hypoallergenic: 'no' }), '')).toHaveLength(4);
  });

  it('applies trait thresholds and excludes breeds without scores', () => {
    expect(ids(filterItems(items, criteria({ traitMinimums: { goodWithChildren: 4 } }), ''))).toEqual([
      'beagle',
      'poodle',
    ]);
    expect(ids(filterItems(items, criteria({ traitMinimums: { goodWithChildren: 4, goodWithDogs: 5 } }), ''))).toEqual([
      'beagle',
    ]);
  });
});

describe('countActiveFilters', () => {
  it('counts each selected value', () => {
    expect(countActiveFilters(EMPTY_CRITERIA)).toBe(0);
    expect(
      countActiveFilters(
        criteria({ groupIds: ['a', 'b'], coats: ['wire'], hypoallergenic: 'yes', traitMinimums: { goodWithDogs: 3 } }),
      ),
    ).toBe(5);
  });
});

describe('buildGroupedEntries', () => {
  it('groups alphabetically with headers and an ungrouped bucket last', () => {
    const { entries, headerIndices } = buildGroupedEntries(items, groups);
    const headers = entries.filter((entry) => entry.kind === 'header').map((entry) => entry.title);

    expect(headers).toEqual(['Hound Group', 'Non-Sporting Group', 'Terrier Group', 'Working Group', 'Other breeds']);
    expect(headerIndices).toEqual([0, 2, 4, 6, 8]);
    expect(entries).toHaveLength(items.length + headers.length);
  });

  it('marks the last row in each section and skips empty groups', () => {
    const { entries } = buildGroupedEntries(
      items.filter((item) => item.groupId === 'hound'),
      groups,
    );
    expect(entries).toEqual([
      { kind: 'header', key: 'header:hound', title: 'Hound Group', count: 1 },
      expect.objectContaining({ kind: 'row', key: 'beagle', isLast: true }),
    ]);
  });
});
