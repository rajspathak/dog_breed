export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly retryAfterMs: number | null = null,
  ) {
    super(`Request failed with ${status}`);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(readonly url: string) {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(
    readonly url: string,
    readonly reason: unknown,
  ) {
    super('Network request failed');
    this.name = 'NetworkError';
  }
}

export const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError';

export const isRetryable = (error: unknown): boolean => {
  if (error instanceof TimeoutError || error instanceof NetworkError) return true;
  if (error instanceof HttpError) {
    return error.status === 408 || error.status === 425 || error.status === 429 || error.status >= 500;
  }
  return false;
};

export type BackoffOptions = {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  random?: () => number;
};

export const DEFAULT_BACKOFF: BackoffOptions = {
  retries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
};

export const backoffDelay = (attempt: number, options: BackoffOptions): number => {
  const ceiling = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt);
  const random = options.random ?? Math.random;
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export const withRetry = async <T>(
  task: (attempt: number) => Promise<T>,
  options: BackoffOptions = DEFAULT_BACKOFF,
  signal?: AbortSignal,
): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      if (isAbortError(error) || signal?.aborted || attempt >= options.retries || !isRetryable(error)) {
        throw error;
      }
      const hinted = error instanceof HttpError ? error.retryAfterMs : null;
      await sleep(hinted ?? backoffDelay(attempt, options), signal);
    }
  }
};

const parseRetryAfter = (header: string | null): number | null => {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, Math.min(date - Date.now(), 30_000));
};

export type RequestOptions = {
  timeoutMs: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

export const getJson = async (url: string, options: RequestOptions): Promise<unknown> => {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs);
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HttpError(response.status, url, parseRetryAfter(response.headers.get('Retry-After')));
    }
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (timedOut) throw new TimeoutError(url);
    if (isAbortError(error)) throw error;
    throw new NetworkError(url, error);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
};

export const describeError = (error: unknown): string => {
  if (error instanceof TimeoutError) return 'The server took too long to respond.';
  if (error instanceof NetworkError) return 'Unable to reach the server.';
  if (error instanceof HttpError) {
    return error.status >= 500 ? 'The server is having trouble right now.' : `Request failed (${error.status}).`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
};
