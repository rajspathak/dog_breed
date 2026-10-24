import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { BreedList } from '@/components/list/BreedList';
import { FilterButton } from '@/components/list/FilterButton';
import { ResultSummary } from '@/components/list/ResultSummary';
import { SearchBar } from '@/components/list/SearchBar';
import { SyncStatusBanner } from '@/components/sync/SyncStatusBanner';
import { countActiveFilters } from '@/domain/filters';
import { useBreedEntries } from '@/hooks/useBreedEntries';
import { useCatalogStore } from '@/store/catalogStore';
import { useFilterStore } from '@/store/filterStore';
import { useCatalogSync } from '@/sync/useCatalogSync';
import { createThemedStyles, useTheme } from '@/theme/theme';

const ListHeader = ({ onRetry }: { onRetry: () => void }) => {
  const styles = useStyles();
  const router = useRouter();
  const { query, setQuery, criteria } = useFilterStore(
    useShallow((state) => ({ query: state.query, setQuery: state.setQuery, criteria: state.criteria })),
  );

  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        <SearchBar value={query} onChangeText={setQuery} />
        <FilterButton activeCount={countActiveFilters(criteria)} onPress={() => router.push('/filters')} />
      </View>
      <SyncStatusBanner onRetry={onRetry} />
    </View>
  );
};

const EmptyResults = ({
  hasCatalog,
  syncing,
  onReset,
}: {
  hasCatalog: boolean;
  syncing: boolean;
  onReset: () => void;
}) => {
  const { colors } = useTheme();
  if (!hasCatalog && syncing) {
    return (
      <View style={{ paddingVertical: 64 }}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Downloading breeds" />
      </View>
    );
  }
  if (!hasCatalog) {
    return <EmptyState title="No breeds saved yet" message="Pull down to download the catalog once you're online." />;
  }
  return (
    <EmptyState
      title="No matching breeds"
      message="Try a different search or loosen a filter."
      actionLabel="Reset search and filters"
      onAction={onReset}
    />
  );
};

export const BreedListScreen = () => {
  const styles = useStyles();
  const router = useRouter();
  const { refresh, isManualRefreshing } = useCatalogSync();
  const { entries, headerIndices, matchCount, totalCount } = useBreedEntries();
  const syncing = useCatalogStore((state) => state.sync.phase === 'syncing');
  const { criteria, clearCriteria, setQuery } = useFilterStore(
    useShallow((state) => ({ criteria: state.criteria, clearCriteria: state.clearCriteria, setQuery: state.setQuery })),
  );

  const retry = useCallback(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const resetAll = useCallback(() => {
    clearCriteria();
    setQuery('');
  }, [clearCriteria, setQuery]);

  const openBreed = useCallback((id: string) => router.push({ pathname: '/breed/[id]', params: { id } }), [router]);

  const empty = useMemo(
    () => <EmptyResults hasCatalog={totalCount > 0} syncing={syncing} onReset={resetAll} />,
    [totalCount, syncing, resetAll],
  );

  return (
    <View style={styles.screen}>
      <ListHeader onRetry={retry} />
      <ResultSummary
        matchCount={matchCount}
        totalCount={totalCount}
        filtersActive={countActiveFilters(criteria) > 0}
        onClear={clearCriteria}
      />
      <ErrorBoundary name="Breed list">
        <BreedList
          entries={entries}
          headerIndices={headerIndices}
          refreshing={isManualRefreshing}
          onRefresh={retry}
          onSelect={openBreed}
          ListEmptyComponent={empty}
        />
      </ErrorBoundary>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: theme.spacing(2),
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
    paddingBottom: theme.spacing(3),
  },
}));
