﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { CONFIG, SEMANTIC_CLUSTERS, CONFUSING_PAIRS } from './config.js';
import { DEFAULT_WORDS } from './data/default_vocab.js';
import { AppState, ReactiveAppState, watch, computed } from './state.js';
import { performanceMonitor } from './utils/performance-monitor.js';
import { pwaWidgets } from './widgets/pwa-widgets.js';
import { particleSystem } from './utils/particle-system.js';

import {
  db, FSRS_W, MIN_EF, MAX_EF,
  memoryCache, actionStack,
  loadFromIndexedDB,
  getPersonalizedCircadianFactor, pushAction, undoLastAction, restoreActionStack,
  getData, getWordData, setWordData, getWordStatus,
  getWrongWords, addWrongWord, removeWrongWord,
  getHeatmap, recordHeatmap,
  shuffle, updateFSRS, calculateFSRSInterval
} from './core.js';

import {
  webdavConfig, loadWebDAVConfig,
  saveWebDAVConfig,
  mergeLocalAndCloud,
  syncToWebDAV, syncFromWebDAV
} from './sync.js';

import {
  UI, playTone, fireConfetti, speak, setSafeWordHeader,
  toggleTheme, initTheme,
  showLoadingOverlay, updateLoadingProgress,
  Skeleton
} from './ui.js';

import { StudyFeature, INITIAL_STUDY_EMPTY_STATE } from './features/study.js';
import { ReviewFeature } from './features/review.js';
import { SpellingFeature } from './features/spelling.js';
import { miniGame } from './features/minigame.js';
import { engineVisualizer } from './features/engine-visualizer.js';

// 检测是否运行在 file:// 协议下
const isFileProtocol = () => {
  return window.location.protocol === 'file:';
};

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getDisplayMeaning(word) {
  return word?.meaning || word?.translation || '';
}

const INITIAL_SUBTITLE_TEXT = 'FSRS 4.5 算法 · 本地记忆同步';
const CORRUPTED_PLACEHOLDER_PATTERN = /(?:\?{2,}|锟斤拷|�)/;
const CORRUPTED_GARBLED_PATTERN = /(?:瀹|鐨|鍜|搴|淇|绛|瑙|濂|範|淓|闂|銆|榛|蹇|鎴|鍚|涓|浠|妯|鍓|暱)/;

function hasCorruptedPlaceholderText(value) {
  return !value || CORRUPTED_PLACEHOLDER_PATTERN.test(value.trim()) || CORRUPTED_GARBLED_PATTERN.test(value.trim());
}

function repairInitialPlaceholderText() {
  const subtitleEl = document.querySelector('.engine-header .subtitle');
  const titleEl = document.querySelector('.engine-header h1');
  const wordEl = document.getElementById('study-word');
  const meaningEl = document.getElementById('study-meaning');
  const pronEl = document.getElementById('study-pron');
  const exampleEl = document.getElementById('study-example');
  const startBtn = document.getElementById('start-btn');
  const soundBtn = document.getElementById('study-sound-btn');

  document.title = 'CET46 科学记忆引擎 Pro v1.3.2';

  if (titleEl && hasCorruptedPlaceholderText(titleEl.textContent || '')) {
    titleEl.textContent = 'CET46 科学记忆引擎 Pro v1.3.2';
  }

  if (subtitleEl && hasCorruptedPlaceholderText(subtitleEl.textContent || '')) {
    subtitleEl.textContent = INITIAL_SUBTITLE_TEXT;
  }

  if (wordEl && hasCorruptedPlaceholderText(wordEl.textContent || '')) {
    wordEl.textContent = INITIAL_STUDY_EMPTY_STATE.word;
  }

  if (meaningEl && hasCorruptedPlaceholderText(meaningEl.textContent || '')) {
    meaningEl.textContent = INITIAL_STUDY_EMPTY_STATE.meaning;
  }

  if (pronEl && hasCorruptedPlaceholderText(pronEl.textContent || '')) {
    pronEl.textContent = INITIAL_STUDY_EMPTY_STATE.pronunciation;
  }

  if (exampleEl && hasCorruptedPlaceholderText(exampleEl.textContent || '')) {
    exampleEl.textContent = INITIAL_STUDY_EMPTY_STATE.example;
  }

  if (startBtn && hasCorruptedPlaceholderText(startBtn.textContent || '')) {
    startBtn.textContent = '开始学习';
    startBtn.setAttribute('aria-label', '开始学习');
  }

  if (soundBtn && hasCorruptedPlaceholderText(soundBtn.textContent || '')) {
    soundBtn.textContent = '发音';
    soundBtn.setAttribute('title', '发音');
    soundBtn.setAttribute('aria-label', '播放单词发音');
  }
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

function setHtml(selector, html) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}

function setInputText(selector, { placeholder, ariaLabel, title, value } = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (placeholder !== undefined) el.setAttribute('placeholder', placeholder);
  if (ariaLabel !== undefined) el.setAttribute('aria-label', ariaLabel);
  if (title !== undefined) el.setAttribute('title', title);
  if (value !== undefined && !el.value) el.value = value;
}

function restoreTextIfCorrupted(selector, text) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (hasCorruptedPlaceholderText(el.textContent || '')) {
    el.textContent = text;
  }
}

function restoreHtmlIfCorrupted(selector, html) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (hasCorruptedPlaceholderText(el.textContent || '')) {
    el.innerHTML = html;
  }
}

function setSelectOptions(selector, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  const currentValue = el.value;
  el.innerHTML = options
    .map(({ value, label }) => `<option value="${escapeHtml(String(value))}">${escapeHtml(label)}</option>`)
    .join('');
  if (options.some(option => option.value === currentValue)) {
    el.value = currentValue;
  }
}

function repairVisibleUIText() {
  repairInitialPlaceholderText();

  setText('.engine-header h1', 'CET46 科学记忆引擎 Pro v1.3.2');
  setText('.engine-header .subtitle', INITIAL_SUBTITLE_TEXT);
  setText('#engine-fuel-label', '燃料 20%');
  setText('#engine-heat-label', '温度 0%');
  setText('#engine-status-text', '引擎待机中');

  setText('[data-tab="study"] .tab-label', '学习');
  setText('[data-tab="review"] .tab-label', '复习');
  setText('[data-tab="wrong"] .tab-label', '错题');
  setText('[data-tab="stats"] .tab-label', '统计');
  setText('[data-tab="list"] .tab-label', '词库');

  setInputText('#study-level', { ariaLabel: '选择学习范围' });
  setSelectOptions('#study-level', [
    { value: 'all', label: '全部词库' },
    { value: 'CET4', label: 'CET-4' },
    { value: 'CET6', label: 'CET-6' }
  ]);
  setText('label[for="study-level"]', '选择学习范围');

  setText('#study-sound-btn', '发音');
  setInputText('#study-sound-btn', { ariaLabel: '播放发音', title: '播放发音' });
  setText('#save-mnemonic-btn', '保存联想');
  setText('.flip-hint.card-hint', '点击卡片或按空格键查看释义');
  setHtml('#retention-display', '记忆留存: <strong id="retention-value">--</strong>');
  setText('#btn-unknown', '不认识');
  setText('#btn-spell', '拼写');
  setText('#btn-known', '认识');
  setInputText('#btn-unknown', { ariaLabel: '标记为不认识' });
  setInputText('#btn-spell', { ariaLabel: '进入拼写模式' });
  setInputText('#btn-known', { ariaLabel: '标记为认识' });
  setText('#btn-cloze', '完形填空：关闭');
  setHtml('#study-estimate', '预计完成：<strong id="study-est-date">--</strong>');
  setText('#progress-text', '学习进度: 0 / 0 (0%)');
  setInputText('#start-btn', { ariaLabel: '开始学习' });
  setText('#start-btn', '开始学习');
  setText('#reset-progress-btn span:last-child', '重置进度');
  setText('#undo-btn span:last-child', '撤销');

  const shortcutChips = document.querySelectorAll('.controls-row .action-chip[aria-hidden="true"]');
  if (shortcutChips.length >= 4) {
    shortcutChips[0].innerHTML = '<kbd>←</kbd><span>不认识</span>';
    shortcutChips[1].innerHTML = '<kbd>空格</kbd><span>翻转</span>';
    shortcutChips[2].innerHTML = '<kbd>→</kbd><span>认识</span>';
    shortcutChips[3].innerHTML = '<kbd>S</kbd><span>拼写</span>';
  }

  setText('#review-count + .review-stat-label', '待复习');
  setText('#review-overdue + .review-stat-label', '已过期');
  setText('#review-sound-btn', '发音');
  setInputText('#review-sound-btn', { ariaLabel: '播放发音', title: '播放发音' });
  setText('#review-word', '暂无待复习单词');
  setHtml('#review-retention-display', '记忆留存: <strong id="review-retention-value">--</strong>');
  setText('#btn-review-unknown', '还是不会');
  setText('#btn-review-known', '记住了');

  setText('#wrong-count + .review-stat-label', '错词总数');
  setText('#wrong-total-errors + .review-stat-label', '累计错误');
  setText('#wrong-study-btn', '专项复习错题');
  setHtml('#error-analysis-panel > div:first-child', '错误病理分析');

  setText('.heatmap-container .heatmap-title span:first-child', '学习热力图');
  setText('#heatmap-streak', '连续 0 天');
  const secondHeatmapTitle = document.querySelectorAll('.heatmap-container .heatmap-title')[1];
  if (secondHeatmapTitle) {
    secondHeatmapTitle.children[0].textContent = '未来 7 天复习工作量预测';
  }
  setText('#total-upcoming', '总计：0 词');
  setText('#stats-total-words + .review-stat-label', '总学习词数');
  setText('#stats-avg-ef + .review-stat-label', '平均 EF');
  setText('#stats-days + .review-stat-label', '学习天数');
  const statsEstLabel = document.querySelector('#stats-est-date + .review-stat-label');
  if (statsEstLabel) statsEstLabel.textContent = '预计达成日期';

  const dataPanelTitles = document.querySelectorAll('.data-panel h3');
  if (dataPanelTitles[0]) dataPanelTitles[0].textContent = 'WebDAV 云同步';
  if (dataPanelTitles[1]) dataPanelTitles[1].textContent = '算法实验室';
  if (dataPanelTitles[2]) dataPanelTitles[2].textContent = '本地数据管理';

  setInputText('#webdav-url', { placeholder: 'WebDAV 服务器地址' });
  setInputText('#webdav-master-key', { placeholder: '主密码（用于加密凭证）' });
  setInputText('#webdav-username', { placeholder: '用户名' });
  setInputText('#webdav-password', { placeholder: '密码' });
  const autoSyncLabel = document.querySelector('label[for="webdav-auto-sync"]');
  if (autoSyncLabel) autoSyncLabel.textContent = '启动时自动增量同步';
  setText('#save-webdav-btn', '保存配置');
  setText('#test-webdav-btn', '测试连接');
  setText('#sync-up-btn', '同步到云端');
  setText('#sync-down-btn', '从云端恢复');
  setText('#toggle-config-btn', '配置');
  setText('#export-key-btn', '导出凭证');
  setText('#webdav-status', isFileProtocol() ? '本地模式下部分云同步功能可能不可用' : '');

  const fsrsTuning = document.querySelector('.fsrs-tuning');
  if (fsrsTuning) {
    const topRow = fsrsTuning.querySelector('div > span');
    if (topRow) topRow.textContent = '当前模型 Log-Loss:';
    const targetRow = fsrsTuning.querySelector('div[style*="align-items: center"] span');
    if (targetRow) targetRow.textContent = '目标留存率';
    const hint = fsrsTuning.querySelector('div[style*="font-size: 0.75rem; color: var(--gray); margin-top: 0.5rem;"]');
    if (hint) hint.textContent = '留存率越高，复习越频繁，记忆越牢固';
  }
  setText('#train-fsrs-btn', '基于历史数据训练');
  setText('#reset-fsrs-btn', '恢复默认权重');
  setText('#export-btn', '导出进度');
  setText('#import-btn', '导入进度');
  setText('#load-vocab-btn', '加载词库');

  setInputText('#search-input', { placeholder: '搜索词库...', ariaLabel: '搜索词库' });
  setText('label[for="search-input"]', '搜索词库');
  setText('label[for="filter-level"]', '筛选词库');
  setText('label[for="filter-status"]', '筛选状态');
  setSelectOptions('#filter-level', [
    { value: 'all', label: '全部词库' },
    { value: 'CET4', label: 'CET-4' },
    { value: 'CET6', label: 'CET-6' }
  ]);
  setSelectOptions('#filter-status', [
    { value: 'all', label: '全部状态' },
    { value: 'new', label: '未学习' },
    { value: 'review', label: '待复习' },
    { value: 'mastered', label: '已掌握' }
  ]);
  setText('#btn-apply-filter', '应用筛选');

  setText('#spelling-title', '拼写挑战');
  setText('.spelling-hint', '根据提示拼写单词');
  setText('#spelling-sound', '发音');
  setText('#hint-btn', '提示');
  setText('#hint-level-display', '提示等级: 0');
  setText('#spelling-cancel-btn', '取消');
  setText('#spelling-submit', '提交');
  setText('#keep-local', '保留本地');
  setText('#use-cloud', '使用云端');
}

function repairRuntimeCorruptedUIText() {
  restoreTextIfCorrupted('#engine-status-text', '当前状态正常，可以开始学习');
  restoreTextIfCorrupted('#engine-fuel-label', '燃料 20%');
  restoreTextIfCorrupted('#engine-heat-label', '温度 0%');
  restoreTextIfCorrupted('#stats-est-date', '继续学习后生成预测');
  restoreTextIfCorrupted('#fsrs-fit-score', '--');
  restoreTextIfCorrupted('#webdav-status', isFileProtocol() ? '本地模式下部分云同步功能可能不可用' : '当前状态正常');
  restoreTextIfCorrupted('#study-estimate', '预计完成：--');
  restoreTextIfCorrupted('#review-word', '暂无待复习单词');
  restoreTextIfCorrupted('#retention-value', '--');
  restoreTextIfCorrupted('#review-retention-value', '--');

  const semanticWarning = document.getElementById('semantic-warning');
  if (semanticWarning && hasCorruptedPlaceholderText(semanticWarning.textContent || '')) {
    semanticWarning.innerHTML = '<strong>当前状态正常，可以开始学习</strong>';
  }
}

let uiRepairObserver = null;

function ensureUIRepairObserver() {
  // Recovery mode: keep the runtime text repair one-shot only.
  // Observing the whole document and then mutating visible text can
  // easily retrigger itself and freeze the file:// build.
  if (uiRepairObserver || typeof MutationObserver === 'undefined') return;
  return;
}

// 全局错误捕获
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.message, e.filename, e.lineno);
  if (e.error) {
    UI.toast && UI.toast('发生错误，请刷新页面', 'error');
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise Rejection]', e.reason);
  UI.toast && UI.toast('操作出错，请刷新页面重试', 'error');
  e.preventDefault();
});
let SettingsFeature = null;
let WebDAVFeature = null;
let settingsFeatureLoading = false;
let webdavFeatureLoading = false;

const WebVitals = {
  metrics: {},
  
  init() {
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
    this.measureFCP();
  },
  
  measureLCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const po = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
  },
  
  measureFID() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const po = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.metrics.FID = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.FID);
        });
      });
      po.observe({ type: 'first-input', buffered: true });
    } catch (e) {}
  },
  
  measureCLS() {
    if (!('PerformanceObserver' in window)) return;
    
    let clsValue = 0;
    try {
      const po = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.CLS = clsValue;
      });
      po.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  },
  
  measureTTFB() {
    if (!performance.timing) return;
    
    const timing = performance.timing;
    const ttfb = timing.responseStart - timing.navigationStart;
    this.metrics.TTFB = ttfb;
    this.reportMetric('TTFB', ttfb);
  },
  
  measureFCP() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      const po = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });
      po.observe({ type: 'paint', buffered: true });
    } catch (e) {}
  },
  
  reportMetric(name, value) {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 200, poor: 500 },
      FCP: { good: 1000, poor: 3000 }
    };
    
    const threshold = thresholds[name];
    if (!threshold) return;
    
    let rating = 'good';
    if (value > threshold.poor) {
      rating = 'poor';
    } else if (value > threshold.good) {
      rating = 'needs-improvement';
    }
    
    console.log(`Web Vitals [${name}]: ${value.toFixed(2)}ms (${rating})`);
    
    if (rating === 'poor') {
      console.warn(`性能指标 ${name} 较差，建议继续优化`);
    }
  },
  
  getMetrics() {
    return { ...this.metrics };
  },
  
  getScore() {
    const metrics = this.metrics;
    let score = 100;
    
    if (metrics.LCP > 4000) score -= 25;
    else if (metrics.LCP > 2500) score -= 10;
    
    if (metrics.FID > 300) score -= 25;
    else if (metrics.FID > 100) score -= 10;
    
    if (metrics.CLS > 0.25) score -= 25;
    else if (metrics.CLS > 0.1) score -= 10;
    
    if (metrics.TTFB > 500) score -= 15;
    else if (metrics.TTFB > 200) score -= 5;
    
    return Math.max(0, score);
  }
};

const WorkerPool = {
  workers: new Map(),
  maxWorkers: 3,
  
  async getWorker(name, url) {
    // file:// 协议下无法创建 Worker，返回 null
    if (isFileProtocol()) {
      console.log(`[WorkerPool] file:// 协议下无法创建 Worker，跳过 ${name}`);
      return null;
    }
    
    if (this.workers.has(name)) {
      return this.workers.get(name);
    }
    
    if (this.workers.size >= this.maxWorkers) {
      const oldestKey = this.workers.keys().next().value;
      this.terminateWorker(oldestKey);
    }
    
    try {
      const worker = new Worker(url, { type: 'module' });
      this.workers.set(name, worker);
      console.log(`[WorkerPool] 创建 ${name} Worker (当前: ${this.workers.size}/${this.maxWorkers})`);
      return worker;
    } catch (e) {
      console.error(`[WorkerPool] 创建 ${name} Worker 失败:`, e.message);
      return null;
    }
  },
  
  terminateWorker(name) {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
      console.log(`[WorkerPool] 终止 ${name} Worker`);
    }
  },
  
  clearAll() {
    this.workers.forEach((worker, name) => {
      worker.terminate();
      console.log(`[WorkerPool] 清理 ${name} Worker`);
    });
    this.workers.clear();
  },
  
  getStats() {
    return {
      active: this.workers.size,
      max: this.maxWorkers,
      names: Array.from(this.workers.keys())
    };
  }
};

async function loadSettingsFeature() {
  if (SettingsFeature) return SettingsFeature;
  if (settingsFeatureLoading) {
    while (settingsFeatureLoading) {
      await new Promise(r => setTimeout(r, 50));
    }
    return SettingsFeature;
  }
  
  settingsFeatureLoading = true;
  try {
    const module = await import('./features/settings.js');
    SettingsFeature = module.SettingsFeature;
    return SettingsFeature;
  } finally {
    settingsFeatureLoading = false;
  }
}

async function loadWebDAVFeature() {
  if (WebDAVFeature) return WebDAVFeature;
  if (webdavFeatureLoading) {
    while (webdavFeatureLoading) {
      await new Promise(r => setTimeout(r, 50));
    }
    return WebDAVFeature;
  }
  
  webdavFeatureLoading = true;
  try {
    const module = await import('./features/webdav.js');
    WebDAVFeature = module.WebDAVFeature;
    return WebDAVFeature;
  } finally {
    webdavFeatureLoading = false;
  }
}

let WORDS = [...DEFAULT_WORDS];

let semanticGraphWorker = null;
let semanticGraphCache = null;
let semanticGraphBuilding = false;
let semanticGraphCancelled = false;
let semanticGraphTimerId = null;

function initSemanticGraphWorker() {
  if (semanticGraphWorker) return;
  
  // file:// 协议下无法创建 Worker，直接跳过
  if (isFileProtocol()) {
    console.log('[Semantic] file:// 协议下跳过 Worker，使用主线程处理');
    return;
  }
  
  try {
    semanticGraphWorker = new Worker(
      new URL('./workers/semantic-worker.js', import.meta.url),
      { type: 'module' }
    );
  } catch (e) {
    console.error('创建 Semantic Worker 失败:', e.message);
    semanticGraphWorker = null;
  }
}

/**
 * @param {Array<{id: number, word: string, level: string}>} words
 * @param {number} [threshold=2]
 * @returns {Promise<Object|null>}
 */
async function buildSemanticGraphAsync(words, threshold = 2) {
  if (semanticGraphCache) return semanticGraphCache;
  if (semanticGraphBuilding) return null;

  // 灏濊瘯浠?IndexedDB 鍔犺浇 BK-Tree 缂撳瓨
  let cachedBKTree = null;
  if (db.instance) {
    try {
      cachedBKTree = await db.getSerializedBKTree();
      if (cachedBKTree) {
        // BK-Tree 从 IndexedDB 缓存加载成功
      }
    } catch (e) {
      console.log('BK-Tree 缓存读取失败，将重新构建');
    }
  }

  semanticGraphBuilding = true;
  initSemanticGraphWorker();

  if (semanticGraphCancelled) {
    semanticGraphBuilding = false;
    return Promise.resolve(null);
  }

  // 如果 worker 创建失败（如 file:// 协议），直接返回 null
  if (!semanticGraphWorker) {
    console.log('[Semantic] Worker 不可用，跳过语义图谱构建');
    semanticGraphBuilding = false;
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    if (semanticGraphCancelled) {
      if (semanticGraphWorker) {
        semanticGraphWorker.terminate();
        semanticGraphWorker = null;
      }
      semanticGraphBuilding = false;
      resolve(null);
      return;
    }
    // 如果有缓存，直接发送给 Worker 加载
    if (cachedBKTree) {
      semanticGraphWorker.postMessage({ 
        words, 
        threshold, 
        cachedBKTree 
      });
    } else {
      // 否则发送构建指令
      semanticGraphWorker.postMessage({
        words, 
        threshold,
        loadFromDB: true 
      });
    }

    semanticGraphWorker.onmessage = async (e) => {
      if (semanticGraphCancelled) {
        semanticGraphWorker.terminate();
        semanticGraphWorker = null;
        semanticGraphBuilding = false;
        resolve(null);
        return;
      }
      if (e.data.type === 'SAVE_TREE') {
        if (db.instance) {
          try {
            // 鍚屾椂淇濆瓨鍒?IndexedDB 鍜?localStorage锛堝吋瀹规棫鐗堬級
            await db.saveSerializedBKTree(e.data.data);
            localStorage.setItem('cet46_semantic_bktree', e.data.data);
            console.log(`BK-Tree 已保存到 IndexedDB，单词数：${e.data.wordCount}`);
          } catch (e) {
            console.warn('BK-Tree 保存失败:', e);
          }
        }
        return;
      }
      
      if (e.data.type === 'complete') {
        semanticGraphCache = e.data.results;

        if (db.instance) {
          try {
            await db.save('session', { key: 'semantic_graph_cache', data: semanticGraphCache });
            console.log('语义图谱已持久化到 IndexedDB');
          } catch (e) {
            console.warn('语义图谱缓存保存失败:', e);
          }
        }

        semanticGraphWorker.terminate();
        semanticGraphWorker = null;
        semanticGraphBuilding = false;

        resolve(semanticGraphCache);
      } else if (e.data.type === 'progress') {
        console.log(`语义图谱构建进度：${Math.round(e.data.progress * 100)}%`);
      }
    };

    semanticGraphWorker.postMessage({
      words: words.map(w => w.word),
      threshold
    });
  });
}

function findConfusingWords(word) {
  const confusing = [];
  
  for (const pair of CONFUSING_PAIRS) {
    if (pair.includes(word)) {
      confusing.push(...pair.filter(w => w !== word));
    }
  }
  
  const semanticCluster = SEMANTIC_CLUSTERS[word];
  if (semanticCluster) {
    confusing.push(...semanticCluster);
  }
  
  if (semanticGraphCache && semanticGraphCache[word]) {
    confusing.push(...semanticGraphCache[word].map(item => item.word));
  }
  
  return [...new Set(confusing)];
}

/**
 * @returns {Promise<void>}
 */
async function initSemanticGraphInBackground() {
  if (semanticGraphCache || semanticGraphBuilding) return;
  semanticGraphTimerId = setTimeout(() => {
    if (!semanticGraphCancelled) {
      buildSemanticGraphAsync(WORDS, 2);
    }
  }, CONSTANTS.SEMANTIC_GRAPH_DEFER_MS);
}

/**
 * @returns {void}
 */
function cleanupSemanticGraph() {
  semanticGraphCancelled = true;
  if (semanticGraphTimerId) {
    clearTimeout(semanticGraphTimerId);
    semanticGraphTimerId = null;
  }
  if (semanticGraphWorker) {
    semanticGraphWorker.terminate();
    semanticGraphWorker = null;
  }
  semanticGraphBuilding = false;
}

function adjustForSemanticInterference(wordId, baseInterval) {
  const word = WORDS.find(w => w.id === wordId);
  if (!word) return baseInterval;
  
  const confusingWords = findConfusingWords(word.word);
  if (confusingWords.length === 0) return baseInterval;
  
  let interferenceCount = 0;
  const data = getData();
  
  for (const confusingWord of confusingWords) {
    const confusingEntry = WORDS.find(w => w.word === confusingWord);
    if (confusingEntry) {
      const wd = data[confusingEntry.id];
      if (wd && wd.status === 'review' && wd.nextReview > Date.now()) {
        const timeDiff = Math.abs(wd.nextReview - (Date.now() + baseInterval));
        if (timeDiff < 24 * 60 * 60 * 1000) {
          interferenceCount++;
        }
      }
    }
  }
  
  if (interferenceCount > 0) {
    const adjustmentFactor = 1 + (interferenceCount * 0.3);
    AppState.set('semanticInterfered', true);
    return Math.round(baseInterval * adjustmentFactor);
  }
  
  AppState.set('semanticInterfered', false);
  return baseInterval;
}

const vocabProcessor = {
  processing: false,
  async processJSON(jsonStr, onProgress) {
    return new Promise((resolve, reject) => {
      if (this.processing) {
        reject(new Error('宸叉湁澶勭悊浠诲姟鍦ㄨ繘琛屼腑'));
        return;
      }
      this.processing = true;

      // file:// 协议下无法创建 Worker，使用主线程处理
      if (isFileProtocol()) {
        console.log('[Vocab] file:// 协议下使用主线程处理词库 JSON');
        try {
          const data = JSON.parse(jsonStr);
          const rawWords = Array.isArray(data) ? data : (data.words || []);
          
          const processed = rawWords.map((w, i) => ({
            id: w.id || i + 1,
            word: (w.word || '').trim(),
            phonetic: w.phonetic || '',
            meaning: w.meaning || '',
            example: w.example || '',
            level: w.level || 'CET4'
          })).filter(w => w.word.length > 0);
          
          this.processing = false;
          if (onProgress) onProgress(100);
          resolve({ result: processed, count: processed.length });
        } catch (err) {
          this.processing = false;
          reject(new Error('JSON 鏍煎紡瑙ｆ瀽澶辫触: ' + err.message));
        }
        return;
      }

      try {
        const worker = new Worker(
          new URL('./workers/vocab-worker.js', import.meta.url),
          { type: 'module' }
        );

        const handler = (event) => {
          const { type, result, count, message } = event.data;

          if (type === 'SUCCESS') {
            this.processing = false;
            worker.removeEventListener('message', handler);
            if (onProgress) onProgress(100);
            worker.terminate();
            resolve({ result, count });
          } else if (type === 'ERROR') {
            this.processing = false;
            worker.removeEventListener('message', handler);
            worker.terminate();
            reject(new Error(message));
          }
        };

        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'PROCESS_JSON', payload: jsonStr });
        if (onProgress) onProgress(10);
        
      } catch (e) {
        this.processing = false;
        console.error('创建 Vocab Worker 失败:', e.message);
        reject(e);
      }
    });
  }
};

/**
 * @param {Array<{word: string}>} words
 * @returns {Promise<void>}
 */
async function prefetchAudioLibrary(words) {
  const maxWords = CONSTANTS.AUDIO_PREFETCH_MAX;
  const wordsToPrefetch = words.slice(0, maxWords);
  const CONCURRENCY = CONSTANTS.AUDIO_PREFETCH_CONCURRENCY;
  const DELAY_BETWEEN_BATCHES = CONSTANTS.AUDIO_PREFETCH_BATCH_DELAY;
  
  for (let i = 0; i < wordsToPrefetch.length; i += CONCURRENCY) {
    const batch = wordsToPrefetch.slice(i, i + CONCURRENCY);
    const batchPromises = batch.map(w => {
      if (w.word && navigator.serviceWorker && navigator.serviceWorker.controller) {
        const originalUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w.word)}&type=2`;
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_AUDIO', url: originalUrl });
      }
      return Promise.resolve();
    });
    
    await Promise.all(batchPromises);
    
    if (i % (10 * CONCURRENCY) === 0) {
      const progress = Math.min(i + CONCURRENCY, maxWords);
      console.log(`已预缓存 ${progress} / ${maxWords} 个音频`);
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
  }
}

function saveMnemonic(wordId, mnemonic) {
  const wd = { ...getWordData(wordId) };
  wd.mnemonic = mnemonic;
  setWordData(wordId, wd);
  
  if (db.instance) {
    db.save('progress', { id: wordId, ...wd });
  }
}

function getMnemonic(wordId) {
  const wd = getWordData(wordId);
  return wd.mnemonic || '';
}

const CONSTANTS = {
  OVERLOAD_THRESHOLD: 200,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  DEFAULT_STUDY_LIMIT: 20,
  QUICK_REVIEW_LIMIT: 50,
  AUDIO_PREFETCH_MAX: 500,
  AUDIO_PREFETCH_CONCURRENCY: 10,
  AUDIO_PREFETCH_BATCH_DELAY: 100,
  SEMANTIC_GRAPH_DEFER_MS: 5000
};

function updateStats() {
  if (!WORDS || WORDS.length === 0) {
    console.error('[updateStats] WORDS 为空！这是一个严重问题！');
  }
  
  const data = getData();
  let newCount = 0, reviewCount = 0, masteredCount = 0;
  let todayReviewCount = 0;
  const today = new Date().toISOString().split('T')[0];

  WORDS.forEach(w => {
    const wd = data[w.id];
    if (!wd || wd.status === 'new') newCount++;
    else if (wd.status === 'review') {
      reviewCount++;
      if (wd.nextReviewDate === today) todayReviewCount++;
    }
    else if (wd.status === 'mastered') masteredCount++;
  });

  document.getElementById('stat-total').textContent = WORDS.length;
  document.getElementById('stat-new').textContent = newCount;
  document.getElementById('stat-review').textContent = reviewCount;
  document.getElementById('stat-mastered').textContent = masteredCount;

  checkMemoryOverload(todayReviewCount);
}

function checkMemoryOverload(todayCount) {
  const studyView = document.getElementById('view-study');
  let banner = document.getElementById('overload-banner');

  if (todayCount > CONSTANTS.OVERLOAD_THRESHOLD) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'overload-banner';
      banner.style.cssText = 'background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; text-align: center;';

      const title = document.createElement('div');
      title.style.cssText = 'font-weight: bold; font-size: 1.1rem;';
      title.textContent = '记忆负载过高';

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size: 0.9rem; margin-top: 0.3rem;';
      desc.textContent = `今日待复习 ${todayCount} 词，建议先消化积压内容`;

      const btn = document.createElement('button');
      btn.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e53e3e; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;';
      btn.textContent = '进入快速回顾';
      btn.addEventListener('click', enterQuickReviewMode);

      banner.append(title, desc, btn);
      if (studyView) studyView.insertBefore(banner, studyView.firstChild);
    }
  } else if (banner) {
    banner.remove();
  }
}

function enterQuickReviewMode() {
  const data = getData();
  const today = new Date().toISOString().split('T')[0];
  
  const quickQueue = WORDS.filter(w => {
    const wd = data[w.id];
    return wd && wd.status === 'review' && wd.nextReviewDate === today;
  }).slice(0, CONSTANTS.QUICK_REVIEW_LIMIT);

  if (quickQueue.length === 0) {
    UI.toast('没有待复习单词', 'warning');
    return;
  }

  shuffle(quickQueue);
  
  StudyFeature.setWords(WORDS);
  StudyFeature.startStudy('all', CONSTANTS.QUICK_REVIEW_LIMIT, getData, memoryCache, db, { overrideQueue: quickQueue });
  
  UI.toast(`快速回顾模式：${quickQueue.length} 个单词`, 'success');
}

function switchTab(tab) {
  console.log(`[switchTab] 切换到标签 ${tab}`);

  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"], .tab-button[data-tab="${tab}"]`);
  document.querySelectorAll('.tab-btn, .tab-button').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  } else {
    console.error(`[switchTab] 未找到标签按钮 ${tab}`);
  }

  const targetView = document.getElementById(`view-${tab}`);
  if (!targetView) {
    console.error(`[switchTab] 未找到视图 view-${tab}`);
    return;
  }

  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  targetView.classList.add('active');

  if (tab === 'review') {
    ReviewFeature.updateReview(getWordData, MIN_EF, MAX_EF, FSRS_W);
  }
  if (tab === 'wrong') renderWrongList();
  if (tab === 'list') renderList();
  if (tab === 'stats') {
    renderHeatmap();
    renderStorageInfo();
  }

  repairVisibleUIText();
  repairRuntimeCorruptedUIText();
}

async function renderStorageInfo() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const percent = ((usage / quota) * 100).toFixed(2);
    const usedMB = (usage / 1024 / 1024).toFixed(1);
    const totalMB = (quota / 1024 / 1024).toFixed(0);

    const statusEl = document.getElementById('webdav-status');
    if (!statusEl) return;

    const existingStorage = statusEl.querySelector('.storage-info');
    if (existingStorage) existingStorage.remove();

    const storageDiv = document.createElement('div');
    storageDiv.className = 'storage-info';
    storageDiv.style.cssText = 'margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;';

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.75rem;';

    const label = document.createElement('span');
    label.textContent = '当前 PWA 缓存资源占用';

    const value = document.createElement('span');
    value.textContent = `${usedMB}MB / ${totalMB}MB`;

    row.appendChild(label);
    row.appendChild(value);

    const barContainer = document.createElement('div');
    barContainer.style.cssText = 'height: 4px; background: var(--border-color); border-radius: 2px; margin-top: 5px; overflow: hidden;';

    const barFill = document.createElement('div');
    barFill.style.cssText = `height: 100%; width: ${percent}%; background: ${percent > 80 ? 'var(--danger)' : 'var(--success)'};`;

    barContainer.appendChild(barFill);
    storageDiv.appendChild(row);
    storageDiv.appendChild(barContainer);
    if (isFileProtocol()) {
      const note = document.createElement('div');
      note.style.cssText = 'margin-top: 6px; font-size: 0.75rem; color: var(--gray);';
      note.textContent = '本地模式下部分云同步功能可能不可用';
      storageDiv.appendChild(note);
    }
    statusEl.appendChild(storageDiv);
  }
}

function renderHeatmap() {
  const heatmap = getHeatmap();
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const today = new Date();

  let streak = 0;
  let currentStreak = 0;

  const fragment = document.createDocumentFragment();

  for (let i = 49; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = heatmap[dateStr] || 0;

    let level = 0;
    if (count > 0) level = 1;
    if (count > 10) level = 2;
    if (count > 30) level = 3;
    if (count > 50) level = 4;
    if (count > 100) level = 5;

    const cell = document.createElement('div');
    cell.className = `heatmap-cell level-${level}`;
    cell.title = `${dateStr}: ${count} 词`;
    fragment.appendChild(cell);

    if (count > 0) {
      currentStreak++;
    } else if (i > 0) {
      if (currentStreak > streak) streak = currentStreak;
      currentStreak = 0;
    }
  }

  if (currentStreak > streak) streak = currentStreak;

  grid.innerHTML = '';
  grid.appendChild(fragment);
  document.getElementById('heatmap-streak').textContent = `连续 ${streak} 天`;

  const totalWords = Object.keys(getData()).length;
  const allData = getData();
  let totalEF = 0;
  let efCount = 0;
  Object.values(allData).forEach(wd => {
    if (wd.ef) {
      totalEF += wd.ef;
      efCount++;
    }
  });

  document.getElementById('stats-total-words').textContent = totalWords;
  document.getElementById('stats-avg-ef').textContent = efCount > 0 ? (totalEF / efCount).toFixed(2) : '2.5';
  document.getElementById('stats-days').textContent = Object.keys(heatmap).length;

  updateProgressEstimation();
  renderRetentionChart();
}

function renderRetentionChart() {
  const canvas = document.getElementById('retention-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const data = getData();
  const upcomingReviews = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  WORDS.forEach(w => {
    const wd = data[w.id];
    if (wd && wd.status === 'review' && wd.nextReview) {
      const reviewDate = new Date(wd.nextReview);
      reviewDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((reviewDate - today) / (24 * 60 * 60 * 1000));
      if (daysDiff >= 0 && daysDiff < 7) {
        upcomingReviews[daysDiff]++;
      }
    }
  });

  const totalUpcoming = upcomingReviews.reduce((a, b) => a + b, 0);
  document.getElementById('total-upcoming').textContent = `总计: ${totalUpcoming} 词`;

  const labels = ['今天', '+1天', '+2天', '+3天', '+4天', '+5天', '+6天'];
  const maxValue = Math.max(...upcomingReviews, 10);
  const barWidth = (rect.width - 60) / 7;
  const barGap = 8;
  const chartHeight = rect.height - 50;

  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#2d3748';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  upcomingReviews.forEach((count, i) => {
    const x = 30 + i * barWidth + barWidth / 2;
    const barHeight = (count / maxValue) * chartHeight * 0.7;
    const y = rect.height - 30 - barHeight;

    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, '#e2a053');
    gradient.addColorStop(1, '#b16223');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - barWidth / 2 + barGap / 2, y, barWidth - barGap, barHeight);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#2d3748';
    ctx.fillText(count.toString(), x, y - 5);
    ctx.fillText(labels[i], x, rect.height - 10);
  });

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(20, rect.height - 30);
  ctx.lineTo(rect.width - 20, rect.height - 30);
  ctx.stroke();
}

function updateProgressEstimation() {
  const heatmap = getHeatmap();
  const dates = Object.keys(heatmap).sort();
  const estElement = document.getElementById('stats-est-date');

  if (!estElement) return;

  const data = getData();
  let masteredCount = 0;
  WORDS.forEach(w => {
    const wd = data[w.id];
    if (wd && wd.status === 'mastered') masteredCount++;
  });
  const remaining = WORDS.length - masteredCount;

  if (dates.length < 3 || masteredCount < 5) {
    estElement.textContent = '继续学习后生成预测';
    return;
  }

  const last14Days = dates.slice(-14);
  const dailyMastery = [];
  
  for (let i = 1; i < last14Days.length; i++) {
    const prevDate = last14Days[i - 1];
    const currDate = last14Days[i];
    const prevMastered = memoryCache.progressSnapshot?.[prevDate]?.mastered || 0;
    const currMastered = memoryCache.progressSnapshot?.[currDate]?.mastered || 0;
    const dailyGain = Math.max(0, currMastered - prevMastered);
    if (dailyGain > 0) dailyMastery.push(dailyGain);
  }

  let avgMasteryRate;
  if (dailyMastery.length >= 3) {
    const recent = dailyMastery.slice(-7);
    avgMasteryRate = recent.reduce((a, b) => a + b, 0) / recent.length;
  } else {
    const last7Days = dates.slice(-7);
    const totalActivity = last7Days.reduce((sum, date) => sum + (heatmap[date] || 0), 0);
    const avgActivity = totalActivity / Math.max(last7Days.length, 1);
    avgMasteryRate = Math.max(avgActivity * 0.15, 1);
  }

  avgMasteryRate = Math.max(avgMasteryRate, 0.5);

  const daysToFinish = Math.ceil(remaining / avgMasteryRate);
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + daysToFinish);

  estElement.innerHTML = `<strong>${estDate.getMonth() + 1} 月 ${estDate.getDate()} 日</strong>（${daysToFinish} 天后）`;
}

async function saveDailyProgressSnapshot() {
  const today = new Date().toISOString().split('T')[0];
  const data = getData();
  let masteredCount = 0;
  WORDS.forEach(w => {
    const wd = data[w.id];
    if (wd && wd.status === 'mastered') masteredCount++;
  });

  if (!memoryCache.progressSnapshot) {
    memoryCache.progressSnapshot = {};
  }
  memoryCache.progressSnapshot[today] = { mastered: masteredCount };

  if (db.instance) {
    await db.save('session', { 
      key: 'progressSnapshot', 
      data: memoryCache.progressSnapshot 
    });
  }
}

function getWrongWordsList() {
  const wrongWords = getWrongWords();
  const list = [];
  const entries = wrongWords && typeof wrongWords.entries === 'function'
    ? wrongWords.entries()
    : Object.entries(wrongWords || {});

  for (const [id, wrongData] of entries) {
    const w = WORDS.find(word => word.id === parseInt(id));
    if (w) {
      list.push({
        ...w,
        meaning: getDisplayMeaning(w) || getDisplayMeaning(wrongData),
        wrongData
      });
    }
  }

  return list.sort((a, b) => b.wrongData.count - a.wrongData.count);
}

function renderWrongList() {
  const wrongWords = getWrongWordsList();
  const container = document.getElementById('wrong-list');
  if (!container) {
    console.warn('[renderWrongList] wrong-list 容器不存在');
    return;
  }

  let totalErrors = 0;
  wrongWords.forEach(w => totalErrors += w.wrongData.count);

  const wrongCountEl = document.getElementById('wrong-count');
  const wrongTotalErrorsEl = document.getElementById('wrong-total-errors');
  if (wrongCountEl) wrongCountEl.textContent = wrongWords.length;
  if (wrongTotalErrorsEl) wrongTotalErrorsEl.textContent = totalErrors;

  renderErrorAnalysis(wrongWords);

  if (wrongWords.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>当前没有错题</p></div>';
    return;
  }

  container.innerHTML = '';
  
  wrongWords.forEach(w => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.dataset.action = 'show-detail';
    div.dataset.id = w.id;
    div.style.cursor = 'pointer';
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'list-item-left';
    
    const wordDiv = document.createElement('div');
    wordDiv.className = 'list-item-word';
    wordDiv.textContent = w.word;
    const small = document.createElement('small');
    small.textContent = w.level;
    wordDiv.appendChild(small);
    
    const pronDiv = document.createElement('div');
    pronDiv.className = 'list-item-pron';
    pronDiv.textContent = w.phonetic;
    
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'list-item-meaning';
    meaningDiv.textContent = getDisplayMeaning(w);
    
    leftDiv.appendChild(wordDiv);
    leftDiv.appendChild(pronDiv);
    leftDiv.appendChild(meaningDiv);
    
    const badge = document.createElement('span');
    badge.className = 'badge badge-danger';
    badge.textContent = `${w.wrongData.count} 次`;
    
    div.appendChild(leftDiv);
    div.appendChild(badge);

    container.appendChild(div);
  });
}

function renderErrorAnalysis(wrongWords) {
  const container = document.getElementById('error-analysis-content');
  
  if (wrongWords.length === 0) {
    container.innerHTML = '<div style="color: var(--success);">暂无错误数据</div>';
    return;
  }

  const suffixCount = {};
  const lengthDistribution = { short: 0, medium: 0, long: 0 };
  const timeDistribution = {};
  let totalErrorCount = 0;

  wrongWords.forEach(w => {
    const word = w.word;
    totalErrorCount += w.wrongData.count;

    const suffixes = ['tion', 'sion', 'ment', 'ness', 'ity', 'able', 'ible', 'ous', 'ive', 'al', 'er', 'or', 'ly', 'ed', 'ing', 'ate', 'fy', 'ize'];
    suffixes.forEach(suffix => {
      if (word.endsWith(suffix)) {
        suffixCount[suffix] = (suffixCount[suffix] || 0) + w.wrongData.count;
      }
    });

    if (word.length <= 5) lengthDistribution.short++;
    else if (word.length <= 8) lengthDistribution.medium++;
    else lengthDistribution.long++;

    if (w.wrongData.lastWrong) {
      const hour = new Date(w.wrongData.lastWrong).getHours();
      const timeSlot = Math.floor(hour / 4) * 4;
      const slotLabel = `${timeSlot}:00-${timeSlot + 4}:00`;
      timeDistribution[slotLabel] = (timeDistribution[slotLabel] || 0) + w.wrongData.count;
    }
  });

  const fragment = document.createDocumentFragment();

  const topSuffix = Object.entries(suffixCount).sort((a, b) => b[1] - a[1])[0];
  if (topSuffix && topSuffix[1] >= 2) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    div.innerHTML = `后缀提示：<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">-${escapeHtml(String(topSuffix[0]))}</code> 出现较多（${topSuffix[1]} 次），建议集中记忆这一类词形。`;
    fragment.appendChild(div);
  }

  const maxLenType = Object.entries(lengthDistribution).sort((a, b) => b[1] - a[1])[0];
  const lenLabels = { short: '短词（1-5 字母）', medium: '中等词（6-8 字母）', long: '长词（9 字母以上）' };
  if (maxLenType[1] >= 3) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    let text = `长度分布：错误更集中在 <strong>${lenLabels[maxLenType[0]]}</strong>（${maxLenType[1]} 词）。`;
    if (maxLenType[0] === 'long') {
      text += ' 可以把长词拆分成词根词缀来记忆。';
    } else if (maxLenType[0] === 'short') {
      text += ' 注意区分近形词与常见短词混淆。';
    } else {
      text += ' 适合按主题批量复习。';
    }
    div.innerHTML = text;
    fragment.appendChild(div);
  }

  const topTimeSlot = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topTimeSlot) {
    const hour = parseInt(topTimeSlot[0]);
    let timeAdvice = '';
    if (hour >= 22 || hour < 2) {
      timeAdvice = '深夜学习效率偏低，建议调整到白天复习';
    } else if (hour >= 14 && hour < 18) {
      timeAdvice = '下午容易疲劳，建议缩短单次学习时长';
    } else if (hour >= 6 && hour < 10) {
      timeAdvice = '早晨学习前先进入状态，效果会更好';
    } else {
      timeAdvice = '注意保持专注，避免分心';
    }
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    div.innerHTML = `${escapeHtml(timeAdvice)}。错误高峰时段：<strong>${escapeHtml(String(topTimeSlot[0]))}</strong>（${topTimeSlot[1]} 次）`;
    fragment.appendChild(div);
  }

  const avgErrors = (totalErrorCount / wrongWords.length).toFixed(1);
  const summaryDiv = document.createElement('div');
  summaryDiv.style.cssText = 'margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);';
  summaryDiv.innerHTML = `平均每个错词错误 <strong>${avgErrors}</strong> 次，当前共分析 <strong>${wrongWords.length}</strong> 个错词。`;
  fragment.appendChild(summaryDiv);

  container.innerHTML = '';
  container.appendChild(fragment);
}

function startWrongWordsStudy() {
  const wrongWords = getWrongWordsList();

  if (wrongWords.length === 0) {
    UI.toast('没有错题需要复习！', 'warning');
    return;
  }

  const wrongQueue = wrongWords.map(w => WORDS.find(word => word.id === w.id)).filter(Boolean);
  
  StudyFeature.setWords(WORDS);
  shuffle(wrongQueue);
  StudyFeature.startStudy('all', wrongQueue.length, getData, memoryCache, db, { overrideQueue: wrongQueue });

  switchTab('study');
}

const ITEM_HEIGHT = 80;
const VISIBLE_COUNT = 6;
let filteredWords = [];
let virtualScrollRAF = null;
let listItemPool = [];
const POOL_SIZE = VISIBLE_COUNT + 4;

function getOrCreateListItem() {
  let div;
  if (listItemPool.length > 0) {
    div = listItemPool.pop();
    div.replaceChildren();
    div.className = 'list-item';
    div.style.cssText = `height: ${ITEM_HEIGHT}px; box-sizing: border-box; cursor: pointer;`;
  } else {
    div = document.createElement('div');
    div.className = 'list-item';
    div.style.cssText = `height: ${ITEM_HEIGHT}px; box-sizing: border-box; cursor: pointer;`;
  }

  const leftDiv = document.createElement('div');
  leftDiv.className = 'list-item-left';

  const wordDiv = document.createElement('div');
  wordDiv.className = 'list-item-word';
  // 鍒涘缓鏂囨湰鑺傜偣鐢ㄤ簬鏄剧ず鍗曡瘝
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

function recycleListItem(div) {
  if (listItemPool.length < POOL_SIZE) {
    div.dataset.action = '';
    div.dataset.id = '';
    listItemPool.push(div);
  }
}

function renderVirtualList() {
  const container = document.getElementById('virtual-scroll-container');
  const content = document.getElementById('virtual-scroll-content');

  if (!container || !content) {
    console.error('[renderVirtualList] 容器不存在', { container: !!container, content: !!content });
    return;
  }

  const scrollTop = container.scrollTop;
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIndex = Math.min(startIndex + VISIBLE_COUNT + 2, filteredWords.length);

  const visibleItems = filteredWords.slice(startIndex, endIndex);

  const fragment = document.createDocumentFragment();
  const existingItems = content.querySelectorAll('.list-item');
  existingItems.forEach(item => recycleListItem(item));

  visibleItems.forEach((w, _index) => {
    if (!w || !w.id) {
      console.warn('[renderVirtualList] 璺宠繃鏃犳晥鍗曡瘝:', w);
      return;
    }
    
    const s = getWordStatus(w.id);
    const badgeClass = { new: 'badge-gray', review: 'badge-warning', mastered: 'badge-success', deleted: 'badge-danger' }[s] || 'badge-gray';
    const badgeText = { new: '未学习', review: '待复习', mastered: '已掌握', deleted: '已移除' }[s] || '未学习';

    const div = getOrCreateListItem();
    div.dataset.action = 'show-detail';
    div.dataset.id = w.id;

    const wordDiv = div.querySelector('.list-item-word');
    // childNodes[0] 是单词文本节点，small 用来显示级别标签
    if (wordDiv && wordDiv.childNodes[0]) {
      wordDiv.childNodes[0].textContent = (w.word || '未知单词') + ' ';
    }
    const smallEl = wordDiv ? wordDiv.querySelector('small') : null;
    if (smallEl) {
      smallEl.textContent = w.level || '';
    }

    const pronEl = div.querySelector('.list-item-pron');
    if (pronEl) {
      pronEl.textContent = w.phonetic || '';
    }
    
    const meaningEl = div.querySelector('.list-item-meaning');
    if (meaningEl) {
      meaningEl.textContent = getDisplayMeaning(w);
    }

    const badge = div.querySelector('.badge');
    if (badge) {
      badge.className = `badge ${badgeClass}`;
      badge.textContent = badgeText;
    }

    fragment.appendChild(div);
  });
  content.replaceChildren(fragment);
}

function debouncedRenderVirtualList() {
  if (virtualScrollRAF) cancelAnimationFrame(virtualScrollRAF);
  virtualScrollRAF = requestAnimationFrame(renderVirtualList);
}

function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedRenderList = debounce(() => {
  const container = document.getElementById('virtual-scroll-container');
  if (container) container.scrollTop = 0;
  renderList();
}, 300);

function renderList() {
  if (!WORDS || WORDS.length === 0) {
    console.error('[renderList] WORDS 为空，无法渲染词库列表！');
    return;
  }

  const searchInput = document.getElementById('search-input');
  const levelSelect = document.getElementById('filter-level');
  const statusSelect = document.getElementById('filter-status');

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const level = levelSelect ? levelSelect.value : 'all';
  const status = statusSelect ? statusSelect.value : 'all';

  filteredWords = WORDS.filter((w) => {
    const matchSearch = !search || w.word.toLowerCase().includes(search) || getDisplayMeaning(w).toLowerCase().includes(search);
    const matchLevel = level === 'all' || w.level === level;
    const s = getWordStatus(w.id);
    const matchStatus = status === 'all' || s === status;
    return matchSearch && matchLevel && matchStatus;
  });
  
  console.log('[renderList] 綃涢€夊悗鍗曡瘝鏁伴噺:', filteredWords.length);

  const container = document.getElementById('virtual-scroll-container');
  const pagination = document.getElementById('pagination-controls');

  if (filteredWords.length === 0) {
    if (container) {
      const scrollContent = document.getElementById('virtual-scroll-content');
      if (scrollContent) {
        scrollContent.innerHTML = '<div class="empty-state" style="height: 200px;"><p>没有找到匹配的单词</p><p style="font-size:12px;color:#999;">请检查搜索词、词库范围和学习状态筛选条件。</p></div>';
      }
    }
    if (pagination) pagination.style.display = 'none';
    return;
  }

  renderVirtualList();
  if (pagination) pagination.style.display = 'none';
}

function showWordDetail(id) {
  const w = WORDS.find(word => word.id === id);
  if (!w) return;

  setSafeWordHeader('study-word', w.word, w.level);

  const pronEl = document.getElementById('study-pron');
  const meaningEl = document.getElementById('study-meaning');
  const exampleEl = document.getElementById('study-example');
  if (pronEl) pronEl.textContent = w.phonetic;
  if (meaningEl) meaningEl.textContent = getDisplayMeaning(w);
  if (exampleEl) exampleEl.textContent = w.example;

  switchTab('study');

  const startBtn = document.getElementById('start-btn');
  const studyButtons = document.getElementById('study-buttons');
  const studyProgress = document.getElementById('study-progress');
  const cycleBanner = document.getElementById('cycle-banner');

  if (startBtn) startBtn.style.display = 'block';
  if (studyButtons) studyButtons.style.display = 'none';
  if (studyProgress) studyProgress.style.display = 'none';
  if (cycleBanner) cycleBanner.style.display = 'none';
}

async function loadCustomVocab(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoadingOverlay(true, '正在解析词库...', 10);

  const reader = new FileReader();
  reader.onload = async function(e) {
    const jsonStr = e.target.result;
    
    try {
      const { result, count } = await vocabProcessor.processJSON(jsonStr, (progress) => {
        updateLoadingProgress(progress, '正在处理词库数据...');
      });
      
      updateLoadingProgress(50, '正在写入本地数据...');
      
      WORDS = result;
      
      if (db.instance) {
        await db.clear('words');
        await db.bulkSave('words', result, (progress) => {
          updateLoadingProgress(50 + progress * 0.5, `正在写入本地数据（${Math.round(progress)}%）...`);
        });
        console.log(`??????? IndexedDB: ${count} ???`);
      }

      updateLoadingProgress(100, '处理完成');
      
      setTimeout(async () => {
        showLoadingOverlay(false);
        updateStats();
        renderList();
        
        setTimeout(async () => {
          await prefetchAudioLibrary(result);
        }, 1000);
        
        UI.toast(`词库导入成功，共 ${count} 个单词`, 'success');
      }, 300);
      
    } catch (err) {
      showLoadingOverlay(false);
      console.error('导入失败:', err);
      UI.toast(`导入失败：${err.message}`, 'error');
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = () => {
    showLoadingOverlay(false);
    UI.toast('文件读取失败', 'error');
    event.target.value = '';
  };
  reader.readAsText(file);
}

let visualViewportHandler = null;

function handleVisualViewportResize() {
  const modalBox = document.querySelector('.spelling-modal.active .spelling-box');
  if (!modalBox) return;

  const offset = window.innerHeight - window.visualViewport.height;

  if (offset > 0) {
    modalBox.style.transform = `translateY(-${offset / 2.5}px)`;
    modalBox.style.transition = 'transform 0.2s ease-out';
  } else {
    modalBox.style.transform = 'translateY(0)';
  }
}

function addVisualViewportListener() {
  if (window.visualViewport && !visualViewportHandler) {
    visualViewportHandler = handleVisualViewportResize;
    window.visualViewport.addEventListener('resize', visualViewportHandler, { passive: true });
  }
}

function removeVisualViewportListener() {
  if (window.visualViewport && visualViewportHandler) {
    window.visualViewport.removeEventListener('resize', visualViewportHandler);
    visualViewportHandler = null;
  }
}

async function initializeFeatures() {
  console.log(`[initializeFeatures] 寮€濮嬪垵濮嬪寲锛學ORDS 鏁伴噺: ${WORDS?.length || 0}`);

  try {
    if (!WORDS || WORDS.length === 0) {
      console.error('[initializeFeatures] WORDS ????? DEFAULT_WORDS ????');
      WORDS = [...DEFAULT_WORDS];
    }

    console.log('[initializeFeatures] 设置 StudyFeature 词库...');
    StudyFeature.setWords(WORDS);
    console.log('[initializeFeatures] 设置 ReviewFeature 词库...');
    ReviewFeature.setWords(WORDS);
    
    console.log('[initializeFeatures] 鍔犺浇璁剧疆...');
    const settings = await loadSettingsFeature();
    if (settings) {
      settings.setWords(WORDS);
    }

    console.log('[initializeFeatures] 鍒濆鍖?SpellingFeature...');
    SpellingFeature.init({
      get studyQueue() { return StudyFeature.studyQueue; },
      get studyIndex() { return StudyFeature.studyIndex; },
      getWordData,
      setWordData,
      addWrongWord,
      removeWrongWord,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      updateProgress: StudyFeature.updateProgress,
      showStudyWord: () => StudyFeature.showStudyWord()
    });

    console.log('[initializeFeatures] 鍒濆鍖?miniGame...');
    miniGame.init();
    
    console.log('[initializeFeatures] 鍒濆鍖?engineVisualizer...');
    engineVisualizer.init();
    console.log('[initializeFeatures] 鍒濆鍖?pwaWidgets...');
    pwaWidgets.init();

    console.log('[initializeFeatures] 鍔犺浇 WebDAV...');
    const webdav = await loadWebDAVFeature();
    if (webdav) {
      webdav.init({
        updateStats,
        renderList
      });
    }

    if (settings) {
      settings.init({
        WORDS,
        updateStats,
        renderList
      });
    }
    
    console.log('[initializeFeatures] ?????');
  } catch (error) {
    console.error('[initializeFeatures] 鉂?鍒濆鍖栧け璐?', error);
    throw error;
  }
}

function bindStudyStartButton(session) {
  const startBtn = document.getElementById('start-btn');
  if (!startBtn) return;

  if (session && session.hasSession) {
    startBtn.textContent = `继续上次学习（剩余 ${session.session.queue.length} 词）`;
    startBtn.dataset.action = 'resume-study';
  } else {
    startBtn.textContent = '开始学习';
    startBtn.dataset.action = 'start-study';
    if (StudyFeature && typeof StudyFeature.resetStudyCard === 'function') {
      StudyFeature.resetStudyCard();
    }
  }

  repairVisibleUIText();
}

async function requestPersistentStorage() {
  // file:// 协议下无法请求持久化存储权限，直接跳过
  if (isFileProtocol()) {
    console.log('[Storage] file:// 协议下跳过持久化存储权限请求');
    return false;
  }
  
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.log('持久化存储权限已获取，数据将不会被浏览器自动清理');
      } else {
        console.warn('持久化存储权限被拒绝，浏览器可能在磁盘空间不足时清理数据');
      }
      return isPersisted;
    } catch (e) {
      console.warn('请求持久化存储失败', e);
      return false;
    }
  }
  return false;
}

async function initApp() {
  setupNetworkStatusListener();
  initSwipeGestures();
  WebVitals.init();

  setupReactiveBindings();

  Skeleton.showWordCardLoading('study-card');
  Skeleton.showListLoading('virtual-scroll-content', 6);

  let dbAvailable = false;

  try {
    await db.init();
    dbAvailable = true;

    if (dbAvailable) {
      requestPersistentStorage();
    }
    
    const dbWords = await db.getAll('words');
    if (dbWords && dbWords.length > 0) {
      WORDS = dbWords;
      console.log(`? IndexedDB ????: ${WORDS.length} ???`);
    } else {
      await db.bulkSave('words', DEFAULT_WORDS);
      WORDS = [...DEFAULT_WORDS];
      console.log(`????????????: ${WORDS.length} ???`);
    }
    
    // 关键修复：确保 WORDS 始终有数据
    if (!WORDS || WORDS.length === 0) {
      console.warn('[initApp] WORDS ?????????????');
      WORDS = [...DEFAULT_WORDS];
    }

    await loadFromIndexedDB();
    console.log('IndexedDB 数据已加载');

    if (dbAvailable && db.instance) {
      try {
        const actionStackData = await db.getAll('actionStack');
        if (actionStackData && actionStackData.length > 0) {
          const actions = actionStackData
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(item => item.action);
          restoreActionStack(actions);
        }
      } catch (stackErr) {
        console.warn('恢复 actionStack 失败:', stackErr);
      }
    }
  } catch (err) {
    console.log('IndexedDB 不可用，使用内存模式:', err);
    dbAvailable = false;
    // 关键修复：即使 IndexedDB 失败，也要确保 WORDS 有数据
    if (!WORDS || WORDS.length === 0) {
      WORDS = [...DEFAULT_WORDS];
      console.log(`[initApp] IndexedDB ????????? ${WORDS.length} ???`);
    }
  }

  if (!dbAvailable) {
    const storageError = document.createElement('div');
    storageError.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f56565;color:white;padding:10px;text-align:center;z-index:9999;font-size:14px;';
    storageError.textContent = '本地数据库不可用，当前已切换到内存模式。';
    document.body.appendChild(storageError);
  }

  await initializeFeatures();

  initTheme();
  loadWebDAVConfig();
  updateStats();
  
  // 鍏堥殣钘忛鏋跺睆锛屽啀娓叉煋鍒楄〃
  Skeleton.hide('study-card');
  Skeleton.hide('virtual-scroll-content');
  
  renderList();
  
  const sessionResult = await StudyFeature.checkStudySession(memoryCache, db);
  bindStudyStartButton(sessionResult);
  repairVisibleUIText();

  saveDailyProgressSnapshot();
  initSemanticGraphInBackground();
  checkAndShowMilestones();
  console.log('引擎已启动，词库容量:', WORDS.length);
  
  // TODO: 初始化环境粒子系统
  // particleSystem.init();
  
  window.addEventListener('beforeunload', cleanupSemanticGraph);
  
  if (typeof window !== 'undefined') {
    window.perfMonitor = performanceMonitor;
    window.showPerfPanel = () => performanceMonitor.showPerformancePanel();
    window.particleSystem = particleSystem; // 暴露给调试
    window.WORDS = WORDS; // 暴露词库给调试
    window.filteredWords = filteredWords; // 暴露筛选结果给调试

    // 调试功能：强制重置词库
    window.resetVocabulary = async () => {
      console.log('[Debug] 正在强制重置词库...');
      try {
        // 清空 IndexedDB 中的词库
        const allWords = await db.getAll('words');
        for (const w of allWords) {
          await db.delete('words', w.id);
        }
        console.log('[Debug] 已清空 IndexedDB 词库');
        
        // 重新保存默认词库
        for (const w of DEFAULT_WORDS) {
          await db.save('words', w);
        }
        WORDS = [...DEFAULT_WORDS];
        console.log(`[Debug] ????????? ${WORDS.length} ???`);
        
        // 重新初始化词库引用
        StudyFeature.setWords(WORDS);
        ReviewFeature.setWords(WORDS);
        renderList();
        
        alert(`词库已重置，当前共 ${WORDS.length} 个单词`);
      } catch (e) {
        console.error('[Debug] 重置词库失败:', e);
        alert('重置词库失败：' + e.message);
      }
    };
    
    // 调试功能：检查词库状态
    window.checkVocabulary = () => {
      console.log('[Debug] ========== 词库状态检查 ==========');
      console.log('[Debug] WORDS 长度:', WORDS?.length || 0);
      console.log('[Debug] DEFAULT_WORDS 长度:', DEFAULT_WORDS?.length || 0);
      console.log('[Debug] filteredWords 长度:', filteredWords?.length || 0);
      console.log('[Debug] StudyFeature.WORDS 长度:', StudyFeature?.WORDS?.length || 0);
      console.log('[Debug] ====================================');
      return {
        wordsLength: WORDS?.length || 0,
        defaultWordsLength: DEFAULT_WORDS?.length || 0,
        filteredWordsLength: filteredWords?.length || 0,
        studyFeatureWordsLength: StudyFeature?.WORDS?.length || 0
      };
    };
    
    console.log('[Debug] 调试功能已加载：');
    console.log('  - resetVocabulary() : 强制重置词库');
    console.log('  - checkVocabulary() : 检查词库状态');
  }

  const shortcutGuideShown = localStorage.getItem('cet46_shortcut_guide_shown');
  if (!shortcutGuideShown) {
    setTimeout(() => UI.showShortcutGuide(), 1000);
  }

  if (webdavConfig && webdavConfig.autoSync && webdavConfig.url) {
    console.log('启动时自动增量同步已启用');
    setTimeout(async () => {
      try {
        await WebDAVFeature.handleSyncFromWebDAV();
      } catch (e) {
        console.log('自动同步失败:', e);
      }
    }, 2000);
  }
}

document.addEventListener('keydown', (e) => {
  const spellingModal = document.getElementById('spelling-modal').classList.contains('active');

  if (spellingModal) {
    SpellingFeature.handleSpellingKeydown(e);
    return;
  }
  
  if (e.key === 'F12' && e.ctrlKey) {
    e.preventDefault();
    performanceMonitor.showPerformancePanel();
    return;
  }

  const studyView = document.getElementById('view-study').classList.contains('active');
  const reviewView = document.getElementById('view-review').classList.contains('active');

  if (studyView && document.getElementById('study-buttons').style.display !== 'none') {
    if (e.key === 'ArrowLeft') {
      StudyFeature.markWord(false);
    }
    if (e.key === 'ArrowRight') {
      StudyFeature.markWord(true);
    }
    if ((e.key === 'z' || e.key === 'Z') && e.ctrlKey) {
      e.preventDefault();
      undoLastAction();
    }
  }

  if (reviewView && document.getElementById('review-buttons').style.display !== 'none') {
    if (e.key === 'ArrowLeft') {
      ReviewFeature.markReviewWord(false, {
        getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
        adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
        removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
        showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
        playTone, fireConfetti
      });
    }
    if (e.key === 'ArrowRight') {
      ReviewFeature.markReviewWord(true, {
        getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
        adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
        removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
        showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
        playTone, fireConfetti
      });
    }
  }
});

// 注意：这些事件监听器已移到 DOMContentLoaded 中初始化，确保 DOM 已准备好
function initFilterEventListeners() {
  const searchInput = document.getElementById('search-input');
  const levelSelect = document.getElementById('filter-level');
  const statusSelect = document.getElementById('filter-status');
  const virtualContainer = document.getElementById('virtual-scroll-container');
  
  if (searchInput) {
    searchInput.addEventListener('input', debouncedRenderList);
  }
  
  if (levelSelect) {
    levelSelect.addEventListener('change', () => { 
      if (virtualContainer) virtualContainer.scrollTop = 0;
      renderList(); 
    });
  }
  
  if (statusSelect) {
    statusSelect.addEventListener('change', () => { 
      if (virtualContainer) virtualContainer.scrollTop = 0;
      renderList(); 
    });
  }
  
  if (virtualContainer) {
    virtualContainer.addEventListener('scroll', debouncedRenderVirtualList, { passive: true });
  }
}

if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('PWA Service Worker 注册成功');

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });

      if (reg.waiting && navigator.serviceWorker.controller) {
        showUpdateNotification();
      }
    }).catch(err => {
      console.log('Service Worker 注册失败:', err);
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('Service Worker 宸叉洿鏂帮紝椤甸潰鍗冲皢鍒锋柊');
      window.location.reload();
    });
  });
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--sv-panel-base) 0%, var(--sv-panel-shadow) 100%);
    color: var(--sv-text-main);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.95rem;
    animation: slideUp 0.3s ease;
  `;
  
  const span = document.createElement('span');
  span.textContent = '发现新版本';
  
  const btn = document.createElement('button');
  btn.style.cssText = `
    background: white;
    color: var(--primary);
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
  `;
  btn.textContent = '立即更新';
  btn.addEventListener('click', updateApp);
  
  notification.appendChild(span);
  notification.appendChild(btn);
  document.body.appendChild(notification);
}

function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        reg.waiting.postMessage('skipWaiting');
      }
    });
  }
  const notification = document.getElementById('update-notification');
  if (notification) notification.remove();
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 50;
const SWIPE_TIME_THRESHOLD = 500;

function initSwipeGestures() {
  const studyCard = document.getElementById('study-card');
  const reviewCard = document.getElementById('review-card');
  
  if (studyCard) {
    studyCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    studyCard.addEventListener('touchend', handleStudyTouchEnd, { passive: true });
  }
  
  if (reviewCard) {
    reviewCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    reviewCard.addEventListener('touchend', handleReviewTouchEnd, { passive: true });
  }
}

function handleTouchStart(e) {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }
}

function handleStudyTouchEnd(e) {
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const deltaTime = Date.now() - touchStartTime;

  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > Math.abs(deltaX) || deltaTime > SWIPE_TIME_THRESHOLD) {
    return;
  }

  if (deltaX < 0) {
    StudyFeature.markWord(false);
    showSwipeFeedback('left');
  } else {
    StudyFeature.markWord(true);
    showSwipeFeedback('right');
  }
}

function handleReviewTouchEnd(e) {
  if (!ReviewFeature.reviewFlipped) return;
  
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const deltaTime = Date.now() - touchStartTime;
  
  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > Math.abs(deltaX) || deltaTime > SWIPE_TIME_THRESHOLD) {
    return;
  }
  
  if (deltaX < 0) {
    ReviewFeature.markReviewWord(false, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
      removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
      showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
      playTone, fireConfetti
    });
    showSwipeFeedback('left');
  } else {
    ReviewFeature.markReviewWord(true, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
      removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
      showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
      playTone, fireConfetti
    });
    showSwipeFeedback('right');
  }
}

function showSwipeFeedback(direction) {
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    ${direction === 'left' ? 'left: 20px' : 'right: 20px'};
    transform: translateY(-50%);
    font-size: 3rem;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1000;
    pointer-events: none;
  `;
  indicator.textContent = direction === 'left' ? '×' : '√';
  document.body.appendChild(indicator);
  
  requestAnimationFrame(() => {
    indicator.style.opacity = '1';
  });
  
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 200);
  }, 300);
}

function setupNetworkStatusListener() {
  const banner = document.getElementById('offline-banner');
  const offlineIndicator = document.getElementById('offline-indicator');
  const statusDot = document.getElementById('network-status-dot');

  async function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (banner) {
      banner.style.display = isOnline ? 'none' : 'block';
    }
    
    if (offlineIndicator) {
      if (isOnline) {
        offlineIndicator.textContent = '📦';
        offlineIndicator.title = '资源状态';
        offlineIndicator.setAttribute('aria-label', '资源状态');
        
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          try {
            const cacheNames = await caches.keys();
            const audioCache = cacheNames.find(name => name.includes('audio'));
            if (audioCache) {
              const cache = await caches.open(audioCache);
              const keys = await cache.keys();
              if (keys.length > 100) {
                offlineIndicator.title = `资源状态：已缓存 ${keys.length} 项离线资源`;
              }
            }
          } catch (e) {}
        }
      } else {
        offlineIndicator.textContent = '📴';
        offlineIndicator.title = '资源状态：当前为离线模式';
        offlineIndicator.setAttribute('aria-label', '资源状态');
      }
    }
    
    if (statusDot) {
      statusDot.className = isOnline ? 'status-dot online' : 'status-dot offline';
      statusDot.title = '网络状态';
      statusDot.setAttribute('aria-label', '网络状态');
    }
    
    ReactiveAppState.set('isOnline', isOnline);
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

function showResourceStatusPanel() {
  const isFileMode = isFileProtocol();
  const totalWords = Array.isArray(WORDS) ? WORDS.length : 0;
  UI.showStatusPanel('资源状态', [
    { label: '本地资源', value: isFileMode ? '已启用' : '按环境加载' },
    { label: '离线词库', value: totalWords > 0 ? `已加载 ${totalWords} 个词条` : '等待初始化' },
    { label: '当前模式', value: isFileMode ? 'file:// 本地版' : '在线版' }
  ], {
    note: isFileMode
      ? '当前为本地资源模式，常用词库已内置，可直接学习。'
      : '当前为在线模式，可按需使用缓存和同步功能。',
    closeText: '关闭说明'
  });
}

function showNetworkStatusPanel() {
  const isFileMode = isFileProtocol();
  const isOnline = navigator.onLine;
  const syncState = isFileMode
    ? '本地版不使用在线同步'
    : isOnline
      ? '可联网，可检查更新或同步'
      : '当前离线，暂不可同步';

  UI.showStatusPanel('网络状态', [
    { label: '网络连接', value: isOnline ? '在线' : '离线' },
    { label: '运行模式', value: isFileMode ? '本地模式' : '在线模式' },
    { label: '同步/更新', value: syncState }
  ], {
    note: isFileMode
      ? '你正在使用 file:// 本地版，适合离线学习。'
      : '在线模式下可继续使用同步、更新和远程资源能力。',
    closeText: '关闭说明'
  });
}

function setupReactiveBindings() {
  watch(['syncInProgress', 'isOnline'], (values, { key, newValue }) => {
    if (key === 'syncInProgress') {
      const syncBtn = document.getElementById('sync-btn');
      if (syncBtn) {
        syncBtn.disabled = newValue;
        syncBtn.textContent = newValue ? '同步中...' : '同步';
      }
    }
    
    if (key === 'isOnline') {
      const statusDot = document.getElementById('network-status-dot');
      if (statusDot) {
        statusDot.className = newValue ? 'status-dot online' : 'status-dot offline';
      }
    }
  });
  
  watch(['ui.isLoading'], (values) => {
    const app = document.getElementById('app');
    if (app) {
      if (values.ui.isLoading) {
        app.classList.add('loading');
      } else {
        app.classList.remove('loading');
      }
    }
  });
  
  computed(
    () => {
      const now = Date.now();
      const circadian = AppState.get('personalizedCircadian') || 1.0;
      return Object.values(memoryCache.progress || {}).filter(wd => {
        if (!wd.nextReview) return false;
        const adjustedNext = wd.nextReview * circadian;
        return adjustedNext <= now;
      }).length;
    },
    ['memoryCache.progress']
  );
  
  watch(['stats'], (_values) => {
    updateStats();
  });
  
  console.log('响应式绑定已设置');
}

function showMilestoneCelebration(type, _count) {
  const milestones = {
    'first-100': { emoji: '🎉', text: '首次掌握100词！' },
    'first-500': { emoji: '🏆', text: '突破500词大关！' },
    'first-1000': { emoji: '👑', text: '千词达成！学霸认证！' },
    'streak-7': { emoji: '🔥', text: '连续学习7天！' },
    'streak-30': { emoji: '💪', text: '坚持学习30天！' },
    'all-mastered': { emoji: '🎓', text: '全部掌握！恭喜毕业！' }
  };
  
  const milestone = milestones[type];
  if (!milestone) return;
  
  const celebration = document.createElement('div');
  celebration.className = 'milestone-celebration';
  celebration.innerHTML = `
    <div class="emoji">${milestone.emoji}</div>
    <div class="text">${milestone.text}</div>
  `;
  document.body.appendChild(celebration);
  
  fireConfetti();
  
  setTimeout(() => {
    celebration.style.animation = 'milestone-pop 0.3s ease reverse';
    setTimeout(() => celebration.remove(), 300);
  }, 2500);
}

function checkAndShowMilestones() {
  const data = getData();
  let masteredCount = 0;
  WORDS.forEach(w => {
    const wd = data[w.id];
    if (wd && wd.status === 'mastered') masteredCount++;
  });
  
  const milestones = JSON.parse(localStorage.getItem('cet46_milestones') || '{}');
  
  if (masteredCount >= 100 && !milestones['first-100']) {
    showMilestoneCelebration('first-100', 100);
    milestones['first-100'] = true;
  }
  if (masteredCount >= 500 && !milestones['first-500']) {
    showMilestoneCelebration('first-500', 500);
    milestones['first-500'] = true;
  }
  if (masteredCount >= 1000 && !milestones['first-1000']) {
    showMilestoneCelebration('first-1000', 1000);
    milestones['first-1000'] = true;
  }
  if (masteredCount >= WORDS.length && !milestones['all-mastered']) {
    showMilestoneCelebration('all-mastered', WORDS.length);
    milestones['all-mastered'] = true;
  }
  
  const heatmap = getHeatmap();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (heatmap[dateStr] > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  if (streak >= 7 && !milestones['streak-7']) {
    showMilestoneCelebration('streak-7', 7);
    milestones['streak-7'] = true;
  }
  if (streak >= 30 && !milestones['streak-30']) {
    showMilestoneCelebration('streak-30', 30);
    milestones['streak-30'] = true;
  }
  
  localStorage.setItem('cet46_milestones', JSON.stringify(milestones));
}

 

function setupGlobalEventDelegation() {
  const ACTION_HANDLERS = {
    'toggle-theme': () => toggleTheme(),
    'show-resource-status': () => showResourceStatusPanel(),
    'show-network-status': () => showNetworkStatusPanel(),
    'show-shortcut-guide': () => UI.showShortcutGuide(),
    
    // 导航栏动作
    'nav-study': () => {
      console.log('[Nav] ???????');
      switchTab('study');
    },
    'nav-review': () => {
      console.log('[Nav] ???????');
      switchTab('review');
    },
    'nav-wrong': () => {
      console.log('[Nav] ???????');
      switchTab('wrong');
    },
    'nav-stats': () => {
      console.log('[Nav] ???????');
      switchTab('stats');
    },
    'nav-list': () => {
      console.log('[Nav] ???????');
      switchTab('list');
    },
    
    'start-study': () => {
      const levelSelect = document.getElementById('study-level');
      const level = levelSelect ? levelSelect.value : 'all';
      console.log(`[Start Study] 绾у埆锛?{level}`);

      if (typeof StudyFeature !== 'undefined' && typeof StudyFeature.startStudy === 'function') {
        const result = StudyFeature.startStudy(level, CONSTANTS.DEFAULT_STUDY_LIMIT, getData, memoryCache, db);
        if (result) {
          console.log('[Start Study] 学习已启动');
        } else {
          console.warn('[Start Study] 学习启动失败');
        }
      } else {
        console.error('[Start Study] StudyFeature 鏈畾涔夛紒');
        alert('学习功能尚未就绪，请稍后重试');
      }
    },
    'resume-study': async () => {
      console.log('[Resume Study] 缁х画瀛︿範');
      const sessionResult = await StudyFeature.checkStudySession(memoryCache, db);
      if (!sessionResult || !sessionResult.hasSession || !sessionResult.session) {
        UI.toast && UI.toast('Session restore failed, started a new session', 'warning');
        const levelSelect = document.getElementById('study-level');
        const level = levelSelect ? levelSelect.value : 'all';
        StudyFeature.startStudy(level, CONSTANTS.DEFAULT_STUDY_LIMIT, getData, memoryCache, db);
        return;
      }

      const session = sessionResult.session;
      const levelSelect = document.getElementById('study-level');
      if (levelSelect && session.level) {
        levelSelect.value = session.level;
      }

      const resumed = await StudyFeature.resumeFromSession(session, memoryCache, db);
      if (resumed) {
        UI.toast && UI.toast('Resumed previous study session', 'success');
      } else {
        UI.toast && UI.toast('Session restore failed, started a new session', 'warning');
        StudyFeature.startStudy(session.level || 'all', CONSTANTS.DEFAULT_STUDY_LIMIT, getData, memoryCache, db);
      }
    },
    'mark-known': () => {
      console.log('[Mark Known] ?????');
      if (StudyFeature && StudyFeature.markWord) {
        StudyFeature.markWord(true);
      }
    },
    'mark-unknown': () => {
      console.log('[Mark Unknown] 标记为不认识');
      if (StudyFeature && StudyFeature.markWord) {
        StudyFeature.markWord(false);
      }
    },
    'open-spelling': () => SpellingFeature.openSpellingChallenge(),
    'toggle-cloze': () => StudyFeature.toggleClozeMode(),
    'save-mnemonic': () => StudyFeature.handleSaveMnemonic(saveMnemonic),
    'undo-action': () => undoLastAction(),
    
    'flip-review': () => ReviewFeature.flipReviewCard(),
    'review-known': () => ReviewFeature.markReviewWord(true, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
      removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
      showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
      playTone, fireConfetti
    }),
    'review-unknown': () => ReviewFeature.markReviewWord(false, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
      removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
      showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
      playTone, fireConfetti
    }),
    
    'study-wrong': () => startWrongWordsStudy(),
    
    'close-spelling': () => {
      removeVisualViewportListener();
      SpellingFeature.closeSpellingModal();
    },
    'submit-spelling': () => SpellingFeature.checkSpelling(),
    'spelling-mode-meaning': () => SpellingFeature.setSpellingMode('meaning'),
    'spelling-mode-phonetic': () => SpellingFeature.setSpellingMode('phonetic'),
    'spelling-mode-audio': () => SpellingFeature.setSpellingMode('audio'),
    'spelling-hint': () => SpellingFeature.giveSpellingHint(),
    
    'speak-study-word': (e) => { e.stopPropagation(); StudyFeature.speakCurrentWord(); },
    'speak-review-word': (e) => { e.stopPropagation(); ReviewFeature.speakReviewWord(); },
    'speak-spelling-word': () => SpellingFeature.replaySpellingAudio(),
    
    'toggle-webdav': () => WebDAVFeature ? WebDAVFeature.toggleWebDAVConfig() : console.warn('[WebDAV] ?????'),
    'save-webdav': () => WebDAVFeature ? WebDAVFeature.handleSaveWebDAVConfig() : console.warn('[WebDAV] ?????'),
    'test-webdav': () => WebDAVFeature ? WebDAVFeature.handleTestWebDAVConnection() : console.warn('[WebDAV] ?????'),
    'sync-up': () => WebDAVFeature ? WebDAVFeature.handleSyncToWebDAV() : console.warn('[WebDAV] ?????'),
    'sync-down': () => WebDAVFeature ? WebDAVFeature.handleSyncFromWebDAV() : console.warn('[WebDAV] ?????'),
    'export-key': () => WebDAVFeature ? WebDAVFeature.handleExportEncryptionKey() : console.warn('[WebDAV] ?????'),

    'train-fsrs': () => SettingsFeature ? SettingsFeature.trainFSRSWeights() : console.warn('[Settings] ?????'),
    'reset-fsrs': () => SettingsFeature ? SettingsFeature.resetFSRSWeights() : console.warn('[Settings] ?????'),
    'reset-progress': () => SettingsFeature ? SettingsFeature.resetProgress() : console.warn('[Settings] ?????'),
    'export-data': () => SettingsFeature ? SettingsFeature.exportData() : console.warn('[Settings] ?????'),
    'import-data': () => document.getElementById('import-file').click(),
    'load-vocab': () => document.getElementById('vocab-file').click(),
    
    'show-detail': (e) => {
      const target = e.target.closest('[data-action="show-detail"]');
      if (target && target.dataset.id) {
        showWordDetail(parseInt(target.dataset.id));
      }
    }
  };

  document.addEventListener('click', (e) => {
    console.log('[Click Event] 鐐瑰嚮浜?', e.target.tagName, e.target.className, e.target.id);
    
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) {
      // 不打印这个日志，因为点击空白区域是正常的
      return;
    }

    const action = actionElement.dataset.action;
    const handler = ACTION_HANDLERS[action];
    
    console.log(`[Input Debug] 鐐瑰嚮浜嗗姩浣? ${action}`, actionElement);

    if (typeof handler === 'function') {
      console.log(`[Action] 鎵ц鍔ㄤ綔: ${action}`);
      try {
        handler(e);
      } catch (err) {
        console.error(`[Action Error] 动作 "${action}" 执行失败:`, err);
      }
    } else {
      console.error(`[Missing Handler] 鍔ㄤ綔 "${action}" 娌℃湁瀵瑰簲鐨勫鐞嗗嚱鏁帮紒`);
      console.log('[Available Actions]', Object.keys(ACTION_HANDLERS));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return;
    }

    const actionElement = e.target.closest('[data-action][role="button"]');
    if (!actionElement) {
      return;
    }

    e.preventDefault();
    actionElement.click();
  });

  console.log('CET46 Pro v1.0: 事件委托系统已启用 (模块化架构 + FSRS增强)');
  console.log('[Debug] 已注册的动作处理器:', Object.keys(ACTION_HANDLERS));
}

// 检查 DOM 是否已准备好
if (document.readyState === 'loading') {
  console.log('[main.js] DOM 仍在加载中，等待 DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initApplication);
} else {
  console.log('[main.js] DOM 已准备好，直接初始化...');
  initApplication();
}

async function initApplication() {
  console.log('[DOMContentLoaded] 馃殌 椤甸潰寮€濮嬪姞杞?..');
  console.log('[DOMContentLoaded] 鍒濆 WORDS 闀垮害:', typeof WORDS !== 'undefined' ? WORDS.length : 'undefined');
  console.log('[DOMContentLoaded] DEFAULT_WORDS 闀垮害:', typeof DEFAULT_WORDS !== 'undefined' ? DEFAULT_WORDS.length : 'undefined');
  
  // 初始化筛选器事件监听器，确保 DOM 已准备好
  initFilterEventListeners();
  
  // 事件委托负责按钮与导航动作绑定
  setupGlobalEventDelegation();
  repairVisibleUIText();
  repairRuntimeCorruptedUIText();
  ensureUIRepairObserver();

  try {
    await initApp();
    console.log('[DOMContentLoaded] 最终 WORDS 长度:', WORDS.length);
  } catch (error) {
    console.error('应用初始化失败:', error);
    alert('应用加载失败，请刷新页面重试。错误：' + error.message);
  }
}
