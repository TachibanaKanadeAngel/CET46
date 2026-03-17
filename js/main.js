import { CONFIG, SEMANTIC_CLUSTERS, CONFUSING_PAIRS } from './config.js';
import { DEFAULT_WORDS } from './data/default_vocab.js';
import { AppState, ReactiveAppState, watch, computed } from './state.js';
import { performanceMonitor } from './utils/performance-monitor.js';
import { pwaWidgets } from './widgets/pwa-widgets.js';
import { particleSystem } from './utils/particle-system.js';

import {
  db, FSRS_W, DEFAULT_FSRS_W, DEFAULT_EF, MIN_EF, MAX_EF,
  ACTION_STACK_MAX, CIRCADIAN_MIN_SAMPLES, SCHEMA_VERSION,
  memoryCache, actionStack,
  loadFSRSWeights, saveFSRSWeights,
  loadFromIndexedDB, getWordDataSync,
  getPersonalizedCircadianFactor, pushAction, undoLastAction,
  getData, saveData, getWordData, markWordAsDeleted, getWordStatus,
  getWrongWords, saveWrongWords, addWrongWord, removeWrongWord,
  getHeatmap, saveHeatmap, recordHeatmap,
  collectReviewLogs, migrateData
} from './core.js';



import {
  subscribeToStore, getMemoryCache
} from './store.js';

import {
  Security, asyncCrypto,
  webdavConfig, loadWebDAVConfig, decryptWebDAVCredentials,
  saveWebDAVConfig, testWebDAVConnection,
  generateVectorClock, compareVectorClocks, mergePropertyAware, mergeLocalAndCloud,
  syncToWebDAV, syncFromWebDAV,
  exportEncryptionKey, updateWebDAVStatus
} from './sync.js';

import { Network } from './network.js';

import {
  UI, playTone, fireConfetti, speak, setSafeWordHeader,
  generateCloze, initClozeMode, toggleTheme, initTheme,
  showLoadingOverlay, updateLoadingProgress,
  renderAlgorithmTransparency, createAlgorithmHeatmap,
  renderEFDisplay, Skeleton, THEME_KEY
} from './ui.js';

import { StudyFeature } from './features/study.js';
import { ReviewFeature } from './features/review.js';
import { SpellingFeature } from './features/spelling.js';
import { miniGame } from './features/minigame.js';
import { engineVisualizer } from './features/engine-visualizer.js';
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
    
    console.log(`📊 Web Vitals [${name}]: ${value.toFixed(2)}ms (${rating})`);
    
    if (rating === 'poor') {
      console.warn(`⚠️ ${name} 性能指标较差，建议优化`);
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
    if (this.workers.has(name)) {
      return this.workers.get(name);
    }
    
    if (this.workers.size >= this.maxWorkers) {
      const oldestKey = this.workers.keys().next().value;
      this.terminateWorker(oldestKey);
    }
    
    const worker = new Worker(url, { type: 'module' });
    this.workers.set(name, worker);
    console.log(`🔧 WorkerPool: 创建 ${name} Worker (当前: ${this.workers.size}/${this.maxWorkers})`);
    return worker;
  },
  
  terminateWorker(name) {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
      console.log(`🔧 WorkerPool: 终止 ${name} Worker`);
    }
  },
  
  clearAll() {
    this.workers.forEach((worker, name) => {
      worker.terminate();
      console.log(`🔧 WorkerPool: 清理 ${name} Worker`);
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
    console.log('📦 SettingsFeature 模块已动态加载');
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
    console.log('📦 WebDAVFeature 模块已动态加载');
    return WebDAVFeature;
  } finally {
    webdavFeatureLoading = false;
  }
}

let WORDS = [...DEFAULT_WORDS];

let semanticGraphWorker = null;
let semanticGraphCache = null;
let semanticGraphBuilding = false;

function initSemanticGraphWorker() {
  if (semanticGraphWorker) return;
  
  semanticGraphWorker = new Worker(
    new URL('./workers/semantic-worker.js', import.meta.url),
    { type: 'module' }
  );
}

async function buildSemanticGraphAsync(words, threshold = 2) {
  if (semanticGraphCache) return semanticGraphCache;
  if (semanticGraphBuilding) return null;

  // 尝试从 IndexedDB 加载 BK-Tree 缓存
  let cachedBKTree = null;
  if (db.instance) {
    try {
      cachedBKTree = await db.getSerializedBKTree();
      if (cachedBKTree) {
        console.log('BK-Tree 从 IndexedDB 缓存加载成功');
      }
    } catch (e) {
      console.log('BK-Tree 缓存读取失败，将重新构建');
    }
  }

  semanticGraphBuilding = true;
  initSemanticGraphWorker();

  return new Promise((resolve) => {
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
      if (e.data.type === 'SAVE_TREE') {
        if (db.instance) {
          try {
            // 同时保存到 IndexedDB 和 localStorage（兼容旧版）
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

async function initSemanticGraphInBackground() {
  if (semanticGraphCache || semanticGraphBuilding) return;
  setTimeout(() => {
    buildSemanticGraphAsync(WORDS, 2).then(() => {
      console.log('语义图谱构建完成');
    });
  }, 5000);
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
        reject(new Error('已有处理任务在进行中'));
        return;
      }
      this.processing = true;

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
    });
  }
};

async function prefetchAudioLibrary(words) {
  console.log('📡 开始静默预缓存音频...');
  const maxWords = 500;
  const wordsToPrefetch = words.slice(0, maxWords);
  
  for (let i = 0; i < wordsToPrefetch.length; i++) {
    const w = wordsToPrefetch[i];
    if (w.word) {
      const originalUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w.word)}&type=2`;
      
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_AUDIO', url: originalUrl });
      }
      
      if (i % 50 === 0) {
        console.log(`📡 已预缓存 ${i} / ${maxWords} 个音频`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('✅ 音频预缓存完成');
}

async function setWordData(id, wd) {
  const previousState = { ...memoryCache.progress[id] };
  
  wd.isDirty = true;
  wd.mtime = Date.now();
  
  memoryCache.progress[id] = wd;
  
  await pushAction(id, previousState);
  
  return new Promise((resolve, reject) => {
    memoryCache.writeQueue.push({
      id,
      data: wd,
      resolve,
      reject,
      timestamp: Date.now()
    });
    
    if (memoryCache.writeQueue.length >= 5 || !memoryCache.isWriting) {
      processWriteQueue();
    }
    
    setTimeout(() => {
      if (memoryCache.writeQueue.find(item => item.id === id)) {
        processWriteQueue();
      }
    }, 100);
  });
}

async function processWriteQueue() {
  if (memoryCache.isWriting || memoryCache.writeQueue.length === 0) return;
  
  memoryCache.isWriting = true;
  const batch = memoryCache.writeQueue.splice(0, 5);
  
  try {
    if (db.instance) {
      const tx = db.instance.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      
      batch.forEach(item => {
        store.put({ id: item.id, ...item.data });
      });
      
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(new Error('Transaction failed'));
      });
    }
    
    batch.forEach(item => item.resolve());
  } catch (err) {
    console.error('批量写入失败，回滚到队列:', err);
    memoryCache.writeQueue.unshift(...batch);
    batch.forEach(item => item.reject(err));
  } finally {
    memoryCache.isWriting = false;
    if (memoryCache.writeQueue.length > 0) {
      setTimeout(processWriteQueue, 50);
    }
  }
}

function saveMnemonic(wordId, mnemonic) {
  const wd = getWordData(wordId);
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
  MS_PER_DAY: 24 * 60 * 60 * 1000
};

function updateStats() {
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
      title.textContent = '⚠️ 记忆负载过高';

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size: 0.9rem; margin-top: 0.3rem;';
      desc.textContent = `今日待复习 ${todayCount} 词，建议先消灭积压`;

      const btn = document.createElement('button');
      btn.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem 1rem; background: white; color: #e53e3e; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;';
      btn.textContent = '🚀 进入快速回顾模式';
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
  }).slice(0, 50);

  if (quickQueue.length === 0) {
    UI.toast('没有待复习单词', 'warning');
    return;
  }

  shuffle(quickQueue);
  
  StudyFeature.setWords(WORDS);
  StudyFeature.startStudy('all', getData, memoryCache, db, { overrideQueue: quickQueue });
  
  UI.toast(`快速回顾模式：${quickQueue.length} 个单词`, 'success');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');

  if (tab === 'review') {
    ReviewFeature.updateReview(getWordData, MIN_EF, MAX_EF, FSRS_W);
  }
  if (tab === 'wrong') renderWrongList();
  if (tab === 'list') renderList();
  if (tab === 'stats') {
    renderHeatmap();
    renderStorageInfo();
  }
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
    label.textContent = '📦 PWA 离线存储';

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
    cell.title = `${dateStr}: ${count}次`;
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
  document.getElementById('heatmap-streak').textContent = `🔥 连续 ${streak} 天`;

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
  document.getElementById('total-upcoming').textContent = `总计: ${totalUpcoming}词`;

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
    estElement.textContent = "学习几天后再来看";
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

  estElement.innerHTML = `<strong>${estDate.getMonth() + 1}月${estDate.getDate()}日</strong> (${daysToFinish}天后)`;
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
  for (const id in wrongWords) {
    const w = WORDS.find(word => word.id === parseInt(id));
    if (w) {
      list.push({ ...w, wrongData: wrongWords[id] });
    }
  }
  return list.sort((a, b) => b.wrongData.count - a.wrongData.count);
}

function renderWrongList() {
  const wrongWords = getWrongWordsList();
  const container = document.getElementById('wrong-list');

  let totalErrors = 0;
  wrongWords.forEach(w => totalErrors += w.wrongData.count);

  document.getElementById('wrong-count').textContent = wrongWords.length;
  document.getElementById('wrong-total-errors').textContent = totalErrors;

  renderErrorAnalysis(wrongWords);

  if (wrongWords.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🎉</div><p>太棒了！没有错题</p></div>';
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
    meaningDiv.textContent = w.meaning;
    
    leftDiv.appendChild(wordDiv);
    leftDiv.appendChild(pronDiv);
    leftDiv.appendChild(meaningDiv);
    
    const badge = document.createElement('span');
    badge.className = 'badge badge-danger';
    badge.textContent = `❌ ${w.wrongData.count}次`;
    
    div.appendChild(leftDiv);
    div.appendChild(badge);

    container.appendChild(div);
  });
}

function renderErrorAnalysis(wrongWords) {
  const container = document.getElementById('error-analysis-content');
  
  if (wrongWords.length === 0) {
    container.innerHTML = '<div style="color: var(--success);">✅ 暂无错误数据</div>';
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
    div.innerHTML = `🏷️ <strong>后缀敏感:</strong> 你经常在 <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">-${topSuffix[0]}</code> 后缀的词上出错 (${topSuffix[1]}次)，建议专项练习该后缀词汇。`;
    fragment.appendChild(div);
  }

  const maxLenType = Object.entries(lengthDistribution).sort((a, b) => b[1] - a[1])[0];
  const lenLabels = { short: '短词(≤5字母)', medium: '中词(6-8字母)', long: '长词(≥9字母)' };
  if (maxLenType[1] >= 3) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    let text = `📏 <strong>长度特征:</strong> 错误集中在 <strong>${lenLabels[maxLenType[0]]}</strong> (${maxLenType[1]}个)，`;
    if (maxLenType[0] === 'long') {
      text += '建议拆分记忆长难词。';
    } else if (maxLenType[0] === 'short') {
      text += '短词易混淆，注意形近词区分。';
    } else {
      text += '注意词根词缀的规律。';
    }
    div.innerHTML = text;
    fragment.appendChild(div);
  }

  const topTimeSlot = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topTimeSlot) {
    const hour = parseInt(topTimeSlot[0]);
    let timeAdvice = '';
    if (hour >= 22 || hour < 2) {
      timeAdvice = '🌙 深夜学习效率较低，建议调整到白天';
    } else if (hour >= 14 && hour < 18) {
      timeAdvice = '☀️ 下午时段错误较多，可能疲劳';
    } else if (hour >= 6 && hour < 10) {
      timeAdvice = '🌅 早晨学习需充分清醒';
    } else {
      timeAdvice = '⏰ 注意保持专注';
    }
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    div.innerHTML = `${timeAdvice}，错误高峰时段: <strong>${topTimeSlot[0]}</strong> (${topTimeSlot[1]}次)`;
    fragment.appendChild(div);
  }

  const avgErrors = (totalErrorCount / wrongWords.length).toFixed(1);
  const summaryDiv = document.createElement('div');
  summaryDiv.style.cssText = 'margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);';
  summaryDiv.innerHTML = `📈 平均每词错误 <strong>${avgErrors}</strong> 次，共 <strong>${wrongWords.length}</strong> 个错词需攻克。`;
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
  StudyFeature.startStudy('all', getData, memoryCache, db, { overrideQueue: wrongQueue });

  switchTab('study');
}

const ITEM_HEIGHT = 80;
const VISIBLE_COUNT = 6;
let filteredWords = [];
let virtualScrollRAF = null;
let listItemPool = [];
const POOL_SIZE = VISIBLE_COUNT + 4;

function getOrCreateListItem() {
  if (listItemPool.length > 0) {
    return listItemPool.pop();
  }
  const div = document.createElement('div');
  div.className = 'list-item';
  div.style.cssText = `height: ${ITEM_HEIGHT}px; box-sizing: border-box;`;
  div.style.cursor = 'pointer';

  const leftDiv = document.createElement('div');
  leftDiv.className = 'list-item-left';

  const wordDiv = document.createElement('div');
  wordDiv.className = 'list-item-word';
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
  const spacer = document.getElementById('virtual-scroll-spacer');

  if (!container || !content) return;
  if (!spacer) {
    const newSpacer = document.createElement('div');
    newSpacer.id = 'virtual-scroll-spacer';
    newSpacer.style.cssText = 'position: absolute; top: 0; left: 0; right: 0;';
    container.insertBefore(newSpacer, content);
  }

  const spacerEl = document.getElementById('virtual-scroll-spacer');
  const scrollTop = container.scrollTop;
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIndex = Math.min(startIndex + VISIBLE_COUNT + 2, filteredWords.length);

  spacerEl.style.height = `${filteredWords.length * ITEM_HEIGHT}px`;
  content.style.transform = `translateY(${startIndex * ITEM_HEIGHT}px)`;

  const visibleItems = filteredWords.slice(startIndex, endIndex);

  const fragment = document.createDocumentFragment();
  const existingItems = content.querySelectorAll('.list-item');
  existingItems.forEach(item => recycleListItem(item));
  content.innerHTML = '';

  visibleItems.forEach(w => {
    const s = getWordStatus(w.id);
    const badgeClass = { new: 'badge-gray', review: 'badge-warning', mastered: 'badge-success', deleted: 'badge-danger' }[s];
    const badgeText = { new: '未学习', review: '待复习', mastered: '已掌握', deleted: '已删除' }[s];

    const div = getOrCreateListItem();
    div.dataset.action = 'show-detail';
    div.dataset.id = w.id;

    const wordDiv = div.querySelector('.list-item-word');
    wordDiv.firstChild.textContent = w.word;
    wordDiv.querySelector('small').textContent = w.level;

    div.querySelector('.list-item-pron').textContent = w.phonetic;
    div.querySelector('.list-item-meaning').textContent = w.meaning;

    const badge = div.querySelector('.badge');
    badge.className = `badge ${badgeClass}`;
    badge.textContent = badgeText;

    fragment.appendChild(div);
  });

  content.appendChild(fragment);
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
  const search = document.getElementById('search-input').value.toLowerCase();
  const level = document.getElementById('filter-level').value;
  const status = document.getElementById('filter-status').value;

  filteredWords = WORDS.filter(w => {
    const matchSearch = w.word.toLowerCase().includes(search) || w.meaning.toLowerCase().includes(search);
    const matchLevel = level === 'all' || w.level === level;
    const s = getWordStatus(w.id);
    const matchStatus = status === 'all' || s === status;
    return matchSearch && matchLevel && matchStatus;
  });

  const container = document.getElementById('virtual-scroll-container');
  const pagination = document.getElementById('pagination-controls');

  if (filteredWords.length === 0) {
    if (container) {
      document.getElementById('virtual-scroll-content').innerHTML = '<div class="empty-state" style="height: 200px;"><div class="icon">🔍</div><p>没有找到匹配的单词</p></div>';
      document.getElementById('virtual-scroll-spacer').style.height = '200px';
    }
    pagination.style.display = 'none';
    return;
  }

  renderVirtualList();
  pagination.style.display = 'none';
}

function showWordDetail(id) {
  const w = WORDS.find(word => word.id === id);
  if (!w) return;

  setSafeWordHeader('study-word', w.word, w.level);
  document.getElementById('study-pron').textContent = w.phonetic;
  document.getElementById('study-meaning').textContent = w.meaning;
  document.getElementById('study-example').textContent = w.example;
  document.getElementById('study-card').classList.add('flipped');

  switchTab('study');

  document.getElementById('start-btn').style.display = 'block';
  document.getElementById('study-buttons').style.display = 'none';
  document.getElementById('study-progress').style.display = 'none';
  document.getElementById('cycle-banner').style.display = 'none';
}

async function loadCustomVocab(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoadingOverlay(true, '🧪 正在后台解析词库...', 10);

  const reader = new FileReader();
  reader.onload = async function(e) {
    const jsonStr = e.target.result;
    
    try {
      const { result, count } = await vocabProcessor.processJSON(jsonStr, (progress) => {
        updateLoadingProgress(progress, '🧪 正在异步反序列化...');
      });
      
      updateLoadingProgress(50, '💾 正在写入数据库...');
      
      WORDS = result;
      
      if (db.instance) {
        await db.clear('words');
        await db.bulkSave('words', result, (progress) => {
          updateLoadingProgress(50 + progress * 0.5, `💾 正在高效写入数据库 (${Math.round(progress)}%)...`);
        });
        console.log(`词库已持久化到 IndexedDB: ${count} 个单词`);
      }

      updateLoadingProgress(100, '✅ 完成！');
      
      setTimeout(async () => {
        showLoadingOverlay(false);
        updateStats();
        renderList();
        
        setTimeout(async () => {
          await prefetchAudioLibrary(result);
        }, 1000);
        
        UI.toast(`✅ 异步处理完成！成功加载 ${count} 个单词。`, 'success');
      }, 300);
      
    } catch (err) {
      showLoadingOverlay(false);
      console.error('导入失败:', err);
      UI.toast('❌ ' + err.message, 'error');
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = () => {
    showLoadingOverlay(false);
    UI.toast('❌ 文件读取失败', 'error');
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
  StudyFeature.setWords(WORDS);
  ReviewFeature.setWords(WORDS);
  
  const settings = await loadSettingsFeature();
  if (settings) {
    settings.setWords(WORDS);
  }

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
    showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency)
  });

  miniGame.init();
  
  engineVisualizer.init();
  pwaWidgets.init();

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
}

function bindStudyStartButton(session) {
  const startBtn = document.getElementById('start-btn');
  if (session && session.hasSession) {
    startBtn.textContent = `🚀 继续上次学习 (剩余 ${session.session.queue.length} 词)`;
    startBtn.dataset.action = 'resume-study';
  } else {
    startBtn.textContent = '🚀 开始学习';
    startBtn.dataset.action = 'start-study';
  }
}

async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.log('✅ 持久化存储权限已获取，数据将不会被浏览器自动清理');
      } else {
        console.warn('⚠️ 持久化存储权限被拒绝，浏览器可能在磁盘空间不足时清理数据');
      }
      return isPersisted;
    } catch (e) {
      console.warn('请求持久化存储失败:', e);
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
      console.log(`从 IndexedDB 加载词库: ${WORDS.length} 个单词`);
    } else {
      for (const w of DEFAULT_WORDS) {
        await db.save('words', w);
      }
      WORDS = [...DEFAULT_WORDS];
      console.log(`首次运行，已保存默认词库: ${WORDS.length} 个单词`);
    }

    await loadFromIndexedDB();
    console.log('IndexedDB 初始化成功');
  } catch (err) {
    console.log('IndexedDB 不可用，使用内存模式:', err);
    dbAvailable = false;
  }

  if (!dbAvailable) {
    const storageError = document.createElement('div');
    storageError.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f56565;color:white;padding:10px;text-align:center;z-index:9999;font-size:14px;';
    storageError.textContent = '⚠️ 存储空间不可用，学习进度将在页面关闭后丢失';
    document.body.appendChild(storageError);
  }

  await initializeFeatures();

  initTheme();
  loadWebDAVConfig();
  updateStats();
  renderList();
  
  const sessionResult = await StudyFeature.checkStudySession(memoryCache, db);
  bindStudyStartButton(sessionResult);
  
  Skeleton.hide('study-card');
  Skeleton.hide('virtual-scroll-content');

  saveDailyProgressSnapshot();
  initSemanticGraphInBackground();
  checkAndShowMilestones();
  console.log('🚀 引擎已启动，词库容量:', WORDS.length);
  
  // 初始化环境粒子系统
  particleSystem.init();
  
  if (typeof window !== 'undefined') {
    window.perfMonitor = performanceMonitor;
    window.showPerfPanel = () => performanceMonitor.showPerformancePanel();
    window.particleSystem = particleSystem; // 暴露给调试
  }

  const shortcutGuideShown = localStorage.getItem('cet46_shortcut_guide_shown');
  if (!shortcutGuideShown) {
    setTimeout(() => UI.showShortcutGuide(), 1000);
  }

  if (webdavConfig && webdavConfig.autoSync && webdavConfig.url) {
    console.log('🔄 启动时自动增量同步已启用');
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
    if (e.key === 'ArrowLeft' && StudyFeature.studyFlipped) {
      StudyFeature.markStudyWord(false, {
        getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
        getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
        recordHeatmap, saveDailyProgressSnapshot,
        saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
        updateStats,
        showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
        playTone
      });
    }
    if (e.key === ' ') {
      e.preventDefault();
      StudyFeature.flipStudyCard(getMnemonic);
    }
    if (e.key === 'ArrowRight' && StudyFeature.studyFlipped) {
      StudyFeature.markStudyWord(true, {
        getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
        getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
        recordHeatmap, saveDailyProgressSnapshot,
        saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
        updateStats,
        showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
        playTone
      });
    }
    if ((e.key === 's' || e.key === 'S') && StudyFeature.studyFlipped) {
      SpellingFeature.openSpellingChallenge();
    }
    if ((e.key === 'z' || e.key === 'Z') && e.ctrlKey) {
      e.preventDefault();
      undoLastAction();
    }
  }

  if (reviewView && document.getElementById('review-buttons').style.display !== 'none') {
    if (e.key === 'ArrowLeft' && ReviewFeature.reviewFlipped) {
      ReviewFeature.markReviewWord(false, {
        getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
        adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord,
        removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats,
        showReviewWord: () => ReviewFeature.showReviewWord(MIN_EF, MAX_EF, FSRS_W),
        playTone, fireConfetti
      });
    }
    if (e.key === ' ') {
      e.preventDefault();
      ReviewFeature.flipReviewCard();
    }
    if (e.key === 'ArrowRight' && ReviewFeature.reviewFlipped) {
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

document.getElementById('search-input').addEventListener('input', debouncedRenderList);
document.getElementById('filter-level').addEventListener('change', () => { 
  const container = document.getElementById('virtual-scroll-container');
  if (container) container.scrollTop = 0;
  renderList(); 
});
document.getElementById('filter-status').addEventListener('change', () => { 
  const container = document.getElementById('virtual-scroll-container');
  if (container) container.scrollTop = 0;
  renderList(); 
});

const virtualContainer = document.getElementById('virtual-scroll-container');
if (virtualContainer) {
  virtualContainer.addEventListener('scroll', debouncedRenderVirtualList, { passive: true });
}

if ('serviceWorker' in navigator) {
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
      console.log('Service Worker 已更新，页面即将刷新');
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
  span.textContent = '🚀 新版本可用';
  
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

window.addEventListener('unhandledrejection', (event) => {
  console.error('未捕获的 Promise 错误:', event.reason);
  UI.toast('操作出错，请刷新页面重试', 'error');
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  if (event.error) {
    console.error('全局错误:', event.error);
    UI.toast('发生错误，请刷新页面', 'error');
  }
});

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
  if (!StudyFeature.studyFlipped) return;
  
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const deltaTime = Date.now() - touchStartTime;
  
  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaY) > Math.abs(deltaX) || deltaTime > SWIPE_TIME_THRESHOLD) {
    return;
  }
  
  if (deltaX < 0) {
    StudyFeature.markStudyWord(false, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
      recordHeatmap, saveDailyProgressSnapshot,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
      playTone
    });
    showSwipeFeedback('left');
  } else {
    StudyFeature.markStudyWord(true, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
      recordHeatmap, saveDailyProgressSnapshot,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
      playTone
    });
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
  indicator.textContent = direction === 'left' ? '❌' : '✅';
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
        offlineIndicator.textContent = '🟢';
        offlineIndicator.title = '在线 - 所有功能可用';
        
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          try {
            const cacheNames = await caches.keys();
            const audioCache = cacheNames.find(name => name.includes('audio'));
            if (audioCache) {
              const cache = await caches.open(audioCache);
              const keys = await cache.keys();
              if (keys.length > 100) {
                offlineIndicator.title = `在线 - 音频缓存就绪 (${keys.length}个)`;
              }
            }
          } catch (e) {}
        }
      } else {
        offlineIndicator.textContent = '🔴';
        offlineIndicator.title = '离线 - 部分功能受限';
      }
    }
    
    if (statusDot) {
      statusDot.className = isOnline ? 'status-dot online' : 'status-dot offline';
    }
    
    ReactiveAppState.set('isOnline', isOnline);
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
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
  
  const pendingReviews = computed(
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
  
  watch(['stats'], (values) => {
    updateStats();
  });
  
  console.log('✅ 响应式绑定已设置');
}

function showMilestoneCelebration(type, count) {
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
    'show-shortcut-guide': () => UI.showShortcutGuide(),
    
    // 导航栏动作
    'nav-study': () => {
      console.log('[Nav] 切换到学习视图');
      switchTab('study');
    },
    'nav-review': () => {
      console.log('[Nav] 切换到复习视图');
      switchTab('review');
    },
    'nav-wrong': () => {
      console.log('[Nav] 切换到错题视图');
      switchTab('wrong');
    },
    'nav-stats': () => {
      console.log('[Nav] 切换到统计视图');
      switchTab('stats');
    },
    'nav-list': () => {
      console.log('[Nav] 切换到词库视图');
      switchTab('list');
    },
    
    'start-study': () => {
      const level = document.getElementById('study-level').value;
      StudyFeature.startStudy(level, getData, memoryCache, db);
    },
    'resume-study': () => {
      const session = memoryCache.session;
      if (session) {
        StudyFeature.resumeStudy(session);
      }
    },
    'flip-card': () => StudyFeature.flipStudyCard(getMnemonic),
    'mark-known': () => StudyFeature.markStudyWord(true, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
      recordHeatmap, saveDailyProgressSnapshot,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
      playTone
    }),
    'mark-unknown': () => StudyFeature.markStudyWord(false, {
      getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval,
      getPersonalizedCircadianFactor, adjustForSemanticInterference, addWrongWord,
      recordHeatmap, saveDailyProgressSnapshot,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      showStudyWord: () => StudyFeature.showStudyWord(findConfusingWords, adjustForSemanticInterference, MIN_EF, MAX_EF, FSRS_W, getWordData, renderAlgorithmTransparency),
      playTone
    }),
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
    
    'toggle-webdav': () => WebDAVFeature.toggleWebDAVConfig(),
    'save-webdav': () => WebDAVFeature.handleSaveWebDAVConfig(),
    'test-webdav': () => WebDAVFeature.handleTestWebDAVConnection(),
    'sync-up': () => WebDAVFeature.handleSyncToWebDAV(),
    'sync-down': () => WebDAVFeature.handleSyncFromWebDAV(),
    'export-key': () => WebDAVFeature.handleExportEncryptionKey(),
    
    'train-fsrs': () => SettingsFeature.trainFSRSWeights(),
    'reset-fsrs': () => SettingsFeature.resetFSRSWeights(),
    'reset-progress': () => SettingsFeature.resetProgress(),
    'export-data': () => SettingsFeature.exportData(),
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
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) {
      console.log('[Debug] 点击的元素没有 data-action 属性');
      return;
    }

    const action = actionElement.dataset.action;
    const handler = ACTION_HANDLERS[action];
    
    console.log(`[Input Debug] 点击了动作: ${action}`, actionElement);

    if (typeof handler === 'function') {
      console.log(`[Action] 执行动作: ${action}`);
      try {
        handler(e);
      } catch (err) {
        console.error(`[Action Error] 动作 "${action}" 执行失败:`, err);
      }
    } else {
      console.error(`[Missing Handler] 动作 "${action}" 没有对应的处理函数！`);
      console.log('[Available Actions]', Object.keys(ACTION_HANDLERS));
    }
  });

  console.log('🚀 CET46 Pro v1.0: 事件委托系统已启用 (模块化架构 + FSRS增强)');
  console.log('[Debug] 已注册的动作处理器:', Object.keys(ACTION_HANDLERS));
}

document.addEventListener('DOMContentLoaded', async () => {
  // 绑定导航栏 tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  setupGlobalEventDelegation();
  
  try {
    await initApp();
    console.log('✅ 应用初始化成功');
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    alert('应用加载失败，请刷新页面重试。错误: ' + error.message);
  }
});
