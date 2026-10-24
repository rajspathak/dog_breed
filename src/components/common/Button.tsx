import { Pressable, Text } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  accessibilityHint?: string;
};

export const Button = ({ label, onPress, variant = 'primary', accessibilityHint }: Props) => {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
      ]}
    >
      <Text style={variant === 'primary' ? styles.primaryLabel : styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
};

const useStyles = createThemedStyles((theme) => ({
  base: {
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2.5),
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  primaryLabel: {
    color: theme.colors.onAccent,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  ghostLabel: {
    color: theme.colors.accent,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
}));
