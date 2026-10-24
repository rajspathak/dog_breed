import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { createQueryClient, wireReactQueryToDevice } from '@/sync/queryClient';
import { useTheme } from '@/theme/theme';

import { BackgroundTasks } from './BackgroundTasks';
import { CatalogBootstrap } from './CatalogBootstrap';

wireReactQueryToDevice();

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);
  const theme = useTheme();

  const navigationTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    };
  }, [theme]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary name="App">
            <CatalogBootstrap>
              <BackgroundTasks />
              {children}
            </CatalogBootstrap>
          </ErrorBoundary>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
