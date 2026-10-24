type Reply = { status: number; body?: unknown; headers?: Record<string, string> } | Error;

type Route = (url: string, call: number) => Reply | Promise<Reply>;

export const createFakeFetch = (route: Route) => {
  const calls: string[] = [];
  const counts = new Map<string, number>();

  const impl = async (input: unknown): Promise<unknown> => {
    const url = String(input);
    calls.push(url);
    const call = (counts.get(url) ?? 0) + 1;
    counts.set(url, call);
    const reply = await route(url, call);
    if (reply instanceof Error) throw reply;
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      headers: { get: (name: string) => reply.headers?.[name] ?? null },
      json: async () => reply.body,
    };
  };

  return { fetchImpl: impl as unknown as typeof fetch, calls };
};

export const pageOf = (page: number, last: number, records: number, ids: string[]) => ({
  data: ids.map((id) => ({
    id,
    type: 'breed',
    attributes: { name: `Breed ${id}` },
    relationships: { group: { data: { id: 'g1', type: 'group' } } },
  })),
  meta: { pagination: { current: page, last, records } },
});
