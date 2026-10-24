import { create } from 'zustand';

import type { SyncOutcome } from '@/db/catalogRepository';
import { toListItem, type BreedListItem } from '@/domain/filters';
import type { Breed, BreedGroup } from '@/domain/types';

export type SyncPhase = 'idle' | 'syncing';

export type SyncStatus = {
  phase: SyncPhase;
  pagesDone: number;
  pagesTotal: number;
  lastSuccessAt: number | null;
  lastOutcome: SyncOutcome | null;
  lastError: string | null;
  failedPages: number[];
};

type CatalogState = {
  hydrated: boolean;
  breedsById: Record<string, Breed>;
  listItems: BreedListItem[];
  groupsById: Record<string, BreedGroup>;
  groupIds: string[];
  sync: SyncStatus;
};

type CatalogActions = {
  hydrate(payload: { breeds: Breed[]; groups: BreedGroup[]; sync: Partial<SyncStatus> }): void;
  upsertBreeds(breeds: readonly Breed[]): void;
  removeBreedsNotIn(ids: ReadonlySet<string>): void;
  setGroups(groups: readonly BreedGroup[]): void;
  updateSync(patch: Partial<SyncStatus>): void;
};

const initialSync: SyncStatus = {
  phase: 'idle',
  pagesDone: 0,
  pagesTotal: 0,
  lastSuccessAt: null,
  lastOutcome: null,
  lastError: null,
  failedPages: [],
};

const indexBreeds = (breeds: Iterable<Breed>) => {
  const byId: Record<string, Breed> = {};
  for (const breed of breeds) byId[breed.id] = breed;
  return byId;
};

const listItemCache = new WeakMap<Breed, BreedListItem>();

const listItemFor = (breed: Breed): BreedListItem => {
  const cached = listItemCache.get(breed);
  if (cached) return cached;
  const item = toListItem(breed);
  listItemCache.set(breed, item);
  return item;
};

const projectList = (byId: Record<string, Breed>) =>
  Object.values(byId)
    .map(listItemFor)
    .sort((a, b) => a.name.localeCompare(b.name));

export const useCatalogStore = create<CatalogState & CatalogActions>()((set) => ({
  hydrated: false,
  breedsById: {},
  listItems: [],
  groupsById: {},
  groupIds: [],
  sync: initialSync,

  hydrate: ({ breeds, groups, sync }) => {
    const breedsById = indexBreeds(breeds);
    set({
      hydrated: true,
      breedsById,
      listItems: projectList(breedsById),
      groupsById: Object.fromEntries(groups.map((group) => [group.id, group])),
      groupIds: groups.map((group) => group.id),
      sync: { ...initialSync, ...sync },
    });
  },

  upsertBreeds: (breeds) => {
    if (breeds.length === 0) return;
    set((state) => {
      const breedsById = { ...state.breedsById };
      for (const breed of breeds) breedsById[breed.id] = breed;
      return { breedsById, listItems: projectList(breedsById) };
    });
  },

  removeBreedsNotIn: (ids) => {
    set((state) => {
      const kept = Object.values(state.breedsById).filter((breed) => ids.has(breed.id));
      if (kept.length === state.listItems.length) return state;
      const breedsById = indexBreeds(kept);
      return { breedsById, listItems: projectList(breedsById) };
    });
  },

  setGroups: (groups) => {
    if (groups.length === 0) return;
    set({
      groupsById: Object.fromEntries(groups.map((group) => [group.id, group])),
      groupIds: groups.map((group) => group.id),
    });
  },

  updateSync: (patch) => set((state) => ({ sync: { ...state.sync, ...patch } })),
}));

export const selectGroups = (state: CatalogState): BreedGroup[] =>
  state.groupIds.map((id) => state.groupsById[id]).filter((group): group is BreedGroup => group !== undefined);
