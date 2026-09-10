import { describe, it, expect, beforeEach } from 'vitest';
import {
  FSRS_WEIGHT_COUNT,
  validateFSRSWeights,
  serializeFSRSWeights,
  serializeWeights,
  applyFSRSWeightsFromText,
  resetFSRSWeights,
  hasCustomFSRSWeights,
} from '../js/utils/fsrs-calibration.ts';
import { DEFAULT_FSRS_W, getFSRSWeights } from '../js/fsrs.js';

const custom17 = Array.from({ length: FSRS_WEIGHT_COUNT }, (_, i) => 0.5 + i * 0.1);

describe('fsrs-calibration', () => {
  beforeEach(() => {
    resetFSRSWeights();
  });

  describe('validateFSRSWeights', () => {
    it('accepts a valid 17-length finite array', () => {
      const r = validateFSRSWeights(DEFAULT_FSRS_W);
      expect(r.valid).toBe(true);
      expect(r.errors).toEqual([]);
    });

    it('rejects non-array inputs', () => {
      expect(validateFSRSWeights(null).valid).toBe(false);
      expect(validateFSRSWeights('x').valid).toBe(false);
      expect(validateFSRSWeights({}).valid).toBe(false);
    });

    it('rejects wrong length', () => {
      const r = validateFSRSWeights([1, 2, 3]);
      expect(r.valid).toBe(false);
      expect(r.errors[0]).toMatch(/17/);
    });

    it('rejects non-finite and out-of-range values', () => {
      const bad = [...DEFAULT_FSRS_W];
      bad[3] = NaN;
      bad[7] = Infinity;
      bad[9] = 500;
      const r = validateFSRSWeights(bad);
      expect(r.valid).toBe(false);
      expect(r.errors.length).toBe(3);
    });
  });

  describe('serialize / apply', () => {
    it('round-trips current weights through JSON text', () => {
      expect(applyFSRSWeightsFromText(serializeFSRSWeights()).ok).toBe(true);
      expect(getFSRSWeights()).toEqual(DEFAULT_FSRS_W);
    });

    it('applies a custom weight set and persists it', () => {
      const r = applyFSRSWeightsFromText(serializeWeights(custom17));
      expect(r.ok).toBe(true);
      expect(r.weights).toEqual(custom17);
      expect(getFSRSWeights()).toEqual(custom17);
    });

    it('accepts a wrapped export object with a weights field', () => {
      const text = JSON.stringify({ version: 1, weights: custom17 });
      const r = applyFSRSWeightsFromText(text);
      expect(r.ok).toBe(true);
      expect(getFSRSWeights()).toEqual(custom17);
    });

    it('rejects empty and malformed text', () => {
      expect(applyFSRSWeightsFromText('').ok).toBe(false);
      expect(applyFSRSWeightsFromText('   ').ok).toBe(false);
      expect(applyFSRSWeightsFromText('not-json').ok).toBe(false);
    });

    it('rejects out-of-range weights and leaves state unchanged', () => {
      const bad = [...custom17];
      bad[0] = 999;
      expect(applyFSRSWeightsFromText(serializeWeights(bad)).ok).toBe(false);
      expect(getFSRSWeights()).toEqual(DEFAULT_FSRS_W);
    });
  });

  describe('resetFSRSWeights / hasCustomFSRSWeights', () => {
    it('reports custom state and resets back to default', () => {
      applyFSRSWeightsFromText(serializeWeights(custom17));
      expect(hasCustomFSRSWeights()).toBe(true);
      expect(resetFSRSWeights()).toBe(true);
      expect(hasCustomFSRSWeights()).toBe(false);
      expect(getFSRSWeights()).toEqual(DEFAULT_FSRS_W);
    });
  });
});