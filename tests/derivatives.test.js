import { describe, it, expect } from 'vitest';
import { getMorphologyRoot, buildWordFamilyIndex, getWordFamily, getWordDerivativeSummary } from '../js/utils/derivatives.ts';

describe('getMorphologyRoot', () => {
  it('strips a prefix', () => {
    expect(getMorphologyRoot('international')).toBe('nation');
    expect(getMorphologyRoot('unhappy')).toBe('happ');
  });

  it('strips a suffix', () => {
    expect(getMorphologyRoot('happiness')).toBe('happi');
    expect(getMorphologyRoot('careful')).toBe('care');
  });

  it('strips both prefix and suffix', () => {
    expect(getMorphologyRoot('uncomfortable')).toBe('comfort');
  });

  it('keeps short words unchanged', () => {
    expect(getMorphologyRoot('run')).toBe('run');
  });

  it('returns empty for invalid input', () => {
    expect(getMorphologyRoot('')).toBe('');
    expect(getMorphologyRoot(null)).toBe('');
  });
});

describe('buildWordFamilyIndex / getWordFamily', () => {
  const words = [
    { id: 1, word: 'national' },
    { id: 2, word: 'international' },
    { id: 3, word: 'happy' },
    { id: 4, word: 'happiness' },
  ];

  it('groups words by morphology root', () => {
    const index = buildWordFamilyIndex(words);
    expect(index.get('nation').map(w => w.word).sort()).toEqual(['international', 'national']);
    expect(index.get('happ').map(w => w.word)).toEqual(['happy']);
    expect(index.get('happi').map(w => w.word)).toEqual(['happiness']);
  });

  it('getWordFamily excludes self by default', () => {
    const siblings = getWordFamily('national', words).map(w => w.word);
    expect(siblings).toEqual(['international']);
  });

  it('getWordFamily can include self', () => {
    const family = getWordFamily('international', words, { includeSelf: true }).map(w => w.word);
    expect(family).toEqual(['international', 'national']);
  });

  it('ignores words without a valid word field', () => {
    const index = buildWordFamilyIndex([{ id: 9 }, { word: '' }]);
    expect(index.size).toBe(0);
  });
});

describe('getWordDerivativeSummary', () => {
  const words = [
    { id: 1, word: 'national' },
    { id: 2, word: 'international' },
  ];

  it('returns root, total count and siblings', () => {
    const s = getWordDerivativeSummary('national', words);
    expect(s.root).toBe('nation');
    expect(s.counts.total).toBe(2);
    expect(s.counts.siblings).toBe(1);
    expect(s.siblings.map(w => w.word)).toEqual(['international']);
  });
});