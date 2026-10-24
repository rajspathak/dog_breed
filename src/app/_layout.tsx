import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/components/app/AppProviders';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ title: 'Dog Breeds', headerTransparent: false }} />
        <Stack.Screen name="breed/[id]" options={{ title: '' }} />
        <Stack.Screen name="filters" options={{ title: 'Filters', presentation: 'modal', headerTransparent: false }} />
      </Stack>
    </AppProviders>
  );
}
