import { describe, it, expect } from 'vitest';
import { evaluateAchievements, getEarnedAchievements } from '../js/utils/achievements.ts';

describe('evaluateAchievements', () => {
  it('returns all achievement entries with progress', () => {
    const all = evaluateAchievements({});
    expect(Array.isArray(all)).toBe(true);
    // 每个成就都带进度对象
    for (const a of all) {
      expect(a).toHaveProperty('earned');
      expect(a).toHaveProperty('progress');
      expect(a.progress).toHaveProperty('current');
      expect(a.progress).toHaveProperty('goal');
    }
  });

  it('marks earned when threshold met', () => {
    const badges = evaluateAchievements({ newLearned: 120, currentStreak: 7, mastered: 300 });
    const byId = Object.fromEntries(badges.map(b => [b.id, b]));
    expect(byId['first-word'].earned).toBe(true);
    expect(byId['words-100'].earned).toBe(true);
    expect(byId['words-500'].earned).toBe(false);
    expect(byId['streak-7'].earned).toBe(true);
    expect(byId['streak-30'].earned).toBe(false);
    expect(byId['master-50'].earned).toBe(true);
    expect(byId['master-200'].earned).toBe(true);
  });

  it('caps progress at goal', () => {
    const badges = evaluateAchievements({ newLearned: 999 });
    const first = badges.find(b => b.id === 'words-100');
    expect(first.progress.current).toBe(100);
    expect(first.progress.goal).toBe(100);
  });
});

describe('getEarnedAchievements', () => {
  it('returns only earned badges', () => {
    const earned = getEarnedAchievements({ newLearned: 2, currentStreak: 1 });
    const ids = earned.map(e => e.id);
    // 只学了新词、未复习、未连击 -> 仅“初出茅庐”
    expect(ids).toEqual(['first-word']);
  });
});