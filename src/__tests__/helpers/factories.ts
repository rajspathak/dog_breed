import { toListItem, type BreedListItem } from '@/domain/filters';
import type { Breed } from '@/domain/types';

export const makeBreed = (overrides: Partial<Breed> = {}): Breed => ({
  id: 'breed-1',
  name: 'Test Breed',
  description: 'A breed used in tests.',
  groupId: 'group-a',
  lifeSpan: { min: 10, max: 12 },
  maleWeight: { min: 20, max: 30 },
  femaleWeight: { min: 18, max: 26 },
  maleHeight: { min: 50, max: 60 },
  femaleHeight: { min: 48, max: 56 },
  hypoallergenic: false,
  origin: { era: null, region: null, country: 'Germany' },
  coat: { type: 'double', length: 'short', colors: ['black'] },
  traits: {
    energy: 3,
    barking: 3,
    drooling: 1,
    grooming: 2,
    shedding: 3,
    trainability: 4,
    goodWithDogs: 3,
    apartmentFriendly: 2,
    goodWithChildren: 4,
    goodWithStrangers: 3,
    exerciseMinutes: 60,
    temperament: ['loyal'],
  },
  otherNames: [],
  recognizedBy: ['AKC'],
  images: [],
  sizeBand: 'medium',
  coatCategories: ['short'],
  ...overrides,
});

export const makeItem = (overrides: Partial<Breed> = {}): BreedListItem => toListItem(makeBreed(overrides));
