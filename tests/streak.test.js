import { describe, it, expect } from 'vitest';
import {
  shiftDateStr,
  computeCurrentStreak,
  computeLongestStreak,
  hasStudiedToday,
} from '../js/utils/streak.ts';

describe('shiftDateStr', () => {
  it('shifts by days', () => {
    expect(shiftDateStr('2026-08-30', -1)).toBe('2026-08-29');
    expect(shiftDateStr('2026-08-30', 1)).toBe('2026-08-31');
  });
  it('crosses month boundary', () => {
    expect(shiftDateStr('2026-08-01', -1)).toBe('2026-07-31');
  });
});

describe('computeCurrentStreak', () => {
  const today = '2026-08-30';
  it('counts consecutive days ending today', () => {
    const map = { '2026-08-28': 5, '2026-08-29': 0, '2026-08-30': 10 };
    expect(computeCurrentStreak(map, today)).toBe(1);
  });
  it('counts back from yesterday when today not studied yet', () => {
    const map = { '2026-08-28': 5, '2026-08-29': 8 };
    expect(computeCurrentStreak(map, today)).toBe(2);
  });
  it('returns 0 with no activity', () => {
    expect(computeCurrentStreak({}, today)).toBe(0);
  });
  it('long running streak', () => {
    const map = {};
    for (let i = 0; i < 5; i++) map[shiftDateStr(today, -i)] = 3;
    expect(computeCurrentStreak(map, today)).toBe(5);
  });
});

describe('computeLongestStreak', () => {
  it('finds longest run', () => {
    const map = {};
    for (let i = 0; i < 3; i++) map[shiftDateStr('2026-08-30', -i)] = 1; // 28,29,30
    for (let i = 0; i < 2; i++) map[shiftDateStr('2026-08-10', -i)] = 1; // 9,10
    expect(computeLongestStreak(map)).toBe(3);
  });
  it('handles empty map', () => {
    expect(computeLongestStreak({})).toBe(0);
  });
  it('counts single isolated day', () => {
    expect(computeLongestStreak({ '2026-08-01': 2 })).toBe(1);
  });
});

describe('hasStudiedToday', () => {
  it('returns true/false', () => {
    expect(hasStudiedToday({ '2026-08-30': 4 }, '2026-08-30')).toBe(true);
    expect(hasStudiedToday({}, '2026-08-30')).toBe(false);
  });
});