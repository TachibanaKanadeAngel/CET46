import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateFSRSInterval, applyFuzz, calculateLevenshtein, updateFSRS, calculateForgettingDecay, calculateOptimalInterval, calculateShortTermMemory, getFSRSWeights, setFSRSWeights, DEFAULT_FSRS_W } from '../js/fsrs.js';

describe('calculateLevenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(calculateLevenshtein('hello', 'hello')).toBe(0);
  });
  it('ignores case and trims whitespace', () => {
    expect(calculateLevenshtein('  Hello  ', 'hello')).toBe(0);
  });
  it('returns edit distance for different strings', () => {
    expect(calculateLevenshtein('kitten', 'sitting')).toBe(3);
  });
  it('returns length of non-empty string when other is empty', () => {
    expect(calculateLevenshtein('abc', '')).toBe(3);
  });
  it.each([
    ['', '', 0],
    ['a', '', 1],
    ['', 'a', 1],
    ['abc', 'abc', 0],
    ['abc', 'ab', 1],
    ['abc', 'abcd', 1],
    ['book', 'back', 2],
    ['saturday', 'sunday', 3],
  ])('returns correct distance for "%s" vs "%s"', (a, b, expected) => {
    expect(calculateLevenshtein(a, b)).toBe(expected);
  });
});

describe('calculateFSRSInterval', () => {
  it('returns positive interval in milliseconds', () => {
    const interval = calculateFSRSInterval(10);
    expect(interval).toBeGreaterThan(0);
    expect(Number.isInteger(interval)).toBe(true);
  });
  it('scales with stability', () => {
    const small = calculateFSRSInterval(1);
    const large = calculateFSRSInterval(100);
    expect(large).toBeGreaterThan(small);
  });
  it('adjusts with circadian score', () => {
    const positive = calculateFSRSInterval(10, null, 1);
    const negative = calculateFSRSInterval(10, null, -1);
    expect(positive).not.toBe(negative);
  });
  it('returns at least 1 day in ms', () => {
    const interval = calculateFSRSInterval(0.01);
    expect(interval).toBeGreaterThanOrEqual(86400000);
  });
  it('respects custom retention target', () => {
    const high = calculateFSRSInterval(10, 0.95);
    const low = calculateFSRSInterval(10, 0.8);
    expect(low).toBeGreaterThan(high);
  });
  it('uses default retention when not specified', () => {
    const withDefault = calculateFSRSInterval(10);
    const withExplicit = calculateFSRSInterval(10, 0.9);
    expect(withDefault).toBe(withExplicit);
  });
});

describe('applyFuzz', () => {
  it('returns same interval for sub-day intervals', () => {
    expect(applyFuzz(1000)).toBe(1000);
    expect(applyFuzz(86399999)).toBe(86399999);
  });
  it('applies ±5% fuzz to intervals >= 1 day', () => {
    const day = 86400000;
    for (let i = 0; i < 50; i++) {
      const result = applyFuzz(day);
      const ratio = result / day;
      expect(ratio).toBeGreaterThanOrEqual(0.95);
      expect(ratio).toBeLessThanOrEqual(1.05);
    }
  });
  it('produces different results on subsequent calls', () => {
    const day = 86400000;
    const results = new Set(Array.from({ length: 20 }, () => applyFuzz(day)));
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('calculateForgettingDecay', () => {
  it('returns 1 when no stability', () => {
    expect(calculateForgettingDecay({}, 5)).toBe(1);
  });
  it('returns 1 when no lastStudy', () => {
    expect(calculateForgettingDecay({ stability: 10 }, null)).toBe(1);
  });
  it('decreases exponentially with time', () => {
    const fresh = calculateForgettingDecay({ stability: 10, lastStudy: Date.now() }, 0);
    const old = calculateForgettingDecay({ stability: 10, lastStudy: Date.now() - 10 * 86400000 }, 10);
    expect(old).toBeLessThanOrEqual(fresh);
  });
  it('clamps between 0.1 and 1', () => {
    const fresh = calculateForgettingDecay({ stability: 1000, lastStudy: Date.now() }, 0);
    const old = calculateForgettingDecay({ stability: 1000, lastStudy: Date.now() - 3650 * 86400000 }, 3650);
    expect(fresh).toBeGreaterThanOrEqual(0.1);
    expect(fresh).toBeLessThanOrEqual(1);
    expect(old).toBeGreaterThanOrEqual(0.1);
  });
  it('returns ~(1 + days/(9*S))^(-1)', () => {
    const s = 30;
    const ls = Date.now() - 15 * 86400000;
    const result = calculateForgettingDecay({ stability: s, lastStudy: ls }, 15);
    const expected = Math.max(0.1, Math.min(1, Math.pow(1 + 15 / (9 * s), -1)));
    expect(result).toBeCloseTo(expected, 2);
  });
});

describe('calculateShortTermMemory', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('initializes shortTermReps to 0', () => {
    const wd = {};
    const result = calculateShortTermMemory(wd, 3);
    expect(result.reps).toBeGreaterThanOrEqual(0);
  });
  it('increments reps on quality >= 3', () => {
    const wd = { shortTermReps: 0, lastShortTermReview: Date.now() };
    const result = calculateShortTermMemory(wd, 3);
    expect(result.reps).toBe(1);
  });
  it('decrements reps on quality < 3', () => {
    const wd = { shortTermReps: 3, lastShortTermReview: Date.now() };
    const result = calculateShortTermMemory(wd, 1);
    expect(result.reps).toBe(2);
  });
  it('caps at 5 reps', () => {
    const wd = { shortTermReps: 5, lastShortTermReview: Date.now() - 1000 };
    const result = calculateShortTermMemory(wd, 3);
    expect(result.reps).toBe(5);
  });
  it('resets after 24h window', () => {
    const wd = { shortTermReps: 3, lastShortTermReview: Date.now() - 25 * 60 * 60 * 1000 };
    const result = calculateShortTermMemory(wd, 3);
    expect(result.reps).toBe(1);
  });
  it('provides short-term bonus multiplier', () => {
    const wd = { shortTermReps: 5, lastShortTermReview: Date.now() - 1000 };
    const result = calculateShortTermMemory(wd, 3);
    expect(result.bonus).toBeCloseTo(1.5, 1);
  });
});

describe('calculateOptimalInterval', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns positive integer', () => {
    const wd = { stability: 10, difficulty: 5, lastStudy: Date.now() };
    const interval = calculateOptimalInterval(wd, 3);
    expect(Number.isInteger(interval)).toBe(true);
    expect(interval).toBeGreaterThan(0);
  });
  it('reduces interval for low quality', () => {
    const wd = { stability: 10, difficulty: 5, lastStudy: Date.now() };
    const bad = calculateOptimalInterval(wd, 1);
    const good = calculateOptimalInterval(wd, 3);
    expect(bad).toBeLessThanOrEqual(good);
  });
});

describe('updateFSRS Parameterized', () => {
  it.each([
    [1, 'again'],
    [2, 'hard'],
    [3, 'good'],
    [4, 'easy'],
  ])('accepts quality %i (%s)', (quality) => {
    const result = updateFSRS({ stability: 10, difficulty: 5 }, quality);
    expect(result.stability).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.difficulty).toBeLessThanOrEqual(10);
  });

  it('stability ranking: easy >= good >= hard', () => {
    const base = { stability: 10, difficulty: 5 };
    const hard = updateFSRS(base, 2).stability;
    const good = updateFSRS(base, 3).stability;
    const easy = updateFSRS(base, 4).stability;
    expect(easy).toBeGreaterThanOrEqual(good);
    expect(good).toBeGreaterThanOrEqual(hard);
  });

  it('low difficulty leads to higher stability than high difficulty', () => {
    const easyWord = updateFSRS({ stability: 10, difficulty: 2 }, 3);
    const hardWord = updateFSRS({ stability: 10, difficulty: 9 }, 3);
    expect(easyWord.stability).toBeGreaterThanOrEqual(hardWord.stability);
  });

  it('maintains difficulty within [1, 10] across many repetitions', () => {
    let wd = { stability: 5, difficulty: 5 };
    const qualities = [3, 4, 2, 3, 1, 3, 4, 4, 3, 2, 3, 3, 4, 1, 3, 3, 4, 2, 3, 3];
    for (const q of qualities) {
      wd = { ...wd, ...updateFSRS(wd, q) };
    }
    expect(wd.difficulty).toBeGreaterThanOrEqual(1);
    expect(wd.difficulty).toBeLessThanOrEqual(10);
    expect(wd.stability).toBeGreaterThan(0);
  });
});

describe('updateFSRS - edge cases', () => {
  it('throws on invalid quality 0', () => {
    expect(() => updateFSRS({}, 0)).toThrow();
  });
  it('throws on invalid quality 5', () => {
    expect(() => updateFSRS({}, 5)).toThrow();
  });
  it('handles null word data gracefully', () => {
    const result = updateFSRS({}, 3);
    expect(result.stability).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThanOrEqual(1);
  });
  it('preserves very high stability', () => {
    const result = updateFSRS({ stability: 1000, difficulty: 5 }, 4);
    expect(result.stability).toBeGreaterThanOrEqual(1000);
  });
  it('recovers from very low stability', () => {
    const result = updateFSRS({ stability: 0.1, difficulty: 5 }, 3);
    expect(result.stability).toBeGreaterThan(0);
  });
});

describe('getFSRSWeights / setFSRSWeights', () => {
  afterEach(() => {
    setFSRSWeights(DEFAULT_FSRS_W);
  });

  it('returns current weights array', () => {
    const w = getFSRSWeights();
    expect(Array.isArray(w)).toBe(true);
    expect(w).toHaveLength(17);
  });
  it('rejects invalid weight arrays', () => {
    expect(setFSRSWeights([])).toBe(false);
    expect(setFSRSWeights([1, 2, 3])).toBe(false);
  });
  it('accepts valid weight arrays', () => {
    const newWeights = Array.from({ length: 17 }, (_, i) => i + 0.1);
    expect(setFSRSWeights(newWeights)).toBe(true);
    expect(getFSRSWeights()).toEqual(newWeights);
  });
});

describe('evaluateLogLoss and calculateGradientsForLogLoss', () => {
  it('evaluateLogLoss returns 0 for empty logs', async () => {
    const { evaluateLogLoss } = await import('../js/fsrs.js');
    expect(evaluateLogLoss([], DEFAULT_FSRS_W)).toBe(0);
  });

  it('evaluateLogLoss computes log loss for valid review logs', async () => {
    const { evaluateLogLoss } = await import('../js/fsrs.js');
    const logs = [
      { elapsedDays: 3, difficulty: 5, reviewCount: 2, lastResult: 1 },
      { elapsedDays: 7, difficulty: 6, reviewCount: 3, lastResult: 0 },
      { elapsedDays: 1, difficulty: 4, reviewCount: 1, quality: 4 },
    ];
    const loss = evaluateLogLoss(logs, DEFAULT_FSRS_W);
    expect(loss).toBeGreaterThan(0);
    expect(Number.isFinite(loss)).toBe(true);
  });

  it('evaluateLogLoss skips invalid/non-positive elapsedDays or NaN records', async () => {
    const { evaluateLogLoss } = await import('../js/fsrs.js');
    const logs = [
      { elapsedDays: 0, difficulty: 5, reviewCount: 1, lastResult: 1 },
      { elapsedDays: -2, difficulty: 5, reviewCount: 1, lastResult: 1 },
      { elapsedDays: null, difficulty: 5, reviewCount: 1, lastResult: 1 },
    ];
    expect(evaluateLogLoss(logs, DEFAULT_FSRS_W)).toBe(0);
  });

  it('calculateGradientsForLogLoss computes gradient vector for weights', async () => {
    const { calculateGradientsForLogLoss } = await import('../js/fsrs.js');
    const logs = [
      { elapsedDays: 2, difficulty: 5, reviewCount: 1, lastResult: 1 },
      { elapsedDays: 5, difficulty: 4, reviewCount: 2, lastResult: 0 },
    ];
    const gradients = calculateGradientsForLogLoss(logs, DEFAULT_FSRS_W);
    expect(Array.isArray(gradients)).toBe(true);
    expect(gradients).toHaveLength(DEFAULT_FSRS_W.length);
    expect(gradients.every(g => typeof g === 'number' && Number.isFinite(g))).toBe(true);
  });
});

describe('updateEF, migrateSM2ToFSRS, calculateInterval, circadian stats', () => {
  it('updateEF adjusts EF based on quality within [1.3, 3.0]', async () => {
    const { updateEF } = await import('../js/fsrs.js');
    expect(updateEF(2.0, 4)).toBeCloseTo(2.1);
    expect(updateEF(2.0, 0)).toBeCloseTo(1.85);
    expect(updateEF(2.5, 4)).toBe(2.6);
    expect(updateEF(3.0, 5)).toBe(3.0); // max clamped
    expect(updateEF(1.3, 0)).toBe(1.3); // min clamped
  });

  it('migrateSM2ToFSRS converts SM-2 word data to FSRS', async () => {
    const { migrateSM2ToFSRS } = await import('../js/fsrs.js');
    expect(migrateSM2ToFSRS(null)).toBeNull();

    const alreadyFSRS = { stability: 10, difficulty: 5 };
    expect(migrateSM2ToFSRS(alreadyFSRS)).toBe(alreadyFSRS);

    const sm2Word = { ef: 2.5, level: 3 };
    const migrated = migrateSM2ToFSRS(sm2Word);
    expect(migrated.stability).toBeGreaterThan(0);
    expect(migrated.difficulty).toBe(7);
  });

  it('calculateInterval clamps quality and updates stability/difficulty', async () => {
    const { calculateInterval } = await import('../js/fsrs.js');
    expect(calculateInterval(null, 3)).toBe(86400000);

    const wd = { stability: 5, difficulty: 5, lastStudy: Date.now() - 86400000 };
    const interval = calculateInterval(wd, 4);
    expect(interval).toBeGreaterThan(0);
    expect(wd.stability).toBeDefined();
    expect(wd.difficulty).toBeDefined();
  });

  it('updateHourStats and getCircadianScore calculate circadian adjustment', async () => {
    const { updateHourStats, getCircadianScore } = await import('../js/fsrs.js');
    const hour = new Date().getHours();
    for (let i = 0; i < 15; i++) {
      updateHourStats(hour, true);
    }
    const score = getCircadianScore();
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});
