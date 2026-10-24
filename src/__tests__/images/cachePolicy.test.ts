import { bucketFor, fileNameFor, planEviction } from '@/images/cachePolicy';

const entry = (url: string, bytes: number, lastAccess: number) => ({ url, bytes, lastAccess });

describe('planEviction', () => {
  it('keeps everything while under budget', () => {
    expect(planEviction([entry('a', 10, 1), entry('b', 10, 2)], 25)).toEqual([]);
  });

  it('evicts least recently used entries until under budget', () => {
    const entries = [entry('new', 40, 30), entry('old', 40, 10), entry('mid', 40, 20)];
    expect(planEviction(entries, 50)).toEqual(['old', 'mid']);
  });

  it('never evicts protected entries such as the file just written', () => {
    const entries = [entry('just-written', 60, 1), entry('other', 30, 5)];
    expect(planEviction(entries, 60, new Set(['just-written']))).toEqual(['other']);
  });
});

describe('fileNameFor', () => {
  it('produces stable, filesystem safe names', () => {
    const url = 'https://images.dogapi.dog/zpwegcab6hzq09q0eyl8oxf66lve';
    expect(fileNameFor(url)).toBe(fileNameFor(url));
    expect(fileNameFor(url)).toMatch(/^zpwegcab6hzq09q0eyl8oxf66lve-[a-z0-9]+\.img$/);
    expect(fileNameFor('https://x/a?b=../../etc')).not.toContain('/');
  });

  it('separates urls that share a tail', () => {
    expect(fileNameFor('https://a.test/img')).not.toBe(fileNameFor('https://b.test/img'));
  });
});

describe('bucketFor', () => {
  it('keeps thumbnails in their own budget', () => {
    expect(bucketFor('thumb')).toBe('thumb');
    expect(bucketFor('medium')).toBe('full');
    expect(bucketFor('large')).toBe('full');
  });
});
