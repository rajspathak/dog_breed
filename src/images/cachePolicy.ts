import type { ImageVariant } from '@/domain/types';

export type CacheBucket = 'thumb' | 'full';

export type CacheEntry = {
  url: string;
  bytes: number;
  lastAccess: number;
};

export const bucketFor = (variant: ImageVariant): CacheBucket => (variant === 'thumb' ? 'thumb' : 'full');

export const planEviction = (
  entries: readonly CacheEntry[],
  budgetBytes: number,
  protectedUrls: ReadonlySet<string> = new Set(),
): string[] => {
  let total = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  if (total <= budgetBytes) return [];
  const evicted: string[] = [];
  const oldestFirst = [...entries].sort((a, b) => a.lastAccess - b.lastAccess);
  for (const entry of oldestFirst) {
    if (total <= budgetBytes) break;
    if (protectedUrls.has(entry.url)) continue;
    evicted.push(entry.url);
    total -= entry.bytes;
  }
  return evicted;
};

const hash = (value: string): string => {
  let h1 = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    h1 ^= value.charCodeAt(index);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(36);
};

export const fileNameFor = (url: string): string => {
  const tail = url.split(/[?#]/)[0]?.split('/').pop() ?? '';
  const safe = tail.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return `${safe || 'img'}-${hash(url)}.img`;
};
