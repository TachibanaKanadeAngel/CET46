import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../js/db.js', () => ({
  db: {
    instance: null,
    save: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([])
  }
}));

import { db } from '../js/db.js';
import { memoryCache } from '../js/store.js';
import {
  migrateSM2ToFSRS,
  getWordData,
  setWordData,
  markWordAsDeleted,
  getWordStatus,
  getData,
  saveData,
  resetProgress,
  migrateData,
  collectReviewLogs,
  invalidateReviewLogsCache,
  pushAction,
  restoreActionStack,
  actionStack,
  SCHEMA_VERSION
} from '../js/core.js';
import { DEFAULT_EF, MIN_EF, MAX_EF, DEFAULT_FSRS_W } from '../js/fsrs.js';
import { CONFIG } from '../js/config.js';

const ACTION_STACK_MAX = CONFIG.MAX_ACTION_STACK;

beforeEach(() => {
  memoryCache.progress.clear();
  memoryCache.wrongWords.clear();
  memoryCache.heatmap.clear();
  memoryCache.deletedIds = new Set();
  memoryCache.session = null;
  memoryCache.studySession = null;
  actionStack.length = 0;
  invalidateReviewLogsCache();
  db.instance = null;
  db.save.mockClear();
  db.delete.mockClear();
  db.clear.mockClear();
  db.getAll.mockClear();
});

afterEach(() => {
  db.instance = null;
});

describe('migrateSM2ToFSRS', () => {
  it('returns null when wd is null', () => {
    expect(migrateSM2ToFSRS(null)).toBeNull();
  });

  it('returns null when wd is undefined', () => {
    expect(migrateSM2ToFSRS(undefined)).toBeNull();
  });

  it('returns wd as-is when stability and difficulty already exist', () => {
    const wd = { stability: 5, difficulty: 3, ef: 2.5 };
    expect(migrateSM2ToFSRS(wd)).toBe(wd);
  });

  it('does not re-migrate when stability=0 and difficulty=0 (!=null check)', () => {
    const wd = { stability: 0, difficulty: 0, ef: 2.5 };
    const result = migrateSM2ToFSRS(wd);
    expect(result).toBe(wd);
    expect(result.stability).toBe(0);
    expect(result.difficulty).toBe(0);
  });

  it('calculates stability from ef when only ef exists', () => {
    const wd = { ef: 2.5 };
    const result = migrateSM2ToFSRS(wd);
    const expectedS = (2.5 - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1;
    expect(result.stability).toBeCloseTo(expectedS, 10);
    expect(result.difficulty).toBe(DEFAULT_FSRS_W[4]);
  });

  it('calculates difficulty from level when only level exists', () => {
    const wd = { level: 5 };
    const result = migrateSM2ToFSRS(wd);
    expect(result.stability).toBe(DEFAULT_FSRS_W[0]);
    expect(result.difficulty).toBe(Math.max(1, 10 - 5));
  });

  it('calculates both s and d when ef and level exist', () => {
    const wd = { ef: 2.5, level: 3 };
    const result = migrateSM2ToFSRS(wd);
    const expectedS = (2.5 - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1;
    const expectedD = Math.max(1, 10 - 3);
    expect(result.stability).toBeCloseTo(expectedS, 10);
    expect(result.difficulty).toBe(expectedD);
  });

  it('uses defaults when neither ef nor level exist', () => {
    const wd = { status: 'learning' };
    const result = migrateSM2ToFSRS(wd);
    expect(result.stability).toBe(DEFAULT_FSRS_W[0]);
    expect(result.difficulty).toBe(DEFAULT_FSRS_W[4]);
  });

  it('clamps difficulty to minimum of 1 when level >= 10', () => {
    const wd = { level: 12 };
    const result = migrateSM2ToFSRS(wd);
    expect(result.difficulty).toBe(1);
  });

  it('preserves original properties in the returned object', () => {
    const wd = { ef: 2.5, status: 'review', reviewCount: 7 };
    const result = migrateSM2ToFSRS(wd);
    expect(result.ef).toBe(2.5);
    expect(result.status).toBe('review');
    expect(result.reviewCount).toBe(7);
    expect(result.stability).toBeDefined();
    expect(result.difficulty).toBeDefined();
  });
});

describe('getWordData', () => {
  it('returns default object when id does not exist', () => {
    const result = getWordData('nonexistent');
    expect(result).toEqual({
      status: 'new',
      level: 0,
      nextReview: 0,
      lastStudy: 0,
      ef: DEFAULT_EF,
      reviewCount: 0,
      difficulty: DEFAULT_FSRS_W[4],
      stability: DEFAULT_FSRS_W[0],
      interval: 0
    });
    expect(memoryCache.progress.get('nonexistent')).toBe(result);
  });

  it('returns existing data directly when already migrated', () => {
    const wd = { stability: 5, difficulty: 3, status: 'learning', ef: 2.5 };
    memoryCache.progress.set('100', wd);
    const result = getWordData('100');
    expect(result).toBe(wd);
  });

  it('migrates and writes back when data is not migrated', () => {
    const wd = { ef: 2.5, level: 3, status: 'learning' };
    memoryCache.progress.set('200', wd);
    const result = getWordData('200');
    expect(result.stability).toBeDefined();
    expect(result.difficulty).toBeDefined();
    expect(result).not.toBe(wd);
    const cached = memoryCache.progress.get('200');
    expect(cached.stability).toBeDefined();
    expect(cached.difficulty).toBeDefined();
  });
});

describe('setWordData', () => {
  it('sets isDirty and mtime on new data', async () => {
    const wd = { status: 'learning', ef: 2.5 };
    const before = Date.now();
    const result = await setWordData('300', wd);
    expect(result.isDirty).toBe(true);
    expect(result.mtime).toBeGreaterThanOrEqual(before);
    expect(result.mtime).toBeLessThanOrEqual(Date.now());
    expect(memoryCache.progress.get('300')).toBe(result);
  });

  it('pushes action with deep-copied previousState when modifying existing data', async () => {
    const original = { status: 'new', ef: 2.5, stability: 5, difficulty: 3 };
    memoryCache.progress.set('400', original);
    const updated = { status: 'learning', ef: 2.6, stability: 5, difficulty: 3 };
    await setWordData('400', updated);
    expect(actionStack.length).toBe(1);
    expect(actionStack[0].wordId).toBe('400');
    expect(actionStack[0].state).toEqual(original);
    expect(actionStack[0].state).not.toBe(original);
  });

  it('does not crash with non-numeric string id', async () => {
    const wd = { status: 'learning', ef: 2.5, stability: 1, difficulty: 5 };
    const result = await setWordData('abc', wd);
    expect(result).toBeDefined();
    expect(result.isDirty).toBeUndefined();
  });

  it('does not crash with non-numeric string id when db.instance is set', async () => {
    db.instance = {};
    const wd = { status: 'learning', ef: 2.5, stability: 1, difficulty: 5 };
    const result = await setWordData('abc', wd);
    expect(result).toBeDefined();
    expect(result.isDirty).toBeUndefined();
    const progressCalls = db.save.mock.calls.filter(c => c[0] === 'progress');
    expect(progressCalls.length).toBe(0);
  });

  it('persists to db when db.instance is set and id is numeric', async () => {
    db.instance = {};
    const wd = { status: 'learning', ef: 2.5, stability: 1, difficulty: 5 };
    await setWordData('500', wd);
    expect(db.save).toHaveBeenCalledWith('progress', expect.objectContaining({
      id: 500,
      status: 'learning'
    }));
  });

  it('invalidates review logs cache', async () => {
    memoryCache.progress.set('600', {
      stability: 5, difficulty: 3, reviewCount: 10, level: 4, lastStudy: Date.now()
    });
    collectReviewLogs(true);
    const wd = { status: 'review', ef: 2.5, stability: 6, difficulty: 4, reviewCount: 10, level: 4, lastStudy: Date.now() };
    await setWordData('600', wd);
    const logs = collectReviewLogs(true);
    const entry = logs.find(l => l.wordId === 600);
    expect(entry).toBeDefined();
    expect(entry.stability).toBe(6);
  });
});

describe('markWordAsDeleted', () => {
  it('marks word as deleted so getWordStatus returns deleted', () => {
    memoryCache.progress.set('500', {
      status: 'learning', ef: 2.5, stability: 5, difficulty: 3
    });
    markWordAsDeleted('500');
    expect(getWordStatus('500')).toBe('deleted');
  });

  it('adds id to deletedIds', () => {
    memoryCache.progress.set('501', {
      status: 'learning', ef: 2.5, stability: 5, difficulty: 3
    });
    markWordAsDeleted('501');
    expect(memoryCache.deletedIds.has('501')).toBe(true);
  });

  it('removes word from progress cache', () => {
    memoryCache.progress.set('502', {
      status: 'learning', ef: 2.5, stability: 5, difficulty: 3
    });
    markWordAsDeleted('502');
    expect(memoryCache.progress.has('502')).toBe(false);
  });

  it('calls db.delete when db.instance is set', () => {
    db.instance = {};
    memoryCache.progress.set('503', {
      status: 'learning', ef: 2.5, stability: 5, difficulty: 3
    });
    markWordAsDeleted('503');
    expect(db.delete).toHaveBeenCalledWith('progress', 503);
  });
});

describe('getWordStatus', () => {
  it('returns "deleted" for deleted words', () => {
    memoryCache.deletedIds.add('600');
    expect(getWordStatus('600')).toBe('deleted');
  });

  it('returns status for existing words', () => {
    memoryCache.progress.set('601', {
      status: 'learning', stability: 5, difficulty: 3
    });
    expect(getWordStatus('601')).toBe('learning');
  });

  it('returns "new" for non-existent words', () => {
    expect(getWordStatus('nonexistent')).toBe('new');
  });

  it('prioritizes deleted status over progress status', () => {
    memoryCache.progress.set('602', {
      status: 'mastered', stability: 10, difficulty: 1
    });
    memoryCache.deletedIds.add('602');
    expect(getWordStatus('602')).toBe('deleted');
  });
});

describe('getData / saveData', () => {
  it('getData returns progress toObject', () => {
    memoryCache.progress.set('700', { status: 'learning' });
    memoryCache.progress.set('701', { status: 'review' });
    const data = getData();
    expect(data['700']).toEqual({ status: 'learning' });
    expect(data['701']).toEqual({ status: 'review' });
  });

  it('saveData then getData retrieves the data', () => {
    const obj = { '800': { status: 'mastered' }, '801': { status: 'new' } };
    saveData(obj);
    const data = getData();
    expect(data['800']).toEqual({ status: 'mastered' });
    expect(data['801']).toEqual({ status: 'new' });
  });

  it('getData returns empty object when progress is empty', () => {
    const data = getData();
    expect(data).toEqual({});
  });
});

describe('resetProgress', () => {
  it('clears all caches and resets state', async () => {
    memoryCache.progress.set('900', { status: 'learning' });
    memoryCache.wrongWords.set('900', { word: 'test' });
    memoryCache.heatmap.set('2024-01-01', 5);
    memoryCache.deletedIds.add('900');
    memoryCache.session = { foo: 'bar' };
    memoryCache.studySession = { baz: 'qux' };
    actionStack.push({ _id: 1, wordId: '900', state: {} });

    await resetProgress();

    expect(memoryCache.progress.size).toBe(0);
    expect(memoryCache.wrongWords.size).toBe(0);
    expect(memoryCache.heatmap.size).toBe(0);
    expect(memoryCache.deletedIds.size).toBe(0);
    expect(memoryCache.session).toBeNull();
    expect(memoryCache.studySession).toBeNull();
    expect(actionStack.length).toBe(0);
  });

  it('calls db.clear for each store when db.instance is set', async () => {
    db.instance = {};
    await resetProgress();
    expect(db.clear).toHaveBeenCalledWith('progress');
    expect(db.clear).toHaveBeenCalledWith('wrongWords');
    expect(db.clear).toHaveBeenCalledWith('heatmap');
    expect(db.clear).toHaveBeenCalledWith('session');
    expect(db.clear).toHaveBeenCalledWith('actionStack');
  });
});

describe('migrateData', () => {
  it('sets version for old data without version field', () => {
    const data = { progress: {}, wrongWords: {} };
    const result = migrateData(data);
    expect(result.version).toBe(SCHEMA_VERSION);
  });

  it('upgrades existing version to SCHEMA_VERSION', () => {
    const data = { version: '0.9', progress: {}, wrongWords: {} };
    const result = migrateData(data);
    expect(result.version).toBe(SCHEMA_VERSION);
  });

  it('fills missing stability in progress entries', () => {
    const data = {
      version: '0.9',
      progress: {
        '1': { ef: 2.5 },
        '2': { stability: 5 },
        '3': { stability: 3, difficulty: 7 }
      }
    };
    const result = migrateData(data);
    expect(result.progress['1'].stability).toBe(DEFAULT_FSRS_W[0]);
    expect(result.progress['1'].difficulty).toBe(DEFAULT_FSRS_W[4]);
    expect(result.progress['2'].stability).toBe(5);
    expect(result.progress['2'].difficulty).toBe(DEFAULT_FSRS_W[4]);
    expect(result.progress['3'].stability).toBe(3);
    expect(result.progress['3'].difficulty).toBe(7);
  });

  it('fills missing time fields in wrongWords entries', () => {
    const before = Date.now();
    const data = {
      version: '0.9',
      wrongWords: {
        '1': { word: 'test', count: 1 },
        '2': { word: 'hello', count: 2, firstWrong: 1000 }
      }
    };
    const result = migrateData(data);
    expect(result.wrongWords['1'].firstWrong).toBeGreaterThanOrEqual(before);
    expect(result.wrongWords['1'].lastWrong).toBeGreaterThanOrEqual(before);
    expect(result.wrongWords['2'].firstWrong).toBe(1000);
    expect(result.wrongWords['2'].lastWrong).toBeGreaterThanOrEqual(before);
  });

  it('skips non-object wrongWords entries', () => {
    const data = {
      version: '0.9',
      wrongWords: {
        '1': 'just a string',
        '2': null,
        '3': 42
      }
    };
    const result = migrateData(data);
    expect(result.wrongWords['1']).toBe('just a string');
    expect(result.wrongWords['2']).toBeNull();
    expect(result.wrongWords['3']).toBe(42);
  });

  it('handles data without progress or wrongWords', () => {
    const data = { version: '0.9' };
    const result = migrateData(data);
    expect(result.version).toBe(SCHEMA_VERSION);
  });

  it('treats stability=0 as missing (truthy check)', () => {
    const data = {
      version: '0.9',
      progress: {
        '1': { stability: 0, difficulty: 5 }
      }
    };
    const result = migrateData(data);
    expect(result.progress['1'].stability).toBe(DEFAULT_FSRS_W[0]);
  });
});

describe('collectReviewLogs', () => {
  it('returns empty array when no data', () => {
    expect(collectReviewLogs(true)).toEqual([]);
  });

  it('returns correctly formatted logs for valid entries', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    memoryCache.progress.set('1000', {
      stability: 5,
      difficulty: 3,
      reviewCount: 10,
      level: 4,
      lastStudy: twoDaysAgo
    });
    invalidateReviewLogsCache();
    const logs = collectReviewLogs(true);
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log.wordId).toBe(1000);
    expect(log.stability).toBe(5);
    expect(log.difficulty).toBe(3);
    expect(log.reviewCount).toBe(10);
    expect(log.level).toBe(4);
    expect(log.lastResult).toBe(1);
    expect(log.quality).toBe(3);
    expect(log.timestamp).toBe(twoDaysAgo);
    expect(log.elapsedDays).toBeGreaterThanOrEqual(1);
  });

  it('skips entries with reviewCount=0', () => {
    memoryCache.progress.set('1001', {
      stability: 5, difficulty: 3, reviewCount: 0
    });
    invalidateReviewLogsCache();
    expect(collectReviewLogs(true).length).toBe(0);
  });

  it('skips entries with stability=0', () => {
    memoryCache.progress.set('1002', {
      stability: 0, difficulty: 3, reviewCount: 5
    });
    invalidateReviewLogsCache();
    expect(collectReviewLogs(true).length).toBe(0);
  });

  it('skips entries with difficulty=0', () => {
    memoryCache.progress.set('1003', {
      stability: 5, difficulty: 0, reviewCount: 5
    });
    invalidateReviewLogsCache();
    expect(collectReviewLogs(true).length).toBe(0);
  });

  it('computes quality=4 when level > 5', () => {
    memoryCache.progress.set('1004', {
      stability: 5, difficulty: 3, reviewCount: 3, level: 7, lastStudy: Date.now()
    });
    invalidateReviewLogsCache();
    const logs = collectReviewLogs(true);
    expect(logs[0].quality).toBe(4);
  });

  it('computes quality=1 when level <= 0', () => {
    memoryCache.progress.set('1005', {
      stability: 5, difficulty: 3, reviewCount: 3, level: 0, lastStudy: Date.now()
    });
    invalidateReviewLogsCache();
    const logs = collectReviewLogs(true);
    expect(logs[0].quality).toBe(1);
    expect(logs[0].lastResult).toBe(0);
  });

  it('uses cache on subsequent calls without forceRefresh', () => {
    memoryCache.progress.set('1006', {
      stability: 5, difficulty: 3, reviewCount: 3, level: 4, lastStudy: Date.now()
    });
    invalidateReviewLogsCache();
    const first = collectReviewLogs(true);
    expect(first.length).toBe(1);
    memoryCache.progress.clear();
    const cached = collectReviewLogs(false);
    expect(cached.length).toBe(1);
  });
});

describe('actionStack operations', () => {
  it('pushAction adds an action to the stack', async () => {
    await pushAction('1000', { status: 'new' });
    expect(actionStack.length).toBe(1);
    expect(actionStack[0].wordId).toBe('1000');
    expect(actionStack[0].state).toEqual({ status: 'new' });
    expect(actionStack[0].timestamp).toBeGreaterThan(0);
  });

  it('pushAction creates deep copy of prevState', async () => {
    const state = { status: 'learning', nested: { value: 42 } };
    await pushAction('1001', state);
    expect(actionStack[0].state).toEqual(state);
    expect(actionStack[0].state).not.toBe(state);
    expect(actionStack[0].state.nested).not.toBe(state.nested);
  });

  it('pushAction increments _id for each action', async () => {
    await pushAction('a', {});
    await pushAction('b', {});
    await pushAction('c', {});
    expect(actionStack.length).toBe(3);
    expect(actionStack[0]._id).toBeLessThan(actionStack[1]._id);
    expect(actionStack[1]._id).toBeLessThan(actionStack[2]._id);
  });

  it('restoreActionStack replaces the stack', () => {
    actionStack.push({ _id: 1, wordId: 'old', state: {}, timestamp: 0 });
    const newActions = [
      { _id: 10, wordId: '1', state: { status: 'a' }, timestamp: Date.now() },
      { _id: 20, wordId: '2', state: { status: 'b' }, timestamp: Date.now() }
    ];
    restoreActionStack(newActions);
    expect(actionStack.length).toBe(2);
    expect(actionStack[0].wordId).toBe('1');
    expect(actionStack[1].wordId).toBe('2');
  });

  it('evicts oldest action when exceeding ACTION_STACK_MAX', async () => {
    for (let i = 0; i < ACTION_STACK_MAX + 5; i++) {
      await pushAction(String(i), { index: i });
    }
    expect(actionStack.length).toBe(ACTION_STACK_MAX);
    expect(actionStack[0].wordId).toBe('5');
    expect(actionStack[actionStack.length - 1].wordId).toBe(
      String(ACTION_STACK_MAX + 4)
    );
  });

  it('calls db.save when db.instance is set', async () => {
    db.instance = {};
    await pushAction('dbtest', { status: 'new' });
    expect(db.save).toHaveBeenCalledWith('actionStack', expect.objectContaining({
      wordId: 'dbtest'
    }));
  });

  it('calls db.delete for evicted action when db.instance is set and action has _dbId', async () => {
    db.instance = {};
    // 模拟 IndexedDB autoIncrement 主键写回行为：save 后给 action 写入 id
    // 修复后 action._dbId = action.id（实际 IndexedDB 主键），而非本地计数器 _id
    let mockAutoIncId = 1;
    db.save.mockImplementation((storeName, data) => {
      if (storeName === 'actionStack' && data.id === undefined) {
        data.id = mockAutoIncId++;
      }
      return Promise.resolve(true);
    });
    for (let i = 0; i < ACTION_STACK_MAX + 1; i++) {
      await pushAction(String(i), { index: i });
    }
    expect(db.delete).toHaveBeenCalled();
    // 恢复默认 mock 实现
    db.save.mockResolvedValue(true);
  });
});
