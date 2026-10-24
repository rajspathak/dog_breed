const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MB = 1024 * 1024;

export const env = {
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://dogapi.dog/api/v2').replace(/\/+$/, ''),
  pageSize: toNumber(process.env.EXPO_PUBLIC_PAGE_SIZE, 48),
  pageConcurrency: toNumber(process.env.EXPO_PUBLIC_PAGE_CONCURRENCY, 3),
  requestTimeoutMs: toNumber(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS, 10_000),
  staleAfterMs: toNumber(process.env.EXPO_PUBLIC_STALE_AFTER_MINUTES, 360) * 60_000,
  thumbCacheBytes: toNumber(process.env.EXPO_PUBLIC_THUMB_CACHE_MB, 20) * MB,
  fullCacheBytes: toNumber(process.env.EXPO_PUBLIC_FULL_CACHE_MB, 80) * MB,
} as const;
