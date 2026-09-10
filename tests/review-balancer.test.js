import { describe, it, expect } from 'vitest';
import {
  calculateWordUrgency,
  balanceReviewQueue,
} from '../js/utils/review-balancer.ts';

describe('review-balancer.ts test suite', () => {
  it('calculates word urgency appropriately based on retrievability, difficulty and error count', () => {
    const now = Date.now();
    const urgentWord = {
      id: 1,
      stability: 0.5,
      difficulty: 8.0,
      lastStudy: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      errorCount: 4,
    };

    const freshMasteredWord = {
      id: 2,
      stability: 100,
      difficulty: 2.0,
      lastStudy: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      errorCount: 0,
    };

    const urgencyHigh = calculateWordUrgency(urgentWord, now);
    const urgencyLow = calculateWordUrgency(freshMasteredWord, now);

    expect(urgencyHigh).toBeGreaterThan(urgencyLow);
    expect(Number.isFinite(urgencyHigh)).toBe(true);
    expect(Number.isFinite(urgencyLow)).toBe(true);
  });

  it('returns empty balance result for empty due queue', () => {
    const result = balanceReviewQueue([]);
    expect(result.todayBatch).toEqual([]);
    expect(result.deferredQueue).toEqual([]);
    expect(result.metrics.totalDue).toBe(0);
    expect(result.metrics.isAvalanche).toBe(false);
  });

  it('passes normal-sized queue directly without avalanche truncation', () => {
    const queue = [
      { id: 1, stability: 1, difficulty: 5 },
      { id: 2, stability: 2, difficulty: 4 },
      { id: 3, stability: 3, difficulty: 3 },
    ];

    const result = balanceReviewQueue(queue, { dailyBatchLimit: 10 });
    expect(result.todayBatch.length).toBe(3);
    expect(result.deferredQueue.length).toBe(0);
    expect(result.metrics.isAvalanche).toBe(false);
    expect(result.metrics.estimatedDaysToClear).toBe(1);
  });

  it('detects review avalanche and caps today batch while deferring overflow items', () => {
    const massiveQueue = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      stability: Math.random() * 5 + 0.1,
      difficulty: Math.random() * 5 + 5,
      errorCount: i % 3,
    }));

    const result = balanceReviewQueue(massiveQueue, {
      dailyBatchLimit: 30,
      avalancheRatio: 2.0,
    });

    expect(result.metrics.isAvalanche).toBe(true);
    expect(result.metrics.totalDue).toBe(150);
    expect(result.todayBatch.length).toBe(30);
    expect(result.deferredQueue.length).toBe(120);
    expect(result.metrics.estimatedDaysToClear).toBe(5);

    // 验证高紧迫度的词汇被排在 todayBatch 的最前端
    const topUrgency = calculateWordUrgency(result.todayBatch[0]);
    const bottomUrgency = calculateWordUrgency(
      result.deferredQueue[result.deferredQueue.length - 1]
    );
    expect(topUrgency).toBeGreaterThanOrEqual(bottomUrgency);
  });
});
