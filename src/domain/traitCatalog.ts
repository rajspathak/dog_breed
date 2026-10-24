import type { ScoreTraitKey } from './types';

export type TraitDefinition = {
  key: ScoreTraitKey;
  label: string;
  low: string;
  high: string;
};

export type TraitCategory = {
  title: string;
  traits: TraitDefinition[];
};

export const TRAIT_CATEGORIES: readonly TraitCategory[] = [
  {
    title: 'Family & social',
    traits: [
      { key: 'goodWithChildren', label: 'Good with children', low: 'Cautious', high: 'Great' },
      { key: 'goodWithDogs', label: 'Good with other dogs', low: 'Selective', high: 'Friendly' },
      { key: 'goodWithStrangers', label: 'Good with strangers', low: 'Reserved', high: 'Outgoing' },
      { key: 'apartmentFriendly', label: 'Apartment friendly', low: 'Needs space', high: 'Adapts well' },
    ],
  },
  {
    title: 'Energy & training',
    traits: [
      { key: 'energy', label: 'Energy', low: 'Mellow', high: 'High drive' },
      { key: 'trainability', label: 'Trainability', low: 'Independent', high: 'Eager' },
      { key: 'barking', label: 'Barking', low: 'Quiet', high: 'Vocal' },
    ],
  },
  {
    title: 'Care & upkeep',
    traits: [
      { key: 'grooming', label: 'Grooming needs', low: 'Minimal', high: 'Frequent' },
      { key: 'shedding', label: 'Shedding', low: 'Light', high: 'Heavy' },
      { key: 'drooling', label: 'Drooling', low: 'Dry', high: 'Drooly' },
    ],
  },
];

export const MAX_EXERCISE_MINUTES = 120;
