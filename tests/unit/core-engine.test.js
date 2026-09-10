import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreEngine, getPersonalizedCircadianFactor, calculateMasteryScore } from '../../js/core.js';
import { SafeStore, MemoryStorage } from '../../js/store.js';
import { ActionBus } from '../../js/utils/action-bus.js';

describe('TypeScript Core Architecture Tests', () => {
  describe('Circadian Factor & Mastery Scoring', () => {
    it('calculates circadian factor based on hourly statistics', () => {
      const statsMap = {
        9: { correct: 20, total: 20 }, // 100% acc
        10: { correct: 5, total: 20 },  // 25% acc
      };

      const factorMorning = getPersonalizedCircadianFactor(statsMap, 9);
      expect(factorMorning).toBeGreaterThan(1.0);

      const factorLow = getPersonalizedCircadianFactor(statsMap, 10);
      expect(factorLow).toBeLessThan(1.0);
    });

    it('returns 1.0 when insufficient sample data exists', () => {
      const statsMap = {
        9: { correct: 2, total: 3 },
      };
      expect(getPersonalizedCircadianFactor(statsMap, 9)).toBe(1.0);
    });

    it('calculates mastery scores and assigns proper mastery grade', () => {
      const newProgress = {
        status: 'new',
        level: 0,
        nextReview: 0,
        lastStudy: 0,
        ef: 2.5,
        reviewCount: 0,
        difficulty: 5.0,
        stability: 1.0,
      };

      const newRes = calculateMasteryScore(newProgress);
      expect(newRes.grade).toBe('New');
      expect(newRes.score).toBe(0);

      const masteredProgress = {
        status: 'mastered',
        level: 8,
        nextReview: Date.now() + 864000000,
        lastStudy: Date.now() - 1000,
        ef: 2.8,
        reviewCount: 6,
        difficulty: 3.0,
        stability: 50.0,
      };

      const masterRes = calculateMasteryScore(masteredProgress);
      expect(masterRes.grade).toBe('Mastered');
      expect(masterRes.score).toBeGreaterThan(80);
    });
  });

  describe('SafeStore & Memory Fallback Sandbox', () => {
    it('stores and retrieves data in memory storage fallback', () => {
      const memStore = new MemoryStorage();
      memStore.setItem('test_key', 'test_value');

      expect(memStore.getItem('test_key')).toBe('test_value');
      expect(memStore.length).toBe(1);

      memStore.removeItem('test_key');
      expect(memStore.getItem('test_key')).toBeNull();
    });

    it('handles JSON parsing and default values safely in SafeStore', () => {
      const store = new SafeStore();
      const defaultVal = { foo: 'bar' };

      expect(store.get('non_existent_key', defaultVal)).toEqual(defaultVal);

      store.set('sample_data', { count: 42 });
      expect(store.get('sample_data', { count: 0 })).toEqual({ count: 42 });
    });
  });

  describe('ActionBus Event System', () => {
    it('publishes and subscribes to named events cleanly', async () => {
      const bus = new ActionBus();
      const fn = vi.fn();

      const unsubscribe = bus.on('test-event', fn);
      await bus.emit('test-event', { msg: 'hello' });

      expect(fn).toHaveBeenCalledWith({ msg: 'hello' });

      unsubscribe();
      await bus.emit('test-event', { msg: 'world' });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
