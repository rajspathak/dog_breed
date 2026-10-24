export const foldText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const buildSearchText = (name: string, otherNames: readonly string[]): string =>
  foldText([name, ...otherNames].join(' | '));

export const matchesQuery = (searchText: string, query: string): boolean => {
  const tokens = foldText(query).split(' ').filter(Boolean);
  return tokens.every((token) => searchText.includes(token));
};
