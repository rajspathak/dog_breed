import { deriveCoatCategories, deriveSizeBand } from '@/domain/derive';

const range = (min: number, max: number) => ({ min, max });

describe('deriveSizeBand', () => {
  it.each([
    [range(2, 4), range(2, 3), 'small'],
    [range(10, 14), range(9, 12), 'medium'],
    [range(30, 36), range(25, 32), 'large'],
    [range(60, 80), range(50, 70), 'giant'],
  ] as const)('buckets %j / %j as %s', (male, female, expected) => {
    expect(deriveSizeBand({ maleWeight: male, femaleWeight: female, maleHeight: null, femaleHeight: null })).toBe(
      expected,
    );
  });

  it('uses whichever weight is available', () => {
    expect(
      deriveSizeBand({ maleWeight: null, femaleWeight: range(45, 50), maleHeight: null, femaleHeight: null }),
    ).toBe('giant');
  });

  it('falls back to height when weight is missing', () => {
    expect(
      deriveSizeBand({ maleWeight: null, femaleWeight: null, maleHeight: range(25, 30), femaleHeight: null }),
    ).toBe('small');
    expect(
      deriveSizeBand({ maleWeight: null, femaleWeight: null, maleHeight: range(70, 80), femaleHeight: null }),
    ).toBe('giant');
  });

  it('reports unknown when nothing is measurable', () => {
    expect(deriveSizeBand({ maleWeight: null, femaleWeight: null, maleHeight: null, femaleHeight: null })).toBe(
      'unknown',
    );
  });
});

describe('deriveCoatCategories', () => {
  it('combines length with a wire texture', () => {
    expect(deriveCoatCategories({ type: 'wire', length: 'medium', colors: [] })).toEqual(['medium', 'wire']);
  });

  it('derives hairless from coat type when length is missing', () => {
    expect(deriveCoatCategories({ type: 'hairless', length: null, colors: [] })).toEqual(['hairless']);
  });

  it('does not duplicate hairless', () => {
    expect(deriveCoatCategories({ type: 'hairless', length: 'hairless', colors: [] })).toEqual(['hairless']);
  });
});
