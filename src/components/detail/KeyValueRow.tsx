import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  label: string;
  value: string;
};

export const KeyValueRow = ({ label, value }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing(4),
    paddingVertical: theme.spacing(1.5),
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  value: {
    flexShrink: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
}));
