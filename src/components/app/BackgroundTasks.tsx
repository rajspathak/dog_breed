import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { imageCache } from '@/images/imageCache';
import { useCatalogStore } from '@/store/catalogStore';
import { useCatalogSync } from '@/sync/useCatalogSync';

const useThumbnailPrefetch = () => {
  const { isWifi, isOffline } = useNetworkStatus();
  const lastOutcome = useCatalogStore((state) => state.sync.lastOutcome);
  const items = useCatalogStore((state) => state.listItems);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !isWifi || isOffline || lastOutcome !== 'complete' || items.length === 0) return;
    done.current = true;
    const urls = items.map((item) => item.thumbUrl).filter((url): url is string => url !== null);
    imageCache.prefetch(urls, 'thumb').catch(() => {
      done.current = false;
    });
  }, [isWifi, isOffline, lastOutcome, items]);
};

const useMemoryPressureRelief = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('memoryWarning', () => {
      Image.clearMemoryCache().catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);
};

export const BackgroundTasks = () => {
  useCatalogSync();
  useThumbnailPrefetch();
  useMemoryPressureRelief();
  return null;
};
