import { formatRange, formatRelativeTime } from '@/domain/format';
import { buildSearchText, foldText, matchesQuery } from '@/domain/search';

describe('formatRelativeTime', () => {
  const now = Date.UTC(2026, 0, 1, 12);

  it.each([
    [10 * 1000, 'just now'],
    [5 * 60 * 1000, '5 minutes ago'],
    [60 * 60 * 1000, '1 hour ago'],
    [2 * 60 * 60 * 1000, '2 hours ago'],
    [3 * 24 * 60 * 60 * 1000, '3 days ago'],
  ])('formats %d ms ago as "%s"', (delta, expected) => {
    expect(formatRelativeTime(now - delta, now)).toBe(expected);
  });
});

describe('formatRange', () => {
  it('handles missing, equal and spread ranges', () => {
    expect(formatRange(null, 'kg')).toBe('Not recorded');
    expect(formatRange({ min: 5, max: 5 }, 'kg')).toBe('5 kg');
    expect(formatRange({ min: 4, max: 6 }, 'kg')).toBe('4–6 kg');
  });
});

describe('search helpers', () => {
  it('folds punctuation and diacritics', () => {
    expect(foldText('  Chien de Saint-Hubert ')).toBe('chien de saint hubert');
    expect(foldText('Löwchen')).toBe('lowchen');
  });

  it('requires every token to match somewhere in the name or aliases', () => {
    const text = buildSearchText('Bloodhound', ['Chien de Saint-Hubert', 'St. Hubert Hound']);
    expect(matchesQuery(text, 'saint hubert')).toBe(true);
    expect(matchesQuery(text, 'blood st')).toBe(true);
    expect(matchesQuery(text, 'blood poodle')).toBe(false);
  });
});
