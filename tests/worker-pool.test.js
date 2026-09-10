import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 模拟浏览器 Worker 与 window 环境（node 测试环境无 DOM）
class FakeWorker {
  constructor() {
    this.handlers = {};
    this.terminated = false;
  }
  addEventListener(type, cb) {
    (this.handlers[type] = this.handlers[type] || []).push(cb);
  }
  removeEventListener() {}
  postMessage() {}
  terminate() {
    this.terminated = true;
  }
}

const realWorker = globalThis.Worker;
const realWindow = globalThis.window;

beforeEach(() => {
  globalThis.Worker = FakeWorker;
  globalThis.window = { location: { protocol: 'http:' } };
});

afterEach(() => {
  globalThis.Worker = realWorker;
  globalThis.window = realWindow;
});

describe('isFileProtocol', () => {
  it('detects file protocol', async () => {
    globalThis.window = { location: { protocol: 'file:' } };
    const { isFileProtocol } = await import('../js/utils/worker-pool.js');
    expect(isFileProtocol()).toBe(true);
    expect(isFileProtocol.name).toBeDefined();
  });
});

describe('WorkerPool', () => {
  let WorkerPool;

  beforeEach(async () => {
    ({ WorkerPool } = await import('../js/utils/worker-pool.js'));
    WorkerPool.clearAll();
    WorkerPool.maxWorkers = 3;
  });

  it('returns null on file protocol', async () => {
    globalThis.window = { location: { protocol: 'file:' } };
    const w = await WorkerPool.getWorker('x', 'url.js');
    expect(w).toBeNull();
  });

  it('creates and caches a worker', async () => {
    const w1 = await WorkerPool.getWorker('cache', 'worker.js');
    expect(w1).toBeInstanceOf(FakeWorker);
    const w2 = await WorkerPool.getWorker('cache', 'worker.js');
    expect(w2).toBe(w1);
  });

  it('evicts the oldest worker when above maxWorkers', async () => {
    WorkerPool.maxWorkers = 1;
    const w1 = await WorkerPool.getWorker('one', 'w1.js');
    const w2 = await WorkerPool.getWorker('two', 'w2.js');
    expect(w1.terminated).toBe(true);
    expect(WorkerPool.workers.has('two')).toBe(true);
    expect(w2).toBeInstanceOf(FakeWorker);
  });

  it('returns null when Worker construction throws', async () => {
    globalThis.Worker = class ThrowingWorker {
      constructor() {
        throw new Error('boom');
      }
    };
    const w = await WorkerPool.getWorker('fail', 'bad.js');
    expect(w).toBeNull();
  });

  it('getStats reports active workers', async () => {
    await WorkerPool.getWorker('a', 'a.js');
    await WorkerPool.getWorker('b', 'b.js');
    const stats = WorkerPool.getStats();
    expect(stats.active).toBe(2);
    expect(stats.max).toBe(3);
    expect(stats.names).toContain('a');
  });

  it('terminateWorker removes a worker and its idle timer', async () => {
    const w = await WorkerPool.getWorker('t', 't.js');
    WorkerPool.terminateWorker('t');
    expect(w.terminated).toBe(true);
    expect(WorkerPool.workers.has('t')).toBe(false);
    expect(WorkerPool.idleTimers.has('t')).toBe(false);
  });

  it('clearAll terminates all workers', async () => {
    const w1 = await WorkerPool.getWorker('c1', 'c1.js');
    const w2 = await WorkerPool.getWorker('c2', 'c2.js');
    WorkerPool.clearAll();
    expect(w1.terminated).toBe(true);
    expect(w2.terminated).toBe(true);
    expect(WorkerPool.workers.size).toBe(0);
    expect(WorkerPool.idleTimers.size).toBe(0);
  });

  it('getStats with no workers', () => {
    expect(WorkerPool.getStats().active).toBe(0);
  });
});

describe('worker-pool integration (spy logging)', () => {
  it('records info logs through the module logger on file protocol', async () => {
    globalThis.window = { location: { protocol: 'file:' } };
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const mod = await import('../js/utils/worker-pool.js');
    const w = await mod.WorkerPool.getWorker('logme', 'log.js');
    expect(w).toBeNull();
    expect(infoSpy).toHaveBeenCalled();
    console.info.mockRestore();
  });

  it('WorkerPool terminates worker after idle timeout', async () => {
    vi.useFakeTimers();
    try {
      const { WorkerPool } = await import('../js/utils/worker-pool.js');
      const w = await WorkerPool.getWorker('idleWorker', 'w.js');
      expect(WorkerPool.workers.has('idleWorker')).toBe(true);

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000 + 100);
      expect(w.terminated).toBe(true);
      expect(WorkerPool.workers.has('idleWorker')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('vocabProcessor', () => {
  it('processes JSON with worker messages, handles success, error, and progress', async () => {
    const { vocabProcessor } = await import('../js/utils/worker-pool.js');

    class MockVocabWorker {
      constructor() {
        this.handlers = {};
        this.terminated = false;
      }
      addEventListener(type, cb) {
        (this.handlers[type] = this.handlers[type] || []).push(cb);
      }
      removeEventListener(type, cb) {
        if (this.handlers[type]) {
          this.handlers[type] = this.handlers[type].filter(h => h !== cb);
        }
      }
      postMessage(msg) {
        if (msg.payload === 'valid') {
          setTimeout(() => {
            (this.handlers['message'] || []).forEach(cb =>
              cb({ data: { type: 'SUCCESS', result: [{ word: 'a' }], count: 1 } })
            );
          }, 10);
        } else if (msg.payload === 'error') {
          setTimeout(() => {
            (this.handlers['message'] || []).forEach(cb =>
              cb({ data: { type: 'ERROR', message: 'Parse failure' } })
            );
          }, 10);
        } else if (msg.payload === 'crash') {
          setTimeout(() => {
            (this.handlers['error'] || []).forEach(cb => cb(new Error('Crash error')));
          }, 10);
        }
      }
      terminate() {
        this.terminated = true;
      }
    }

    vocabProcessor._getWorker = vi.fn().mockResolvedValue(new MockVocabWorker());

    // Test success
    const onProgress = vi.fn();
    const result = await vocabProcessor.processJSON('valid', onProgress);
    expect(result.count).toBe(1);
    expect(onProgress).toHaveBeenCalledWith(100);

    // Test error message
    await expect(vocabProcessor.processJSON('error')).rejects.toThrow('Parse failure');

    // Test crash error
    await expect(vocabProcessor.processJSON('crash')).rejects.toThrow('Crash error');

    // Test concurrent execution lock
    vocabProcessor.processing = true;
    await expect(vocabProcessor.processJSON('another')).rejects.toThrow('已有处理任务在进行中');
    vocabProcessor.processing = false;
  });
});