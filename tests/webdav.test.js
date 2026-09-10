import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sync module
const syncMock = {
  webdavConfig: null,
  decryptWebDAVCredentials: vi.fn(),
  clearWebDAVPlaintextCredentials: vi.fn(),
  saveWebDAVConfig: vi.fn(async () => {}),
  testWebDAVConnection: vi.fn(async () => {}),
  syncToWebDAV: vi.fn(async () => ({ status: 'success', changes: 5 })),
  syncFromWebDAV: vi.fn(async () => ({ status: 'success' })),
  exportEncryptionKey: vi.fn(() => null),
  updateWebDAVStatus: vi.fn(),
};
vi.mock('../js/sync.js', () => syncMock);
vi.mock('../js/db.js', () => ({ db: { instance: null } }));
vi.mock('../js/store.js', () => ({ memoryCache: { progress: {} } }));
vi.mock('../js/ui.js', () => ({
  UI: {
    toast: vi.fn(),
    prompt: vi.fn(async () => 'password'),
    safeExecute: vi.fn(async (fn) => fn()),
  },
}));
vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

let createObjectURLSpy;
let revokeObjectURLSpy;
let randomUUIDSpy;

beforeEach(() => {
  vi.useFakeTimers();
  const store = {};
  globalThis.localStorage = {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = String(v); }),
    removeItem: vi.fn(k => { delete store[k]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    _store: store,
  };
  globalThis.document = {
    getElementById: vi.fn(() => null),
    createElement: vi.fn(() => ({
      href: '', download: '', click: vi.fn(),
    })),
  };
  globalThis.window = {};
  // crypto.randomUUID spy - 兼容 Node 18+ 已有 crypto 全局
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    randomUUIDSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-1234');
  } else {
    // 旧环境 fallback：defineProperty 写入 crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: vi.fn(() => 'test-uuid-1234') },
      writable: true,
      configurable: true,
    });
  }
  // 保留 URL 构造器，仅 spy 静态方法
  createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  globalThis.Blob = class MockBlob {
    constructor(parts, opts) { this.parts = parts; this.opts = opts; }
  };
  // 重置 sync mock 状态
  syncMock.webdavConfig = null;
  syncMock.exportEncryptionKey.mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  createObjectURLSpy?.mockRestore();
  revokeObjectURLSpy?.mockRestore();
  randomUUIDSpy?.mockRestore();
  vi.clearAllMocks();
  vi.resetModules();
});

function mockElement(values) {
  // values: { 'webdav-url': 'http://...', ... }
  globalThis.document.getElementById = vi.fn(id => {
    const v = values[id];
    if (v === undefined) return { value: '', checked: false };
    if (typeof v === 'boolean') return { value: '', checked: v };
    return { value: v, checked: false };
  });
}

describe('WebDAVFeature exports', () => {
  it('exports all expected methods', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    expect(typeof WebDAVFeature.init).toBe('function');
    expect(typeof WebDAVFeature.toggleWebDAVConfig).toBe('function');
    expect(typeof WebDAVFeature.handleSaveWebDAVConfig).toBe('function');
    expect(typeof WebDAVFeature.handleTestWebDAVConnection).toBe('function');
    expect(typeof WebDAVFeature.handleExportEncryptionKey).toBe('function');
    expect(typeof WebDAVFeature.handleSyncToWebDAV).toBe('function');
    expect(typeof WebDAVFeature.handleSyncFromWebDAV).toBe('function');
  });

  it('init stores callbacks', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    expect(() => WebDAVFeature.init({
      updateStats: vi.fn(),
      renderList: vi.fn(),
    })).not.toThrow();
  });
});

describe('toggleWebDAVConfig', () => {
  it('toggles panel display from none to block', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const panel = { style: { display: 'none' } };
    globalThis.document.getElementById = vi.fn(() => panel);
    WebDAVFeature.toggleWebDAVConfig();
    expect(panel.style.display).toBe('block');
  });

  it('toggles panel display from block to none', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const panel = { style: { display: 'block' } };
    globalThis.document.getElementById = vi.fn(() => panel);
    WebDAVFeature.toggleWebDAVConfig();
    expect(panel.style.display).toBe('none');
  });

  it('does nothing when panel is missing', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    globalThis.document.getElementById = vi.fn(() => null);
    expect(() => WebDAVFeature.toggleWebDAVConfig()).not.toThrow();
  });
});

describe('handleSaveWebDAVConfig validation', () => {
  it('rejects empty URL', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': '' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('请输入'),
      'error'
    );
  });

  it('rejects URL not starting with http:// or https://', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'ftp://example.com/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('http://'),
      'error'
    );
  });

  it('rejects malformed URL', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://[invalid' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('无效'),
      'error'
    );
  });

  it('rejects localhost as SSRF protection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://localhost/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('内网'),
      'error'
    );
  });

  it('rejects 127.x.x.x as SSRF protection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://127.0.0.1/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('内网'),
      'error'
    );
  });

  it('rejects 192.168.x.x as SSRF protection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://192.168.1.1/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('内网'),
      'error'
    );
  });

  it('rejects 10.x.x.x as SSRF protection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://10.0.0.1/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('内网'),
      'error'
    );
  });

  it('rejects 172.16.x.x as SSRF protection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'http://172.16.0.1/dav' });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('内网'),
      'error'
    );
  });

  it('accepts public URL and saves config', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    mockElement({
      'webdav-url': 'https://dav.example.com/path',
      'webdav-master-key': 'master-key',
      'webdav-username': 'user',
      'webdav-password': 'pass',
      'webdav-auto-sync': true,
    });
    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(syncMock.saveWebDAVConfig).toHaveBeenCalledWith(
      'https://dav.example.com/path',
      'user',
      'pass',
      'master-key',
      true
    );
  });
});

describe('handleExportEncryptionKey', () => {
  it('warns when no encrypted config exists', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.exportEncryptionKey.mockReturnValueOnce(null);
    WebDAVFeature.handleExportEncryptionKey();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('暂无'),
      'warning'
    );
  });

  it('downloads key file when encryption key exists', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    syncMock.exportEncryptionKey.mockReturnValueOnce({
      salt: 'abc', iv: 'def', key: 'xyz',
    });
    WebDAVFeature.handleExportEncryptionKey();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const link = globalThis.document.createElement.mock.results[0].value;
    expect(link.download).toBe('CET46_Identity.key');
    expect(link.click).toHaveBeenCalled();
  });
});

describe('handleSyncToWebDAV', () => {
  it('warns when webdavConfig is null', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = null;
    await WebDAVFeature.handleSyncToWebDAV();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('请先配置'),
      'warning'
    );
  });

  it('calls syncToWebDAV with proper arguments when config exists', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    await WebDAVFeature.handleSyncToWebDAV();
    expect(syncMock.syncToWebDAV).toHaveBeenCalled();
    expect(syncMock.updateWebDAVStatus).toHaveBeenCalledWith(
      expect.stringContaining('增量同步完成')
    );
  });

  it('reports no_changes when status is no_changes', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    syncMock.syncToWebDAV.mockResolvedValueOnce({ status: 'no_changes' });
    await WebDAVFeature.handleSyncToWebDAV();
    expect(syncMock.updateWebDAVStatus).toHaveBeenCalledWith(
      expect.stringContaining('已是最新')
    );
  });
});

describe('handleSyncFromWebDAV', () => {
  it('warns when webdavConfig is null', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = null;
    await WebDAVFeature.handleSyncFromWebDAV();
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('请先配置'),
      'warning'
    );
  });

  it('reports success when sync status is success', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    syncMock.syncFromWebDAV.mockResolvedValueOnce({ status: 'success' });
    await WebDAVFeature.handleSyncFromWebDAV();
    expect(syncMock.updateWebDAVStatus).toHaveBeenCalledWith('增量同步成功');
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('增量合并'),
      'success'
    );
  });

  it('warns when status is needs_full_sync', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    syncMock.syncFromWebDAV.mockResolvedValueOnce({ status: 'needs_full_sync' });
    await WebDAVFeature.handleSyncFromWebDAV();
    expect(syncMock.updateWebDAVStatus).toHaveBeenCalledWith('需要全量同步');
    expect(UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('全量同步'),
      'warning'
    );
  });
});

describe('getDeviceId persistence (via handleSyncToWebDAV)', () => {
  it('generates and persists device id on first sync', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    await WebDAVFeature.handleSyncToWebDAV();
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      'cet46_device_id',
      expect.stringContaining('pwa-')
    );
  });

  it('reuses existing device id on subsequent syncs', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    globalThis.localStorage._store['cet46_device_id'] = 'pwa-existing-id';
    syncMock.syncToWebDAV.mockClear();
    await WebDAVFeature.handleSyncToWebDAV();
    expect(syncMock.syncToWebDAV).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'pwa-existing-id'
    );
  });

  it('handles localStorage errors in getDeviceId via memory fallback', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    globalThis.localStorage.getItem.mockImplementationOnce(() => {
      throw new Error('Access denied in private mode');
    });
    syncMock.webdavConfig = { encryptedAuth: false, username: 'user' };
    await expect(WebDAVFeature.handleSyncToWebDAV()).resolves.toBeUndefined();
  });
});

describe('handleTestWebDAVConnection', () => {
  it('warns when URL is missing', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': '' });
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('请先输入'), 'warning');
  });

  it('rejects private IP during connection test', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    mockElement({ 'webdav-url': 'https://192.168.1.1/dav' });
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('内网'), 'error');
  });

  it('handles encrypted auth credentials decryption for test connection', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = { encryptedAuth: true };

    // Missing master key
    mockElement({
      'webdav-url': 'https://dav.example.com',
      'webdav-master-key': '',
    });
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('主密码'), 'warning');

    // Wrong master key
    mockElement({
      'webdav-url': 'https://dav.example.com',
      'webdav-master-key': 'wrong-pass',
    });
    syncMock.decryptWebDAVCredentials.mockResolvedValueOnce(false);
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('主密码错误'), 'error');
  });

  it('warns when username or password is missing', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = null;
    mockElement({
      'webdav-url': 'https://dav.example.com',
      'webdav-username': '',
      'webdav-password': '',
    });
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('用户名和密码'), 'warning');
  });

  it('runs connection test and toasts success / error', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');
    syncMock.webdavConfig = null;
    mockElement({
      'webdav-url': 'https://dav.example.com',
      'webdav-username': 'user',
      'webdav-password': 'password',
    });

    syncMock.testWebDAVConnection.mockResolvedValueOnce(true);
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('测试成功'), 'success');
    expect(syncMock.clearWebDAVPlaintextCredentials).toHaveBeenCalled();

    syncMock.testWebDAVConnection.mockRejectedValueOnce(new Error('Auth failed'));
    await WebDAVFeature.handleTestWebDAVConnection();
    expect(UI.toast).toHaveBeenCalledWith('Auth failed', 'error');
    expect(syncMock.clearWebDAVPlaintextCredentials).toHaveBeenCalled();
  });
});

describe('ensureCredentialsReady interactive decryption', () => {
  it('prompts user when master key input is empty during sync', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');

    syncMock.webdavConfig = { encryptedAuth: true };
    mockElement({ 'webdav-master-key': '' });

    // User cancels prompt
    UI.prompt.mockResolvedValueOnce(null);
    await WebDAVFeature.handleSyncToWebDAV();
    expect(syncMock.syncToWebDAV).not.toHaveBeenCalled();

    // User inputs wrong password
    UI.prompt.mockResolvedValueOnce('wrong-pass');
    syncMock.decryptWebDAVCredentials.mockResolvedValueOnce(false);
    await WebDAVFeature.handleSyncToWebDAV();
    expect(UI.toast).toHaveBeenCalledWith('主密码错误', 'error');

    // Decryption throws exception
    UI.prompt.mockResolvedValueOnce('bad-key');
    syncMock.decryptWebDAVCredentials.mockRejectedValueOnce(new Error('Corrupted data'));
    await WebDAVFeature.handleSyncToWebDAV();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('凭证解密失败'), 'error');
  });
});

describe('SSRF protection IP parsing edges', () => {
  it('rejects IPv6 loopback, link-local, and IPv4-mapped private IPs', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');

    const blockedUrls = [
      'http://[::1]/dav',
      'http://[fe80::1]/dav',
      'http://[::ffff:192.168.1.1]/dav',
      'http://0177.0.0.1/dav',
      'http://0x7f.0.0.1/dav',
      'http://[fc00::1]/dav',
    ];

    for (const url of blockedUrls) {
      mockElement({ 'webdav-url': url });
      await WebDAVFeature.handleSaveWebDAVConfig();
      expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('内网'), 'error');
      UI.toast.mockClear();
    }
  });

  it('handles saveWebDAVConfig rejection in handleSaveWebDAVConfig', async () => {
    const { WebDAVFeature } = await import('../js/features/webdav.js');
    const { UI } = await import('../js/ui.js');

    mockElement({
      'webdav-url': 'https://dav.example.com',
      'webdav-master-key': 'master123',
    });
    syncMock.saveWebDAVConfig.mockRejectedValueOnce(new Error('Save failed'));

    await WebDAVFeature.handleSaveWebDAVConfig();
    expect(UI.toast).toHaveBeenCalledWith('Save failed', 'error');
  });
});

