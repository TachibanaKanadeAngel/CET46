import logger from '../utils/logger.js';
export const PBKDF2_ITERATIONS = 600000;

// blob 回退代码（仅在独立 worker 文件不可用时使用，如 file:// 协议）
const cryptoWorkerCode = `
  const PBKDF2_ITERATIONS = ${PBKDF2_ITERATIONS};
  self.onmessage = async (e) => {
    const { requestId, type, password, salt, iv, data } = e.data;
    const enc = new TextEncoder();
    const reply = (payload, transfer) => {
      if (requestId !== undefined) payload.requestId = requestId;
      self.postMessage(payload, transfer || []);
    };
    try {
      if (type === 'deriveKey') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
        reply({ type: 'key_derived' });
      } else if (type === 'encrypt') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
        );
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        reply({ type: 'encrypted', ciphertext }, [ciphertext]);
      } else if (type === 'decrypt') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        reply({ type: 'decrypted', data: decrypted }, [decrypted]);
      }
    } catch (err) {
      reply({ type: 'error', error: type === 'decrypt' ? '解密失败' : err.message });
    }
  };
`;

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * P2 优化：Crypto Worker 池化复用
 * 避免每次 encrypt/decrypt 都创建+销毁 Worker 的开销（约 5ms/次）
 * 通过 requestId 实现请求/响应关联，支持单 Worker 串行处理多请求
 * 包含 idle 超时自动回收（30s 无操作则 terminate），平衡内存与性能
 */
export const cryptoWorkerPool = {
  _worker: null as Worker | null,
  _blobUrl: null as string | null,
  _counter: 0,
  _pending: new Map<number, { resolve: (val: any) => void; reject: (err: any) => void; timeout: any }>(),
  _idleTimer: null as any,
  _idleTimeoutMs: 30000,

  _createWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;

    try {
      const workerUrl = new URL('../workers/crypto-worker.js', import.meta.url);
      const worker = new Worker(workerUrl, { type: 'module' });
      this._attachHandlers(worker);
      return worker;
    } catch (_e: any) {
      try {
        const blob = new Blob([cryptoWorkerCode], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        this._blobUrl = url;
        this._attachHandlers(worker);
        return worker;
      } catch (_e2: any) {
        return null;
      }
    }
  },

  _attachHandlers(worker: Worker): void {
    worker.onmessage = (e: MessageEvent) => {
      const { requestId } = e.data || {};
      if (requestId === undefined) return;
      const handler = this._pending.get(requestId);
      if (!handler) return;
      this._pending.delete(requestId);
      clearTimeout(handler.timeout);
      if (e.data.type === 'error') {
        handler.reject(new Error(e.data.error));
      } else {
        handler.resolve(e.data);
      }
      this._resetIdleTimer();
    };
    worker.onerror = (err: ErrorEvent) => {
      logger.error('❌ Crypto Worker 崩溃:', err.message);
      for (const [, handler] of this._pending) {
        clearTimeout(handler.timeout);
        handler.reject(new Error('Worker 加密失败: ' + err.message));
      }
      this._pending.clear();
      this._terminate();
    };
  },

  _resetIdleTimer(): void {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    if (this._pending.size === 0) {
      this._idleTimer = setTimeout(() => {
        if (this._pending.size === 0) {
          logger.debug('[CryptoPool] idle 超时，回收 Worker');
          this._terminate();
        }
      }, this._idleTimeoutMs);
    }
  },

  _terminate(): void {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  },

  async _executeInThread(task: any): Promise<any> {
    const { type, password, salt, iv, data } = task;
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    if (type === 'encrypt') {
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      return { type: 'encrypted', ciphertext };
    } else if (type === 'decrypt') {
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return { type: 'decrypted', data: decrypted };
    }
    throw new Error(`未知任务类型: ${type}`);
  },

  /**
   * 执行一次加密/解密操作
   */
  async execute(task: any): Promise<any> {
    if (typeof Worker === 'undefined') {
      return this._executeInThread(task);
    }

    if (!this._worker) {
      this._worker = this._createWorker();
      if (!this._worker) {
        return this._executeInThread(task);
      }
    }

    return new Promise((resolve, reject) => {
      const requestId = ++this._counter;
      const timeout = setTimeout(() => {
        this._pending.delete(requestId);
        reject(new Error(task.type === 'encrypt' ? '加密超时' : '解密超时'));
      }, 30000);

      this._pending.set(requestId, { resolve, reject, timeout });
      try {
        this._worker!.postMessage({ ...task, requestId });
      } catch (_e) {
        this._pending.delete(requestId);
        clearTimeout(timeout);
        this._executeInThread(task).then(resolve, reject);
      }
    });
  },

  destroy(): void {
    this._terminate();
    this._pending.clear();
  },
};

export const asyncCrypto = {
  async encrypt(text: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(text);

    const result = await cryptoWorkerPool.execute({
      type: 'encrypt',
      password,
      salt,
      iv,
      data,
    });

    const combined = new Uint8Array(salt.length + iv.length + result.ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(result.ciphertext), salt.length + iv.length);
    return uint8ArrayToBase64(combined);
  },

  async decrypt(encryptedBase64: string, password: string): Promise<string> {
    let combined: Uint8Array;
    try {
      combined = base64ToUint8Array(encryptedBase64);
    } catch {
      throw new Error('Base64 解码失败');
    }
    if (combined.length < 44) {
      throw new Error('密文数据不完整或已损坏');
    }
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const result = await cryptoWorkerPool.execute({
      type: 'decrypt',
      password,
      salt,
      iv,
      data,
    });

    return new TextDecoder().decode(result.data);
  },
};

export const Security = {
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
      'deriveKey',
    ]);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encrypt(text: string, password: string): Promise<string> {
    return asyncCrypto.encrypt(text, password);
  },

  async decrypt(encryptedBase64: string, password: string): Promise<string> {
    return asyncCrypto.decrypt(encryptedBase64, password);
  },
};

export default Security;
