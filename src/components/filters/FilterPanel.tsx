import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { THRESHOLD_TRAITS, type HypoallergenicFilter, type ThresholdTrait } from '@/domain/filters';
import { COAT_LABELS } from '@/domain/format';
import { SIZE_BANDS } from '@/domain/derive';
import { shortGroupName } from '@/domain/normalize';
import type { CoatCategory, SizeBand } from '@/domain/types';
import { selectGroups, useCatalogStore } from '@/store/catalogStore';
import { useFilterStore } from '@/store/filterStore';
import { createThemedStyles } from '@/theme/theme';

import { ChipGroup, type ChipOption } from './ChipGroup';
import { FilterSection } from './FilterSection';
import { SegmentedControl, type Segment } from './SegmentedControl';
import { TraitThresholdRow } from './TraitThresholdRow';

const SIZE_OPTIONS: readonly ChipOption<SizeBand>[] = SIZE_BANDS.map(({ band, label, maxKg }, index) => {
  const lower = index === 0 ? 0 : (SIZE_BANDS[index - 1]?.maxKg ?? 0);
  const range = Number.isFinite(maxKg) ? `${lower}–${maxKg} kg` : `${lower}+ kg`;
  return { value: band, label: `${label} · ${range}` };
});

const COAT_OPTIONS: readonly ChipOption<CoatCategory>[] = (
  ['short', 'medium', 'long', 'wire', 'hairless'] as const
).map((coat) => ({ value: coat, label: COAT_LABELS[coat] }));

const HYPO_SEGMENTS: readonly Segment<HypoallergenicFilter>[] = [
  { value: 'any', label: 'Any' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const TRAIT_LABELS: Record<ThresholdTrait, string> = {
  goodWithChildren: 'Good with children',
  goodWithDogs: 'Good with other dogs',
  goodWithStrangers: 'Good with strangers',
};

export const FilterPanel = () => {
  const styles = useStyles();
  const groups = useCatalogStore(useShallow(selectGroups));
  const criteria = useFilterStore((state) => state.criteria);
  const { toggleGroup, toggleSize, toggleCoat, setHypoallergenic, setTraitMinimum } = useFilterStore(
    useShallow((state) => ({
      toggleGroup: state.toggleGroup,
      toggleSize: state.toggleSize,
      toggleCoat: state.toggleCoat,
      setHypoallergenic: state.setHypoallergenic,
      setTraitMinimum: state.setTraitMinimum,
    })),
  );

  const groupOptions = useMemo(
    () =>
      [...groups]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((group) => ({ value: group.id, label: `${shortGroupName(group.name)} (${group.breedIds.length})` })),
    [groups],
  );

  return (
    <ScrollView contentContainerStyle={styles.content} testID="filter-panel">
      <FilterSection title="Breed group">
        <ChipGroup options={groupOptions} selected={criteria.groupIds} onToggle={toggleGroup} testIDPrefix="group" />
      </FilterSection>

      <FilterSection title="Size" hint="Based on the average adult weight of males and females">
        <ChipGroup options={SIZE_OPTIONS} selected={criteria.sizeBands} onToggle={toggleSize} testIDPrefix="size" />
      </FilterSection>

      <FilterSection title="Coat" hint="Wire matches wire-haired coats of any length">
        <ChipGroup options={COAT_OPTIONS} selected={criteria.coats} onToggle={toggleCoat} testIDPrefix="coat" />
      </FilterSection>

      <FilterSection title="Hypoallergenic">
        <SegmentedControl
          segments={HYPO_SEGMENTS}
          value={criteria.hypoallergenic}
          onChange={setHypoallergenic}
          accessibilityLabel="Hypoallergenic"
          testIDPrefix="hypo"
        />
      </FilterSection>

      <FilterSection title="Temperament" hint="Minimum score on a 1–5 scale">
        <View style={styles.traits}>
          {THRESHOLD_TRAITS.map((trait) => (
            <TraitThresholdRow
              key={trait}
              label={TRAIT_LABELS[trait]}
              minimum={criteria.traitMinimums[trait]}
              onChange={(minimum) => setTraitMinimum(trait, minimum)}
              testIDPrefix={`trait-${trait}`}
            />
          ))}
        </View>
      </FilterSection>
    </ScrollView>
  );
};

const useStyles = createThemedStyles((theme) => ({
  content: {
    paddingHorizontal: theme.spacing(4),
    paddingBottom: theme.spacing(10),
  },
  traits: {
    gap: theme.spacing(4),
  },
}));
