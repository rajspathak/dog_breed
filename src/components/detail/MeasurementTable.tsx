import { Text, View } from 'react-native';

import { formatRange } from '@/domain/format';
import type { Breed } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  breed: Pick<Breed, 'maleWeight' | 'femaleWeight' | 'maleHeight' | 'femaleHeight'>;
};

export const MeasurementTable = ({ breed }: Props) => {
  const styles = useStyles();
  const rows = [
    { label: 'Weight', male: formatRange(breed.maleWeight, 'kg'), female: formatRange(breed.femaleWeight, 'kg') },
    { label: 'Height', male: formatRange(breed.maleHeight, 'cm'), female: formatRange(breed.femaleHeight, 'cm') },
  ];

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.head, styles.first]} />
        <Text style={[styles.cell, styles.head]}>Male</Text>
        <Text style={[styles.cell, styles.head]}>Female</Text>
      </View>
      {rows.map((row) => (
        <View
          key={row.label}
          style={styles.row}
          accessible
          accessibilityLabel={`${row.label}. Male ${row.male}. Female ${row.female}`}
        >
          <Text style={[styles.cell, styles.first, styles.label]}>{row.label}</Text>
          <Text style={styles.cell}>{row.male}</Text>
          <Text style={styles.cell}>{row.female}</Text>
        </View>
      ))}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  table: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1),
  },
  row: {
    flexDirection: 'row',
    paddingVertical: theme.spacing(2),
  },
  cell: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  first: {
    flex: 0.8,
  },
  head: {
    color: theme.colors.textSubtle,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  label: {
    color: theme.colors.textMuted,
  },
}));
