import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

import { Button } from './Button';

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState = ({ title, message, actionLabel, onAction }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(8),
    gap: theme.spacing(3),
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    lineHeight: 21,
  },
}));
