import { memo } from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  index: number;
  total: number;
};

export const PageDots = memo(({ index, total }: Props) => {
  const styles = useStyles();
  if (total <= 1) return null;
  return (
    <View style={styles.row} accessible accessibilityLabel={`Photo ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, dot) => (
        <View key={dot} style={[styles.dot, dot === index && styles.active]} />
      ))}
      <Text style={styles.counter}>
        {index + 1} / {total}
      </Text>
    </View>
  );
});

PageDots.displayName = 'PageDots';

const useStyles = createThemedStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing(3),
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.scaleEmpty,
  },
  active: {
    width: 16,
    backgroundColor: theme.colors.accent,
  },
  counter: {
    marginLeft: theme.spacing(2),
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    fontVariant: ['tabular-nums'],
  },
}));
