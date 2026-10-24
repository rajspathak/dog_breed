import type { CoatCategory, Range, SizeBand } from './types';

export const SIZE_LABELS: Record<SizeBand, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  giant: 'Giant',
  unknown: 'Unknown size',
};

export const COAT_LABELS: Record<CoatCategory, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  wire: 'Wire',
  hairless: 'Hairless',
};

export const formatRange = (range: Range | null, unit: string): string => {
  if (!range) return 'Not recorded';
  return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
};

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export const formatRelativeTime = (timestamp: number, now: number): string => {
  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 45) return 'just now';
  for (const [unit, size] of UNITS) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
  }
  return 'just now';
};

export const titleCase = (value: string): string => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
