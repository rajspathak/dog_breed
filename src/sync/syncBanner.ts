import { env } from '@/config/env';
import { formatRelativeTime } from '@/domain/format';
import type { SyncStatus } from '@/store/catalogStore';

export type BannerTone = 'info' | 'warning' | 'danger' | 'neutral';

export type SyncBanner = {
  tone: BannerTone;
  title: string;
  detail: string | null;
  canRetry: boolean;
};

type Input = {
  sync: SyncStatus;
  isOffline: boolean;
  hasData: boolean;
  now: number;
};

export const describeSyncBanner = ({ sync, isOffline, hasData, now }: Input): SyncBanner => {
  const freshness = sync.lastSuccessAt ? `Last synced ${formatRelativeTime(sync.lastSuccessAt, now)}` : 'Never synced';

  if (isOffline) {
    return {
      tone: 'warning',
      title: hasData ? "You're offline · showing saved breeds" : "You're offline",
      detail: hasData ? freshness : 'Connect to the internet to download the breed catalog.',
      canRetry: false,
    };
  }

  if (sync.phase === 'syncing') {
    const progress = sync.pagesTotal > 0 ? ` (${sync.pagesDone}/${sync.pagesTotal} pages)` : '';
    return { tone: 'info', title: `Syncing breeds${progress}`, detail: hasData ? freshness : null, canRetry: false };
  }

  if (sync.lastOutcome === 'failed' || sync.lastOutcome === 'partial') {
    return {
      tone: 'danger',
      title: hasData ? 'Showing cached data' : "Couldn't load breeds",
      detail: [sync.lastError, hasData ? freshness : null].filter(Boolean).join(' · ') || null,
      canRetry: true,
    };
  }

  const stale = sync.lastSuccessAt !== null && now - sync.lastSuccessAt > env.staleAfterMs;
  return { tone: stale ? 'warning' : 'neutral', title: freshness, detail: null, canRetry: stale };
};
