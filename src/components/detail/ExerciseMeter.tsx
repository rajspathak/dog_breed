import { Text, View } from 'react-native';

import { MAX_EXERCISE_MINUTES } from '@/domain/traitCatalog';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  minutes: number | null;
};

export const ExerciseMeter = ({ minutes }: Props) => {
  const styles = useStyles();
  const ratio = minutes === null ? 0 : Math.min(1, minutes / MAX_EXERCISE_MINUTES);
  const label = minutes === null ? 'Not recorded' : `${minutes} min / day`;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Daily exercise: ${label}`}
      accessibilityValue={minutes === null ? undefined : { min: 0, max: MAX_EXERCISE_MINUTES, now: minutes }}
    >
      <View style={styles.header}>
        <Text style={styles.label}>Daily exercise</Text>
        <Text style={styles.value}>{label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <View style={styles.header}>
        <Text style={styles.caption}>0</Text>
        <Text style={styles.caption}>{MAX_EXERCISE_MINUTES}+ min</Text>
      </View>
    </View>
  );
};

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
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.scaleEmpty,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.info,
  },
  caption: {
    color: theme.colors.textSubtle,
    fontSize: 11,
  },
}));
