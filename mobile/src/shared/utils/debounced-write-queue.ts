type PendingWrite<T> = {
  dueAt: number;
  persist: (value: T) => Promise<void>;
  value: T;
  waiters: {
    reject: (reason?: unknown) => void;
    resolve: () => void;
  }[];
};

export class DebouncedWriteQueue<T> {
  private pending: PendingWrite<T> | undefined;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly delayMs: number) {}

  enqueue(value: T, persist: (latestValue: T) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const waiter = { reject, resolve };
      if (this.pending) {
        this.pending = {
          ...this.pending,
          dueAt: Date.now() + this.delayMs,
          persist,
          value,
          waiters: [...this.pending.waiters, waiter],
        };
      } else {
        this.pending = {
          dueAt: Date.now() + this.delayMs,
          persist,
          value,
          waiters: [waiter],
        };
      }
      this.armTimer();
    });
  }

  flush(): void {
    if (!this.pending) return;
    this.pending.dueAt = 0;
    this.armTimer();
  }

  private armTimer(): void {
    if (this.running || !this.pending) return;
    if (this.timer) clearTimeout(this.timer);
    const delay = Math.max(0, this.pending.dueAt - Date.now());
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.persistPending();
    }, delay);
  }

  private async persistPending(): Promise<void> {
    if (this.running || !this.pending) return;
    const current = this.pending;
    this.pending = undefined;
    this.running = true;
    try {
      await current.persist(current.value);
      for (const waiter of current.waiters) waiter.resolve();
    } catch (error) {
      for (const waiter of current.waiters) waiter.reject(error);
    } finally {
      this.running = false;
      this.armTimer();
    }
  }
}
