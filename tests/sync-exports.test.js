import { describe, it, expect, vi, beforeEach } from 'vitest';

const coreMock = {
  getCacheData: vi.fn(),
  getCacheEntries: vi.fn(),
  setCacheValue: vi.fn(),
  getCacheValue: vi.fn(),
  getCacheSize: vi.fn(),
  generateVectorClock: vi.fn(),
  mergePropertyAware: vi.fn(),
  mergePropertyAwareInteractive: vi.fn(),
  ConflictError: class ConflictError extends Error {},
  getSyncBase: vi.fn(),
  saveSyncBase: vi.fn(),
  getBaseValue: vi.fn(),
};

const webdavMock = {
  webdavConfig: { url: 'https://example.com' },
  loadWebDAVConfig: vi.fn(),
  decryptWebDAVCredentials: vi.fn(),
  clearWebDAVPlaintextCredentials: vi.fn(),
  saveWebDAVConfig: vi.fn(),
  testWebDAVConnection: vi.fn(),
  syncToWebDAV: vi.fn(),
  syncFromWebDAV: vi.fn(),
  exportEncryptionKey: vi.fn(),
  // sync-ui.ts 已合并进 sync-webdav.ts
  updateWebDAVStatus: vi.fn(),
};

vi.mock('../js/services/sync-core.js', () => coreMock);
vi.mock('../js/services/sync-webdav.js', () => webdavMock);

describe('js/sync.js exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-exports sync crypto entry points', async () => {
    const sync = await import('../js/sync.js');
    expect(sync.Security).toBeDefined();
    expect(typeof sync.Security.encrypt).toBe('function');
    expect(typeof sync.Security.decrypt).toBe('function');
    expect(sync.asyncCrypto).toBeDefined();
  });

  it('re-exports sync core helpers', async () => {
    const sync = await import('../js/sync.js');
    expect(sync.getCacheData).toBe(coreMock.getCacheData);
    expect(sync.generateVectorClock).toBe(coreMock.generateVectorClock);
    expect(sync.ConflictError).toBe(coreMock.ConflictError);
    expect(sync.saveSyncBase).toBe(coreMock.saveSyncBase);
  });

  it('re-exports webdav service entry points', async () => {
    const sync = await import('../js/sync.js');
    expect(sync.webdavConfig).toBe(webdavMock.webdavConfig);
    expect(sync.loadWebDAVConfig).toBe(webdavMock.loadWebDAVConfig);
    expect(sync.saveWebDAVConfig).toBe(webdavMock.saveWebDAVConfig);
    expect(sync.syncToWebDAV).toBe(webdavMock.syncToWebDAV);
    expect(sync.syncFromWebDAV).toBe(webdavMock.syncFromWebDAV);
    expect(sync.exportEncryptionKey).toBe(webdavMock.exportEncryptionKey);
  });

  it('re-exports sync UI updater', async () => {
    // sync-ui.ts 已合并进 sync-webdav.ts
    const sync = await import('../js/sync.js');
    expect(sync.updateWebDAVStatus).toBe(webdavMock.updateWebDAVStatus);
  });
});

describe('sync-crypto.js actual implementation', () => {
  it('derives key with PBKDF2 and validates ciphertext length on decrypt', async () => {
    const { Security, cryptoWorkerPool } = await import('../js/services/sync-crypto.js');

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await Security.deriveKey('masterPassword123', salt);
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');

    // Ciphertext too short (< 44 bytes)
    const shortBase64 = btoa('1234567890');
    await expect(Security.decrypt(shortBase64, 'password123')).rejects.toThrow(
      '密文数据不完整或已损坏'
    );

    // Malformed base64
    await expect(Security.decrypt('bad!!base64==', 'password123')).rejects.toThrow(
      'Base64 解码失败'
    );

    cryptoWorkerPool.destroy();
  });
});

