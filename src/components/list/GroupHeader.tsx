import { memo } from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

import { HEADER_HEIGHT } from './layout';

type Props = {
  title: string;
  count: number;
};

export const GroupHeader = memo(({ title, count }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.header} accessibilityRole="header" accessibilityLabel={`${title}, ${count} breeds`}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
});

GroupHeader.displayName = 'GroupHeader';

const useStyles = createThemedStyles((theme) => ({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(4),
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  count: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
}));
