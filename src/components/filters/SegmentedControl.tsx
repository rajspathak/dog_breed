import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testIDPrefix?: string;
};

export const SegmentedControl = <T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
  testIDPrefix,
}: Props<T>) => {
  const styles = useStyles();
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${accessibilityLabel}: ${segment.label}`}
            testID={testIDPrefix ? `${testIDPrefix}-${segment.value}` : undefined}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.sm,
  },
  selected: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    color: theme.colors.text,
  },
}));
