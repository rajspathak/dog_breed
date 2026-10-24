import { createDownloadQueue } from '@/images/downloadQueue';

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('createDownloadQueue', () => {
  it('never runs more tasks than the concurrency limit', async () => {
    const queue = createDownloadQueue(2);
    const gates = [deferred(), deferred(), deferred()];
    gates.forEach((gate, index) => queue.run(`t${index}`, 'background', () => gate.promise));

    expect(queue.stats()).toEqual({ active: 2, waiting: 1 });
    gates[0]?.resolve();
    await flush();
    expect(queue.stats()).toEqual({ active: 2, waiting: 0 });
  });

  it('starts visible work before queued background prefetch', async () => {
    const queue = createDownloadQueue(1);
    const order: string[] = [];
    const blocker = deferred();
    queue.run('blocker', 'background', () => blocker.promise);
    const track = (key: string) => () => {
      order.push(key);
      return Promise.resolve();
    };

    const background = Array.from({ length: 5 }, (_, index) =>
      queue.run(`bg${index}`, 'background', track(`bg${index}`)),
    );
    const visible = queue.run('gallery', 'visible', track('gallery'));

    blocker.resolve();
    await Promise.all([...background, visible]);
    expect(order[0]).toBe('gallery');
  });

  it('promotes a queued background download when it becomes visible', async () => {
    const queue = createDownloadQueue(1);
    const order: string[] = [];
    const blocker = deferred();
    queue.run('blocker', 'background', () => blocker.promise);
    const track = (key: string) => () => {
      order.push(key);
      return Promise.resolve();
    };

    const tasks = ['a', 'b', 'c'].map((key) => queue.run(key, 'background', track(key)));
    queue.promote('c');

    blocker.resolve();
    await Promise.all(tasks);
    expect(order).toEqual(['c', 'a', 'b']);
  });

  it('keeps draining after a task fails', async () => {
    const queue = createDownloadQueue(1);
    const failing = queue.run('bad', 'visible', () => Promise.reject(new Error('timeout')));
    const next = queue.run('good', 'visible', () => Promise.resolve('ok'));

    await expect(failing).rejects.toThrow('timeout');
    await expect(next).resolves.toBe('ok');
    expect(queue.stats()).toEqual({ active: 0, waiting: 0 });
  });
});
