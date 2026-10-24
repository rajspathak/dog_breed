import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export const FilterSection = ({ title, hint, children }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  section: {
    paddingVertical: theme.spacing(4),
    gap: theme.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  heading: {
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title - 1,
    fontWeight: '700',
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
}));
