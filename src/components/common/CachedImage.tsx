import { Image, type ImageContentFit } from 'expo-image';
import { memo } from 'react';
import { ActivityIndicator, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import type { ImageVariant } from '@/domain/types';
import { useCachedImage } from '@/hooks/useCachedImage';
import { createThemedStyles, useTheme } from '@/theme/theme';

type Props = {
  url: string | null;
  variant: ImageVariant;
  fallbackLabel: string;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
};

export const CachedImage = memo(
  ({ url, variant, fallbackLabel, style, contentFit = 'cover', accessibilityLabel }: Props) => {
    const styles = useStyles();
    const { colors } = useTheme();
    const { uri, failed } = useCachedImage(url, variant);

    if (!uri) {
      return (
        <View style={[style, styles.placeholder]} accessible={false}>
          {failed ? <Text style={styles.initial}>{fallbackLabel.charAt(0).toUpperCase()}</Text> : null}
          {!failed && variant !== 'thumb' ? (
            <ActivityIndicator color={colors.textSubtle} accessibilityLabel="Loading photo" />
          ) : null}
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={style}
        contentFit={contentFit}
        cachePolicy="memory"
        recyclingKey={url}
        transition={variant === 'thumb' ? 0 : 150}
        accessibilityLabel={accessibilityLabel}
        accessible={accessibilityLabel !== undefined}
      />
    );
  },
);

CachedImage.displayName = 'CachedImage';

const useStyles = createThemedStyles((theme) => ({
  placeholder: {
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: theme.colors.textSubtle,
    fontSize: theme.font.heading,
    fontWeight: '600',
  },
}));
