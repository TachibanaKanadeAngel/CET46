import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCacheData,
  getCacheEntries,
  setCacheValue,
  getCacheValue,
  generateVectorClock,
  mergePropertyAware,
  ConflictError,
  getBaseValue,
  saveSyncBase,
  generateBackupData,
  mergeLocalAndCloud,
} from '../js/services/sync-core.js';

describe('getCacheData', () => {
  it('returns empty object for null cache', () => {
    expect(getCacheData(null)).toEqual({});
  });

  it('returns empty object for undefined cache', () => {
    expect(getCacheData(undefined)).toEqual({});
  });

  it('returns toObject result when cache has toObject method', () => {
    const cache = {
      toObject: () => ({ a: 1, b: 2 })
    };
    expect(getCacheData(cache)).toEqual({ a: 1, b: 2 });
  });

  it('returns spread copy when cache has no toObject method', () => {
    const cache = { a: 1, b: 2 };
    const result = getCacheData(cache);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(cache);
  });
});

describe('getCacheEntries', () => {
  it('returns empty array for null cache', () => {
    expect(getCacheEntries(null)).toEqual([]);
  });

  it('returns empty array for undefined cache', () => {
    expect(getCacheEntries(undefined)).toEqual([]);
  });

  it('returns entries() result when cache has entries method', () => {
    const cache = {
      entries: () => [['a', 1], ['b', 2]]
    };
    expect(getCacheEntries(cache)).toEqual([['a', 1], ['b', 2]]);
  });

  it('returns Object.entries when cache has no entries method', () => {
    const cache = { a: 1, b: 2 };
    const result = getCacheEntries(cache);
    expect(result).toEqual([['a', 1], ['b', 2]]);
  });
});

describe('setCacheValue', () => {
  it('does nothing for null cache', () => {
    expect(() => setCacheValue(null, 'key', 'val')).not.toThrow();
  });

  it('uses cache.set when cache has get and set methods', () => {
    const set = vi.fn();
    const cache = { set, get: () => {} };
    setCacheValue(cache, 'key', 'val');
    expect(set).toHaveBeenCalledWith('key', 'val');
  });

  it('falls back to property assignment when no set/get methods', () => {
    const cache = {};
    setCacheValue(cache, 'key', 'val');
    expect(cache.key).toBe('val');
  });
});

describe('getCacheValue', () => {
  it('returns undefined for null cache', () => {
    expect(getCacheValue(null, 'key')).toBeUndefined();
  });

  it('returns undefined for undefined cache', () => {
    expect(getCacheValue(undefined, 'key')).toBeUndefined();
  });

  it('uses cache.get when available', () => {
    const cache = {
      get: (key) => key === 'a' ? 42 : undefined
    };
    expect(getCacheValue(cache, 'a')).toBe(42);
    expect(getCacheValue(cache, 'b')).toBeUndefined();
  });

  it('falls back to property access when no get method', () => {
    const cache = { a: 100 };
    expect(getCacheValue(cache, 'a')).toBe(100);
    expect(getCacheValue(cache, 'b')).toBeUndefined();
  });
});

describe('generateVectorClock', () => {
  beforeEach(() => {
    localStorage.removeItem('cet46_vector_clock');
  });

  it('creates new clock entry for device', () => {
    const clock = generateVectorClock('device1');
    expect(clock.device1).toBe(1);
  });

  it('increments existing clock entry', () => {
    generateVectorClock('device1');
    const clock = generateVectorClock('device1');
    expect(clock.device1).toBe(2);
  });

  it('maintains separate counters for different devices', () => {
    generateVectorClock('device1');
    generateVectorClock('device2');
    const clock = generateVectorClock('device1');
    expect(clock.device1).toBe(2);
    expect(clock.device2).toBe(1);
  });

  it('persists clock to localStorage', () => {
    generateVectorClock('device1');
    const stored = JSON.parse(localStorage.getItem('cet46_vector_clock'));
    expect(stored.device1).toBe(1);
  });

  it('returns a copy of the clock', () => {
    const clock1 = generateVectorClock('device1');
    clock1.device1 = 999;
    const clock2 = generateVectorClock('device1');
    expect(clock2.device1).toBe(2);
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('cet46_vector_clock', 'not-json');
    const clock = generateVectorClock('device1');
    expect(clock.device1).toBe(1);
  });
});

describe('mergePropertyAware', () => {
  it('merges using local as base when local has higher weight', () => {
    const local = { reviewCount: 10, level: 5, mnemonic: '', wrongCount: 2 };
    const cloud = { reviewCount: 3, level: 1, mnemonic: '', wrongCount: 1 };
    const result = mergePropertyAware(local, cloud);
    expect(result.reviewCount).toBe(10);
    expect(result.level).toBe(5);
  });

  it('merges using cloud as base when cloud has higher weight', () => {
    const local = { reviewCount: 1, level: 0, mnemonic: '', wrongCount: 1 };
    const cloud = { reviewCount: 10, level: 5, mnemonic: '', wrongCount: 3 };
    const result = mergePropertyAware(local, cloud);
    expect(result.reviewCount).toBe(10);
    expect(result.level).toBe(5);
  });

  it('takes max wrongCount from both sides', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: '', wrongCount: 5 };
    const cloud = { reviewCount: 0, level: 0, mnemonic: '', wrongCount: 3 };
    const result = mergePropertyAware(local, cloud);
    expect(result.wrongCount).toBe(5);
  });

  it('uses cloud mnemonic when local has none', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: '', wrongCount: 0 };
    const cloud = { reviewCount: 0, level: 0, mnemonic: 'cloud note', wrongCount: 0 };
    const result = mergePropertyAware(local, cloud);
    expect(result.mnemonic).toBe('cloud note');
  });

  it('uses local mnemonic when cloud has none', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: 'local note', wrongCount: 0 };
    const cloud = { reviewCount: 0, level: 0, mnemonic: '', wrongCount: 0 };
    const result = mergePropertyAware(local, cloud);
    expect(result.mnemonic).toBe('local note');
  });

  it('throws ConflictError when both have different non-empty mnemonics', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: 'local note', wrongCount: 0 };
    const cloud = { reviewCount: 0, level: 0, mnemonic: 'cloud note', wrongCount: 0 };
    expect(() => mergePropertyAware(local, cloud)).toThrow(ConflictError);
  });

  it('ConflictError contains localWd, cloudWd, and field', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: 'local note', wrongCount: 0 };
    const cloud = { reviewCount: 0, level: 0, mnemonic: 'cloud note', wrongCount: 0 };
    try {
      mergePropertyAware(local, cloud);
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictError);
      expect(e.name).toBe('ConflictError');
      expect(e.localWd).toBe(local);
      expect(e.cloudWd).toBe(cloud);
      expect(e.field).toBe('mnemonic');
    }
  });

  it('defaults wrongCount to 0 when not present', () => {
    const local = { reviewCount: 0, level: 0, mnemonic: '' };
    const cloud = { reviewCount: 0, level: 0, mnemonic: '' };
    const result = mergePropertyAware(local, cloud);
    expect(result.wrongCount).toBe(0);
  });

  it('does not throw when mnemonics are identical and non-empty', () => {
    const local = { reviewCount: 5, level: 3, mnemonic: 'same note', wrongCount: 1 };
    const cloud = { reviewCount: 2, level: 1, mnemonic: 'same note', wrongCount: 2 };
    const result = mergePropertyAware(local, cloud);
    expect(result.mnemonic).toBe('same note');
  });

  it('falls back to max nextReview when newer side lacks nextReview', () => {
    const local = { lastStudy: 100, nextReview: 0, reviewCount: 1, mnemonic: '' };
    const cloud = { lastStudy: 100, nextReview: 5000, reviewCount: 3, mnemonic: '' };
    const result = mergePropertyAware(local, cloud);
    expect(result.nextReview).toBe(5000);
  });

  it('merges vector clocks by taking the max version per device', () => {
    const local = { mnemonic: '', vectorClock: { a: 2, b: 1 } };
    const cloud = { mnemonic: '', vectorClock: { a: 1, c: 4 } };
    const result = mergePropertyAware(local, cloud);
    expect(result.vectorClock).toEqual({ a: 2, b: 1, c: 4 });
  });
});

describe('sync base helpers', () => {
  beforeEach(() => {
    localStorage.removeItem('cet46_sync_base');
  });

  it('saveSyncBase persists data for getBaseValue lookups', () => {
    saveSyncBase({
      wrongWords: { 1: { count: 5 } },
      heatmap: { '2026-07-07': 3 },
    });

    expect(getBaseValue('wrongWords', '1', 'count')).toBe(5);
    expect(getBaseValue('heatmap', '2026-07-07')).toBe(3);
    expect(getBaseValue('wrongWords', '404', 'count')).toBe(0);
  });
});

describe('generateBackupData', () => {
  it('falls back to memory cache when IndexedDB read fails', async () => {
    const db = {
      instance: {},
      getAll: vi.fn().mockRejectedValue(new Error('db failed')),
    };
    const memoryCache = {
      progress: { toObject: () => ({ 1: { status: 'review' } }) },
      wrongWords: { toObject: () => ({ 2: { count: 1 } }) },
      heatmap: { toObject: () => ({ '2026-07-07': 5 }) },
      deletedIds: new Set(['9']),
    };

    const backup = await generateBackupData(memoryCache, db);

    expect(backup.progress).toEqual({ 1: { status: 'review' } });
    expect(backup.wrongWords).toEqual({ 2: { count: 1 } });
    expect(backup.heatmap).toEqual({ '2026-07-07': 5 });
    expect(backup.deletedIds).toEqual(['9']);
  });
});

describe('mergeLocalAndCloud', () => {
  it('keeps restudied progress even when deletedIds contains the same id on another device', async () => {
    const merged = await mergeLocalAndCloud(
      {
        progress: {
          1: { status: 'review', lastStudy: 100, reviewCount: 1, mnemonic: '' },
        },
        wrongWords: {},
        heatmap: {},
        deletedIds: [],
      },
      {
        progress: {},
        wrongWords: {},
        heatmap: {},
        deletedIds: ['1'],
      },
      'device-a'
    );

    expect(merged.progress['1']).toEqual(
      expect.objectContaining({ status: 'review', lastStudy: 100 })
    );
    expect(merged.deletedIds).toContain('1');
  });
});

describe('ConflictError', () => {
  it('is an instance of Error', () => {
    const err = new ConflictError('test', {}, {}, 'field');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name ConflictError', () => {
    const err = new ConflictError('test', {}, {}, 'field');
    expect(err.name).toBe('ConflictError');
  });

  it('stores message, localWd, cloudWd, and field', () => {
    const local = { a: 1 };
    const cloud = { b: 2 };
    const err = new ConflictError('conflict msg', local, cloud, 'mnemonic');
    expect(err.message).toBe('conflict msg');
    expect(err.localWd).toBe(local);
    expect(err.cloudWd).toBe(cloud);
    expect(err.field).toBe('mnemonic');
  });
});

describe('getCacheSize', () => {
  it('returns size for null, LRUCache-like, and plain objects', async () => {
    const { getCacheSize } = await import('../js/services/sync-core.js');
    expect(getCacheSize(null)).toBe(0);
    expect(getCacheSize({ size: 42 })).toBe(42);
    expect(getCacheSize({ a: 1, b: 2 })).toBe(2);
  });
});

describe('showConflictModal & mergePropertyAwareInteractive', () => {
  it('resolves cloud when modal element is missing', async () => {
    const { showConflictModal, mergePropertyAwareInteractive } = await import(
      '../js/services/sync-core.js'
    );
    globalThis.document = { getElementById: vi.fn(() => null) };

    const result = await showConflictModal({ word: 'test' }, { word: 'test' }, 'mnemonic');
    expect(result).toBe('cloud');

    const merged = await mergePropertyAwareInteractive(
      { mnemonic: 'local-m' },
      { mnemonic: 'cloud-m' }
    );
    expect(merged.mnemonic).toBe('cloud-m');
  });

  it('resolves user decision when keep-local or use-cloud button is clicked', async () => {
    const { showConflictModal } = await import('../js/services/sync-core.js');

    const modal = {
      classList: { add: vi.fn(), remove: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null),
    };
    const keepBtn = {};
    const cloudBtn = {};
    const wordEl = {};
    const diffEl = {};
    const counterEl = {};

    globalThis.document = {
      getElementById: vi.fn(id => {
        if (id === 'conflict-modal') return modal;
        if (id === 'keep-local') return keepBtn;
        if (id === 'use-cloud') return cloudBtn;
        if (id === 'conflict-word') return wordEl;
        if (id === 'conflict-diff') return diffEl;
        if (id === 'conflict-counter') return counterEl;
        return null;
      }),
    };

    const promiseLocal = showConflictModal(
      { word: 'apple', mnemonic: 'local-m' },
      { word: 'apple', mnemonic: 'cloud-m' },
      'mnemonic'
    );
    keepBtn.onclick();
    expect(await promiseLocal).toBe('local');

    const promiseCloud = showConflictModal(
      { word: 'apple', mnemonic: 'local-m' },
      { word: 'apple', mnemonic: 'cloud-m' },
      'mnemonic'
    );
    cloudBtn.onclick();
    expect(await promiseCloud).toBe('cloud');
  });
});

describe('mergeLocalAndCloud advanced wrongWords and heatmap delta merging', () => {
  it('correctly calculates wrongWords count delta and timestamps', async () => {
    saveSyncBase({
      wrongWords: { 1: { count: 2 } },
      heatmap: { '2026-08-30': 5 },
    });

    const local = {
      progress: {},
      wrongWords: {
        1: { count: 5, firstWrong: 1000, lastWrong: 3000, word: 'test' },
      },
      heatmap: {
        '2026-08-30': 12,
      },
      deletedIds: [],
    };

    const cloud = {
      progress: {},
      wrongWords: {
        1: { count: 4, firstWrong: 1500, lastWrong: 2500, word: 'test' },
      },
      heatmap: {
        '2026-08-30': 8,
      },
      deletedIds: [],
    };

    const merged = await mergeLocalAndCloud(local, cloud, 'dev-1');

    // cloud 4 + (local 5 - base 2) = 7
    expect(merged.wrongWords['1'].count).toBe(7);
    expect(merged.wrongWords['1'].firstWrong).toBe(1000);
    expect(merged.wrongWords['1'].lastWrong).toBe(3000);

    // heatmap: cloud 8 + (local 12 - base 5) = 15
    expect(merged.heatmap['2026-08-30']).toBe(15);
  });
});

