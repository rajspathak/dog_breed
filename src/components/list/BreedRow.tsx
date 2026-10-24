import { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CachedImage } from '@/components/common/CachedImage';
import type { BreedListItem } from '@/domain/filters';
import { COAT_LABELS, SIZE_LABELS } from '@/domain/format';
import { createThemedStyles } from '@/theme/theme';

import { ROW_HEIGHT, THUMB_SIZE } from './layout';

type Props = {
  item: BreedListItem;
  isLast: boolean;
  onPress: (id: string) => void;
};

const subtitleFor = (item: BreedListItem): string => {
  const coat = item.coats.length > 0 ? `${item.coats.map((coat) => COAT_LABELS[coat]).join('/')} coat` : null;
  return [SIZE_LABELS[item.sizeBand], coat, item.lifeSpanLabel].filter(Boolean).join(' · ');
};

export const BreedRow = memo(({ item, isLast, onPress }: Props) => {
  const styles = useStyles();
  const handlePress = useCallback(() => onPress(item.id), [onPress, item.id]);
  const subtitle = subtitleFor(item);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}. ${subtitle}${item.hypoallergenic ? '. Hypoallergenic' : ''}`}
      accessibilityHint="Opens breed details"
      testID={`breed-row-${item.id}`}
    >
      <CachedImage url={item.thumbUrl} variant="thumb" fallbackLabel={item.name} style={styles.thumb} />
      <View style={[styles.body, !isLast && styles.divider]}>
        <View style={styles.titleLine}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.hypoallergenic ? <Text style={styles.badge}>Hypoallergenic</Text> : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
});

BreedRow.displayName = 'BreedRow';

const useStyles = createThemedStyles((theme) => ({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing(4),
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: theme.radius.md,
  },
  body: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    marginLeft: theme.spacing(3),
    paddingRight: theme.spacing(4),
    gap: theme.spacing(1),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  name: {
    flexShrink: 1,
    color: theme.colors.text,
    fontSize: theme.font.title - 1,
    fontWeight: '600',
  },
  badge: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
}));
