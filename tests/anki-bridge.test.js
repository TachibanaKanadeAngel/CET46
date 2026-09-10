import { describe, it, expect } from 'vitest';
import { isHeaderRow, buildAnkiExport, parseAnkiImport } from '../js/utils/anki-bridge.js';

describe('isHeaderRow', () => {
  it('recognizes Anki field headers', () => {
    expect(isHeaderRow(['Word', 'Meaning', 'Phonetic'])).toBe(true);
    expect(isHeaderRow(['单词', '释义'])).toBe(true);
  });
  it('rejects a data row', () => {
    expect(isHeaderRow(['apple', 'n 苹果'])).toBe(false);
  });
});

describe('buildAnkiExport', () => {
  const words = [
    { word: 'apple', meaning: 'n 苹果', phonetic: '/ˈæp.l̩/', example: 'an apple', level: 'CET4' },
  ];

  it('emits header + tab-separated lines', () => {
    const text = buildAnkiExport(words);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Word\tMeaning\tPhonetic\tExample\tLevel');
    expect(lines[1]).toContain('apple\tn 苹果\t/ˈæp.l̩/\tan apple\tCET4');
  });

  it('sanitizes tabs inside field values', () => {
    const text = buildAnkiExport([{ word: 'a', meaning: 'x\ty' }], { fields: ['word', 'meaning'] });
    expect(text).toContain('a\tx y');
  });

  it('supports custom field order', () => {
    const text = buildAnkiExport(words, { fields: ['word', 'example'] });
    expect(text.split('\n')[0]).toBe('Word\tExample');
  });
});

describe('parseAnkiImport', () => {
  it('round-trips header export back to words', () => {
    const words = [{ word: 'apple', meaning: 'n 苹果', phonetic: '/x/', example: 'a', level: 'CET4' }];
    const text = buildAnkiExport(words);
    const parsed = parseAnkiImport(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      word: 'apple',
      meaning: 'n 苹果',
      phonetic: '/x/',
      example: 'a',
      level: 'CET4',
      source: 'anki',
    });
  });

  it('parses headerless tab-separated import', () => {
    const parsed = parseAnkiImport('apple\tn 苹果\nbook\tn 书');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ word: 'apple', meaning: 'n 苹果', level: 'CUSTOM' });
  });

  it('skips empty lines and Anki comment lines', () => {
    const parsed = parseAnkiImport('#separator:tab\na\tA\n\nb\tB\n');
    expect(parsed).toHaveLength(2);
  });

  it('dedups by lowercase word', () => {
    const parsed = parseAnkiImport('apple\tA\nApple\tB');
    expect(parsed).toHaveLength(1);
  });

  it('supports semicolon separator', () => {
    const parsed = parseAnkiImport('word;meaning\napple;a', { sep: ';' });
    expect(parsed[0]).toMatchObject({ word: 'apple', meaning: 'a' });
  });

  it('applies defaultLevel when level absent', () => {
    const parsed = parseAnkiImport('x,A', { defaultLevel: 'TOEFL' });
    expect(parsed[0].level).toBe('TOEFL');
  });
});