import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies
const coreMock = {
  SCHEMA_VERSION: 3,
  collectReviewLogs: vi.fn(() => []),
  migrateData: vi.fn(d => d),
  resetProgress: vi.fn(async () => []),
};
const fsrsMock = {
  evaluateLogLoss: vi.fn(() => 0.5),
  FSRS_W: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  getFSRSWeights: vi.fn(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]),
  DEFAULT_FSRS_W: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  setFSRSWeights: vi.fn(() => true),
};
const storeMock = {
  memoryCache: {
    wrongWords: { toObject: () => ({ 1: { count: 1 } }), fromObject: vi.fn() },
    heatmap: { toObject: () => ({ '2026-01-01': 5 }), fromObject: vi.fn() },
    progress: { toObject: () => ({ 1: { status: 'new' } }), fromObject: vi.fn() },
    deletedIds: new Set([1, 2]),
  },
};
const dbMock = {
  instance: null,
  clear: vi.fn(async () => {}),
  bulkSave: vi.fn(async () => {}),
  getAll: vi.fn(async () => []),
};
const uiMock = {
  UI: {
    confirm: vi.fn(async () => true),
    toast: vi.fn(),
    prompt: vi.fn(async () => 'key'),
  },
};
const vocabStoreMock = { setWordsArray: vi.fn() };
const semanticGraphUiMock = { buildWordMaps: vi.fn() };

let lastWorkerInstance = null;

class MockWorker {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
    lastWorkerInstance = this;
  }
}

vi.mock('../js/core.js', () => coreMock);
vi.mock('../js/fsrs.js', () => fsrsMock);
vi.mock('../js/store.js', () => storeMock);
vi.mock('../js/db.js', () => ({ db: dbMock }));
vi.mock('../js/config.js', () => ({
  CONFIG: {
    STORAGE_KEYS: { TARGET_RETENTION: 'cet46_target_retention' },
    FSRS: { TARGET_RETENTION: 0.9 },
  },
}));
vi.mock('../js/utils.js', () => ({ shuffle: vi.fn(arr => arr.slice()) }));
vi.mock('../js/ui.js', () => uiMock);
vi.mock('../js/data/vocab-store.js', () => vocabStoreMock);
vi.mock('../js/utils/semantic-graph-ui.js', () => semanticGraphUiMock);
vi.mock('../js/workers/fsrs-trainer-worker.js?worker&inline', () => ({
  default: MockWorker,
}));
vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

let createObjectURLSpy;
let revokeObjectURLSpy;
let domElements = {};

class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  readAsText(file) {
    if (file._triggerError) {
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('File read error'));
      }, 0);
      return;
    }
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: file._content || '{}' } });
      }
    }, 0);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  lastWorkerInstance = null;
  domElements = {};

  const store = {};
  globalThis.localStorage = {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => {
      store[k] = String(v);
    }),
    removeItem: vi.fn(k => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    key: vi.fn(i => Object.keys(store)[i] ?? null),
    get length() {
      return Object.keys(store).length;
    },
    _store: store,
  };

  globalThis.document = {
    getElementById: vi.fn(id => domElements[id] || null),
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
  };
  globalThis.window = {};
  globalThis.alert = vi.fn();
  globalThis.FileReader = MockFileReader;
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'vitest/1.0' },
    writable: true,
    configurable: true,
  });
  globalThis.location = { reload: vi.fn(), hostname: 'localhost', href: 'http://localhost' };
  createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  globalThis.Blob = class MockBlob {
    constructor(parts, opts) {
      this.parts = parts;
      this.opts = opts;
    }
  };

  dbMock.instance = null;
  dbMock.clear.mockReset().mockResolvedValue(undefined);
  dbMock.bulkSave.mockReset().mockResolvedValue(undefined);
  dbMock.getAll.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  createObjectURLSpy?.mockRestore();
  revokeObjectURLSpy?.mockRestore();
  vi.clearAllMocks();
  vi.resetModules();
});

describe('SettingsFeature', () => {
  it('exports all expected functions', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    expect(typeof SettingsFeature.init).toBe('function');
    expect(typeof SettingsFeature.setWords).toBe('function');
    expect(typeof SettingsFeature.resetProgress).toBe('function');
    expect(typeof SettingsFeature.exportData).toBe('function');
    expect(typeof SettingsFeature.importData).toBe('function');
    expect(typeof SettingsFeature.trainFSRSWeights).toBe('function');
    expect(typeof SettingsFeature.cancelFSRSTraining).toBe('function');
    expect(typeof SettingsFeature.resetFSRSWeights).toBe('function');
  });

  it('init accepts array WORDS and binds retention slider', async () => {
    const sliderListeners = {};
    const mockSlider = {
      value: '90',
      addEventListener: vi.fn((evt, cb) => {
        sliderListeners[evt] = cb;
      }),
    };
    const mockValueDisplay = { textContent: '' };
    domElements['retention-slider'] = mockSlider;
    domElements['target-retention-value'] = mockValueDisplay;
    globalThis.localStorage._store['cet46_target_retention'] = '0.85';

    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.init({
      WORDS: [{ id: 1, word: 'a', meaning: 'A', level: 'CET4' }],
      updateStats: vi.fn(),
      renderList: vi.fn(),
    });

    expect(mockSlider.value).toBe(85);
    expect(mockValueDisplay.textContent).toBe('85%');

    // Trigger slider input event
    sliderListeners['input']({ target: { value: '80' } });
    expect(mockValueDisplay.textContent).toBe('80%');
    vi.advanceTimersByTime(150);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      'cet46_target_retention',
      '0.8'
    );
  });

  it('init accepts function WORDS getter', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    expect(() =>
      SettingsFeature.init({
        WORDS: () => [{ id: 1, word: 'a', meaning: 'A', level: 'CET4' }],
        updateStats: () => {},
        renderList: () => {},
      })
    ).not.toThrow();
  });

  it('setWords accepts array and function', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    expect(() =>
      SettingsFeature.setWords([{ id: 1, word: 'a', meaning: 'A', level: 'CET4' }])
    ).not.toThrow();
    expect(() => SettingsFeature.setWords(() => [])).not.toThrow();
  });

  it('resetFSRSWeights restores defaults and notifies UI', async () => {
    const mockScoreEl = { textContent: '' };
    domElements['fsrs-fit-score'] = mockScoreEl;
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.resetFSRSWeights();
    expect(fsrsMock.setFSRSWeights).toHaveBeenCalledWith(fsrsMock.DEFAULT_FSRS_W);
    expect(mockScoreEl.textContent).toBe('已恢复默认');
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('恢复'), 'success');
  });

  it('cancelFSRSTraining returns false when no training in progress', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    expect(SettingsFeature.cancelFSRSTraining()).toBe(false);
  });

  it('trainFSRSWeights rejects when sample size < 50', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    coreMock.collectReviewLogs.mockReturnValueOnce(Array(10).fill({}));
    await SettingsFeature.trainFSRSWeights();
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('样本量'), 'warning');
  });

  it('trainFSRSWeights handles complete with lower loss and cancel in progress', async () => {
    const mockScoreEl = { textContent: '' };
    domElements['fsrs-fit-score'] = mockScoreEl;
    const { SettingsFeature } = await import('../js/features/settings.js');

    coreMock.collectReviewLogs.mockReturnValue(Array(60).fill({ elapsedDays: 1, rating: 3 }));
    fsrsMock.evaluateLogLoss.mockImplementation((set, weights) => {
      if (weights === fsrsMock.DEFAULT_FSRS_W) return 0.5;
      return 0.3; // Lower loss
    });

    SettingsFeature.trainFSRSWeights();
    expect(lastWorkerInstance).not.toBeNull();
    expect(lastWorkerInstance.postMessage).toHaveBeenCalled();
    expect(mockScoreEl.textContent).toBe('启动 Worker 训练中...');

    // Progress message
    lastWorkerInstance.onmessage({
      data: { type: 'progress', iteration: 10, maxIterations: 100, loss: 0.4 },
    });
    expect(mockScoreEl.textContent).toContain('10/100');

    // Info message
    lastWorkerInstance.onmessage({
      data: { type: 'info', message: 'training step info' },
    });

    // Complete message with improved weights
    const newWeights = Array(17).fill(2);
    lastWorkerInstance.onmessage({
      data: { type: 'complete', result: { weights: newWeights } },
    });
    expect(fsrsMock.setFSRSWeights).toHaveBeenCalledWith(newWeights);
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('模型训练成功'), 'success');
    expect(lastWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('trainFSRSWeights handles overfit fallback when new loss is not lower', async () => {
    const mockScoreEl = { textContent: '' };
    domElements['fsrs-fit-score'] = mockScoreEl;
    const { SettingsFeature } = await import('../js/features/settings.js');

    coreMock.collectReviewLogs.mockReturnValue(Array(60).fill({ elapsedDays: 1, rating: 3 }));
    fsrsMock.evaluateLogLoss.mockReturnValue(0.6); // Not lower than initial

    SettingsFeature.trainFSRSWeights();
    lastWorkerInstance.onmessage({
      data: { type: 'complete', result: { weights: Array(17).fill(5) } },
    });

    expect(uiMock.UI.toast).toHaveBeenCalledWith(
      expect.stringContaining('过拟合预警'),
      'warning'
    );
  });

  it('trainFSRSWeights handles worker error message and onerror event', async () => {
    const mockScoreEl = { textContent: '' };
    domElements['fsrs-fit-score'] = mockScoreEl;
    const { SettingsFeature } = await import('../js/features/settings.js');

    coreMock.collectReviewLogs.mockReturnValue(Array(60).fill({ elapsedDays: 1, rating: 3 }));
    SettingsFeature.trainFSRSWeights();

    // Worker error message
    lastWorkerInstance.onmessage({
      data: { type: 'error', error: 'Computation failed' },
    });
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('训练失败'), 'error');

    // Restart training and trigger onerror
    SettingsFeature.trainFSRSWeights();
    lastWorkerInstance.onerror({ message: 'Runtime crash' });
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('Runtime crash'), 'error');
  });

  it('trainFSRSWeights supports cancelFSRSTraining and timeout watchdog', async () => {
    const mockScoreEl = { textContent: '' };
    domElements['fsrs-fit-score'] = mockScoreEl;
    const { SettingsFeature } = await import('../js/features/settings.js');

    coreMock.collectReviewLogs.mockReturnValue(Array(60).fill({ elapsedDays: 1, rating: 3 }));

    // Test explicit cancellation
    SettingsFeature.trainFSRSWeights();
    const cancelled = SettingsFeature.cancelFSRSTraining();
    expect(cancelled).toBe(true);
    expect(mockScoreEl.textContent).toBe('训练已取消');
    expect(uiMock.UI.toast).toHaveBeenCalledWith('用户取消了训练', 'info');

    // Test 5 min timeout watchdog
    SettingsFeature.trainFSRSWeights();
    vi.advanceTimersByTime(5 * 60 * 1000 + 100);
    expect(mockScoreEl.textContent).toBe('训练超时');
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('训练超时'), 'error');
  });

  it('exportData triggers blob download and revokes URL', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.setWords([{ id: 1, word: 'a', meaning: 'A', level: 'CET4' }]);
    await SettingsFeature.exportData();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1100);
    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
    const link = globalThis.document.createElement.mock.results[0].value;
    expect(link.click).toHaveBeenCalled();
    expect(link.download).toMatch(/^cet46_backup_/);
  });

  it('exportData falls back to window.WORDS when getWordsFn returns empty', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.setWords(() => []);
    globalThis.window.WORDS = [{ id: 1, word: 'a', meaning: 'A', level: 'CET4' }];
    await SettingsFeature.exportData();
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('handleResetProgress clears cet46_ prefixed localStorage keys and shows partial failure toast', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    globalThis.localStorage._store['cet46_x'] = '1';
    globalThis.localStorage._store['cet46_y'] = '2';
    globalThis.localStorage._store['other_key'] = '3';
    uiMock.UI.confirm.mockResolvedValueOnce(true);
    coreMock.resetProgress.mockResolvedValueOnce(['db_progress']);

    await SettingsFeature.resetProgress();
    expect(coreMock.resetProgress).toHaveBeenCalled();
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('cet46_x');
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('cet46_y');
    expect(globalThis.localStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('重置部分失败'), 'warning');
    expect(globalThis.location.reload).toHaveBeenCalled();
  });

  it('handleResetProgress does nothing when user cancels confirm', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    uiMock.UI.confirm.mockResolvedValueOnce(false);
    globalThis.localStorage._store['cet46_x'] = '1';
    await SettingsFeature.resetProgress();
    expect(coreMock.resetProgress).not.toHaveBeenCalled();
    expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
    expect(globalThis.location.reload).not.toHaveBeenCalled();
  });

  it('importData rejects non-json and oversized files', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    const txtEvt = { target: { files: [{ name: 'foo.txt', size: 100 }], value: 'foo.txt' } };
    await SettingsFeature.importData(txtEvt);
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('.json'), 'error');

    const bigEvt = {
      target: {
        files: [{ name: 'big.json', size: 60 * 1024 * 1024 }],
        value: 'big.json',
      },
    };
    await SettingsFeature.importData(bigEvt);
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('50MB'), 'error');
  });

  it('importData imports valid backup into IndexedDB and memoryCache', async () => {
    const mockUpdateStats = vi.fn();
    const mockRenderList = vi.fn();
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.init({
      WORDS: () => [],
      updateStats: mockUpdateStats,
      renderList: mockRenderList,
    });

    const mockTx = {
      objectStore: vi.fn(() => ({ put: vi.fn() })),
      oncomplete: null,
      onerror: null,
      onabort: null,
    };
    dbMock.instance = {
      transaction: vi.fn(() => {
        queueMicrotask(() => mockTx.oncomplete && mockTx.oncomplete());
        return mockTx;
      }),
    };
    dbMock.getAll.mockResolvedValue([]);

    const backupPayload = {
      version: 3,
      words: [{ id: 1, word: 'test', meaning: '测试' }],
      progress: { 1: { status: 'review', id: 1 } },
      wrongWords: { 1: { count: 2 } },
      heatmap: { '2026-01-01': 3 },
      deletedIds: [99],
      fsrsWeights: Array(17).fill(1),
    };

    const evt = {
      target: {
        files: [
          {
            name: 'backup.json',
            size: 1024,
            _content: JSON.stringify(backupPayload),
          },
        ],
        value: 'backup.json',
      },
    };

    await SettingsFeature.importData(evt);
    await vi.runAllTimersAsync();

    expect(vocabStoreMock.setWordsArray).toHaveBeenCalledWith(backupPayload.words);
    expect(semanticGraphUiMock.buildWordMaps).toHaveBeenCalled();
    expect(storeMock.memoryCache.progress.fromObject).toHaveBeenCalledWith(backupPayload.progress);
    expect(storeMock.memoryCache.wrongWords.fromObject).toHaveBeenCalledWith(
      backupPayload.wrongWords
    );
    expect(storeMock.memoryCache.heatmap.fromObject).toHaveBeenCalledWith(backupPayload.heatmap);
    expect(storeMock.memoryCache.deletedIds.has(99)).toBe(true);
    expect(fsrsMock.setFSRSWeights).toHaveBeenCalledWith(backupPayload.fsrsWeights);
    expect(mockUpdateStats).toHaveBeenCalled();
    expect(mockRenderList).toHaveBeenCalled();
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('数据导入成功'), 'success');
  });

  it('importData sanitizes prototype pollution in backup JSON', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.init({
      WORDS: () => [],
      updateStats: vi.fn(),
      renderList: vi.fn(),
    });

    const maliciousJson = '{"__proto__":{"polluted":true},"words":[{"__proto__":{"bad":true},"id":1,"word":"ok"}]}';
    const evt = {
      target: {
        files: [{ name: 'malicious.json', size: 100, _content: maliciousJson }],
        value: 'malicious.json',
      },
    };

    await SettingsFeature.importData(evt);
    await vi.runAllTimersAsync();
    expect(Object.prototype.polluted).toBeUndefined();
    expect(Object.prototype.bad).toBeUndefined();
  });

  it('importData handles DB write rollback and errors gracefully', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    SettingsFeature.init({
      WORDS: () => [{ id: 9, word: 'orig' }],
      updateStats: vi.fn(),
      renderList: vi.fn(),
    });

    const mockTx = {
      objectStore: vi.fn(() => ({ put: vi.fn() })),
      oncomplete: null,
      onerror: null,
      onabort: null,
    };
    dbMock.instance = {
      transaction: vi.fn(() => {
        queueMicrotask(() => mockTx.onerror && mockTx.onerror(new Error('Tx Failed')));
        return mockTx;
      }),
    };
    dbMock.getAll.mockResolvedValueOnce([{ id: 9, word: 'orig' }]);

    const evt = {
      target: {
        files: [
          {
            name: 'backup.json',
            size: 500,
            _content: JSON.stringify({
              version: 3,
              words: [{ id: 100, word: 'new' }],
            }),
          },
        ],
        value: 'backup.json',
      },
    };

    await SettingsFeature.importData(evt);
    await vi.runAllTimersAsync();

    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('导入失败'), 'error');
  });

  it('importData handles FileReader error and invalid JSON structure', async () => {
    const { SettingsFeature } = await import('../js/features/settings.js');
    const errEvt = {
      target: {
        files: [{ name: 'err.json', size: 100, _triggerError: true }],
        value: 'err.json',
      },
    };
    await SettingsFeature.importData(errEvt);
    await vi.runAllTimersAsync();
    expect(uiMock.UI.toast).toHaveBeenCalledWith('文件读取失败', 'error');

    const invalidJsonEvt = {
      target: {
        files: [{ name: 'invalid.json', size: 10, _content: '[1,2,3]' }],
        value: 'invalid.json',
      },
    };
    await SettingsFeature.importData(invalidJsonEvt);
    await vi.runAllTimersAsync();
    expect(uiMock.UI.toast).toHaveBeenCalledWith(expect.stringContaining('导入失败'), 'error');
  });
});
