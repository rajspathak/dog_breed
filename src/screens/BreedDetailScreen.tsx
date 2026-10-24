import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { DetailHero } from '@/components/detail/DetailHero';
import { DetailTabs, type DetailTab } from '@/components/detail/DetailTabs';
import { GalleryTab } from '@/components/detail/GalleryTab';
import { OverviewTab } from '@/components/detail/OverviewTab';
import { TraitsTab } from '@/components/detail/TraitsTab';
import { shortGroupName } from '@/domain/normalize';
import type { Breed } from '@/domain/types';
import { useCatalogStore } from '@/store/catalogStore';
import { useBreedDetail } from '@/sync/useBreedDetail';
import { createThemedStyles } from '@/theme/theme';

const TabContent = ({ tab, breed }: { tab: DetailTab; breed: Breed }) => {
  switch (tab) {
    case 'overview':
      return <OverviewTab breed={breed} />;
    case 'traits':
      return <TraitsTab traits={breed.traits} />;
    case 'gallery':
      return <GalleryTab images={breed.images} breedName={breed.name} />;
  }
};

export const BreedDetailScreen = ({ id, initialTab = 'overview' }: { id: string; initialTab?: DetailTab }) => {
  const styles = useStyles();
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const { breed, isRefreshing } = useBreedDetail(id);
  const groupName = useCatalogStore((state) => {
    const groupId = breed?.groupId;
    const group = groupId ? state.groupsById[groupId] : undefined;
    return group ? shortGroupName(group.name) : null;
  });

  if (!breed) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Breed' }} />
        <EmptyState
          title={isRefreshing ? 'Loading breed…' : 'Breed not found'}
          message={isRefreshing ? 'Fetching the latest details.' : "This breed isn't in your saved catalog."}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: breed.name }} />
      <ScrollView
        stickyHeaderIndices={[1]}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        testID="breed-detail"
      >
        <DetailHero breed={breed} groupName={groupName} refreshing={isRefreshing} />
        <DetailTabs active={tab} onChange={setTab} galleryCount={breed.images.length} />
        <ErrorBoundary key={`${breed.id}:${tab}`} name="This tab">
          <TabContent tab={tab} breed={breed} />
        </ErrorBoundary>
      </ScrollView>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: theme.spacing(12),
  },
}));
