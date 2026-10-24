export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const readNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    const text = readString(item);
    if (text) seen.add(text);
  }
  return [...seen];
};

export const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const readRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

export type ResourceObject = {
  id: string;
  type: string;
  attributes: UnknownRecord;
  relationships: UnknownRecord;
};

export const isResourceObject = (value: unknown): value is ResourceObject =>
  isRecord(value) && typeof value.id === 'string' && typeof value.type === 'string' && isRecord(value.attributes);

export type Pagination = {
  current: number;
  last: number;
  records: number;
};

export type CollectionDocument = {
  data: ResourceObject[];
  pagination: Pagination | null;
  rejected: number;
};

export const parseCollection = (payload: unknown): CollectionDocument => {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new TypeError('Response is not a JSON:API collection');
  }
  const data: ResourceObject[] = [];
  let rejected = 0;
  for (const item of payload.data) {
    if (isResourceObject(item)) {
      data.push({ ...item, relationships: readRecord(item.relationships) });
    } else {
      rejected += 1;
    }
  }
  const raw = readRecord(readRecord(payload.meta).pagination);
  const current = readNumber(raw.current);
  const records = readNumber(raw.records);
  const pagination =
    current !== null && records !== null ? { current, records, last: readNumber(raw.last) ?? current } : null;
  return { data, pagination, rejected };
};

export const parseSingle = (payload: unknown): ResourceObject => {
  const data = isRecord(payload) ? payload.data : undefined;
  if (!isResourceObject(data)) {
    throw new TypeError('Response is not a JSON:API resource');
  }
  return { ...data, relationships: readRecord(data.relationships) };
};

export const readRelationshipId = (relationships: UnknownRecord, key: string): string | null =>
  readString(readRecord(readRecord(relationships[key]).data).id);

export const readRelationshipIds = (relationships: UnknownRecord, key: string): string[] =>
  readArray(readRecord(relationships[key]).data)
    .map((entry) => readString(readRecord(entry).id))
    .filter((id): id is string => id !== null);
