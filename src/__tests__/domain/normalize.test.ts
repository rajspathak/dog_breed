import { parseCollection } from '@/api/guards';
import { normalizeBreed, normalizeGroup, shortGroupName } from '@/domain/normalize';

import breedsPage from '../fixtures/breedsPage.json';
import groupsPayload from '../fixtures/groups.json';

const resources = parseCollection(breedsPage).data;
const byName = (name: string) => {
  const resource = resources.find((entry) => entry.attributes.name === name);
  if (!resource) throw new Error(`Fixture missing ${name}`);
  const breed = normalizeBreed(resource);
  if (!breed) throw new Error(`Failed to normalize ${name}`);
  return breed;
};

describe('normalizeBreed', () => {
  it('maps a complete record into the domain shape', () => {
    const breed = byName('Affenpinscher');

    expect(breed.groupId).toBe('f56dc4b1-ba1a-4454-8ce2-bd5d41404a0c');
    expect(breed.lifeSpan).toEqual({ min: 14, max: 16 });
    expect(breed.hypoallergenic).toBe(true);
    expect(breed.coat).toMatchObject({ type: 'wire', length: 'short' });
    expect(breed.coatCategories).toEqual(['short', 'wire']);
    expect(breed.sizeBand).toBe('small');
    expect(breed.traits?.goodWithChildren).toBe(3);
    expect(breed.traits?.exerciseMinutes).toBe(30);
    expect(breed.otherNames).toContain('Monkey Terrier');
    expect(breed.images[0]).toMatchObject({
      thumb: expect.stringContaining('https://'),
      attribution: { author: 'Futurebreak', license: 'CC0' },
    });
  });

  it('survives a record with empty coat, traits, origin and heights', () => {
    const breed = byName('Bavarian Mountain Scent Hound');

    expect(breed.traits).toBeNull();
    expect(breed.coat).toEqual({ type: null, length: null, colors: [] });
    expect(breed.coatCategories).toEqual([]);
    expect(breed.origin).toEqual({ era: null, region: null, country: null });
    expect(breed.maleHeight).toBeNull();
    expect(breed.sizeBand).toBe('large');
  });

  it('treats empty height objects as missing rather than zero', () => {
    const breed = byName('Brussels Griffon');
    expect(breed.maleHeight).toBeNull();
    expect(breed.femaleHeight).toBeNull();
    expect(breed.maleWeight).toEqual({ min: 4, max: 5 });
  });

  it('keeps images whose attribution has null fields', () => {
    const breed = byName('American Foxhound');
    const partial = breed.images.find((image) => image.attribution.author === null);
    expect(partial).toBeDefined();
    expect(partial?.attribution.licenseUrl).toBeNull();
  });

  it('rejects records without a usable name and repairs inverted ranges', () => {
    expect(normalizeBreed({ id: 'x', type: 'breed', attributes: { name: '   ' }, relationships: {} })).toBeNull();

    const breed = normalizeBreed({
      id: 'y',
      type: 'breed',
      attributes: { name: 'Odd', life: { min: 15, max: 9 }, other_names: ['Odd', 'odd', 'Alias', 'Alias'] },
      relationships: {},
    });
    expect(breed?.lifeSpan).toEqual({ min: 9, max: 15 });
    expect(breed?.otherNames).toEqual(['Alias']);
    expect(breed?.groupId).toBeNull();
    expect(breed?.sizeBand).toBe('unknown');
  });

  it('clamps out-of-range trait scores into 1–5', () => {
    const breed = normalizeBreed({
      id: 'z',
      type: 'breed',
      attributes: { name: 'Clamp', traits: { energy: 9, barking: 0, temperament: [] } },
      relationships: {},
    });
    expect(breed?.traits?.energy).toBe(5);
    expect(breed?.traits?.barking).toBe(1);
    expect(breed?.traits?.drooling).toBeNull();
  });
});

describe('normalizeGroup', () => {
  it('reads group names and breed relationships', () => {
    const groups = parseCollection(groupsPayload)
      .data.map(normalizeGroup)
      .filter((group) => group !== null);
    expect(groups).toHaveLength(9);
    expect(groups[0]?.breedIds.length).toBeGreaterThan(0);
  });

  it('shortens group labels for chips', () => {
    expect(shortGroupName('Herding Group')).toBe('Herding');
    expect(shortGroupName('Miscellaneous Class')).toBe('Miscellaneous');
    expect(shortGroupName('Foundation Stock Service')).toBe('Foundation Stock Service');
  });
});
