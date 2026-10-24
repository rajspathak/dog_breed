import { useLocalSearchParams } from 'expo-router';

import { DETAIL_TABS, type DetailTab } from '@/components/detail/DetailTabs';
import { BreedDetailScreen } from '@/screens/BreedDetailScreen';

const asTab = (value: unknown): DetailTab => DETAIL_TABS.find((tab) => tab === value) ?? 'overview';

export default function BreedRoute() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const breedId = typeof id === 'string' ? id : '';
  const initialTab = asTab(tab);
  return <BreedDetailScreen key={`${breedId}:${initialTab}`} id={breedId} initialTab={initialTab} />;
}
