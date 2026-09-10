// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWrongWordsList,
  renderWrongList,
  registerStudyFeature,
  startWrongWordsStudy,
} from '../js/utils/wrong-words.ts';
import { memoryCache } from '../js/store.js';
import { setWordsArray } from '../js/data/vocab-store.js';

describe('wrong-words.ts test suite', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="wrong-list"></div>
      <span id="wrong-count"></span>
      <span id="wrong-total-errors"></span>
      <div id="error-analysis-content"></div>
      <button data-tab="study"></button>
      <div id="view-study" class="view"></div>
    `;

    setWordsArray([
      { id: 1, word: 'internationalization', level: 'CET6', phonetic: '/.../', meaning: '国际化' },
      { id: 2, word: 'abandon', level: 'CET4', phonetic: '/.../', meaning: '放弃' },
      { id: 3, word: 'abbreviation', level: 'CET6', phonetic: '/.../', meaning: '缩写' },
      { id: 4, word: 'cat', level: 'CET4', phonetic: '/.../', meaning: '猫' },
      { id: 5, word: 'dog', level: 'CET4', phonetic: '/.../', meaning: '狗' },
      { id: 6, word: 'fox', level: 'CET4', phonetic: '/.../', meaning: '狐狸' },
    ]);
  });

  it('renders empty state when there are no wrong words', () => {
    memoryCache.wrongWords = {
      entries: () => [],
      toObject: () => ({}),
    };

    renderWrongList();

    const container = document.getElementById('wrong-list');
    expect(container.textContent).toContain('当前没有错题');

    const analysis = document.getElementById('error-analysis-content');
    expect(analysis.textContent).toContain('暂无错误数据');
  });

  it('renders list items and error analysis for suffixes, length, and time slots', () => {
    memoryCache.wrongWords = {
      entries: () => [
        ['1', { count: 5, lastWrong: '2026-08-30T23:00:00.000Z' }],
        ['2', { count: 3, lastWrong: '2026-08-30T15:00:00.000Z' }],
        ['3', { count: 4, lastWrong: '2026-08-30T08:00:00.000Z' }],
        ['4', { count: 2, lastWrong: '2026-08-30T12:00:00.000Z' }],
        ['5', { count: 2, lastWrong: '2026-08-30T12:00:00.000Z' }],
        ['6', { count: 2, lastWrong: '2026-08-30T12:00:00.000Z' }],
      ],
      toObject: () => ({}),
    };

    renderWrongList();

    const countEl = document.getElementById('wrong-count');
    const totalEl = document.getElementById('wrong-total-errors');
    expect(countEl.textContent).toBe('6');
    expect(totalEl.textContent).toBe('18');

    const list = document.getElementById('wrong-list');
    expect(list.children.length).toBe(6);
    expect(list.textContent).toContain('internationalization');
    expect(list.textContent).toContain('5 次');

    const analysis = document.getElementById('error-analysis-content');
    expect(analysis.textContent).toContain('后缀提示');
    expect(analysis.textContent).toContain('平均每个错词错误');
  });

  it('startWrongWordsStudy launches StudyFeature with overrideQueue and activates study view', () => {
    memoryCache.wrongWords = {
      entries: () => [
        ['1', { count: 2 }],
        ['2', { count: 1 }],
      ],
      toObject: () => ({}),
    };

    const mockStudy = {
      startStudy: vi.fn(),
    };
    registerStudyFeature(mockStudy);

    startWrongWordsStudy();

    expect(mockStudy.startStudy).toHaveBeenCalledWith(
      'all',
      0,
      null,
      null,
      null,
      expect.objectContaining({
        overrideQueue: expect.any(Array),
      })
    );

    const tabBtn = document.querySelector('[data-tab="study"]');
    const studyView = document.getElementById('view-study');
    expect(tabBtn.classList.contains('active')).toBe(true);
    expect(studyView.classList.contains('active')).toBe(true);
  });
});
