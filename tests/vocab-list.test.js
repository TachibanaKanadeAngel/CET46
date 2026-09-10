// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  renderList,
  showWordDetail,
  loadCustomVocab,
  debouncedRenderList,
  debouncedRenderVirtualList,
  getFilteredWordsCopy,
  getDisplayMeaning,
  filteredWords,
} from '../js/utils/vocab-list.js';
import { WORDS, setWordsArray } from '../js/data/vocab-store.js';
import { memoryCache } from '../js/store.js';
import { db } from '../js/db.js';

describe('vocab-list.js test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="view-list" class="view active">
        <input id="search-input" value="" />
        <select id="filter-level"><option value="all">全部</option><option value="CET4">CET4</option><option value="CET6">CET6</option></select>
        <select id="filter-status"><option value="all">全部</option><option value="new">未学</option><option value="review">复习</option><option value="mastered">掌握</option></select>
        <div id="virtual-scroll-container" style="height: 480px; overflow: auto;">
          <div id="virtual-scroll-spacer"></div>
          <div id="virtual-scroll-content"></div>
        </div>
        <div id="pagination-controls"></div>
      </div>
      <div id="view-study" class="view">
        <div id="study-word"></div>
        <div id="study-pron"></div>
        <div id="study-meaning"></div>
        <div id="study-example"></div>
        <button id="start-btn"></button>
        <div id="study-buttons"></div>
        <div id="study-progress"></div>
        <div id="cycle-banner"></div>
      </div>
      <button class="tab-btn" data-tab="study"></button>
      <button class="tab-btn active" data-tab="list"></button>
    `;

    setWordsArray([
      { id: 1, word: 'abandon', phonetic: '[əˈbændən]', meaning: 'vt. 放弃，遗弃', example: 'They abandoned the ship.', level: 'CET4' },
      { id: 2, word: 'ability', phonetic: '[əˈbɪləti]', meaning: 'n. 能力，才华', example: 'She has great ability.', level: 'CET4' },
      { id: 3, word: 'abnormal', phonetic: '[æbˈnɔːml]', meaning: 'a. 反常的，不正常的', example: 'Abnormal weather.', level: 'CET6' },
      { id: 4, word: 'aboard', phonetic: '[əˈbɔːd]', meaning: 'adv. 在船上', example: 'Welcome aboard.', level: 'CET4' },
    ]);

    const progressData = {
      1: { status: 'new' },
      2: { status: 'review' },
      3: { status: 'mastered' },
    };
    memoryCache.progress = {
      ...progressData,
      get: (id) => progressData[id],
      toObject: () => ({ ...progressData }),
    };
    memoryCache.deletedIds = new Set();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renderList renders all words when search and filters are empty', () => {
    renderList();

    const items = document.querySelectorAll('.list-item');
    expect(items.length).toBe(4);
    expect(items[0].textContent).toContain('abandon');
    expect(items[1].textContent).toContain('ability');
  });

  it('renderList filters words by keyword search', () => {
    document.getElementById('search-input').value = '能力';
    renderList();

    const items = document.querySelectorAll('.list-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('ability');
  });

  it('renderList filters words by level and status', () => {
    document.getElementById('filter-level').value = 'CET6';
    renderList();

    let items = document.querySelectorAll('.list-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('abnormal');

    document.getElementById('filter-level').value = 'all';
    document.getElementById('filter-status').value = 'review';
    renderList();

    items = document.querySelectorAll('.list-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('ability');
  });

  it('renderList displays empty state when no words match', () => {
    document.getElementById('search-input').value = 'nonexistentxyz';
    renderList();

    const content = document.getElementById('virtual-scroll-content');
    expect(content.innerHTML).toContain('没有找到匹配的单词');
  });

  it('showWordDetail updates study view and switches active tab', () => {
    showWordDetail(1);

    expect(document.getElementById('study-word').textContent).toContain('abandon');
    expect(document.getElementById('study-pron').textContent).toBe('[əˈbændən]');
    expect(document.getElementById('study-example').textContent).toBe('They abandoned the ship.');
    expect(document.getElementById('view-study').classList.contains('active')).toBe(true);
  });

  it('getFilteredWordsCopy returns copy of filtered words array', () => {
    renderList();
    const copy = getFilteredWordsCopy();
    expect(Array.isArray(copy)).toBe(true);
    expect(copy.length).toBe(4);
  });

  it('loadCustomVocab handles CSV import and saves to database', async () => {
    const csvContent = 'word,phonetic,meaning,example,level\napple,[ˈæpl],苹果,An apple a day,CET4\n';
    
    // Mock FileReader
    class MockFileReader {
      readAsText() {
        if (this.onload) {
          this.onload({ target: { result: csvContent } });
        }
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const file = { name: 'custom.csv' };
    const event = {
      target: {
        files: [file],
        value: 'custom.csv',
      },
    };

    db.instance = {
      clear: vi.fn().mockResolvedValue(true),
      bulkSave: vi.fn().mockImplementation((store, data, cb) => {
        if (cb) cb(1);
        return Promise.resolve(true);
      }),
    };

    await loadCustomVocab(event);
    await vi.advanceTimersByTimeAsync(500);

    expect(event.target.value).toBe('');
  });
});
