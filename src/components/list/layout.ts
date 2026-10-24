import type { ListEntry } from '@/domain/filters';

export const ROW_HEIGHT = 80;
export const HEADER_HEIGHT = 44;
export const THUMB_SIZE = 56;

export const entryHeight = (entry: ListEntry): number => (entry.kind === 'header' ? HEADER_HEIGHT : ROW_HEIGHT);

export const computeOffsets = (entries: readonly ListEntry[]): number[] => {
  const offsets = new Array<number>(entries.length);
  let running = 0;
  entries.forEach((entry, index) => {
    offsets[index] = running;
    running += entryHeight(entry);
  });
  return offsets;
};
