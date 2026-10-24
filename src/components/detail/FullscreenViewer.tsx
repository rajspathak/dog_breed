import { Image } from 'expo-image';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BreedImage } from '@/domain/types';
import { useCachedImage } from '@/hooks/useCachedImage';
import { imageCache } from '@/images/imageCache';
import { useTheme } from '@/theme/theme';

import { ImageAttribution } from './ImageAttribution';

type Props = {
  image: BreedImage | null;
  breedName: string;
  onClose: () => void;
};

const ViewerContent = ({ image, breedName, onClose }: Props & { image: BreedImage }) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const large = useCachedImage(image.large, 'large');
  const preview = imageCache.peek(image.medium);
  const uri = large.uri ?? preview;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width, height: height * 0.7 }}
          contentFit="contain"
          cachePolicy="memory"
          transition={200}
          accessibilityLabel={`${breedName}, full size photo`}
          accessible
        />
      ) : null}
      {!large.uri && !large.failed ? <ActivityIndicator style={styles.spinner} color="#FFFFFF" /> : null}
      {large.failed && !preview ? <Text style={styles.error}>{"This photo isn't available offline."}</Text> : null}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <ImageAttribution attribution={image.attribution} inverted />
      </View>
      <Pressable
        onPress={onClose}
        style={[styles.close, { top: insets.top + 12 }]}
        accessibilityRole="button"
        accessibilityLabel="Close photo"
        hitSlop={12}
      >
        <Text style={styles.closeLabel}>Close</Text>
      </Pressable>
    </View>
  );
};

export const FullscreenViewer = ({ image, breedName, onClose }: Props) => (
  <Modal visible={image !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    {image ? <ViewerContent image={image} breedName={breedName} onClose={onClose} /> : null}
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
  },
  error: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  close: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  closeLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
