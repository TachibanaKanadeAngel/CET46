// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndShowMilestones } from '../js/utils/milestones.ts';
import { memoryCache } from '../js/store.js';
import { setWordsArray } from '../js/data/vocab-store.js';
import { localDateStr } from '../js/utils/date.ts';

describe('milestones.ts Learning Milestones and Celebrations test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    localStorage.removeItem('cet46_milestones');
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('triggers milestone celebrations when word mastery thresholds are reached', () => {
    const mockWords = [];
    const progress = {};
    for (let i = 1; i <= 100; i++) {
      mockWords.push({ id: i, word: `word${i}` });
      progress[i] = { status: 'mastered' };
    }
    setWordsArray(mockWords);
    memoryCache.progress = {
      toObject: () => progress,
    };
    memoryCache.heatmap = {
      toObject: () => ({}),
    };

    const fireConfetti = vi.fn();
    checkAndShowMilestones(fireConfetti);

    expect(fireConfetti).toHaveBeenCalled();
    const celebration = document.querySelector('.milestone-celebration');
    expect(celebration).not.toBeNull();
    expect(celebration.textContent).toContain('首次掌握100词！');

    // Verify localStorage updated
    const saved = JSON.parse(localStorage.getItem('cet46_milestones') || '{}');
    expect(saved['first-100']).toBe(true);
    expect(saved['all-mastered']).toBe(true); // 100/100 mastered

    // Advance timer to trigger animation and removal
    vi.advanceTimersByTime(2900);
    expect(celebration.parentNode).toBeNull();
  });

  it('triggers streak milestones when learning consecutive days', () => {
    setWordsArray([{ id: 1, word: 'apple' }]);
    memoryCache.progress = {
      toObject: () => ({}),
    };

    const today = new Date();
    const heatmap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      heatmap[localDateStr(d)] = 10;
    }
    memoryCache.heatmap = {
      toObject: () => heatmap,
    };

    const fireConfetti = vi.fn();
    checkAndShowMilestones(fireConfetti);

    expect(fireConfetti).toHaveBeenCalled();
    const celebration = document.querySelector('.milestone-celebration');
    expect(celebration.textContent).toContain('连续学习7天！');
  });

  it('does not re-trigger milestones that are already recorded in localStorage', () => {
    localStorage.setItem(
      'cet46_milestones',
      JSON.stringify({
        'first-100': true,
        'streak-7': true,
        'all-mastered': true,
      })
    );

    setWordsArray([{ id: 1, word: 'apple' }]);
    memoryCache.progress = {
      toObject: () => ({ 1: { status: 'mastered' } }),
    };
    memoryCache.heatmap = {
      toObject: () => ({}),
    };

    const fireConfetti = vi.fn();
    checkAndShowMilestones(fireConfetti);

    expect(fireConfetti).not.toHaveBeenCalled();
    expect(document.querySelector('.milestone-celebration')).toBeNull();
  });
});
