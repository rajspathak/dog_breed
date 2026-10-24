import { env } from '@/config/env';
import { normalizeBreed, normalizeGroup } from '@/domain/normalize';
import type { Breed, BreedGroup } from '@/domain/types';

import { parseCollection, parseSingle, type ResourceObject } from './guards';
import { DEFAULT_BACKOFF, getJson, withRetry, type BackoffOptions } from './http';

export type ApiConfig = {
  baseUrl: string;
  pageSize: number;
  concurrency: number;
  timeoutMs: number;
  backoff: BackoffOptions;
  fetchImpl?: typeof fetch;
};

export const defaultApiConfig: ApiConfig = {
  baseUrl: env.apiBaseUrl,
  pageSize: env.pageSize,
  concurrency: env.pageConcurrency,
  timeoutMs: env.requestTimeoutMs,
  backoff: DEFAULT_BACKOFF,
};

export type PageResult = {
  page: number;
  totalPages: number;
  breeds: Breed[];
};

export type CatalogFetchResult = {
  breeds: Breed[];
  totalRecords: number;
  totalPages: number;
  failedPages: number[];
  rejectedRecords: number;
  firstError: unknown;
};

const request = (url: string, config: ApiConfig, signal?: AbortSignal) =>
  withRetry(
    () => getJson(url, { timeoutMs: config.timeoutMs, signal, fetchImpl: config.fetchImpl }),
    config.backoff,
    signal,
  );

const breedsPageUrl = (config: ApiConfig, page: number) =>
  `${config.baseUrl}/breeds?page[number]=${page}&page[size]=${config.pageSize}`;

const normalizeAll = (resources: readonly ResourceObject[]) => {
  const breeds: Breed[] = [];
  let rejected = 0;
  for (const resource of resources) {
    const breed = normalizeBreed(resource);
    if (breed) breeds.push(breed);
    else rejected += 1;
  }
  return { breeds, rejected };
};

const runPool = async <T>(items: readonly T[], limit: number, worker: (item: T) => Promise<void>) => {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await worker(next);
    }
  });
  await Promise.all(runners);
};

export const fetchBreedCatalog = async (
  onPage: (result: PageResult) => void,
  signal?: AbortSignal,
  config: ApiConfig = defaultApiConfig,
): Promise<CatalogFetchResult> => {
  const first = parseCollection(await request(breedsPageUrl(config, 1), config, signal));
  const totalRecords = first.pagination?.records ?? first.data.length;
  const totalPages = Math.max(1, first.pagination?.last ?? Math.ceil(totalRecords / config.pageSize));

  const byId = new Map<string, Breed>();
  const failedPages: number[] = [];
  let rejectedRecords = first.rejected;
  let firstError: unknown = null;

  const accept = (page: number, resources: readonly ResourceObject[]) => {
    const { breeds, rejected } = normalizeAll(resources);
    rejectedRecords += rejected;
    for (const breed of breeds) byId.set(breed.id, breed);
    onPage({ page, totalPages, breeds });
  };

  accept(1, first.data);

  const remaining = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  await runPool(remaining, config.concurrency, async (page) => {
    try {
      const document = parseCollection(await request(breedsPageUrl(config, page), config, signal));
      rejectedRecords += document.rejected;
      accept(page, document.data);
    } catch (error) {
      if (signal?.aborted) throw error;
      failedPages.push(page);
      firstError ??= error;
    }
  });

  return {
    breeds: [...byId.values()],
    totalRecords,
    totalPages,
    failedPages: failedPages.sort((a, b) => a - b),
    rejectedRecords,
    firstError,
  };
};

export const fetchGroups = async (
  signal?: AbortSignal,
  config: ApiConfig = defaultApiConfig,
): Promise<BreedGroup[]> => {
  const document = parseCollection(await request(`${config.baseUrl}/groups`, config, signal));
  return document.data.map(normalizeGroup).filter((group): group is BreedGroup => group !== null);
};

export const fetchBreed = async (
  id: string,
  signal?: AbortSignal,
  config: ApiConfig = defaultApiConfig,
): Promise<Breed | null> => {
  const resource = parseSingle(await request(`${config.baseUrl}/breeds/${encodeURIComponent(id)}`, config, signal));
  return normalizeBreed(resource);
};
