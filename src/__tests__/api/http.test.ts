import {
  backoffDelay,
  describeError,
  getJson,
  HttpError,
  isRetryable,
  NetworkError,
  TimeoutError,
  withRetry,
} from '@/api/http';

import { createFakeFetch } from '../helpers/fakeFetch';

const instant = { retries: 3, baseDelayMs: 0, maxDelayMs: 0 };

describe('backoffDelay', () => {
  it('grows exponentially with jitter and respects the cap', () => {
    const options = { retries: 5, baseDelayMs: 500, maxDelayMs: 8000 };
    expect(backoffDelay(0, { ...options, random: () => 0 })).toBe(250);
    expect(backoffDelay(0, { ...options, random: () => 1 })).toBe(500);
    expect(backoffDelay(3, { ...options, random: () => 1 })).toBe(4000);
    expect(backoffDelay(10, { ...options, random: () => 1 })).toBe(8000);
  });
});

describe('isRetryable', () => {
  it('retries transient failures only', () => {
    expect(isRetryable(new HttpError(503, 'u'))).toBe(true);
    expect(isRetryable(new HttpError(429, 'u'))).toBe(true);
    expect(isRetryable(new HttpError(404, 'u'))).toBe(false);
    expect(isRetryable(new TimeoutError('u'))).toBe(true);
    expect(isRetryable(new NetworkError('u', null))).toBe(true);
    expect(isRetryable(new TypeError('bad json'))).toBe(false);
  });
});

describe('withRetry', () => {
  it('retries until the task succeeds', async () => {
    const task = jest
      .fn<Promise<string>, [number]>()
      .mockRejectedValueOnce(new HttpError(500, 'u'))
      .mockRejectedValueOnce(new TimeoutError('u'))
      .mockResolvedValue('ok');

    await expect(withRetry(task, instant)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('gives up after the configured number of retries', async () => {
    const task = jest.fn<Promise<string>, [number]>().mockRejectedValue(new HttpError(502, 'u'));
    await expect(withRetry(task, instant)).rejects.toBeInstanceOf(HttpError);
    expect(task).toHaveBeenCalledTimes(4);
  });

  it('does not retry permanent errors', async () => {
    const task = jest.fn<Promise<string>, [number]>().mockRejectedValue(new HttpError(404, 'u'));
    await expect(withRetry(task, instant)).rejects.toMatchObject({ status: 404 });
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('waits with exponential backoff between attempts', async () => {
    jest.useFakeTimers();
    try {
      const task = jest
        .fn<Promise<string>, [number]>()
        .mockRejectedValueOnce(new HttpError(500, 'u'))
        .mockRejectedValueOnce(new HttpError(500, 'u'))
        .mockResolvedValue('ok');
      const promise = withRetry(task, { retries: 3, baseDelayMs: 100, maxDelayMs: 1000, random: () => 1 });

      await jest.advanceTimersByTimeAsync(99);
      expect(task).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(task).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(200);
      await expect(promise).resolves.toBe('ok');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('getJson', () => {
  it('returns parsed JSON for successful responses', async () => {
    const { fetchImpl } = createFakeFetch(() => ({ status: 200, body: { hello: 'world' } }));
    await expect(getJson('https://x/test', { timeoutMs: 1000, fetchImpl })).resolves.toEqual({ hello: 'world' });
  });

  it('wraps HTTP failures with status and Retry-After', async () => {
    const { fetchImpl } = createFakeFetch(() => ({ status: 429, headers: { 'Retry-After': '2' } }));
    await expect(getJson('https://x/test', { timeoutMs: 1000, fetchImpl })).rejects.toMatchObject({
      status: 429,
      retryAfterMs: 2000,
    });
  });

  it('turns transport errors into NetworkError', async () => {
    const { fetchImpl } = createFakeFetch(() => new TypeError('Network request failed'));
    await expect(getJson('https://x/test', { timeoutMs: 1000, fetchImpl })).rejects.toBeInstanceOf(NetworkError);
  });

  it('times out slow requests', async () => {
    const fetchImpl = ((_: unknown, init?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })) as unknown as typeof fetch;
    await expect(getJson('https://x/slow', { timeoutMs: 10, fetchImpl })).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('describeError', () => {
  it('produces human readable messages', () => {
    expect(describeError(new NetworkError('u', null))).toBe('Unable to reach the server.');
    expect(describeError(new HttpError(503, 'u'))).toBe('The server is having trouble right now.');
    expect(describeError('weird')).toBe('Something went wrong.');
  });
});
