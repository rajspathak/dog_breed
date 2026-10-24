import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  title: string;
  children: ReactNode;
};

export const InfoBlock = ({ title, children }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.block}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  block: {
    gap: theme.spacing(2),
  },
  title: {
    color: theme.colors.textSubtle,
    fontSize: theme.font.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
}));
