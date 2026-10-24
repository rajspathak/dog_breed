import type { Breed, Coat, CoatCategory, Range, SizeBand } from './types';

export const SIZE_BANDS: readonly { band: Exclude<SizeBand, 'unknown'>; label: string; maxKg: number }[] = [
  { band: 'small', label: 'Small', maxKg: 10 },
  { band: 'medium', label: 'Medium', maxKg: 25 },
  { band: 'large', label: 'Large', maxKg: 40 },
  { band: 'giant', label: 'Giant', maxKg: Number.POSITIVE_INFINITY },
];

const HEIGHT_FALLBACK_CM: readonly [Exclude<SizeBand, 'unknown'>, number][] = [
  ['small', 35],
  ['medium', 55],
  ['large', 68],
  ['giant', Number.POSITIVE_INFINITY],
];

const midpoint = (ranges: (Range | null)[]): number | null => {
  const values = ranges.flatMap((range) => (range ? [range.min, range.max] : []));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const deriveSizeBand = (
  breed: Pick<Breed, 'maleWeight' | 'femaleWeight' | 'maleHeight' | 'femaleHeight'>,
): SizeBand => {
  const weight = midpoint([breed.maleWeight, breed.femaleWeight]);
  if (weight !== null) {
    return SIZE_BANDS.find((entry) => weight < entry.maxKg)?.band ?? 'giant';
  }
  const height = midpoint([breed.maleHeight, breed.femaleHeight]);
  if (height !== null) {
    return HEIGHT_FALLBACK_CM.find(([, maxCm]) => height < maxCm)?.[0] ?? 'giant';
  }
  return 'unknown';
};

export const deriveCoatCategories = (coat: Coat): CoatCategory[] => {
  const categories: CoatCategory[] = [];
  if (coat.length) categories.push(coat.length);
  if (coat.type === 'wire') categories.push('wire');
  if (coat.type === 'hairless' && !categories.includes('hairless')) categories.push('hairless');
  return categories;
};
