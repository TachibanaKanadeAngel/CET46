import { describe, it, expect } from 'vitest';
import { parseCSV, isHeaderRow, parseWordCSV, assignWordIds } from '../js/utils/csv-import.ts';

describe('parseCSV', () => {
  it('parses simple rows', () => {
    expect(parseCSV('a,b\nc,d\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('handles quoted fields with commas and newlines', () => {
    const csv = 'w,"很长的，释义"\nexample,1';
    expect(parseCSV(csv)).toEqual([['w', '很长的，释义'], ['example', '1']]);
  });

  it('handles escaped double quotes', () => {
    expect(parseCSV('x,"say ""hi"""')).toEqual([['x', 'say "hi"']]);
  });

  it('skips fully empty lines', () => {
    expect(parseCSV('a,b\n\n\nc,d\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCSV('a,b\r\nc,d\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });
});

describe('isHeaderRow', () => {
  it('recognizes header with word + known column', () => {
    expect(isHeaderRow(['word', 'meaning'])).toBe(true);
    expect(isHeaderRow(['单词', '释义', '例句'])).toBe(true);
  });

  it('rejects a data row', () => {
    expect(isHeaderRow(['apple', 'n 苹果'])).toBe(false);
  });
});

describe('parseWordCSV', () => {
  it('parses header CSV and maps named columns', () => {
    const csv = 'word,phonetic,meaning,example,level\napple,/ˈæp.l̩/,n 苹果,an apple a day,CET4';
    const words = parseWordCSV(csv);
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({
      word: 'apple',
      phonetic: '/ˈæp.l̩/',
      meaning: 'n 苹果',
      example: 'an apple a day',
      level: 'CET4',
      source: 'custom',
    });
  });

  it('supports Chinese header aliases', () => {
    const csv = '单词,释义,例句\nbanana,n 香蕉,I like bananas';
    const words = parseWordCSV(csv);
    expect(words[0]).toMatchObject({ word: 'banana', meaning: 'n 香蕉', example: 'I like bananas', level: 'CUSTOM' });
  });

  it('parses headerless CSV by position (word, meaning)', () => {
    const csv = 'apple,n 苹果\ntree,n 树';
    const words = parseWordCSV(csv, { allowHeader: false });
    expect(words).toHaveLength(2);
    expect(words[0]).toMatchObject({ word: 'apple', meaning: 'n 苹果' });
    expect(words[1]).toMatchObject({ word: 'tree', meaning: 'n 树' });
  });

  it('distinguishes phonetic second column', () => {
    const words = parseWordCSV('apple,/ˈæp.l̩/\n', { allowHeader: false });
    expect(words[0]).toMatchObject({ word: 'apple', phonetic: '/ˈæp.l̩/' });
  });

  it('dedups words ignoring case and skips empties', () => {
    const csv = 'word,meaning\napple,A\nApple,A\n,,\n\n';
    const words = parseWordCSV(csv);
    expect(words).toHaveLength(1);
    expect(words[0].word).toBe('apple');
  });

  it('applies defaultLevel', () => {
    const words = parseWordCSV('word,meaning\nx,A\n', { defaultLevel: 'TOEFL' });
    expect(words[0].level).toBe('TOEFL');
  });
});

describe('assignWordIds', () => {
  it('assigns sequential ids from base', () => {
    const words = assignWordIds([{ word: 'a' }, { word: 'b' }]);
    expect(words[0].id).toBe(900000);
    expect(words[1].id).toBe(900001);
  });
});