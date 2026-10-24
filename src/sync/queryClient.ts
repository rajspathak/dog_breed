import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { backoffDelay, DEFAULT_BACKOFF, isRetryable } from '@/api/http';

import { SyncFailedError } from './syncEngine';

let wired = false;

export const wireReactQueryToDevice = (): void => {
  if (wired) return;
  wired = true;

  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    }),
  );

  if (Platform.OS !== 'web') {
    focusManager.setEventListener((handleFocus) => {
      const subscription = AppState.addEventListener('change', (status) => handleFocus(status === 'active'));
      return () => subscription.remove();
    });
  }
};

export const shouldRetry = (failureCount: number, error: unknown): boolean => {
  const cause = error instanceof SyncFailedError ? error.cause : error;
  return failureCount < 2 && isRetryable(cause);
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attempt) => backoffDelay(attempt + 2, DEFAULT_BACKOFF),
        networkMode: 'online',
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        gcTime: 30 * 60_000,
      },
    },
  });
