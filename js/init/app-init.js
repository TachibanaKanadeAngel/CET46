/* global __CET46_FILE_BUILD__ */

import { CONFIG } from '../config.js';
import { performanceMonitor } from '../utils/performance-monitor.js';
import { pwaWidgets } from '../widgets/pwa-widgets.js';
import { particleSystem } from '../utils/particle-system.js';
import logger from '../utils/logger.js';

import {
  restoreActionStack,
} from '../core.js';

import { db } from '../db.js';

import {
  memoryCache,
  loadFromIndexedDB,
} from '../store.js';

import { webdavConfig, loadWebDAVConfig } from '../sync.js';

import { UI, initTheme, fireConfetti, Skeleton } from '../ui.js';
import { initI18n } from '../utils/i18n.ts';

import { WebVitals } from '../utils/web-vitals.js';
import { isFileProtocol } from '../utils/worker-pool.js';
import {
  buildWordMaps,
  initSemanticGraphInBackground,
  cleanupSemanticGraph,
} from '../utils/semantic-graph-ui.js';

import { StudyFeature } from '../features/study.js';
import { ReviewFeature } from '../features/review.js';
import { engineVisualizer } from '../features/engine-visualizer.js';

import { WORDS, setWordsArray } from '../data/vocab-store.js';
import {
  updateStats,
  saveDailyProgressSnapshot,
} from '../utils/stats.js';
import {
  renderList,
} from '../utils/vocab-list.js';
import { checkAndShowMilestones } from '../utils/milestones.ts';
import {
  setupNetworkStatusListener,
} from '../utils/network-status.ts';
import { setupReactiveBindings } from '../utils/reactive-bindings.ts';
import { initSwipeGestures } from '../utils/swipe-gestures.ts';
import { loadWebDAVFeature } from './module-loaders.js';
import { initializeFeatures } from './feature-init.js';
import { getReviewCallbacks } from './event-delegation.js';
import { setupDebugApi } from './debug-api.js';

// 默认词库统一从 public/data/vocab.json 加载，避免把 600KB+ 词库打进首包 JS。
let _defaultWordsCache = null;
async function getDefaultWords() {
  if (_defaultWordsCache) return _defaultWordsCache;

  const isFileBuild = typeof __CET46_FILE_BUILD__ !== 'undefined' && __CET46_FILE_BUILD__;

  if (isFileBuild) {
    const { DEFAULT_WORDS } = await import('../data/default_vocab.js');
    _defaultWordsCache = DEFAULT_WORDS;
    return _defaultWordsCache;
  }

  const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/CET46/';

  try {
    const response = await fetch(`${baseUrl}data/vocab.json`, {
      cache: 'force-cache',
    });
    if (!response.ok) {
      throw new Error(`加载词库 JSON 失败: ${response.status}`);
    }
    let payload;
    if (typeof response.json === 'function') {
      payload = await response.json();
    } else if (typeof response.text === 'function') {
      payload = JSON.parse(await response.text());
    } else {
      throw new Error('词库响应不支持 JSON 解析');
    }
    if (!payload || !Array.isArray(payload.words) || payload.words.length === 0) {
      throw new Error('词库 JSON 结构无效');
    }
    _defaultWordsCache = payload.words;
    return _defaultWordsCache;
  } catch (error) {
    logger.warn('[getDefaultWords] JSON 词库加载失败，回退到模块词库:', error);
    const { DEFAULT_WORDS } = await import('../data/default_vocab.js');
    _defaultWordsCache = DEFAULT_WORDS;
    return _defaultWordsCache;
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
}

async function requestPersistentStorage() {
  if (isFileProtocol()) {
    logger.info('[Storage] file:// 协议下跳过持久化存储权限请求');
    return false;
  }

  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        logger.info('持久化存储权限已获取，数据将不会被浏览器自动清理');
      } else {
        logger.warn('持久化存储权限被拒绝，浏览器可能在磁盘空间不足时清理数据');
      }
      return isPersisted;
    } catch (e) {
      logger.info('持久化存储权限检查失败，本地数据不受影响', e);
      return false;
    }
  }
  return false;
}

export async function initApp() {
  setupNetworkStatusListener();
  initSwipeGestures(document.getElementById('study-card'), document.getElementById('review-card'), {
    onStudySwipeLeft: () => StudyFeature.markWord(false),
    onStudySwipeRight: () => StudyFeature.markWord(true),
    onReviewSwipeLeft: () => ReviewFeature.markReviewWord(false, getReviewCallbacks()),
    onReviewSwipeRight: () => ReviewFeature.markReviewWord(true, getReviewCallbacks()),
    isReviewFlipped: () => ReviewFeature.reviewFlipped,
  });
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
      setWordsArray(dbWords);
      buildWordMaps();
      logger.info(`从 IndexedDB 加载词库: ${WORDS.length} 个单词`);
    } else {
      const dw = await getDefaultWords();
      await db.bulkSave('words', dw);
      setWordsArray([...dw]);
      buildWordMaps();
      logger.info(`首次运行，已保存默认词库: ${WORDS.length} 个单词`);
    }

    if (!WORDS || WORDS.length === 0) {
      logger.warn('[initApp] WORDS 为空或未正确加载');
      setWordsArray([...await getDefaultWords()]);
      buildWordMaps();
    }

    await loadFromIndexedDB();
    logger.info('IndexedDB 数据已加载');

    if (dbAvailable && db.instance) {
      try {
        const actionStackData = await db.getAll('actionStack');
        if (actionStackData && actionStackData.length > 0) {
          const actions = actionStackData
            .sort((a, b) => a.timestamp - b.timestamp);
          restoreActionStack(actions);
        }
      } catch (stackErr) {
        logger.warn('恢复 actionStack 失败:', stackErr);
      }
    }
  } catch (err) {
    logger.info('IndexedDB 不可用，使用内存模式:', err);
    dbAvailable = false;
    if (!WORDS || WORDS.length === 0) {
      setWordsArray([...await getDefaultWords()]);
      buildWordMaps();
      logger.info(`[initApp] IndexedDB 已成功加载 ${WORDS.length} 个单词`);
    }
  }

  if (!dbAvailable) {
    const storageError = document.createElement('div');
    storageError.style.cssText =
      'position:fixed;top:0;left:0;right:0;background:#f56565;color:white;padding:10px;text-align:center;z-index:9999;font-size:14px;';
    storageError.textContent = '本地数据库不可用，当前已切换到内存模式。';
    document.body.appendChild(storageError);
  }

  await initializeFeatures({ getDefaultWords });

  initTheme();
  initI18n();
  loadWebDAVConfig();
  updateStats();

  Skeleton.hide('study-card');
  Skeleton.hide('virtual-scroll-content');

  renderList();

  const sessionResult = await StudyFeature.checkStudySession(memoryCache, db);
  bindStudyStartButton(sessionResult);

  const runIdleTasks = () => {
    saveDailyProgressSnapshot();
    initSemanticGraphInBackground();
    checkAndShowMilestones(fireConfetti);
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(runIdleTasks, { timeout: 1500 });
  } else {
    setTimeout(runIdleTasks, 200);
  }

  logger.info('引擎已启动，词库容量:', WORDS.length);

  window.addEventListener('beforeunload', () => {
    cleanupSemanticGraph();
    if (particleSystem && typeof particleSystem.destroy === 'function') {
      particleSystem.destroy();
    }
    if (engineVisualizer && typeof engineVisualizer.destroy === 'function') {
      engineVisualizer.destroy();
    }
    if (pwaWidgets && typeof pwaWidgets.stopAutoUpdate === 'function') {
      pwaWidgets.stopAutoUpdate();
    }
    if (performanceMonitor && typeof performanceMonitor.hidePerformancePanel === 'function') {
      performanceMonitor.hidePerformancePanel();
    }
  });

  if (typeof window !== 'undefined') {
    setupDebugApi({
      getDefaultWords,
      getDefaultWordsCacheLength: () => _defaultWordsCache?.length || 0,
    });
  }

  const shortcutGuideShown = localStorage.getItem(CONFIG.STORAGE_KEYS.SHORTCUT_GUIDE_SHOWN);
  if (!shortcutGuideShown) {
    setTimeout(() => UI.showShortcutGuide(), 1000);
  }

  if (webdavConfig && webdavConfig.autoSync && webdavConfig.url) {
    logger.info('启动时自动增量同步已启用');
    setTimeout(async () => {
      try {
        await loadWebDAVFeature.get()?.handleSyncFromWebDAV();
      } catch (e) {
        logger.info('自动同步失败:', e);
        UI.toast('自动同步失败，请检查网络连接', 'error');
      }
    }, 2000);
  }
}
