import { Text, View } from 'react-native';

import { formatRange, titleCase } from '@/domain/format';
import type { Breed } from '@/domain/types';
import { createThemedStyles } from '@/theme/theme';

import { InfoBlock } from './InfoBlock';
import { KeyValueRow } from './KeyValueRow';
import { MeasurementTable } from './MeasurementTable';
import { TagList } from './TagList';

type Props = {
  breed: Breed;
};

export const OverviewTab = ({ breed }: Props) => {
  const styles = useStyles();
  const { era, region, country } = breed.origin;
  const coat = [breed.coat.length, breed.coat.type].filter(Boolean).map((value) => titleCase(value ?? ''));

  return (
    <View style={styles.container} testID="overview-tab">
      {breed.description ? <Text style={styles.description}>{breed.description}</Text> : null}

      <InfoBlock title="At a glance">
        <View>
          <KeyValueRow label="Life span" value={formatRange(breed.lifeSpan, 'years')} />
          <KeyValueRow label="Coat" value={coat.length > 0 ? [...new Set(coat)].join(', ') : 'Not recorded'} />
          {breed.coat.colors.length > 0 ? <KeyValueRow label="Colors" value={breed.coat.colors.join(', ')} /> : null}
        </View>
      </InfoBlock>

      <InfoBlock title="Size">
        <MeasurementTable breed={breed} />
      </InfoBlock>

      <InfoBlock title="Origin">
        <View>
          <KeyValueRow label="Country" value={country ?? 'Unknown'} />
          <KeyValueRow label="Region" value={region ?? 'Unknown'} />
          <KeyValueRow label="Era" value={era ?? 'Unknown'} />
        </View>
      </InfoBlock>

      <InfoBlock title="Also known as">
        <TagList tags={breed.otherNames} emptyLabel="No other names recorded" />
      </InfoBlock>

      <InfoBlock title="Recognized by">
        <TagList tags={breed.recognizedBy} emptyLabel="No kennel clubs listed" />
      </InfoBlock>
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    padding: theme.spacing(4),
    gap: theme.spacing(6),
  },
  description: {
    color: theme.colors.text,
    fontSize: theme.font.body + 1,
    lineHeight: 24,
  },
}));
