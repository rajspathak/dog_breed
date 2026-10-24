import { memo, useCallback } from 'react';
import { Linking, Text, View } from 'react-native';

import { titleCase } from '@/domain/format';
import type { Attribution } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  attribution: Attribution;
  inverted?: boolean;
};

const LinkText = ({ label, url, style }: { label: string; url: string | null; style: object }) => {
  const open = useCallback(() => {
    if (url) Linking.openURL(url).catch(() => undefined);
  }, [url]);

  if (!url) return <Text style={style}>{label}</Text>;
  return (
    <Text style={[style, { textDecorationLine: 'underline' }]} onPress={open} accessibilityRole="link">
      {label}
    </Text>
  );
};

export const formatSource = (source: string | null): string | null =>
  source ? titleCase(source.replace(/[_-]+/g, ' ')) : null;

export const ImageAttribution = memo(({ attribution, inverted = false }: Props) => {
  const styles = useStyles();
  const textStyle = inverted ? styles.inverted : styles.text;
  const source = formatSource(attribution.source);

  return (
    <View style={styles.container} testID="image-attribution">
      <Text style={textStyle} numberOfLines={2}>
        Photo by {attribution.author ?? 'unknown author'}
      </Text>
      <View style={styles.links}>
        {attribution.license ? (
          <LinkText label={attribution.license} url={attribution.licenseUrl} style={textStyle} />
        ) : (
          <Text style={textStyle}>License not specified</Text>
        )}
        {source ? (
          <>
            <Text style={textStyle}> · </Text>
            <LinkText label={source} url={attribution.sourceUrl} style={textStyle} />
          </>
        ) : null}
      </View>
    </View>
  );
});

ImageAttribution.displayName = 'ImageAttribution';

const useStyles = createThemedStyles((theme) => ({
  container: {
    gap: 2,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  inverted: {
    color: '#E8E4DC',
    fontSize: theme.font.caption,
  },
}));
