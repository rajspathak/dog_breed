import { memo } from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  label: string;
  value: number | null;
  low: string;
  high: string;
  max?: number;
};

export const TraitScale = memo(({ label, value, low, high, max = 5 }: Props) => {
  const styles = useStyles();
  const description = value === null ? `${label}: not rated` : `${label}: ${value} out of ${max}. ${low} to ${high}.`;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={description}
      accessibilityValue={value === null ? undefined : { min: 0, max, now: value }}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value === null ? '—' : `${value}/${max}`}</Text>
      </View>
      <View style={styles.track}>
        {Array.from({ length: max }, (_, index) => (
          <View key={index} style={[styles.segment, value !== null && index < value && styles.filled]} />
        ))}
      </View>
      <View style={styles.header}>
        <Text style={styles.caption}>{low}</Text>
        <Text style={styles.caption}>{high}</Text>
      </View>
    </View>
  );
});

TraitScale.displayName = 'TraitScale';

const useStyles = createThemedStyles((theme) => ({
  container: {
    gap: theme.spacing(1.5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  track: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.scaleEmpty,
  },
  filled: {
    backgroundColor: theme.colors.accent,
  },
  caption: {
    color: theme.colors.textSubtle,
    fontSize: 11,
  },
}));
