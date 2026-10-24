import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { CachedImage } from '@/components/common/CachedImage';
import type { BreedImage } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

import { ImageAttribution } from './ImageAttribution';

type Props = {
  image: BreedImage;
  index: number;
  total: number;
  width: number;
  breedName: string;
  onOpen: (index: number) => void;
};

export const GallerySlide = memo(({ image, index, total, width, breedName, onOpen }: Props) => {
  const styles = useStyles();
  const handlePress = useCallback(() => onOpen(index), [onOpen, index]);
  const imageWidth = width - 32;

  return (
    <View style={[styles.slide, { width }]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="imagebutton"
        accessibilityLabel={`${breedName} photo ${index + 1} of ${total}`}
        accessibilityHint="Opens the full size photo"
      >
        <CachedImage
          url={image.medium}
          variant="medium"
          fallbackLabel={breedName}
          style={[styles.image, { width: imageWidth, height: Math.round(imageWidth * 0.75) }]}
        />
      </Pressable>
      <ImageAttribution attribution={image.attribution} />
    </View>
  );
});

GallerySlide.displayName = 'GallerySlide';

const useStyles = createThemedStyles((theme) => ({
  slide: {
    paddingHorizontal: theme.spacing(4),
    gap: theme.spacing(3),
  },
  image: {
    borderRadius: theme.radius.lg,
  },
}));
