import { fetchBreed, fetchBreedCatalog, fetchGroups, type ApiConfig, type PageResult } from '@/api/dogApi';

import groupsPayload from '../fixtures/groups.json';
import { createFakeFetch, pageOf } from '../helpers/fakeFetch';

const pageNumber = (url: string) => Number(/page\[number\]=(\d+)/.exec(url)?.[1]);

const configWith = (fetchImpl: typeof fetch, overrides: Partial<ApiConfig> = {}): ApiConfig => ({
  baseUrl: 'https://api.test/v2',
  pageSize: 2,
  concurrency: 2,
  timeoutMs: 1000,
  backoff: { retries: 2, baseDelayMs: 0, maxDelayMs: 0 },
  fetchImpl,
  ...overrides,
});

describe('fetchBreedCatalog', () => {
  it('reads the page count from meta and merges every page into one dataset', async () => {
    const { fetchImpl, calls } = createFakeFetch((url) => {
      const page = pageNumber(url);
      return { status: 200, body: pageOf(page, 3, 5, page === 3 ? ['e'] : [`${page}a`, `${page}b`]) };
    });
    const pages: PageResult[] = [];

    const result = await fetchBreedCatalog((page) => pages.push(page), undefined, configWith(fetchImpl));

    expect(calls[0]).toBe('https://api.test/v2/breeds?page[number]=1&page[size]=2');
    expect(calls).toHaveLength(3);
    expect(result.totalPages).toBe(3);
    expect(result.totalRecords).toBe(5);
    expect(result.breeds.map((breed) => breed.id).sort()).toEqual(['1a', '1b', '2a', '2b', 'e']);
    expect(result.failedPages).toEqual([]);
    expect(pages.map((page) => page.page).sort()).toEqual([1, 2, 3]);
  });

  it('de-duplicates breeds that shift between pages during a sync', async () => {
    const { fetchImpl } = createFakeFetch((url) => {
      const page = pageNumber(url);
      return { status: 200, body: pageOf(page, 2, 3, page === 1 ? ['a', 'b'] : ['b', 'c']) };
    });
    const result = await fetchBreedCatalog(() => undefined, undefined, configWith(fetchImpl));
    expect(result.breeds.map((breed) => breed.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('retries a flaky page and reports pages that never succeed', async () => {
    const { fetchImpl, calls } = createFakeFetch((url, call) => {
      const page = pageNumber(url);
      if (page === 2 && call === 1) return { status: 503 };
      if (page === 3) return { status: 500 };
      return { status: 200, body: pageOf(page, 3, 6, [`${page}a`, `${page}b`]) };
    });

    const result = await fetchBreedCatalog(() => undefined, undefined, configWith(fetchImpl));

    expect(result.failedPages).toEqual([3]);
    expect(result.breeds).toHaveLength(4);
    expect(result.firstError).toMatchObject({ status: 500 });
    expect(calls.filter((url) => pageNumber(url) === 3)).toHaveLength(3);
  });

  it('fails outright when the first page cannot be loaded', async () => {
    const { fetchImpl } = createFakeFetch(() => new TypeError('offline'));
    await expect(fetchBreedCatalog(() => undefined, undefined, configWith(fetchImpl))).rejects.toMatchObject({
      name: 'NetworkError',
    });
  });

  it('counts malformed records instead of crashing', async () => {
    const { fetchImpl } = createFakeFetch(() => ({
      status: 200,
      body: {
        data: [
          { id: 'ok', type: 'breed', attributes: { name: 'Fine' } },
          { id: 'nameless', type: 'breed', attributes: {} },
          'garbage',
        ],
        meta: { pagination: { current: 1, last: 1, records: 3 } },
      },
    }));
    const result = await fetchBreedCatalog(() => undefined, undefined, configWith(fetchImpl));
    expect(result.breeds.map((breed) => breed.id)).toEqual(['ok']);
    expect(result.rejectedRecords).toBe(2);
  });
});

describe('fetchGroups and fetchBreed', () => {
  it('loads the nine groups', async () => {
    const { fetchImpl } = createFakeFetch(() => ({ status: 200, body: groupsPayload }));
    const groups = await fetchGroups(undefined, configWith(fetchImpl));
    expect(groups.map((group) => group.name)).toContain('Herding Group');
    expect(groups).toHaveLength(9);
  });

  it('loads a single breed by id', async () => {
    const { fetchImpl, calls } = createFakeFetch(() => ({
      status: 200,
      body: { data: { id: 'abc', type: 'breed', attributes: { name: 'Solo' } } },
    }));
    const breed = await fetchBreed('abc', undefined, configWith(fetchImpl));
    expect(breed?.name).toBe('Solo');
    expect(calls[0]).toBe('https://api.test/v2/breeds/abc');
  });
});
