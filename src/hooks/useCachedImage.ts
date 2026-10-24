import { useEffect, useState } from 'react';

import type { ImageVariant } from '@/domain/types';
import { bucketFor } from '@/images/cachePolicy';
import { imageCache } from '@/images/imageCache';

export type CachedImageState = {
  uri: string | null;
  failed: boolean;
};

type Resolution = {
  url: string;
  uri: string | null;
};

export const useCachedImage = (url: string | null, variant: ImageVariant): CachedImageState => {
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const cached = url ? imageCache.peek(url) : null;

  useEffect(() => {
    if (!url || cached) return;
    let active = true;
    imageCache.resolve(url, bucketFor(variant)).then((uri) => {
      if (active) setResolution({ url, uri });
    });
    return () => {
      active = false;
    };
  }, [url, variant, cached]);

  if (!url) return { uri: null, failed: true };
  if (cached) return { uri: cached, failed: false };
  if (resolution?.url === url) return { uri: resolution.uri, failed: resolution.uri === null };
  return { uri: null, failed: false };
};
