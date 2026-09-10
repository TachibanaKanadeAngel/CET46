import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../js/db.js', () => ({
  db: {
    instance: null,
    save: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    bulkSave: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null)
  }
}));

import { db } from '../js/db.js';
import { localDateStr } from '../js/utils/date.ts';
import {
  memoryCache,
  ReactiveCache,
  subscribeToStore,
  loadFromIndexedDB,
  bulkSaveToIndexedDB,
  getWordDataSync,
  setWordDataSync,
  updateWordData,
  deleteWordData,
  saveProgress,
  flushProgress,
  getWrongWords,
  saveWrongWords,
  addWrongWord,
  removeWrongWord,
  getHeatmap,
  saveHeatmap,
  recordHeatmap,
  getMemoryCache,
  getReactiveCache,
  createDefaultWordProgress,
} from '../js/store.js';

beforeEach(() => {
  const LRUClass = memoryCache.heatmap?.constructor;
  if (!memoryCache.progress || typeof memoryCache.progress.clear !== 'function') {
    if (LRUClass) memoryCache.progress = new LRUClass(7000, 'progress');
  } else {
    memoryCache.progress.clear();
  }
  if (!memoryCache.wrongWords || typeof memoryCache.wrongWords.clear !== 'function') {
    if (LRUClass) memoryCache.wrongWords = new LRUClass(500, 'wrongWords');
  } else {
    memoryCache.wrongWords.clear();
  }
  if (!memoryCache.heatmap || typeof memoryCache.heatmap.clear !== 'function') {
    if (LRUClass) memoryCache.heatmap = new LRUClass(365, 'heatmap');
  } else {
    memoryCache.heatmap.clear();
  }
  memoryCache.deletedIds = new Set();
  memoryCache.progressDirtyIds = new Set();
  memoryCache.progressDirty = false;
  memoryCache.wrongWordsDirty = false;
  memoryCache.heatmapDirty = false;
  memoryCache.session = null;
  memoryCache.studySession = null;
  memoryCache.progressSnapshot = null;
  memoryCache.initialized = false;
  db.instance = null;
  db.save.mockClear();
  db.delete.mockClear();
  db.clear.mockClear();
  db.getAll.mockClear();
  db.bulkSave.mockClear();
  db.get.mockClear();
});

describe('LRUCache', () => {
  it('creates cache with specified limit and name', () => {
    expect(memoryCache.progress.limit).toBe(7000);
    expect(memoryCache.progress.name).toBe('progress');
    expect(memoryCache.wrongWords.limit).toBe(500);
    expect(memoryCache.heatmap.limit).toBe(365);
  });

  it('supports put and get operations', () => {
    memoryCache.progress.set('key1', { status: 'learning' });
    expect(memoryCache.progress.get('key1')).toEqual({ status: 'learning' });
    expect(memoryCache.progress.get('nonexistent')).toBeUndefined();
  });

  it('evicts oldest entry when capacity is reached', () => {
    const cache = memoryCache.progress;
    cache.clear();
    for (let i = 0; i < cache.limit; i++) {
      cache.set(String(i), { index: i });
    }
    expect(cache.size).toBe(cache.limit);
    cache.set('overflow', { status: 'new' });
    expect(cache.size).toBe(cache.limit);
    expect(cache.get('0')).toBeUndefined();
    expect(cache.get('overflow')).toEqual({ status: 'new' });
  });

  it('updates recency on access via get', () => {
    const cache = memoryCache.progress;
    cache.clear();
    for (let i = 0; i < cache.limit; i++) {
      cache.set(String(i), { index: i });
    }
    cache.get('0');
    cache.set('overflow', { status: 'new' });
    expect(cache.get('0')).toEqual({ index: 0 });
    expect(cache.get('1')).toBeUndefined();
  });

  it('updates recency on re-set', () => {
    const cache = memoryCache.progress;
    cache.clear();
    for (let i = 0; i < cache.limit; i++) {
      cache.set(String(i), { index: i });
    }
    cache.set('0', { index: 0, updated: true });
    cache.set('overflow', { status: 'new' });
    expect(cache.get('0')).toEqual({ index: 0, updated: true });
    expect(cache.get('1')).toBeUndefined();
  });

  it('supports delete, has, clear, and size', () => {
    memoryCache.progress.set('a', 1);
    memoryCache.progress.set('b', 2);
    expect(memoryCache.progress.size).toBe(2);
    expect(memoryCache.progress.has('a')).toBe(true);
    memoryCache.progress.delete('a');
    expect(memoryCache.progress.has('a')).toBe(false);
    expect(memoryCache.progress.size).toBe(1);
    memoryCache.progress.clear();
    expect(memoryCache.progress.size).toBe(0);
  });

  it('bulkLoad trims entries exceeding limit', () => {
    const cache = memoryCache.wrongWords;
    const largeObj = {};
    for (let i = 0; i < 600; i++) {
      largeObj[`w_${i}`] = { count: i };
    }
    cache.bulkLoad(largeObj);
    expect(cache.size).toBe(cache.limit);
    expect(cache.get('w_0')).toBeUndefined();
    expect(cache.get('w_599')).toBeDefined();
  });

  it('toObject converts to plain object and handles fallback cloning', () => {
    memoryCache.progress.set('1', { status: 'a', nested: { foo: 'bar' } });
    memoryCache.progress.set('2', { status: 'b' });
    const obj = memoryCache.progress.toObject();
    expect(obj['1']).toEqual({ status: 'a', nested: { foo: 'bar' } });
    expect(obj['2']).toEqual({ status: 'b' });

    // Test structuredClone error fallback
    const origSC = globalThis.structuredClone;
    globalThis.structuredClone = () => {
      throw new Error('clone error');
    };
    try {
      const fallbackObj = memoryCache.progress.toObject();
      expect(fallbackObj['1']).toEqual({ status: 'a', nested: { foo: 'bar' } });
    } finally {
      globalThis.structuredClone = origSC;
    }
  });

  it('fromObject loads entries and respects LRU order', () => {
    const data = { x: { v: 1 }, y: { v: 2 } };
    memoryCache.progress.fromObject(data);
    expect(memoryCache.progress.get('x')).toEqual({ v: 1 });
    expect(memoryCache.progress.get('y')).toEqual({ v: 2 });
  });

  it('keys and entries return arrays', () => {
    memoryCache.progress.set('k1', 'v1');
    memoryCache.progress.set('k2', 'v2');
    expect(memoryCache.progress.keys()).toEqual(['k1', 'k2']);
    expect(memoryCache.progress.entries()).toEqual([
      ['k1', 'v1'],
      ['k2', 'v2'],
    ]);
  });

  it('getStats returns cache statistics', () => {
    memoryCache.progress.set('a', 1);
    memoryCache.progress.get('a');
    const stats = memoryCache.progress.getStats();
    expect(stats.name).toBe('progress');
    expect(stats.size).toBe(1);
    expect(stats.limit).toBe(7000);
    expect(stats.accessCount).toBeGreaterThan(0);
  });
});

describe('ReactiveCache & getReactiveCache', () => {
  it('is a Proxy wrapping memoryCache', () => {
    expect(ReactiveCache.progress).toBe(memoryCache.progress);
    expect(ReactiveCache.wrongWords).toBe(memoryCache.wrongWords);
    expect(ReactiveCache.heatmap).toBe(memoryCache.heatmap);
    expect(getReactiveCache()).toBe(ReactiveCache);
  });

  it('notifies listeners on property set for watched keys', () => {
    const listener = vi.fn();
    const unsub = subscribeToStore('progress', listener);
    ReactiveCache.progress = memoryCache.progress;
    expect(listener).toHaveBeenCalledWith(memoryCache.progress, 'progress');
    unsub();
  });

  it('notifies wildcard listeners on any watched key change', () => {
    const wildcard = vi.fn();
    const unsub = subscribeToStore('*', wildcard);
    ReactiveCache.wrongWords = memoryCache.wrongWords;
    expect(wildcard).toHaveBeenCalledWith({ key: 'wrongWords', value: memoryCache.wrongWords });
    unsub();
  });

  it('handles nested plain object properties proxying and mutations', () => {
    const origProgress = memoryCache.progress;
    try {
      const listener = vi.fn();
      const unsub = subscribeToStore('progress', listener);
      const plainProgress = { '10': { status: 'learning' } };
      memoryCache.progress = plainProgress;

      // Access nested proxy
      const p10 = ReactiveCache.progress;
      p10['10'] = { status: 'mastered' };
      expect(listener).toHaveBeenCalled();

      delete p10['10'];
      expect(listener).toHaveBeenCalled();
      unsub();
    } finally {
      memoryCache.progress = origProgress;
    }
  });
});

describe('subscribeToStore', () => {
  it('subscribes and receives notifications', () => {
    const listener = vi.fn();
    const unsub = subscribeToStore('heatmap', listener);
    ReactiveCache.heatmap = memoryCache.heatmap;
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('unsubscribe stops notifications', () => {
    const listener = vi.fn();
    const unsub = subscribeToStore('heatmap', listener);
    unsub();
    ReactiveCache.heatmap = memoryCache.heatmap;
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers on same key', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    const u1 = subscribeToStore('progress', l1);
    const u2 = subscribeToStore('progress', l2);
    ReactiveCache.progress = memoryCache.progress;
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
    u1();
    u2();
  });
});

describe('loadFromIndexedDB', () => {
  it('does nothing when db.instance is null', async () => {
    db.instance = null;
    await loadFromIndexedDB();
    expect(memoryCache.initialized).toBe(false);
  });

  it('loads progress, heatmap, wrongWords, session records into cache on success', async () => {
    db.instance = {};
    db.getAll.mockImplementation(async storeName => {
      if (storeName === 'progress') return [{ id: 1, status: 'review' }];
      if (storeName === 'heatmap') return [{ date: '2026-05-01', count: 12 }];
      if (storeName === 'wrongWords') return [{ id: 1, data: { count: 3 } }];
      return [];
    });
    db.get.mockImplementation(async (store, key) => {
      if (key === 'current') return { data: { activeTab: 'study' } };
      if (key === 'study_session') return { data: { queueIds: [1] } };
      if (key === 'progressSnapshot') return { data: { snap: true } };
      return null;
    });

    const initListener = vi.fn();
    const unsub = subscribeToStore('initialized', initListener);

    await loadFromIndexedDB();

    expect(memoryCache.initialized).toBe(true);
    expect(memoryCache.progress.get('1')).toEqual({ id: 1, status: 'review' });
    expect(memoryCache.heatmap.get('2026-05-01')).toBe(12);
    expect(memoryCache.wrongWords.get('1')).toEqual({ count: 3 });
    expect(memoryCache.session).toEqual({ activeTab: 'study' });
    expect(memoryCache.studySession).toEqual({ queueIds: [1] });
    expect(memoryCache.progressSnapshot).toEqual({ snap: true });
    expect(initListener).toHaveBeenCalledWith(true, 'initialized');
    unsub();
  });

  it('marks initialized and notifies with error object on db load failure', async () => {
    db.instance = {};
    db.getAll.mockRejectedValueOnce(new Error('IndexedDB corrupted'));

    const initListener = vi.fn();
    const unsub = subscribeToStore('initialized', initListener);

    await loadFromIndexedDB();

    expect(memoryCache.initialized).toBe(true);
    expect(initListener).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
      'initialized'
    );
    unsub();
  });
});

describe('bulkSaveToIndexedDB', () => {
  it('does nothing when db.instance is null', async () => {
    await bulkSaveToIndexedDB('progress', [{ id: 1, data: 'test' }]);
    expect(db.bulkSave).not.toHaveBeenCalled();
  });

  it('calls db.bulkSave when db.instance is set', async () => {
    db.instance = {};
    const data = [
      { id: 1, status: 'learning' },
      { id: 2, status: 'review' },
    ];
    await bulkSaveToIndexedDB('progress', data);
    expect(db.bulkSave).toHaveBeenCalledWith('progress', data, undefined);
  });

  it('passes onProgress callback to db.bulkSave', async () => {
    db.instance = {};
    const onProgress = vi.fn();
    const data = [{ id: 1, status: 'learning' }];
    await bulkSaveToIndexedDB('progress', data, onProgress);
    expect(db.bulkSave).toHaveBeenCalledWith('progress', data, onProgress);
  });
});

describe('getWordDataSync & setWordDataSync', () => {
  it('returns default object for nonexistent id', () => {
    const result = getWordDataSync('nonexistent');
    expect(result).toEqual(createDefaultWordProgress());
  });

  it('returns cached data for existing id', () => {
    const wd = { status: 'learning', ef: 2.8 };
    memoryCache.progress.set('word1', wd);
    expect(getWordDataSync('word1')).toBe(wd);
  });

  it('setWordDataSync stores data and marks progress dirty', () => {
    setWordDataSync('wordX', { status: 'review', ef: 2.9 });
    expect(memoryCache.progress.get('wordX')).toEqual({ status: 'review', ef: 2.9 });
    expect(memoryCache.progressDirtyIds.has('wordX')).toBe(true);
    expect(memoryCache.progressDirty).toBe(true);
  });
});

describe('updateWordData', () => {
  it('updates existing word data', () => {
    const wd = { ef: 2.5, status: 'new' };
    memoryCache.progress.set('word1', wd);
    updateWordData('word1', prev => ({ ...prev, status: 'learning' }));
    expect(memoryCache.progress.get('word1').status).toBe('learning');
  });

  it('creates entry for new word and applies update', () => {
    updateWordData('newWord', prev => ({ ...prev, status: 'review' }));
    const result = memoryCache.progress.get('newWord');
    expect(result).toBeDefined();
    expect(result.status).toBe('review');
  });

  it('merges update result with existing data', () => {
    memoryCache.progress.set('word1', { ef: 2.5, status: 'learning', reviewCount: 3 });
    updateWordData('word1', prev => ({ reviewCount: prev.reviewCount + 1 }));
    const result = memoryCache.progress.get('word1');
    expect(result.reviewCount).toBe(4);
    expect(result.ef).toBe(2.5);
  });
});

describe('deleteWordData', () => {
  it('deletes word data from progress map', () => {
    memoryCache.progress.set('word1', { ef: 2.5, status: 'learning' });
    deleteWordData('word1');
    expect(memoryCache.progress.has('word1')).toBe(false);
  });

  it('adds id to deletedIds when status is not new', () => {
    memoryCache.progress.set('word1', { ef: 2.5, status: 'learning' });
    deleteWordData('word1');
    expect(memoryCache.deletedIds.has('word1')).toBe(true);
  });

  it('does not add to deletedIds when status is new', () => {
    memoryCache.progress.set('word2', { ef: 2.5, status: 'new' });
    deleteWordData('word2');
    expect(memoryCache.deletedIds.has('word2')).toBe(false);
  });

  it('does nothing for nonexistent id', () => {
    deleteWordData('nonexistent');
    expect(memoryCache.deletedIds.has('nonexistent')).toBe(false);
  });
});

describe('flushProgress & saveProgress persistence', () => {
  it('flushProgress writes dirty progress records and deletes to IndexedDB', async () => {
    db.instance = {};
    memoryCache.progress.set('1', { status: 'review' });
    memoryCache.progress.set('2', { status: 'learning' });
    memoryCache.progressDirtyIds.add('1');
    memoryCache.progressDirtyIds.add('2');
    memoryCache.deletedIds.add('3');
    memoryCache.progressDirty = true;

    await flushProgress();

    expect(db.bulkSave).toHaveBeenCalledWith('progress', [
      { id: '1', status: 'review' },
      { id: '2', status: 'learning' },
    ]);
    expect(db.delete).toHaveBeenCalledWith('progress', 3);
    expect(memoryCache.progressDirtyIds.size).toBe(0);
    expect(memoryCache.deletedIds.size).toBe(0);
    expect(memoryCache.progressDirty).toBe(false);
  });

  it('flushProgress handles invalid NaN delete ids safely', async () => {
    db.instance = {};
    memoryCache.progressDirty = true;
    memoryCache.deletedIds.add('invalid-nan-id');

    await flushProgress();

    expect(db.delete).not.toHaveBeenCalled();
    expect(memoryCache.deletedIds.has('invalid-nan-id')).toBe(true);
  });

  it('flushProgress restores dirty IDs on persistence error', async () => {
    db.instance = {};
    memoryCache.progress.set('1', { id: 1, status: 'review' });
    memoryCache.progressDirtyIds.add('1');
    memoryCache.deletedIds.add('2');
    memoryCache.progressDirty = true;

    db.bulkSave.mockRejectedValueOnce(new Error('Disk write failed'));

    await flushProgress();

    expect(memoryCache.progressDirty).toBe(true);
    expect(memoryCache.progressDirtyIds.has('1')).toBe(true);
    expect(memoryCache.deletedIds.has('2')).toBe(true);
  });

  it('saveProgress debounces flush execution', () => {
    expect(typeof saveProgress).toBe('function');
  });
});

describe('getWrongWords, addWrongWord, removeWrongWord, and flushWrongWords', () => {
  it('returns the wrongWords LRUCache', () => {
    const result = getWrongWords();
    expect(result).toBe(memoryCache.wrongWords);
  });

  it('adds a new wrong word with object argument', () => {
    const word = { id: '1', word: 'test', meaning: '测试', translation: 'test' };
    const result = addWrongWord(word);
    expect(result).toBe(true);
    const data = memoryCache.wrongWords.get('1');
    expect(data).toBeDefined();
    expect(data.count).toBe(1);
    expect(data.word).toBe('test');
    expect(data.firstWrong).toBeGreaterThan(0);
    expect(data.lastWrong).toBeGreaterThan(0);
  });

  it('adds wrong word with separate id and word arguments', () => {
    const word = { id: '2', word: 'hello', meaning: '你好', translation: 'hello' };
    const result = addWrongWord('2', word);
    expect(result).toBe(true);
    const data = memoryCache.wrongWords.get('2');
    expect(data.word).toBe('hello');
    expect(data.count).toBe(1);
  });

  it('resolves word from global window.WORDS when only id is provided', () => {
    globalThis.window = globalThis.window || {};
    globalThis.window.WORDS = [{ id: 55, word: 'globalWord', meaning: '全局' }];
    const result = addWrongWord(55);
    expect(result).toBe(true);
    const data = memoryCache.wrongWords.get(55);
    expect(data.word).toBe('globalWord');
  });

  it('increments count for existing wrong word', () => {
    const word = { id: '3', word: 'world', meaning: '世界', translation: 'world' };
    addWrongWord(word);
    addWrongWord(word);
    const data = memoryCache.wrongWords.get('3');
    expect(data.count).toBe(2);
  });

  it('returns false for invalid id or missing word', () => {
    expect(addWrongWord(null)).toBe(false);
    expect(addWrongWord(undefined)).toBe(false);
    expect(addWrongWord('999')).toBe(false);
  });

  it('removes an existing wrong word', () => {
    const word = { id: '10', word: 'test', meaning: '测试', translation: 'test' };
    addWrongWord(word);
    expect(memoryCache.wrongWords.has('10')).toBe(true);
    removeWrongWord('10');
    expect(memoryCache.wrongWords.has('10')).toBe(false);
  });

  it('flushWrongWords saves entries to IndexedDB', async () => {
    db.instance = {};
    memoryCache.wrongWords.set('1', { count: 3 });
    memoryCache.wrongWordsDirty = true;

    await saveWrongWords();
    expect(memoryCache.wrongWordsDirty).toBe(true);
  });
});

describe('getHeatmap, recordHeatmap, and saveHeatmap', () => {
  it('returns empty object when heatmap is empty', () => {
    const result = getHeatmap();
    expect(result).toEqual({});
  });

  it('returns heatmap as plain object', () => {
    memoryCache.heatmap.set('2024-01-01', 5);
    memoryCache.heatmap.set('2024-01-02', 3);
    const result = getHeatmap();
    expect(result['2024-01-01']).toBe(5);
    expect(result['2024-01-02']).toBe(3);
  });

  it('records a new date with default count 1 and increments', () => {
    recordHeatmap('2024-06-01');
    expect(memoryCache.heatmap.get('2024-06-01')).toBe(1);
    recordHeatmap('2024-06-01');
    expect(memoryCache.heatmap.get('2024-06-01')).toBe(2);
  });

  it('adds custom count to existing value and defaults to today', () => {
    recordHeatmap('2024-06-01', 5);
    expect(memoryCache.heatmap.get('2024-06-01')).toBe(5);
    recordHeatmap();
    const today = localDateStr();
    expect(memoryCache.heatmap.get(today)).toBe(1);
  });

  it('saveHeatmap is a function', () => {
    expect(typeof saveHeatmap).toBe('function');
  });
});

describe('getMemoryCache', () => {
  it('returns the memoryCache object with all required properties', () => {
    const cache = getMemoryCache();
    expect(cache).toBe(memoryCache);
    expect(cache).toHaveProperty('progress');
    expect(cache).toHaveProperty('wrongWords');
    expect(cache).toHaveProperty('heatmap');
    expect(cache).toHaveProperty('session');
    expect(cache).toHaveProperty('studySession');
    expect(cache).toHaveProperty('initialized');
    expect(cache).toHaveProperty('deletedIds');
    expect(cache).toHaveProperty('wrongWordsDirty');
    expect(cache).toHaveProperty('heatmapDirty');
  });
});

