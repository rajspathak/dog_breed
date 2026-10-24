import { View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { createThemedStyles } from '@/theme/theme';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: readonly ChipOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  testIDPrefix?: string;
};

export const ChipGroup = <T extends string>({ options, selected, onToggle, testIDPrefix }: Props<T>) => {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={selected.includes(option.value)}
          onPress={() => onToggle(option.value)}
          testID={testIDPrefix ? `${testIDPrefix}-${option.value}` : undefined}
        />
      ))}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
}));
