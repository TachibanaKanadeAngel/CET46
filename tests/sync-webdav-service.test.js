import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchWithRetryMock = vi.fn();
const encryptMock = vi.fn();
const decryptMock = vi.fn();
const updateWebDAVStatusMock = vi.fn();
const generateBackupDataMock = vi.fn();
const saveSyncBaseMock = vi.fn();
const mergeLocalAndCloudMock = vi.fn();
const mergeWithIdMock = vi.fn((wd, id) => ({ ...wd, id }));

vi.mock('../js/network.js', () => ({
  Network: {
    fetchWithRetry: fetchWithRetryMock,
  },
}));

vi.mock('../js/services/sync-crypto.js', () => ({
  Security: {
    encrypt: encryptMock,
    decrypt: decryptMock,
  },
}));

vi.mock('../js/services/sync-ui.js', () => ({
  updateWebDAVStatus: updateWebDAVStatusMock,
}));

vi.mock('../js/services/sync-core.js', async () => {
  const actual = await vi.importActual('../js/services/sync-core.js');
  return {
    ...actual,
    generateBackupData: generateBackupDataMock,
    saveSyncBase: saveSyncBaseMock,
    mergeLocalAndCloud: mergeLocalAndCloudMock,
  };
});

vi.mock('../js/utils.js', () => ({
  mergeWithId: mergeWithIdMock,
}));

vi.mock('../js/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

function createResponse({ ok = true, status = 200, json = {}, headers = {} } = {}) {
  return {
    ok,
    status,
    json: vi.fn(async () => json),
    headers: {
      get: vi.fn(name => headers[name] ?? null),
    },
  };
}

describe('sync-webdav service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    const store = {};
    globalThis.localStorage = {
      getItem: vi.fn(key => store[key] ?? null),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn(index => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
      _store: store,
    };

    globalThis.document = {
      getElementById: vi.fn(id => {
        if (id === 'webdav-master-key') {
          return { value: 'master-pass-123' };
        }
        return null;
      }),
    };

    globalThis.Blob = class MockBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };

    globalThis.btoa = value => Buffer.from(value, 'binary').toString('base64');
    globalThis.unescape = value => value;
  });

  it('saveWebDAVConfig normalizes url and clears plaintext credentials', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    const service = await import('../js/services/sync-webdav.js');

    const result = await service.saveWebDAVConfig(
      'https://dav.example.com/root///',
      'user',
      'pass',
      'master-pass-123',
      true
    );

    expect(encryptMock).toHaveBeenCalledWith('user:pass', 'master-pass-123');
    expect(result).toEqual({
      url: 'https://dav.example.com/root',
      encryptedAuth: 'encrypted-auth',
      autoSync: true,
    });
    expect(service.webdavConfig.username).toBeUndefined();
    expect(service.webdavConfig.password).toBeUndefined();
  });

  it('decryptWebDAVCredentials restores username and password from encrypted auth', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('name:pa:ss');
    const service = await import('../js/services/sync-webdav.js');

    await service.saveWebDAVConfig(
      'https://dav.example.com/root',
      'name',
      'pa:ss',
      'master-pass-123',
      false
    );
    const ok = await service.decryptWebDAVCredentials('master-pass-123');

    expect(ok).toBe(true);
    expect(service.webdavConfig.username).toBe('name');
    expect(service.webdavConfig.password).toBe('pa:ss');
  });

  it('syncToWebDAV rehydrates encrypted credentials before network calls', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    generateBackupDataMock.mockResolvedValueOnce({ progress: {}, wrongWords: {}, heatmap: {} });
    fetchWithRetryMock
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 }))
      .mockResolvedValueOnce(createResponse({ ok: true, status: 201 }))
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 }))
      .mockResolvedValueOnce(createResponse({ ok: true, status: 201, headers: { ETag: 'etag-1' } }));

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.example.com/root',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = {
      instance: {
        transaction: vi.fn(() => {
          const tx = {
            objectStore: vi.fn(() => ({ put: vi.fn() })),
            oncomplete: null,
            onerror: null,
            onabort: null,
            error: null,
          };
          queueMicrotask(() => tx.oncomplete && tx.oncomplete());
          return tx;
        }),
      },
      save: vi.fn(async () => {}),
    };
    const dirtyWord = { isDirty: true, mtime: 123, status: 'review' };
    const memoryCache = {
      progress: { entries: () => [['1', dirtyWord]] },
      wrongWords: { toObject: () => ({}) },
      heatmap: { toObject: () => ({}) },
      deletedIds: new Set(),
      wrongWordsDirty: false,
      heatmapDirty: false,
    };

    const result = await service.syncToWebDAV(db, memoryCache, 'device-a');

    expect(result).toEqual({ status: 'success', changes: 1 });
    expect(decryptMock).toHaveBeenCalledWith('encrypted-auth', 'master-pass-123');
    expect(fetchWithRetryMock).toHaveBeenCalled();
    expect(memoryCache.progress.entries()[0][1].isDirty).toBeUndefined();
  });

  it('syncFromWebDAV returns needs_full_sync when cloud progress is larger than local', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    mergeLocalAndCloudMock.mockResolvedValueOnce({
      progress: { 1: { status: 'review' }, 2: { status: 'review' }, 3: { status: 'review' } },
      wrongWords: {},
      heatmap: {},
      deletedIds: [],
    });
    fetchWithRetryMock
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 }))
      .mockResolvedValueOnce(createResponse({
        ok: true,
        status: 200,
        json: {
          progress: { 1: { status: 'review' }, 2: { status: 'review' }, 3: { status: 'review' } },
          wrongWords: {},
          heatmap: {},
          deletedIds: [],
        },
      }));

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.example.com/root',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = { instance: null, save: vi.fn(async () => {}) };
    const memoryCache = {
      progress: { size: 1, toObject: () => ({ 1: { status: 'review' } }) },
      wrongWords: { toObject: () => ({}) },
      heatmap: { toObject: () => ({}) },
      deletedIds: new Set(),
    };

    const result = await service.syncFromWebDAV(db, memoryCache, 'device-a');

    expect(result.status).toBe('needs_full_sync');
    expect(result.message).toContain('全量同步');
  });

  it('persistMergedData uses mergeWithId to keep progress ids stable during syncFromWebDAV', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    mergeLocalAndCloudMock.mockResolvedValueOnce({
      progress: { 7: { status: 'review', id: 999 } },
      wrongWords: { 7: { count: 2 } },
      heatmap: { '2026-07-07': 3 },
      deletedIds: ['7'],
    });
    fetchWithRetryMock
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 }))
      .mockResolvedValueOnce(createResponse({
        ok: true,
        status: 200,
        json: {
          progress: { 7: { status: 'review' } },
          wrongWords: { 7: { count: 2 } },
          heatmap: { '2026-07-07': 3 },
          deletedIds: ['7'],
        },
      }));

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.example.com/root',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = {
      instance: {},
      save: vi.fn(async () => {}),
      bulkSave: vi.fn(async () => {}),
    };
    const memoryCache = {
      progress: new Map([['1', { status: 'review' }]]),
      wrongWords: new Map(),
      heatmap: new Map(),
      deletedIds: new Set(),
    };

    const result = await service.syncFromWebDAV(db, memoryCache, 'device-a');

    expect(result.status).toBe('success');
    expect(mergeWithIdMock).toHaveBeenCalledWith({ status: 'review', id: 999 }, 7);
    expect(db.bulkSave).toHaveBeenCalledWith('progress', [{ status: 'review', id: 7 }]);
    expect(memoryCache.deletedIds.has('7')).toBe(true);
  });

  it('saveWebDAVConfig validates URL, master key length, character requirements, and HTTPS', async () => {
    const service = await import('../js/services/sync-webdav.js');

    await expect(service.saveWebDAVConfig('', 'u', 'p', 'master-pass-123')).rejects.toThrow(
      '请输入 WebDAV 服务器地址'
    );
    await expect(
      service.saveWebDAVConfig('https://dav.com', 'u', 'p', '')
    ).rejects.toThrow('请设置主密码用于加密凭证');
    await expect(
      service.saveWebDAVConfig('https://dav.com', 'u', 'p', 'short1')
    ).rejects.toThrow('至少需要 12 个字符');
    await expect(
      service.saveWebDAVConfig('https://dav.com', 'u', 'p', 'alllettersonlyhere')
    ).rejects.toThrow('同时包含字母和数字');
    await expect(
      service.saveWebDAVConfig('http://dav.com', 'u', 'p', 'masterpass1234')
    ).rejects.toThrow('请使用 HTTPS 地址');
  });

  it('loadWebDAVConfig reads from localStorage and handles corrupted JSON', async () => {
    const service = await import('../js/services/sync-webdav.js');

    expect(service.loadWebDAVConfig()).toBeNull();

    globalThis.localStorage._store['cet46_webdav_config'] = JSON.stringify({
      url: 'https://dav.com',
      encryptedAuth: 'xyz',
    });
    expect(service.loadWebDAVConfig()).toEqual({
      url: 'https://dav.com',
      encryptedAuth: 'xyz',
    });

    globalThis.localStorage._store['cet46_webdav_config'] = '{corrupted';
    expect(service.loadWebDAVConfig()).toBeNull();
  });

  it('testWebDAVConnection validates config and tests PROPFIND method', async () => {
    const service = await import('../js/services/sync-webdav.js');

    await expect(service.testWebDAVConnection(null)).rejects.toThrow('配置不完整');
    await expect(
      service.testWebDAVConnection({
        url: 'http://dav.com',
        username: 'u',
        password: 'p',
      })
    ).rejects.toThrow('请使用 HTTPS 地址');

    fetchWithRetryMock.mockResolvedValueOnce(createResponse({ ok: true, status: 207 }));
    const ok207 = await service.testWebDAVConnection({
      url: 'https://dav.com',
      username: 'u',
      password: 'p',
    });
    expect(ok207).toBe(true);

    fetchWithRetryMock.mockResolvedValueOnce(createResponse({ ok: false, status: 401 }));
    await expect(
      service.testWebDAVConnection({
        url: 'https://dav.com',
        username: 'u',
        password: 'p',
      })
    ).rejects.toThrow('连接失败: 401');
  });

  it('exportEncryptionKey exports key metadata when configured', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    const service = await import('../js/services/sync-webdav.js');

    expect(service.exportEncryptionKey()).toBeNull();

    await service.saveWebDAVConfig(
      'https://dav.com',
      'u',
      'p',
      'master-pass-123',
      true
    );

    expect(service.exportEncryptionKey()).toEqual({
      url: 'https://dav.com',
      auth: 'encrypted-auth',
      autoSync: true,
    });
  });

  it('syncToWebDAV returns no_changes when nothing is dirty', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    fetchWithRetryMock.mockResolvedValueOnce(createResponse({ ok: true, status: 200 })); // HEAD backup

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.com',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = { instance: null, save: vi.fn() };
    const memoryCache = {
      progress: { entries: () => [] },
      wrongWords: { toObject: () => ({}) },
      heatmap: { toObject: () => ({}) },
      deletedIds: new Set(),
      wrongWordsDirty: false,
      heatmapDirty: false,
    };

    const result = await service.syncToWebDAV(db, memoryCache, 'dev-1');
    expect(result.status).toBe('no_changes');
  });

  it('syncToWebDAV handles cloud 412 conflict and upload failure', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    fetchWithRetryMock
      .mockResolvedValueOnce(createResponse({ ok: true, status: 200 })) // HEAD backup
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 })) // GET patch
      .mockResolvedValueOnce(createResponse({ ok: false, status: 412 })); // PUT patch 412

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.com',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = { instance: {}, save: vi.fn() };
    const memoryCache = {
      progress: { entries: () => [['1', { isDirty: true }]] },
      wrongWords: { toObject: () => ({}) },
      heatmap: { toObject: () => ({}) },
      deletedIds: new Set(),
      wrongWordsDirty: false,
      heatmapDirty: false,
    };

    await expect(service.syncToWebDAV(db, memoryCache, 'dev-1')).rejects.toThrow(
      '已被其他设备修改'
    );
  });

  it('syncFromWebDAV handles missing backup 404 and invalid json error', async () => {
    encryptMock.mockResolvedValueOnce('encrypted-auth');
    decryptMock.mockResolvedValueOnce('user:pass');
    fetchWithRetryMock
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 })) // GET patch
      .mockResolvedValueOnce(createResponse({ ok: false, status: 404 })); // GET backup 404

    const service = await import('../js/services/sync-webdav.js');
    await service.saveWebDAVConfig(
      'https://dav.com',
      'user',
      'pass',
      'master-pass-123',
      false
    );

    const db = { instance: null, save: vi.fn() };
    const memoryCache = {
      progress: { size: 0, toObject: () => ({}) },
      wrongWords: { toObject: () => ({}) },
      heatmap: { toObject: () => ({}) },
      deletedIds: new Set(),
    };

    await expect(service.syncFromWebDAV(db, memoryCache, 'dev-1')).rejects.toThrow(
      '云端没有找到备份文件'
    );
  });
});

