import { Directory, File, Paths } from 'expo-file-system';

import { env } from '@/config/env';
import { getDatabase, type SqlDatabase } from '@/db/database';

import { fileNameFor, planEviction, type CacheBucket, type CacheEntry } from './cachePolicy';
import { createDownloadQueue, type DownloadPriority } from './downloadQueue';

type IndexRow = { url: string; bucket: CacheBucket; file_name: string; bytes: number; last_access: number };

type IndexedEntry = CacheEntry & { bucket: CacheBucket; fileName: string };

const BUDGETS: Record<CacheBucket, number> = {
  thumb: env.thumbCacheBytes,
  full: env.fullCacheBytes,
};

const MAX_PARALLEL_DOWNLOADS = 4;
const DOWNLOAD_TIMEOUT_MS = 20_000;
const TOUCH_FLUSH_MS = 3_000;

const directory = new Directory(Paths.cache, 'breed-images');
const index = new Map<string, IndexedEntry>();
const inflight = new Map<string, Promise<string | null>>();
const listeners = new Set<() => void>();
const pendingTouches = new Set<string>();
const queue = createDownloadQueue(MAX_PARALLEL_DOWNLOADS);

let ready: Promise<SqlDatabase> | null = null;
let touchTimer: ReturnType<typeof setTimeout> | null = null;

const fileFor = (entry: Pick<IndexedEntry, 'fileName'>) => new File(directory, entry.fileName);

const removeFile = (entry: IndexedEntry): boolean => {
  try {
    const file = fileFor(entry);
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
};

const init = (): Promise<SqlDatabase> => {
  ready ??= (async () => {
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
    const db = await getDatabase();
    const rows = await db.getAllAsync<IndexRow>(
      'SELECT url, bucket, file_name, bytes, last_access FROM image_cache',
      [],
    );
    const missing: string[] = [];
    for (const row of rows) {
      const entry: IndexedEntry = {
        url: row.url,
        bucket: row.bucket,
        fileName: row.file_name,
        bytes: row.bytes,
        lastAccess: row.last_access,
      };
      if (fileFor(entry).exists) index.set(row.url, entry);
      else missing.push(row.url);
    }
    for (const url of missing) await db.runAsync('DELETE FROM image_cache WHERE url = ?', [url]);
    listeners.forEach((listener) => listener());
    return db;
  })().catch((error: unknown) => {
    ready = null;
    throw error;
  });
  return ready;
};

const flushTouches = async () => {
  touchTimer = null;
  if (pendingTouches.size === 0) return;
  const db = await init();
  const urls = [...pendingTouches];
  pendingTouches.clear();
  await db.withTransactionAsync(async () => {
    for (const url of urls) {
      const entry = index.get(url);
      if (entry) await db.runAsync('UPDATE image_cache SET last_access = ? WHERE url = ?', [entry.lastAccess, url]);
    }
  });
};

const touch = (entry: IndexedEntry) => {
  entry.lastAccess = Date.now();
  pendingTouches.add(entry.url);
  touchTimer ??= setTimeout(() => {
    flushTouches().catch(() => undefined);
  }, TOUCH_FLUSH_MS);
};

const enforceBudget = async (db: SqlDatabase, bucket: CacheBucket, keep: string) => {
  const entries = [...index.values()].filter((entry) => entry.bucket === bucket);
  const evicted = planEviction(entries, BUDGETS[bucket], new Set([keep]));
  for (const url of evicted) {
    const entry = index.get(url);
    if (!entry) continue;
    index.delete(url);
    removeFile(entry);
    await db.runAsync('DELETE FROM image_cache WHERE url = ?', [url]);
  }
};

const download = async (url: string, bucket: CacheBucket): Promise<string | null> => {
  const db = await init();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const fileName = fileNameFor(url);
    const target = new File(directory, fileName);
    const file = await File.downloadFileAsync(url, target, { idempotent: true, signal: controller.signal });
    const entry: IndexedEntry = { url, bucket, fileName, bytes: file.size, lastAccess: Date.now() };
    index.set(url, entry);
    await db.runAsync(
      `INSERT INTO image_cache (url, bucket, file_name, bytes, last_access) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET bytes = excluded.bytes, last_access = excluded.last_access`,
      [url, bucket, fileName, entry.bytes, entry.lastAccess],
    );
    await enforceBudget(db, bucket, url);
    return file.uri;
  } finally {
    clearTimeout(timer);
  }
};

export const imageCache = {
  warmUp(): Promise<void> {
    return init().then(() => undefined);
  },

  peek(url: string): string | null {
    const entry = index.get(url);
    if (!entry) return null;
    touch(entry);
    return fileFor(entry).uri;
  },

  resolve(url: string, bucket: CacheBucket, priority: DownloadPriority = 'visible'): Promise<string | null> {
    const cached = imageCache.peek(url);
    if (cached) return Promise.resolve(cached);
    const existing = inflight.get(url);
    if (existing) {
      if (priority === 'visible') queue.promote(url);
      return existing;
    }
    const task = queue
      .run(url, priority, () => download(url, bucket))
      .catch(() => null)
      .finally(() => inflight.delete(url));
    inflight.set(url, task);
    return task;
  },

  async prefetch(urls: readonly string[], bucket: CacheBucket): Promise<number> {
    await init();
    const missing = urls.filter((url) => !index.has(url));
    const results = await Promise.all(missing.map((url) => imageCache.resolve(url, bucket, 'background')));
    return results.filter(Boolean).length;
  },

  usage(): Record<CacheBucket, { bytes: number; count: number; budget: number }> {
    const totals = {
      thumb: { bytes: 0, count: 0, budget: BUDGETS.thumb },
      full: { bytes: 0, count: 0, budget: BUDGETS.full },
    };
    for (const entry of index.values()) {
      totals[entry.bucket].bytes += entry.bytes;
      totals[entry.bucket].count += 1;
    }
    return totals;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
