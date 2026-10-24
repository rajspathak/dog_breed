import { memo } from 'react';
import { Pressable, Text } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export const Chip = memo(({ label, selected = false, onPress, accessibilityLabel, testID }: Props) => {
  const styles = useStyles();
  const content = <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>;

  if (!onPress) {
    return (
      <Pressable
        disabled
        style={[styles.chip, styles.static]}
        accessible
        accessibilityLabel={accessibilityLabel ?? label}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
});

Chip.displayName = 'Chip';

const useStyles = createThemedStyles((theme) => ({
  chip: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  static: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.surfaceMuted,
  },
  selected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  labelSelected: {
    color: theme.colors.onAccent,
  },
}));
