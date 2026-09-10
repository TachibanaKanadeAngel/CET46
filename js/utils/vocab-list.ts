import { db } from '../db.js';
import { getWordStatus } from '../core.js';
import { WORDS, setWordsArray, findWordById } from '../data/vocab-store.js';
import { getDisplayMeaning } from '../utils.js';
import { setHtml } from './dom.js';
import { vocabProcessor } from './worker-pool.js';
import { updateStats } from './stats.js';
import { UI, showLoadingOverlay, updateLoadingProgress, setSafeWordHeader } from '../ui.js';
import { prefetchAudioLibrary } from './audio-prefetch.js';
import { parseWordCSV, assignWordIds } from './csv-import.js';
import logger from './logger.js';

const ITEM_HEIGHT = 80;
const VISIBLE_COUNT = 6;
const POOL_SIZE = VISIBLE_COUNT + 4;

export let filteredWords: any[] = [];
const listItemPool: HTMLDivElement[] = [];
let virtualScrollRAF: number | null = null;
let _lowercaseIndex: Array<{ word: string; meaning: string }> | null = null;

function buildLowercaseIndex(): void {
  _lowercaseIndex = new Array(WORDS.length);
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    _lowercaseIndex[i] = {
      word: (w.word || '').toLowerCase(),
      meaning: getDisplayMeaning(w).toLowerCase(),
    };
  }
}

function invalidateLowercaseIndex(): void {
  _lowercaseIndex = null;
}

function getOrCreateListItem(): HTMLDivElement {
  if (listItemPool.length > 0) {
    const div = listItemPool.pop()!;
    div.className = 'list-item';
    div.style.cssText = `height: ${ITEM_HEIGHT}px; box-sizing: border-box; cursor: pointer;`;
    return div;
  }

  const div = document.createElement('div');
  div.className = 'list-item';
  div.style.cssText = `height: ${ITEM_HEIGHT}px; box-sizing: border-box; cursor: pointer;`;

  const leftDiv = document.createElement('div');
  leftDiv.className = 'list-item-left';
  const wordDiv = document.createElement('div');
  wordDiv.className = 'list-item-word';
  const textNode = document.createTextNode('');
  wordDiv.appendChild(textNode);
  const small = document.createElement('small');
  wordDiv.appendChild(small);
  const pronDiv = document.createElement('div');
  pronDiv.className = 'list-item-pron';
  const meaningDiv = document.createElement('div');
  meaningDiv.className = 'list-item-meaning';
  leftDiv.appendChild(wordDiv);
  leftDiv.appendChild(pronDiv);
  leftDiv.appendChild(meaningDiv);
  const badge = document.createElement('span');
  badge.className = 'badge';
  div.appendChild(leftDiv);
  div.appendChild(badge);
  return div;
}

function recycleListItem(div: HTMLDivElement): void {
  if (listItemPool.length < POOL_SIZE) {
    div.dataset.action = '';
    div.dataset.id = '';
    listItemPool.push(div);
  }
}

function renderVirtualList(): void {
  const container = document.getElementById('virtual-scroll-container');
  const content = document.getElementById('virtual-scroll-content');
  const spacer = document.getElementById('virtual-scroll-spacer');
  if (!container || !content) return;

  if (spacer) {
    spacer.style.height = filteredWords.length * ITEM_HEIGHT + 'px';
  }

  const scrollTop = container.scrollTop;
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIndex = Math.min(startIndex + VISIBLE_COUNT + 2, filteredWords.length);
  const visibleItems = filteredWords.slice(startIndex, endIndex);

  const fragment = document.createDocumentFragment();
  const existingItems = content.querySelectorAll<HTMLDivElement>('.list-item');
  existingItems.forEach(item => recycleListItem(item));

  visibleItems.forEach(w => {
    if (!w || !w.id) return;
    const s = getWordStatus(w.id);
    const badgeClass =
      {
        new: 'badge-gray',
        review: 'badge-warning',
        mastered: 'badge-success',
        deleted: 'badge-danger',
      }[s] || 'badge-gray';
    const badgeText =
      { new: '未学习', review: '待复习', mastered: '已掌握', deleted: '已移除' }[s] || '未学习';

    const div = getOrCreateListItem();
    div.dataset.action = 'show-detail';
    div.dataset.id = String(w.id);

    const wordDiv = div.querySelector('.list-item-word');
    if (wordDiv && wordDiv.childNodes[0])
      wordDiv.childNodes[0].textContent = (w.word || '未知单词') + ' ';
    const smallEl = wordDiv ? wordDiv.querySelector('small') : null;
    if (smallEl) smallEl.textContent = w.level || '';
    const pronEl = div.querySelector('.list-item-pron');
    if (pronEl) pronEl.textContent = w.phonetic || '';
    const meaningEl = div.querySelector('.list-item-meaning');
    if (meaningEl) meaningEl.textContent = getDisplayMeaning(w);
    const badge = div.querySelector('.badge');
    if (badge) {
      badge.className = `badge ${badgeClass}`;
      badge.textContent = badgeText;
    }
    fragment.appendChild(div);
  });
  content.replaceChildren(fragment);
  content.style.transform = `translateY(${startIndex * ITEM_HEIGHT}px)`;
}

export function debouncedRenderVirtualList(): void {
  if (virtualScrollRAF) cancelAnimationFrame(virtualScrollRAF);
  virtualScrollRAF = requestAnimationFrame(renderVirtualList);
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: any = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export const debouncedRenderList = debounce(() => {
  const container = document.getElementById('virtual-scroll-container');
  if (container) container.scrollTop = 0;
  renderList();
}, 300);

export function renderList(): void {
  if (!WORDS || WORDS.length === 0) {
    logger.error('[renderList] WORDS 为空，无法渲染词库列表！');
    return;
  }

  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const levelSelect = document.getElementById('filter-level') as HTMLSelectElement | null;
  const statusSelect = document.getElementById('filter-status') as HTMLSelectElement | null;

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const level = levelSelect ? levelSelect.value : 'all';
  const status = statusSelect ? statusSelect.value : 'all';

  if (!_lowercaseIndex) buildLowercaseIndex();

  filteredWords = WORDS.filter((w, i) => {
    const idx = _lowercaseIndex![i];
    const matchSearch = !search || idx.word.includes(search) || idx.meaning.includes(search);
    const matchLevel = level === 'all' || w.level === level;
    const s = getWordStatus(w.id);
    const matchStatus = status === 'all' || s === status;
    return matchSearch && matchLevel && matchStatus;
  });

  const pagination = document.getElementById('pagination-controls');

  if (filteredWords.length === 0) {
    const scrollContent = document.getElementById('virtual-scroll-content');
    if (scrollContent) {
      setHtml(
        scrollContent,
        '<div class="empty-state" style="height: 200px;"><p>没有找到匹配的单词</p><p style="font-size:12px;color:#999;">请检查搜索词、词库范围和学习状态筛选条件。</p></div>'
      );
    }
    if (pagination) pagination.style.display = 'none';
    return;
  }

  renderVirtualList();
  if (pagination) pagination.style.display = 'none';
}

export function showWordDetail(id: string | number): void {
  const w = findWordById(id);
  if (!w) return;

  setSafeWordHeader('study-word', w.word, w.level);
  const pronEl = document.getElementById('study-pron');
  const meaningEl = document.getElementById('study-meaning');
  const exampleEl = document.getElementById('study-example');
  if (pronEl) pronEl.textContent = w.phonetic;
  if (meaningEl) meaningEl.textContent = getDisplayMeaning(w);
  if (exampleEl) exampleEl.textContent = w.example;

  const startBtn = document.getElementById('start-btn');
  const studyButtons = document.getElementById('study-buttons');
  const studyProgress = document.getElementById('study-progress');
  const cycleBanner = document.getElementById('cycle-banner');
  if (startBtn) startBtn.style.display = 'block';
  if (studyButtons) studyButtons.style.display = 'none';
  if (studyProgress) studyProgress.style.display = 'none';
  if (cycleBanner) cycleBanner.style.display = 'none';

  const tabBtn = document.querySelector(
    `.tab-btn[data-tab="study"], .tab-button[data-tab="study"]`
  );
  document.querySelectorAll('.tab-btn, .tab-button').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  if (tabBtn) {
    tabBtn.classList.add('active');
    tabBtn.setAttribute('aria-selected', 'true');
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-study');
  if (view) view.classList.add('active');
}

export async function loadCustomVocab(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) return;

  showLoadingOverlay(true, '正在解析词库...', 10);

  const reader = new FileReader();
  reader.onload = async function (e: ProgressEvent<FileReader>) {
    const fileContent = e.target?.result as string;
    if (!fileContent) {
      showLoadingOverlay(false);
      return;
    }
    try {
      let result: any[];
      let count: number;

      if (/\.csv$/i.test(file.name)) {
        updateLoadingProgress(10, '正在解析 CSV 词库...');
        const words = parseWordCSV(fileContent);
        if (words.length === 0) {
          throw new Error('CSV 中未识别到有效单词，请检查格式');
        }
        result = assignWordIds(words);
        count = result.length;
      } else {
        const { result: r, count: c } = await vocabProcessor.processJSON(fileContent, (progress: number) => {
          updateLoadingProgress(progress, '正在处理词库数据...');
        });
        result = r;
        count = c;
      }

      updateLoadingProgress(50, '正在写入本地数据...');
      setWordsArray(result);
      invalidateLowercaseIndex();

      if (db.instance) {
        await db.clear('words');
        await db.bulkSave('words', result, (progress: number) => {
          updateLoadingProgress(
            50 + progress * 0.5,
            `正在写入本地数据（${Math.round(progress)}%）...`
          );
        });
      }

      updateLoadingProgress(100, '处理完成');
      setTimeout(async () => {
        showLoadingOverlay(false);
        updateStats();
        renderList();
        setTimeout(() => prefetchAudioLibrary(result), 1000);
        UI.toast(`词库导入成功，共 ${count} 个单词`, 'success');
      }, 300);
    } catch (err: any) {
      showLoadingOverlay(false);
      UI.toast(`导入失败：${err.message}`, 'error');
    } finally {
      if (target) target.value = '';
    }
  };
  reader.onerror = () => {
    showLoadingOverlay(false);
    if (target) target.value = '';
  };
  reader.readAsText(file);
}

export function getFilteredWordsCopy(): any[] {
  return [...filteredWords];
}

export { getDisplayMeaning };
