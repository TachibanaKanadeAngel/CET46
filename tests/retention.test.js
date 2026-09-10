import { describe, it, expect } from 'vitest';
import {
  forgettingCurve,
  fsrsForgettingCurve,
  averageRetentionCurve,
  curveArea,
} from '../js/utils/retention.ts';

describe('forgettingCurve', () => {
  it('starts at initialRetention', () => {
    expect(forgettingCurve(1, 10, { days: 3 })[0].retention).toBe(1);
  });
  it('decays over time and stays within [0,1]', () => {
    const pts = forgettingCurve(1, 5, { days: 10 });
    for (const p of pts) {
      expect(p.retention).toBeGreaterThanOrEqual(0);
      expect(p.retention).toBeLessThanOrEqual(1);
    }
    expect(pts[pts.length - 1].retention).toBeLessThan(pts[0].retention);
  });
  it('reaches ~0.5 at half-life days', () => {
    const pts = forgettingCurve(1, 10, { days: 10 });
    const p10 = pts.find(p => p.day === 10);
    expect(p10.retention).toBeCloseTo(0.5, 1);
  });
});

describe('fsrsForgettingCurve', () => {
  it('reaches requestedRetention at interval day', () => {
    const pts = fsrsForgettingCurve(7, 0.9, { days: 7 });
    const at7 = pts.find(p => p.day === 7);
    expect(at7.retention).toBeCloseTo(0.9, 1);
  });
});

describe('averageRetentionCurve', () => {
  it('averages multiple curves', () => {
    const pts = averageRetentionCurve(
      [
        { initialRetention: 1, halfLife: 10 },
        { initialRetention: 0.8, halfLife: 20 },
      ],
      { days: 5 }
    );
    expect(pts[0].retention).toBeCloseTo(0.9, 1);
    expect(pts).toHaveLength(6);
  });
  it('falls back to a default curve when empty', () => {
    const pts = averageRetentionCurve([], { days: 3 });
    expect(pts).toHaveLength(4);
  });
});

describe('curveArea', () => {
  it('is larger for more persistent memory', () => {
    const slow = forgettingCurve(1, 50, { days: 10 });
    const fast = forgettingCurve(1, 2, { days: 10 });
    expect(curveArea(slow)).toBeGreaterThan(curveArea(fast));
  });
  it('returns 0 for insufficient points', () => {
    expect(curveArea([])).toBe(0);
  });
});