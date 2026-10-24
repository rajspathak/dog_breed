export type Range = {
  min: number;
  max: number;
};

export type Origin = {
  era: string | null;
  region: string | null;
  country: string | null;
};

export type Attribution = {
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  source: string | null;
  sourceUrl: string | null;
};

export type BreedImage = {
  id: string;
  thumb: string;
  medium: string;
  large: string;
  attribution: Attribution;
};

export const SCORE_TRAIT_KEYS = [
  'energy',
  'barking',
  'drooling',
  'grooming',
  'shedding',
  'trainability',
  'goodWithDogs',
  'apartmentFriendly',
  'goodWithChildren',
  'goodWithStrangers',
] as const;

export type ScoreTraitKey = (typeof SCORE_TRAIT_KEYS)[number];

export type Traits = Record<ScoreTraitKey, number | null> & {
  exerciseMinutes: number | null;
  temperament: string[];
};

export type CoatLength = 'short' | 'medium' | 'long' | 'hairless';

export type Coat = {
  type: string | null;
  length: CoatLength | null;
  colors: string[];
};

export type SizeBand = 'small' | 'medium' | 'large' | 'giant' | 'unknown';

export type CoatCategory = CoatLength | 'wire';

export type Breed = {
  id: string;
  name: string;
  description: string;
  groupId: string | null;
  lifeSpan: Range | null;
  maleWeight: Range | null;
  femaleWeight: Range | null;
  maleHeight: Range | null;
  femaleHeight: Range | null;
  hypoallergenic: boolean;
  origin: Origin;
  coat: Coat;
  traits: Traits | null;
  otherNames: string[];
  recognizedBy: string[];
  images: BreedImage[];
  sizeBand: SizeBand;
  coatCategories: CoatCategory[];
};

export type BreedGroup = {
  id: string;
  name: string;
  breedIds: string[];
};

export type ImageVariant = 'thumb' | 'medium' | 'large';
