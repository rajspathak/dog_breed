import {
  readArray,
  readNumber,
  readRecord,
  readRelationshipId,
  readRelationshipIds,
  readString,
  readStringArray,
  type ResourceObject,
  type UnknownRecord,
} from '@/api/guards';

import { deriveCoatCategories, deriveSizeBand } from './derive';
import type { Attribution, Breed, BreedGroup, BreedImage, Coat, CoatLength, Origin, Range, Traits } from './types';

const COAT_LENGTHS: readonly CoatLength[] = ['short', 'medium', 'long', 'hairless'];

const toRange = (value: unknown): Range | null => {
  const raw = readRecord(value);
  const min = readNumber(raw.min);
  const max = readNumber(raw.max);
  if (min === null && max === null) return null;
  const low = min ?? max ?? 0;
  const high = max ?? min ?? 0;
  return low <= high ? { min: low, max: high } : { min: high, max: low };
};

const toOrigin = (value: unknown): Origin => {
  const raw = readRecord(value);
  return {
    era: readString(raw.era),
    region: readString(raw.region),
    country: readString(raw.country),
  };
};

const toCoat = (value: unknown): Coat => {
  const raw = readRecord(value);
  const length = readString(raw.length)?.toLowerCase() ?? null;
  return {
    type: readString(raw.type)?.toLowerCase() ?? null,
    length: COAT_LENGTHS.find((candidate) => candidate === length) ?? null,
    colors: readStringArray(raw.colors),
  };
};

const toScore = (raw: UnknownRecord, key: string): number | null => {
  const value = readNumber(raw[key]);
  return value === null ? null : Math.min(5, Math.max(1, Math.round(value)));
};

const toTraits = (value: unknown): Traits | null => {
  const raw = readRecord(value);
  const traits: Traits = {
    energy: toScore(raw, 'energy'),
    barking: toScore(raw, 'barking'),
    drooling: toScore(raw, 'drooling'),
    grooming: toScore(raw, 'grooming'),
    shedding: toScore(raw, 'shedding'),
    trainability: toScore(raw, 'trainability'),
    goodWithDogs: toScore(raw, 'good_with_dogs'),
    apartmentFriendly: toScore(raw, 'apartment_friendly'),
    goodWithChildren: toScore(raw, 'good_with_children'),
    goodWithStrangers: toScore(raw, 'good_with_strangers'),
    exerciseMinutes: readNumber(raw.exercise_minutes),
    temperament: readStringArray(raw.temperament),
  };
  const hasAnyValue = Object.values(traits).some((entry) => (Array.isArray(entry) ? entry.length > 0 : entry !== null));
  return hasAnyValue ? traits : null;
};

const toAttribution = (value: unknown): Attribution => {
  const raw = readRecord(value);
  return {
    author: readString(raw.author),
    license: readString(raw.license),
    licenseUrl: readString(raw.license_url),
    source: readString(raw.source),
    sourceUrl: readString(raw.source_url),
  };
};

const toImage = (value: unknown): BreedImage | null => {
  const raw = readRecord(value);
  const id = readString(raw.id);
  const original = readString(raw.url);
  const large = readString(raw.large) ?? original;
  const medium = readString(raw.medium) ?? large;
  const thumb = readString(raw.thumb) ?? medium;
  if (!id || !thumb || !medium || !large) return null;
  return { id, thumb, medium, large, attribution: toAttribution(raw.attribution) };
};

const toImages = (value: unknown): BreedImage[] => {
  const seen = new Set<string>();
  const images: BreedImage[] = [];
  for (const entry of readArray(value)) {
    const image = toImage(entry);
    if (image && !seen.has(image.id)) {
      seen.add(image.id);
      images.push(image);
    }
  }
  return images;
};

export const normalizeBreed = (resource: ResourceObject): Breed | null => {
  const attributes = resource.attributes;
  const name = readString(attributes.name);
  if (!name) return null;

  const coat = toCoat(attributes.coat);
  const ranges = {
    maleWeight: toRange(attributes.male_weight),
    femaleWeight: toRange(attributes.female_weight),
    maleHeight: toRange(attributes.male_height),
    femaleHeight: toRange(attributes.female_height),
  };
  const otherNames = readStringArray(attributes.other_names).filter(
    (alias) => alias.toLowerCase() !== name.toLowerCase(),
  );

  return {
    id: resource.id,
    name,
    description: readString(attributes.description) ?? '',
    groupId: readRelationshipId(resource.relationships, 'group'),
    lifeSpan: toRange(attributes.life),
    ...ranges,
    hypoallergenic: attributes.hypoallergenic === true,
    origin: toOrigin(attributes.origin),
    coat,
    traits: toTraits(attributes.traits),
    otherNames,
    recognizedBy: readStringArray(attributes.recognized_by),
    images: toImages(attributes.images),
    sizeBand: deriveSizeBand(ranges),
    coatCategories: deriveCoatCategories(coat),
  };
};

export const normalizeGroup = (resource: ResourceObject): BreedGroup | null => {
  const name = readString(resource.attributes.name);
  if (!name) return null;
  return {
    id: resource.id,
    name,
    breedIds: readRelationshipIds(resource.relationships, 'breeds'),
  };
};

export const shortGroupName = (name: string): string => name.replace(/\s+(Group|Class)$/i, '').trim();
