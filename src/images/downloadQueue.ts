export type DownloadPriority = 'visible' | 'background';

type Waiter = {
  key: string;
  priority: DownloadPriority;
  start: () => void;
};

export const createDownloadQueue = (concurrency: number) => {
  let active = 0;
  const waiting: Waiter[] = [];

  const next = () => {
    while (active < concurrency && waiting.length > 0) {
      const index = waiting.findIndex((waiter) => waiter.priority === 'visible');
      const [waiter] = waiting.splice(index === -1 ? 0 : index, 1);
      if (!waiter) return;
      active += 1;
      waiter.start();
    }
  };

  return {
    run<T>(key: string, priority: DownloadPriority, task: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        waiting.push({
          key,
          priority,
          start: () => {
            task()
              .then(resolve, reject)
              .finally(() => {
                active -= 1;
                next();
              });
          },
        });
        next();
      });
    },

    promote(key: string): void {
      for (const waiter of waiting) {
        if (waiter.key === key) waiter.priority = 'visible';
      }
    },

    stats(): { active: number; waiting: number } {
      return { active, waiting: waiting.length };
    },
  };
};
