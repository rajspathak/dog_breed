import { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  useWindowDimensions,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import type { BreedImage } from '@/domain/types';

import { FullscreenViewer } from './FullscreenViewer';
import { GallerySlide } from './GallerySlide';
import { PageDots } from './PageDots';

type Props = {
  images: BreedImage[];
  breedName: string;
};

const keyExtractor = (image: BreedImage) => image.id;

export const GalleryTab = ({ images, breedName }: Props) => {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPage(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<BreedImage> | null | undefined, index: number) => ({ length: width, offset: width * index, index }),
    [width],
  );

  const renderItem = useCallback<ListRenderItem<BreedImage>>(
    ({ item, index }) => (
      <GallerySlide
        image={item}
        index={index}
        total={images.length}
        width={width}
        breedName={breedName}
        onOpen={setViewerIndex}
      />
    ),
    [images.length, width, breedName],
  );

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  if (images.length === 0) {
    return <EmptyState title="No photos" message="There are no photos for this breed yet." />;
  }

  return (
    <View testID="gallery-tab">
      <PageDots index={page} total={images.length} />
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleScrollEnd}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        testID="gallery-pager"
      />
      <FullscreenViewer
        image={viewerIndex === null ? null : (images[viewerIndex] ?? null)}
        breedName={breedName}
        onClose={closeViewer}
      />
    </View>
  );
};
