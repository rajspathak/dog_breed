import { Text, View, useWindowDimensions } from 'react-native';

import { CachedImage } from '@/components/common/CachedImage';
import { Chip } from '@/components/common/Chip';
import { SIZE_LABELS } from '@/domain/format';
import type { Breed } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

type Props = {
  breed: Breed;
  groupName: string | null;
  refreshing: boolean;
};

export const DetailHero = ({ breed, groupName, refreshing }: Props) => {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cover = breed.images[0];

  return (
    <View>
      <CachedImage
        url={cover?.medium ?? null}
        variant="medium"
        fallbackLabel={breed.name}
        style={{ width, height: Math.round(width * 0.62) }}
        accessibilityLabel={`Photo of a ${breed.name}`}
      />
      <View style={styles.body}>
        <Text style={styles.name} accessibilityRole="header">
          {breed.name}
        </Text>
        <View style={styles.tags}>
          {groupName ? <Chip label={groupName} /> : null}
          <Chip label={SIZE_LABELS[breed.sizeBand]} />
          {breed.hypoallergenic ? <Chip label="Hypoallergenic" /> : null}
        </View>
        {refreshing ? <Text style={styles.refreshing}>Checking for updates…</Text> : null}
      </View>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  body: {
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(3),
    gap: theme.spacing(3),
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.font.display,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  refreshing: {
    color: theme.colors.textSubtle,
    fontSize: theme.font.caption,
  },
}));
