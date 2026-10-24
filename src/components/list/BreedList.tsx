import { useCallback, useMemo, type JSX } from 'react';
import { FlatList, RefreshControl, type ListRenderItem } from 'react-native';

import type { ListEntry } from '@/domain/filters';
import { useTheme } from '@/theme/theme';

import { BreedRow } from './BreedRow';
import { GroupHeader } from './GroupHeader';
import { computeOffsets, entryHeight } from './layout';

type Props = {
  entries: ListEntry[];
  headerIndices: number[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  ListEmptyComponent: JSX.Element;
};

const keyExtractor = (entry: ListEntry) => entry.key;

export const BreedList = ({ entries, headerIndices, refreshing, onRefresh, onSelect, ListEmptyComponent }: Props) => {
  const { colors } = useTheme();
  const offsets = useMemo(() => computeOffsets(entries), [entries]);

  const getItemLayout = useCallback(
    (data: ArrayLike<ListEntry> | null | undefined, index: number) => {
      const entry = data?.[index];
      return { length: entry ? entryHeight(entry) : 0, offset: offsets[index] ?? 0, index };
    },
    [offsets],
  );

  const renderItem = useCallback<ListRenderItem<ListEntry>>(
    ({ item }) =>
      item.kind === 'header' ? (
        <GroupHeader title={item.title} count={item.count} />
      ) : (
        <BreedRow item={item.item} isLast={item.isLast} onPress={onSelect} />
      ),
    [onSelect],
  );

  return (
    <FlatList
      data={entries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      stickyHeaderIndices={headerIndices}
      initialNumToRender={14}
      maxToRenderPerBatch={16}
      updateCellsBatchingPeriod={30}
      windowSize={9}
      removeClippedSubviews={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      ListEmptyComponent={ListEmptyComponent}
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      testID="breed-list"
    />
  );
};
