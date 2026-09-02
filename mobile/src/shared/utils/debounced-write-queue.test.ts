import { DebouncedWriteQueue } from './debounced-write-queue';

describe('DebouncedWriteQueue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('coalesces rapid changes and persists only the latest value', async () => {
    const persist = jest.fn(async (_value: string) => undefined);
    const queue = new DebouncedWriteQueue<string>(700);

    const first = queue.enqueue('first', persist);
    await jest.advanceTimersByTimeAsync(500);
    const latest = queue.enqueue('latest', persist);
    await jest.advanceTimersByTimeAsync(699);
    expect(persist).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    await Promise.all([first, latest]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('latest');
  });

  it('flushes a pending value immediately', async () => {
    const persist = jest.fn(async (_value: string) => undefined);
    const queue = new DebouncedWriteQueue<string>(700);
    const pending = queue.enqueue('latest', persist);

    queue.flush();
    await jest.runOnlyPendingTimersAsync();
    await pending;

    expect(persist).toHaveBeenCalledWith('latest');
  });
});
