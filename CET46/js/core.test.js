import { describe, it, expect, beforeEach, vi } from 'vitest';

const FSRS_W = [0.4025, 1.4612, 3.3458, 15.6941, 5.3611, 0.9971, 0.8807, 0.0424, 1.4946, 0.144, 0.9995, 2.2107, 0.0578, 0.3267, 1.2691, 0.2314, 2.0583];
const MIN_EF = 1.3;
const MAX_EF = 3.0;
const DEFAULT_EF = 2.5;
const TARGET_RETENTION = 0.9;

function updateFSRS(wd, quality) {
  let s = wd.stability || FSRS_W[0];
  let d = wd.difficulty || FSRS_W[4] || FSRS_W[1];

  let next_d = d - FSRS_W[6] * (quality - 3);
  next_d = Math.min(Math.max(next_d, 1), 10);
  next_d = FSRS_W[7] * (FSRS_W[4] || 5) + (1 - FSRS_W[7]) * next_d;

  let next_s;
  if (quality >= 3) {
    let hard_penalty = (quality === 2) ? FSRS_W[15] : 1;
    let easy_bonus = (quality === 4) ? FSRS_W[16] : 1;

    const success_factor = Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9]) * (Math.exp(1 - quality / 5) - 1);

    next_s = s * (1 + success_factor * FSRS_W[10] * easy_bonus * hard_penalty);
  } else {
    next_s = Math.min(
      s,
      FSRS_W[11] * Math.pow(d, -FSRS_W[12]) * Math.pow(s, FSRS_W[13]) * Math.exp(FSRS_W[14])
    );
  }

  return { stability: Math.max(0.1, next_s), difficulty: next_d };
}

function calculateFSRSInterval(s, r = null) {
  const targetR = r || TARGET_RETENTION;
  const intervalDays = s * (Math.log(targetR) / Math.log(0.9));
  const rawInterval = Math.max(1, Math.round(intervalDays)) * 24 * 60 * 60 * 1000;
  return applyFuzz(rawInterval);
}

function calculateForgettingDecay(wd, daysSinceReview) {
  if (!wd.stability || !wd.lastStudy) return 1;

  const stability = wd.stability;
  const decayFactor = Math.exp(-daysSinceReview / stability);

  return Math.max(0.1, Math.min(1, decayFactor));
}

function calculateShortTermMemory(wd, quality) {
  if (!wd.shortTermReps) wd.shortTermReps = 0;
  if (!wd.lastShortTermReview) wd.lastShortTermReview = 0;

  const now = Date.now();
  const timeSinceLastReview = now - wd.lastShortTermReview;
  const SHORT_TERM_WINDOW = 24 * 60 * 60 * 1000;

  if (timeSinceLastReview > SHORT_TERM_WINDOW) {
    wd.shortTermReps = quality >= 3 ? 1 : 0;
  } else {
    if (quality >= 3) {
      wd.shortTermReps = Math.min(wd.shortTermReps + 1, 5);
    } else {
      wd.shortTermReps = Math.max(0, wd.shortTermReps - 1);
    }
  }

  wd.lastShortTermReview = now;

  const shortTermBonus = 1 + (wd.shortTermReps * 0.1);

  return {
    reps: wd.shortTermReps,
    bonus: shortTermBonus
  };
}

function calculateOptimalInterval(wd, quality) {
  const baseInterval = calculateFSRSInterval(wd.stability);

  const daysSinceReview = wd.lastStudy ? (Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000) : 0;
  const decayFactor = calculateForgettingDecay(wd, daysSinceReview);

  const shortTerm = calculateShortTermMemory(wd, quality);

  let adjustedInterval = baseInterval * decayFactor * shortTerm.bonus;

  if (quality < 3) {
    adjustedInterval *= 0.5;
  } else if (quality === 4) {
    adjustedInterval *= 1.2;
  }

  return Math.round(adjustedInterval);
}

function applyFuzz(interval) {
  if (interval < 24 * 60 * 60 * 1000) return interval;

  const fuzzRange = 0.05;
  const randomFactor = 1 + (Math.random() * fuzzRange * 2 - fuzzRange);
  return Math.round(interval * randomFactor);
}

function calculateLevenshtein(s1, s2) {
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let currRow = new Array(s2.length + 1);

  for (let i = 1; i <= s1.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[s2.length];
}

function migrateSM2ToFSRS(wd) {
  if (!wd) return null;

  if (wd.stability && wd.difficulty) {
    return wd;
  }

  const s = wd.ef ? (wd.ef - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1 : FSRS_W[0];
  const d = wd.level ? Math.max(1, 10 - wd.level) : FSRS_W[1];

  return {
    ...wd,
    stability: s,
    difficulty: d
  };
}

function updateEF(currentEF, quality) {
  let newEF = currentEF;
  if (quality >= 4) {
    newEF += 0.1;
  } else if (quality === 0) {
    newEF -= 0.15;
  }
  return Math.max(MIN_EF, Math.min(MAX_EF, newEF));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHTML(str) {
  return (str || '').replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag)
  );
}

describe('FSRS Algorithm', () => {
  describe('updateFSRS', () => {
    it('should increase stability for correct answers (quality >= 3)', () => {
      const wd = { stability: 5, difficulty: 5 };
      const result = updateFSRS(wd, 4);
      expect(result.stability).toBeGreaterThan(5);
    });

    it('should decrease stability for wrong answers (quality < 3)', () => {
      const wd = { stability: 10, difficulty: 5 };
      const result = updateFSRS(wd, 1);
      expect(result.stability).toBeLessThan(10);
    });

    it('should clamp difficulty between 1 and 10', () => {
      const wd = { stability: 5, difficulty: 1 };
      const result = updateFSRS(wd, 1);
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
    });

    it('should handle new words without existing data', () => {
      const wd = {};
      const result = updateFSRS(wd, 4);
      expect(result.stability).toBeGreaterThan(0);
      expect(result.difficulty).toBeGreaterThan(0);
    });
  });

  describe('calculateFSRSInterval', () => {
    it('should return at least 1 day in milliseconds', () => {
      const interval = calculateFSRSInterval(1);
      expect(interval).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('should increase interval with higher stability', () => {
      const interval1 = calculateFSRSInterval(5);
      const interval2 = calculateFSRSInterval(10);
      expect(interval2).toBeGreaterThan(interval1);
    });

    it('should apply fuzz factor', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const interval = calculateFSRSInterval(10);
      const expectedBase = 10 * (Math.log(0.9) / Math.log(0.9)) * 24 * 60 * 60 * 1000;
      expect(interval).toBeGreaterThanOrEqual(expectedBase * 0.95);
      expect(interval).toBeLessThanOrEqual(expectedBase * 1.05);
    });
  });

  describe('calculateForgettingDecay', () => {
    it('should return 1 for new words without study history', () => {
      const wd = {};
      expect(calculateForgettingDecay(wd, 1)).toBe(1);
    });

    it('should decay toward 0 as days increase', () => {
      const wd = { stability: 10, lastStudy: Date.now() - 10 * 24 * 60 * 60 * 1000 };
      const decay = calculateForgettingDecay(wd, 10);
      expect(decay).toBeLessThan(0.5);
    });

    it('should clamp between 0.1 and 1', () => {
      const wd = { stability: 0.1, lastStudy: Date.now() };
      expect(calculateForgettingDecay(wd, 100)).toBeGreaterThanOrEqual(0.1);
      expect(calculateForgettingDecay(wd, 0)).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateShortTermMemory', () => {
    it('should reset reps after 24 hours', () => {
      const wd = { shortTermReps: 5, lastShortTermReview: Date.now() - 25 * 60 * 60 * 1000 };
      const result = calculateShortTermMemory(wd, 4);
      expect(result.reps).toBe(1);
    });

    it('should increase reps for correct answers within window', () => {
      const wd = { shortTermReps: 2, lastShortTermReview: Date.now() };
      const result = calculateShortTermMemory(wd, 4);
      expect(result.reps).toBe(3);
    });

    it('should decrease reps for wrong answers', () => {
      const wd = { shortTermReps: 2, lastShortTermReview: Date.now() };
      const result = calculateShortTermMemory(wd, 1);
      expect(result.reps).toBe(1);
    });

    it('should cap reps at 5', () => {
      const wd = { shortTermReps: 5, lastShortTermReview: Date.now() };
      const result = calculateShortTermMemory(wd, 4);
      expect(result.reps).toBe(5);
    });

    it('should provide bonus based on reps', () => {
      const wd = { shortTermReps: 3, lastShortTermReview: Date.now() };
      const result = calculateShortTermMemory(wd, 4);
      expect(result.bonus).toBe(1.3);
    });
  });

  describe('calculateOptimalInterval', () => {
    it('should reduce interval for wrong answers', () => {
      const wd = { stability: 10, difficulty: 5, lastStudy: Date.now() };
      const intervalCorrect = calculateOptimalInterval(wd, 4);
      const intervalWrong = calculateOptimalInterval(wd, 1);
      expect(intervalWrong).toBeLessThan(intervalCorrect);
    });

    it('should increase interval for easy answers (quality=4)', () => {
      const wd = { stability: 10, difficulty: 5, lastStudy: Date.now() };
      const interval3 = calculateOptimalInterval(wd, 3);
      const interval4 = calculateOptimalInterval(wd, 4);
      expect(interval4).toBeGreaterThan(interval3);
    });
  });

  describe('applyFuzz', () => {
    it('should not apply fuzz to intervals less than 1 day', () => {
      const interval = 10 * 60 * 1000;
      expect(applyFuzz(interval)).toBe(interval);
    });
  });

  describe('calculateLevenshtein', () => {
    it('should return 0 for identical strings', () => {
      expect(calculateLevenshtein('hello', 'hello')).toBe(0);
    });

    it('should be case insensitive', () => {
      expect(calculateLevenshtein('Hello', 'hello')).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(calculateLevenshtein('', 'hello')).toBe(5);
      expect(calculateLevenshtein('hello', '')).toBe(5);
    });

    it('should calculate correct distance', () => {
      expect(calculateLevenshtein('kitten', 'sitting')).toBe(3);
      expect(calculateLevenshtein('Saturday', 'Sunday')).toBe(3);
    });

    it('should handle whitespace trimming', () => {
      expect(calculateLevenshtein(' hello ', 'hello')).toBe(0);
    });
  });

  describe('migrateSM2ToFSRS', () => {
    it('should return null for null input', () => {
      expect(migrateSM2ToFSRS(null)).toBeNull();
    });

    it('should preserve existing FSRS data', () => {
      const wd = { stability: 10, difficulty: 5, ef: 2.5 };
      const result = migrateSM2ToFSRS(wd);
      expect(result.stability).toBe(10);
      expect(result.difficulty).toBe(5);
    });

    it('should convert SM-2 ef to FSRS stability', () => {
      const wd = { ef: 2.5 };
      const result = migrateSM2ToFSRS(wd);
      expect(result.stability).toBeGreaterThan(0);
    });

    it('should convert SM-2 level to FSRS difficulty', () => {
      const wd = { level: 5 };
      const result = migrateSM2ToFSRS(wd);
      expect(result.difficulty).toBe(5);
    });
  });

  describe('updateEF', () => {
    it('should increase EF for quality >= 4', () => {
      expect(updateEF(2.5, 4)).toBe(2.6);
      expect(updateEF(2.5, 5)).toBe(2.6);
    });

    it('should decrease EF for quality = 0', () => {
      expect(updateEF(2.5, 0)).toBe(2.35);
    });

    it('should clamp EF within bounds', () => {
      expect(updateEF(3.0, 4)).toBe(3.0);
      expect(updateEF(1.3, 0)).toBe(1.3);
    });
  });

  describe('shuffle', () => {
    it('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffle(original);
      expect(original).toEqual(originalCopy);
    });

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled.sort()).toEqual(original);
    });

    it('should handle empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(shuffle([1])).toEqual([1]);
    });
  });

  describe('escapeHTML', () => {
    it('should escape & to &amp;', () => {
      expect(escapeHTML('A & B')).toBe('A &amp; B');
    });

    it('should escape < to &lt;', () => {
      expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
    });

    it('should escape > to &gt;', () => {
      expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
    });

    it('should escape " to &quot;', () => {
      expect(escapeHTML('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('should escape \' to &#39;', () => {
      expect(escapeHTML("it's")).toBe("it&#39;s");
    });

    it('should handle null/undefined', () => {
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });
  });
});
