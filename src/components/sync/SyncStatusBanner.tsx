import { useMemo } from 'react';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNow } from '@/hooks/useNow';
import { useCatalogStore } from '@/store/catalogStore';
import { describeSyncBanner } from '@/sync/syncBanner';

import { SyncBannerView } from './SyncBannerView';

type Props = {
  onRetry: () => void;
};

export const SyncStatusBanner = ({ onRetry }: Props) => {
  const sync = useCatalogStore((state) => state.sync);
  const hasData = useCatalogStore((state) => state.listItems.length > 0);
  const { isOffline } = useNetworkStatus();
  const now = useNow();

  const banner = useMemo(() => describeSyncBanner({ sync, isOffline, hasData, now }), [sync, isOffline, hasData, now]);

  return <SyncBannerView banner={banner} busy={sync.phase === 'syncing' && !isOffline} onRetry={onRetry} />;
};
