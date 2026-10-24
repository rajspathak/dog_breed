import type { SyncStatus } from '@/store/catalogStore';
import { describeSyncBanner } from '@/sync/syncBanner';

const HOUR = 60 * 60 * 1000;
const now = Date.UTC(2026, 5, 1);

const status = (overrides: Partial<SyncStatus> = {}): SyncStatus => ({
  phase: 'idle',
  pagesDone: 0,
  pagesTotal: 0,
  lastSuccessAt: now - 2 * HOUR,
  lastOutcome: 'complete',
  lastError: null,
  failedPages: [],
  ...overrides,
});

describe('describeSyncBanner', () => {
  it('shows freshness when everything is healthy', () => {
    expect(describeSyncBanner({ sync: status(), isOffline: false, hasData: true, now })).toEqual({
      tone: 'neutral',
      title: 'Last synced 2 hours ago',
      detail: null,
      canRetry: false,
    });
  });

  it('prioritises the offline state and keeps freshness visible', () => {
    const banner = describeSyncBanner({ sync: status({ phase: 'syncing' }), isOffline: true, hasData: true, now });
    expect(banner.tone).toBe('warning');
    expect(banner.title).toContain('offline');
    expect(banner.detail).toBe('Last synced 2 hours ago');
  });

  it('shows page progress while syncing', () => {
    const banner = describeSyncBanner({
      sync: status({ phase: 'syncing', pagesDone: 3, pagesTotal: 6 }),
      isOffline: false,
      hasData: true,
      now,
    });
    expect(banner.title).toBe('Syncing breeds (3/6 pages)');
  });

  it('pairs cached data with an error banner after a partial failure', () => {
    const banner = describeSyncBanner({
      sync: status({ lastOutcome: 'partial', lastError: "Couldn't refresh 2 of 6 pages." }),
      isOffline: false,
      hasData: true,
      now,
    });
    expect(banner).toMatchObject({ tone: 'danger', title: 'Showing cached data', canRetry: true });
    expect(banner.detail).toContain("Couldn't refresh 2 of 6 pages.");
  });

  it('offers a refresh once data goes stale', () => {
    const banner = describeSyncBanner({
      sync: status({ lastSuccessAt: now - 3 * 24 * HOUR }),
      isOffline: false,
      hasData: true,
      now,
    });
    expect(banner).toMatchObject({ tone: 'warning', canRetry: true, title: 'Last synced 3 days ago' });
  });

  it('explains a first launch without network', () => {
    const banner = describeSyncBanner({
      sync: status({ lastSuccessAt: null, lastOutcome: null }),
      isOffline: true,
      hasData: false,
      now,
    });
    expect(banner.detail).toContain('Connect to the internet');
  });
});
