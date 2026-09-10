import { describe, it, expect, vi } from 'vitest';
import { escapeHTML, escapeRegExp, shuffle, deepClone, throttle, debounce, formatDate, formatBytes, generateId, safeJSONParse, daysBetween } from '../js/utils.js';

describe('escapeHTML', () => {
  it('escapes & < > " \'', () => {
    expect(escapeHTML('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('returns empty string for null/undefined', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });
  it('passes through normal text', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
  });
});

describe('escapeRegExp', () => {
  it('escapes regex special chars', () => {
    expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });
});

describe('shuffle', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result).toHaveLength(arr.length);
  });
  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result.sort()).toEqual(arr);
  });
  it('does not return new array reference', () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr)).toBe(arr);
  });
});

describe('deepClone', () => {
  it('clones a plain object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });
  it('clones an array', () => {
    const arr = [1, [2, 3]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
  });
  it('clones Date objects', () => {
    const d = new Date('2024-01-01');
    const cloned = deepClone(d);
    expect(cloned).toEqual(d);
    expect(cloned).not.toBe(d);
  });
  it('returns primitives as-is', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});

describe('throttle', () => {
  it('calls function immediately on first invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('ignores calls within throttle window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('debounce', () => {
  it('calls function after delay', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('cancels previous call on new invocation', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('formatDate', () => {
  it('formats with default YYYY-MM-DD', () => {
    const d = new Date(2024, 0, 5);
    expect(formatDate(d)).toBe('2024-01-05');
  });
  it('formats with custom pattern', () => {
    const d = new Date(2024, 11, 25, 14, 30, 45);
    expect(formatDate(d, 'YYYY/MM/DD HH:mm:ss')).toBe('2024/12/25 14:30:45');
  });
});

describe('formatBytes', () => {
  it('returns 0 Bytes for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });
  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

describe('generateId', () => {
  it('generates a string with prefix', () => {
    expect(generateId('test')).toMatch(/^test_/);
  });
  it('defaults to id prefix', () => {
    expect(generateId()).toMatch(/^id_/);
  });
});

describe('safeJSONParse', () => {
  it('parses valid JSON', () => {
    expect(safeJSONParse('{"a":1}')).toEqual({ a: 1 });
  });
  it('returns default on invalid JSON', () => {
    expect(safeJSONParse('invalid', null)).toBe(null);
  });
});

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 0, 10);
    expect(daysBetween(d1, d2)).toBe(9);
  });
});
