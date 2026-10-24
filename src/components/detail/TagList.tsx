import { Text, View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  tags: readonly string[];
  emptyLabel: string;
};

export const TagList = ({ tags, emptyLabel }: Props) => {
  const styles = useStyles();
  if (tags.length === 0) return <Text style={styles.empty}>{emptyLabel}</Text>;
  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <Chip key={tag} label={tag} />
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
  empty: {
    color: theme.colors.textSubtle,
    fontSize: 14,
  },
}));
