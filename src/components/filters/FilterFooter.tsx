import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  matchCount: number;
  onReset: () => void;
  onApply: () => void;
};

export const FilterFooter = ({ matchCount, onReset, onApply }: Props) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Button label="Reset" onPress={onReset} variant="ghost" />
      <View style={styles.primary}>
        <Button label={`Show ${matchCount} ${matchCount === 1 ? 'breed' : 'breeds'}`} onPress={onApply} />
      </View>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  primary: {
    flex: 1,
  },
}));
