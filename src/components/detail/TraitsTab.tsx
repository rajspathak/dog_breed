import { View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { TRAIT_CATEGORIES } from '@/domain/traitCatalog';
import type { Traits } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

import { ExerciseMeter } from './ExerciseMeter';
import { InfoBlock } from './InfoBlock';
import { TagList } from './TagList';
import { TraitScale } from './TraitScale';

type Props = {
  traits: Traits | null;
};

export const TraitsTab = ({ traits }: Props) => {
  const styles = useStyles();

  if (!traits) {
    return <EmptyState title="No trait data yet" message="The source doesn't include trait scores for this breed." />;
  }

  return (
    <View style={styles.container} testID="traits-tab">
      <InfoBlock title="Temperament">
        <TagList tags={traits.temperament} emptyLabel="No temperament tags recorded" />
      </InfoBlock>

      {TRAIT_CATEGORIES.map((category) => (
        <InfoBlock key={category.title} title={category.title}>
          <View style={styles.card}>
            {category.traits.map((trait) => (
              <TraitScale
                key={trait.key}
                label={trait.label}
                value={traits[trait.key]}
                low={trait.low}
                high={trait.high}
              />
            ))}
            {category.title === 'Energy & training' ? <ExerciseMeter minutes={traits.exerciseMinutes} /> : null}
          </View>
        </InfoBlock>
      ))}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    padding: theme.spacing(4),
    gap: theme.spacing(6),
  },
  card: {
    gap: theme.spacing(5),
    padding: theme.spacing(4),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
}));
