import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { FilterFooter } from '@/components/filters/FilterFooter';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { useBreedEntries } from '@/hooks/useBreedEntries';
import { useFilterStore } from '@/store/filterStore';
import { createThemedStyles } from '@/theme/theme';

export const FilterScreen = () => {
  const styles = useStyles();
  const router = useRouter();
  const { matchCount } = useBreedEntries();
  const clearCriteria = useFilterStore((state) => state.clearCriteria);

  return (
    <View style={styles.screen}>
      <ErrorBoundary name="Filters">
        <FilterPanel />
      </ErrorBoundary>
      <FilterFooter matchCount={matchCount} onReset={clearCriteria} onApply={() => router.back()} />
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
