import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { IndexedDB } from '../js/db.js';

function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

const STORES = ['progress', 'words', 'wrongWords', 'heatmap', 'session', 'actionStack', 'meta_store'];

describe('IndexedDB', () => {
  let db;

  beforeAll(async () => {
    await deleteDatabase('CET46_DB');
    db = new IndexedDB();
    await db.init();
  });

  afterAll(async () => {
    if (db && db.instance) {
      db.instance.close();
      db.instance = null;
    }
    await deleteDatabase('CET46_DB');
  });

  beforeEach(async () => {
    for (const store of STORES) {
      await db.clear(store);
    }
  });

  describe('init()', () => {
    it('should have instance after init', () => {
      expect(db.instance).not.toBeNull();
      expect(db.instance).toBeDefined();
    });

    it('should create all required object stores', () => {
      const storeNames = Array.from(db.instance.objectStoreNames);
      expect(storeNames).toContain('progress');
      expect(storeNames).toContain('words');
      expect(storeNames).toContain('wrongWords');
      expect(storeNames).toContain('heatmap');
      expect(storeNames).toContain('session');
      expect(storeNames).toContain('actionStack');
      expect(storeNames).toContain('meta_store');
    });

    it('should create nextReviewDate index on progress store', () => {
      const tx = db.instance.transaction('progress', 'readonly');
      const store = tx.objectStore('progress');
      expect(store.indexNames.contains('nextReviewDate')).toBe(true);
    });
  });

  describe('save() and get()', () => {
    it('should save data and retrieve it', async () => {
      const data = { id: 'word1', word: 'hello', meaning: '你好' };
      await db.save('words', data);
      const result = await db.get('words', 'word1');
      expect(result).toEqual(data);
    });

    it('should return true on successful save', async () => {
      const data = { id: 'word2', word: 'world', meaning: '世界' };
      const result = await db.save('words', data);
      expect(result).toBe(true);
    });

    it('should return undefined for non-existent key', async () => {
      const result = await db.get('words', 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should update existing data with same key', async () => {
      await db.save('words', { id: 'w1', word: 'old' });
      await db.save('words', { id: 'w1', word: 'new' });
      const result = await db.get('words', 'w1');
      expect(result.word).toBe('new');
    });

    it('should reject with error when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.save('words', { id: 'x' })).rejects.toThrow('DB未初始化');
    });

    it('should reject when get is called on uninitialized db', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.get('words', 'x')).rejects.toThrow('DB未初始化');
    });

    it('should save to different stores independently', async () => {
      await db.save('words', { id: 'w1', word: 'test' });
      await db.save('progress', { id: 'w1', nextReviewDate: 1000 });
      const word = await db.get('words', 'w1');
      const progress = await db.get('progress', 'w1');
      expect(word.word).toBe('test');
      expect(progress.nextReviewDate).toBe(1000);
    });
  });

  describe('getAll()', () => {
    it('should return empty array for empty store', async () => {
      const result = await db.getAll('words');
      expect(result).toEqual([]);
    });

    it('should return all saved items', async () => {
      await db.save('words', { id: '1', word: 'a' });
      await db.save('words', { id: '2', word: 'b' });
      await db.save('words', { id: '3', word: 'c' });
      const result = await db.getAll('words');
      expect(result).toHaveLength(3);
    });

    it('should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.getAll('words')).rejects.toThrow('DB未初始化');
    });
  });

  describe('delete()', () => {
    it('should delete a record by id', async () => {
      await db.save('words', { id: 'del1', word: 'bye' });
      await db.delete('words', 'del1');
      const result = await db.get('words', 'del1');
      expect(result).toBeUndefined();
    });

    it('should resolve without error when deleting non-existent id', async () => {
      await expect(db.delete('words', 'ghost')).resolves.toBeUndefined();
    });

    it('should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.delete('words', 'x')).rejects.toThrow('DB未初始化');
    });

    it('should only delete the targeted item', async () => {
      await db.save('words', { id: 'keep', word: 'stay' });
      await db.save('words', { id: 'remove', word: 'go' });
      await db.delete('words', 'remove');
      const kept = await db.get('words', 'keep');
      const removed = await db.get('words', 'remove');
      expect(kept.word).toBe('stay');
      expect(removed).toBeUndefined();
    });
  });

  describe('clear()', () => {
    it('should clear all records in a store', async () => {
      await db.save('words', { id: '1', word: 'a' });
      await db.save('words', { id: '2', word: 'b' });
      await db.clear('words');
      const result = await db.getAll('words');
      expect(result).toEqual([]);
    });

    it('should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.clear('words')).rejects.toThrow('DB未初始化');
    });

    it('should only clear the targeted store', async () => {
      await db.save('words', { id: '1', word: 'a' });
      await db.save('progress', { id: '1', nextReviewDate: 0 });
      await db.clear('words');
      const words = await db.getAll('words');
      const progress = await db.getAll('progress');
      expect(words).toEqual([]);
      expect(progress).toHaveLength(1);
    });
  });

  describe('count()', () => {
    it('should return 0 for empty store', async () => {
      const count = await db.count('words');
      expect(count).toBe(0);
    });

    it('should return correct count after saves', async () => {
      await db.save('words', { id: '1', word: 'a' });
      await db.save('words', { id: '2', word: 'b' });
      await db.save('words', { id: '3', word: 'c' });
      const count = await db.count('words');
      expect(count).toBe(3);
    });

    it('should throw when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.count('words')).rejects.toThrow('DB未初始化');
    });

    it('should reflect count after deletions', async () => {
      await db.save('words', { id: '1', word: 'a' });
      await db.save('words', { id: '2', word: 'b' });
      await db.delete('words', '1');
      const count = await db.count('words');
      expect(count).toBe(1);
    });
  });

  describe('bulkSave()', () => {
    it('should save multiple items', async () => {
      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push({ id: `bulk${i}`, word: `word${i}` });
      }
      await db.bulkSave('words', items);
      const count = await db.count('words');
      expect(count).toBe(10);
    });

    it('should save items in chunks of 500', async () => {
      const items = [];
      for (let i = 0; i < 600; i++) {
        items.push({ id: `chunk${i}`, word: `w${i}` });
      }
      await db.bulkSave('words', items);
      const count = await db.count('words');
      expect(count).toBe(600);
    });

    it('should call onProgress callback', async () => {
      const items = [];
      for (let i = 0; i < 600; i++) {
        items.push({ id: `prog${i}`, word: `w${i}` });
      }
      const onProgress = vi.fn();
      await db.bulkSave('words', items, onProgress);
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenLastCalledWith(100);
    });

    it('should throw when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.bulkSave('words', [{ id: 'x' }])).rejects.toThrow('数据库未就绪');
    });

    it('should handle empty array', async () => {
      await db.bulkSave('words', []);
      const count = await db.count('words');
      expect(count).toBe(0);
    });
  });

  describe('bulkGet()', () => {
    it('should retrieve multiple items by keys', async () => {
      await db.save('words', { id: 'k1', word: 'alpha' });
      await db.save('words', { id: 'k2', word: 'beta' });
      await db.save('words', { id: 'k3', word: 'gamma' });
      const results = await db.bulkGet('words', ['k1', 'k3']);
      expect(results).toHaveLength(2);
      expect(results[0].word).toBe('alpha');
      expect(results[1].word).toBe('gamma');
    });

    it('should return undefined for missing keys', async () => {
      await db.save('words', { id: 'exists', word: 'hi' });
      const results = await db.bulkGet('words', ['exists', 'missing']);
      expect(results[0].word).toBe('hi');
      expect(results[1]).toBeUndefined();
    });

    it('should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.bulkGet('words', ['k1'])).rejects.toThrow('DB未初始化');
    });
  });

  describe('getByIndex()', () => {
    it('should query by index', async () => {
      await db.save('progress', { id: 'p1', nextReviewDate: 1000 });
      await db.save('progress', { id: 'p2', nextReviewDate: 2000 });
      await db.save('progress', { id: 'p3', nextReviewDate: 1000 });
      const results = await db.getByIndex('progress', 'nextReviewDate', 1000);
      expect(results).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      await db.save('progress', { id: 'p1', nextReviewDate: 1000 });
      const results = await db.getByIndex('progress', 'nextReviewDate', 9999);
      expect(results).toEqual([]);
    });

    it('should return empty array when db not initialized', async () => {
      const freshDb = new IndexedDB();
      const result = await freshDb.getByIndex('progress', 'nextReviewDate', 1000);
      expect(result).toEqual([]);
    });
  });

  describe('saveSerializedBKTree() and getSerializedBKTree()', () => {
    it('should save and retrieve BK tree data', async () => {
      const data = { nodes: [1, 2, 3], root: 1 };
      await db.saveSerializedBKTree(data);
      const result = await db.getSerializedBKTree();
      expect(result).toEqual(data);
    });

    it('should return null when no BK tree data exists', async () => {
      const result = await db.getSerializedBKTree();
      expect(result).toBeNull();
    });

    it('should return null for expired BK tree cache (older than 24h)', async () => {
      const data = { nodes: [1], root: 1 };
      const storeName = 'meta_store';
      const tx = db.instance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put({ key: 'bktree_cache', data, timestamp: Date.now() - 25 * 60 * 60 * 1000 });
      await new Promise(resolve => { tx.oncomplete = resolve; });

      const result = await db.getSerializedBKTree();
      expect(result).toBeNull();
    });

    it('should reject saveSerializedBKTree when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.saveSerializedBKTree({})).rejects.toThrow('数据库未初始化');
    });

    it('should return null from getSerializedBKTree when db not initialized', async () => {
      const freshDb = new IndexedDB();
      const result = await freshDb.getSerializedBKTree();
      expect(result).toBeNull();
    });
  });

  describe('close()', () => {
    it('should not throw when called on uninitialized db', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.close()).resolves.toBeUndefined();
      expect(freshDb.instance).toBeNull();
    });
  });

  describe('uninitialized state', () => {
    it('get should reject with DB未初始化', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.get('words', 'x')).rejects.toThrow('DB未初始化');
    });

    it('save should reject with DB未初始化', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.save('words', { id: 'x' })).rejects.toThrow('DB未初始化');
    });

    it('getAll should reject with DB未初始化', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.getAll('words')).rejects.toThrow('DB未初始化');
    });

    it('delete should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.delete('words', 'x')).rejects.toThrow('DB未初始化');
    });

    it('clear should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.clear('words')).rejects.toThrow('DB未初始化');
    });

    it('count should reject when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.count('words')).rejects.toThrow('DB未初始化');
    });

    it('bulkSave should throw 数据库未就绪', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.bulkSave('words', [{ id: 'x' }])).rejects.toThrow('数据库未就绪');
    });

    it('bulkGet should reject with DB未初始化', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.bulkGet('words', ['x'])).rejects.toThrow('DB未初始化');
    });

    it('getByIndex should return empty array', async () => {
      const freshDb = new IndexedDB();
      expect(await freshDb.getByIndex('progress', 'nextReviewDate', 0)).toEqual([]);
    });

    it('saveSerializedBKTree should reject', async () => {
      const freshDb = new IndexedDB();
      await expect(freshDb.saveSerializedBKTree({})).rejects.toThrow('数据库未初始化');
    });

    it('getSerializedBKTree should return null', async () => {
      const freshDb = new IndexedDB();
      expect(await freshDb.getSerializedBKTree()).toBeNull();
    });
  });

  describe('integration: full workflow', () => {
    it('should support save → get → update → delete lifecycle', async () => {
      await db.save('words', { id: 'life', word: 'life', meaning: '生命' });
      let result = await db.get('words', 'life');
      expect(result.word).toBe('life');

      await db.save('words', { id: 'life', word: 'life', meaning: '生活' });
      result = await db.get('words', 'life');
      expect(result.meaning).toBe('生活');

      await db.delete('words', 'life');
      result = await db.get('words', 'life');
      expect(result).toBeUndefined();
    });

    it('should support bulkSave → count → clear → count workflow', async () => {
      const items = [];
      for (let i = 0; i < 50; i++) {
        items.push({ id: `wf${i}`, word: `word${i}` });
      }
      await db.bulkSave('words', items);
      expect(await db.count('words')).toBe(50);

      await db.clear('words');
      expect(await db.count('words')).toBe(0);
    });

    it('should support heatmap store with date keyPath', async () => {
      await db.save('heatmap', { date: '2024-01-01', count: 5 });
      const result = await db.get('heatmap', '2024-01-01');
      expect(result.count).toBe(5);
    });

    it('should support session store with key keyPath', async () => {
      await db.save('session', { key: 'theme', value: 'dark' });
      const result = await db.get('session', 'theme');
      expect(result.value).toBe('dark');
    });
  });

  describe('streamLoadJSONL()', () => {
    it('throws when db not initialized', async () => {
      const freshDb = new IndexedDB();
      await expect(
        freshDb.streamLoadJSONL('http://example.com/vocab.jsonl', 'words')
      ).rejects.toThrow('数据库未就绪');
    });

    it('streams and parses JSONL content into store with progress', async () => {
      const lines = [
        JSON.stringify({ id: 1, word: 'apple', phonetic: '/æpl/', meaning: '苹果', example: 'An apple a day', level: 'CET4' }),
        JSON.stringify({ id: 2, word: 'banana', phonetic: '/bəˈnænə/', meaning: '香蕉', level: 'CET4' }),
        '{"invalid json line',
        JSON.stringify({ id: 3, word: 'cherry', meaning: '樱桃' }),
      ].join('\n') + '\n' + JSON.stringify({ id: 4, word: 'date', meaning: '枣' });

      const encoder = new TextEncoder();
      const chunks = [encoder.encode(lines.slice(0, 50)), encoder.encode(lines.slice(50))];
      let chunkIdx = 0;

      const mockReader = {
        read: vi.fn(async () => {
          if (chunkIdx < chunks.length) {
            return { done: false, value: chunks[chunkIdx++] };
          }
          return { done: true, value: undefined };
        }),
        cancel: vi.fn(async () => {}),
      };

      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      }));

      try {
        const progressCb = vi.fn();
        const total = await db.streamLoadJSONL('http://example.com/vocab.jsonl', 'words', progressCb);

        expect(total).toBe(4);
        const savedWords = await db.getAll('words');
        expect(savedWords.length).toBe(4);
        expect(savedWords.find(w => w.word === 'apple')).toBeDefined();
        expect(savedWords.find(w => w.word === 'date')).toBeDefined();
        expect(mockReader.cancel).toHaveBeenCalled();
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it('handles HTTP error responses in streamLoadJSONL', async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => ({
        ok: false,
        status: 404,
      }));

      try {
        await expect(
          db.streamLoadJSONL('http://example.com/missing.jsonl', 'words')
        ).rejects.toThrow('HTTP 404');
      } finally {
        globalThis.fetch = origFetch;
      }
    });

    it('handles missing response body in streamLoadJSONL', async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => ({
        ok: true,
        status: 200,
        body: null,
      }));

      try {
        await expect(
          db.streamLoadJSONL('http://example.com/nobody.jsonl', 'words')
        ).rejects.toThrow('ReadableStream 不支持');
      } finally {
        globalThis.fetch = origFetch;
      }
    });
  });
});

