import logger from './logger.js';

export const isFileProtocol = (): boolean => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.protocol === 'file:';
  }
  return false;
};

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export const WorkerPool = {
  workers: new Map<string, Worker>(),
  idleTimers: new Map<string, any>(),
  maxWorkers: 3,

  async getWorker(name: string, url: string | URL): Promise<Worker | null> {
    if (typeof Worker === 'undefined' || isFileProtocol()) {
      logger.info(`[WorkerPool] Worker 不可用或在 file:// 协议下，跳过 ${name}`);
      return null;
    }

    if (this.workers.has(name)) {
      const worker = this.workers.get(name)!;
      this.workers.delete(name);
      this.workers.set(name, worker);
      this._resetIdleTimer(name);
      return worker;
    }
    if (this.workers.size >= this.maxWorkers) {
      const oldestKey = this.workers.keys().next().value;
      if (oldestKey) this.terminateWorker(oldestKey);
    }
    try {
      const worker = new Worker(url, { type: 'module' });
      this.workers.set(name, worker);
      this._resetIdleTimer(name);
      return worker;
    } catch (e: any) {
      logger.error(`[WorkerPool] Failed to create ${name} Worker:`, e?.message);
      return null;
    }
  },

  _resetIdleTimer(name: string): void {
    if (this.idleTimers.has(name)) {
      clearTimeout(this.idleTimers.get(name));
    }
    const timer = setTimeout(() => {
      logger.info(`[WorkerPool] ${name} idle ${IDLE_TIMEOUT_MS / 1000}s, terminating`);
      this.terminateWorker(name);
    }, IDLE_TIMEOUT_MS);
    this.idleTimers.set(name, timer);
  },

  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
    if (this.idleTimers.has(name)) {
      clearTimeout(this.idleTimers.get(name));
      this.idleTimers.delete(name);
    }
  },

  clearAll(): void {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers.clear();
    this.idleTimers.forEach(timer => clearTimeout(timer));
    this.idleTimers.clear();
  },

  getStats(): any {
    return {
      active: this.workers.size,
      max: this.maxWorkers,
      names: Array.from(this.workers.keys()),
    };
  },
};

export const vocabProcessor = {
  _worker: null as Worker | null,
  _idleTimer: null as any,
  _idleTimeoutMs: 5 * 60 * 1000,
  processing: false,

  async _getWorker(): Promise<Worker | null> {
    if (this._worker) return this._worker;
    if (typeof Worker === 'undefined' || isFileProtocol()) return null;
    try {
      const workerUrl = new URL('../workers/vocab-worker.js', import.meta.url);
      this._worker = new Worker(workerUrl, { type: 'module' });
      return this._worker;
    } catch (_e) {
      return null;
    }
  },

  _resetIdleTimer(): void {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      if (this._worker) {
        this._worker.terminate();
        this._worker = null;
        logger.info('[vocabProcessor] idle timeout, worker recycled');
      }
      this._idleTimer = null;
    }, this._idleTimeoutMs);
  },

  _destroyWorker(): void {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
  },

  async processJSON(jsonStr: string, onProgress?: (percent: number) => void): Promise<{ result: any; count: number }> {
    if (this.processing) throw new Error('已有处理任务在进行中');
    this.processing = true;
    try {
      const worker = await this._getWorker();
      if (!worker) {
        // 主线程回退解析
        const parsed = JSON.parse(jsonStr);
        const result = Array.isArray(parsed) ? parsed : (parsed.words || []);
        if (onProgress) onProgress(100);
        this.processing = false;
        return { result, count: result.length };
      }

      return await new Promise((resolve, reject) => {
        try {
          const timeout = setTimeout(() => {
            this.processing = false;
            worker.removeEventListener('message', handler);
            worker.removeEventListener('error', errorHandler);
            this._destroyWorker();
            reject(new Error('词库处理超时（30秒）'));
          }, 30000);

          const handler = (event: MessageEvent) => {
            const { type, result, count, message } = event.data || {};
            if (type === 'SUCCESS') {
              clearTimeout(timeout);
              this.processing = false;
              worker.removeEventListener('message', handler);
              worker.removeEventListener('error', errorHandler);
              if (onProgress) onProgress(100);
              this._resetIdleTimer();
              resolve({ result, count });
            } else if (type === 'ERROR') {
              clearTimeout(timeout);
              this.processing = false;
              worker.removeEventListener('message', handler);
              worker.removeEventListener('error', errorHandler);
              this._destroyWorker();
              reject(new Error(message));
            }
          };

          const errorHandler = (err: ErrorEvent) => {
            clearTimeout(timeout);
            this.processing = false;
            worker.removeEventListener('message', handler);
            worker.removeEventListener('error', errorHandler);
            this._destroyWorker();
            reject(new Error(err.message || '词库处理 Worker 崩溃'));
          };

          worker.addEventListener('message', handler);
          worker.addEventListener('error', errorHandler);
          worker.postMessage({ type: 'PROCESS_JSON', payload: jsonStr });
          if (onProgress) onProgress(10);
        } catch (e) {
          this.processing = false;
          this._destroyWorker();
          reject(e);
        }
      });
    } catch (e) {
      this.processing = false;
      throw e;
    }
  },
};

export default WorkerPool;
