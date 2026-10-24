import { Pressable, Text } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  activeCount: number;
  onPress: () => void;
};

export const FilterButton = ({ activeCount, onPress }: Props) => {
  const styles = useStyles();
  const active = activeCount > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filters, ${activeCount} active` : 'Filters'}
      testID="open-filters"
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>
        {active ? `Filters · ${activeCount}` : 'Filters'}
      </Text>
    </Pressable>
  );
};

const useStyles = createThemedStyles((theme) => ({
  button: {
    height: 42,
    paddingHorizontal: theme.spacing(4),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  active: {
    backgroundColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  activeLabel: {
    color: theme.colors.onAccent,
  },
}));
