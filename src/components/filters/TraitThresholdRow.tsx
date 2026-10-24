import { Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

import { SegmentedControl, type Segment } from './SegmentedControl';

type Threshold = 'any' | '2' | '3' | '4' | '5';

const SEGMENTS: readonly Segment<Threshold>[] = [
  { value: 'any', label: 'Any' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5' },
];

type Props = {
  label: string;
  minimum: number | undefined;
  onChange: (minimum: number | null) => void;
  testIDPrefix: string;
};

export const TraitThresholdRow = ({ label, minimum, onChange, testIDPrefix }: Props) => {
  const styles = useStyles();
  const value: Threshold = SEGMENTS.find((segment) => segment.value === String(minimum))?.value ?? 'any';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <SegmentedControl
        segments={SEGMENTS}
        value={value}
        onChange={(next) => onChange(next === 'any' ? null : Number(next))}
        accessibilityLabel={`Minimum score for ${label.toLowerCase()}`}
        testIDPrefix={testIDPrefix}
      />
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  row: {
    gap: theme.spacing(2),
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
}));
