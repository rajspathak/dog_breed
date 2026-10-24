import { create } from 'zustand';

import { EMPTY_CRITERIA, type FilterCriteria, type HypoallergenicFilter, type ThresholdTrait } from '@/domain/filters';
import type { CoatCategory, SizeBand } from '@/domain/types';

type FilterState = {
  query: string;
  criteria: FilterCriteria;
};

type FilterActions = {
  setQuery(query: string): void;
  toggleGroup(id: string): void;
  toggleSize(band: SizeBand): void;
  toggleCoat(coat: CoatCategory): void;
  setHypoallergenic(value: HypoallergenicFilter): void;
  setTraitMinimum(trait: ThresholdTrait, minimum: number | null): void;
  clearCriteria(): void;
};

const toggle = <T>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

export const useFilterStore = create<FilterState & FilterActions>()((set) => ({
  query: '',
  criteria: EMPTY_CRITERIA,

  setQuery: (query) => set({ query }),

  toggleGroup: (id) =>
    set((state) => ({ criteria: { ...state.criteria, groupIds: toggle(state.criteria.groupIds, id) } })),

  toggleSize: (band) =>
    set((state) => ({ criteria: { ...state.criteria, sizeBands: toggle(state.criteria.sizeBands, band) } })),

  toggleCoat: (coat) =>
    set((state) => ({ criteria: { ...state.criteria, coats: toggle(state.criteria.coats, coat) } })),

  setHypoallergenic: (value) => set((state) => ({ criteria: { ...state.criteria, hypoallergenic: value } })),

  setTraitMinimum: (trait, minimum) =>
    set((state) => {
      const traitMinimums = { ...state.criteria.traitMinimums };
      if (minimum === null) delete traitMinimums[trait];
      else traitMinimums[trait] = minimum;
      return { criteria: { ...state.criteria, traitMinimums } };
    }),

  clearCriteria: () => set({ criteria: EMPTY_CRITERIA }),
}));
