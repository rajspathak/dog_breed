import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

import { Button } from './Button';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({ title, message, actionLabel, onAction }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="ghost" /> : null}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing(8),
    paddingVertical: theme.spacing(16),
    gap: theme.spacing(2),
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '600',
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    lineHeight: 21,
  },
}));
