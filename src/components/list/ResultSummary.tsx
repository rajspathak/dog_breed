import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

type Props = {
  matchCount: number;
  totalCount: number;
  filtersActive: boolean;
  onClear: () => void;
};

export const ResultSummary = ({ matchCount, totalCount, filtersActive, onClear }: Props) => {
  const styles = useStyles();
  if (totalCount === 0) return null;
  const narrowed = matchCount !== totalCount;

  return (
    <View style={styles.container}>
      <Text style={styles.text} accessibilityLiveRegion="polite" testID="result-summary">
        {narrowed ? `${matchCount} of ${totalCount} breeds` : `${totalCount} breeds`}
      </Text>
      {filtersActive ? (
        <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="Clear all filters" hitSlop={10}>
          <Text style={styles.clear}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(4),
    paddingBottom: theme.spacing(2),
  },
  text: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  clear: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
}));
