import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ErrorState } from '@/components/common/ErrorState';
import { imageCache } from '@/images/imageCache';
import { hydrateCatalog } from '@/sync/services';
import { createThemedStyles, useTheme } from '@/theme/theme';

type Status = 'loading' | 'ready' | 'error';

export const CatalogBootstrap = ({ children }: { children: ReactNode }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([hydrateCatalog(), imageCache.warmUp().catch(() => undefined)])
      .then(() => active && setStatus('ready'))
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }, []);

  if (status === 'ready') return children;

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <ActivityIndicator color={colors.accent} accessibilityLabel="Loading saved breeds" />
      ) : (
        <ErrorState
          title="Couldn't open local storage"
          message="The on-device database failed to open. Restarting the app usually fixes this."
          actionLabel="Try again"
          onAction={retry}
        />
      )}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
}));
