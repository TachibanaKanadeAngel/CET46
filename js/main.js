if (typeof window !== 'undefined') {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    const mockStorage = {
      _data: {},
      setItem(key, value) { this._data[key] = String(value); },
      getItem(key) { return this._data.hasOwnProperty(key) ? this._data[key] : null; },
      removeItem(key) { delete this._data[key]; },
      clear() { this._data = {}; },
      key(i) { return Object.keys(this._data)[i] || null; },
      get length() { return Object.keys(this._data).length; }
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true, writable: true });
    } catch (_) {
      window.localStorage = mockStorage;
    }
  }
}

import { CONFIG } from './config.js';
import logger from './utils/logger.js';
import { getData } from './core.js';
import { UI } from './ui.js';
import { WORDS } from './data/vocab-store.js';
import { initSemanticGraphUI } from './utils/semantic-graph-ui.js';
import { registerServiceWorker } from './utils/sw-registration.js';
import { setupKeyboardShortcuts } from './utils/keyboard-shortcuts.js';

import { StudyFeature } from './features/study.js';
import { ReviewFeature } from './features/review.js';
import { SpellingFeature } from './features/spelling.js';

import { initApp } from './init/app-init.js';
import {
  setupGlobalEventDelegation,
  initFilterEventListeners,
  handleUndo,
  getReviewCallbacks,
} from './init/event-delegation.js';

// 全局错误捕获
window.addEventListener('error', e => {
  logger.error('[Global Error]', e.message, e.filename, e.lineno);
  if (e.error) {
    UI.toast && UI.toast('发生错误，请刷新页面', 'error');
  }
});

window.addEventListener('unhandledrejection', e => {
  logger.error('[Unhandled Promise Rejection]', e.reason);
  UI.toast && UI.toast('操作出错，请刷新页面重试', 'error');
  e.preventDefault();
});

initSemanticGraphUI({ getWORDS: () => WORDS, getData, CONSTANTS: CONFIG.CONSTANTS });

setupKeyboardShortcuts({
  handleUndo,
  getReviewCallbacks,
  StudyFeature,
  ReviewFeature,
  SpellingFeature,
});

registerServiceWorker();

if (document.readyState === 'loading') {
  logger.info('[main.js] DOM 仍在加载中，等待 DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initApplication);
} else {
  logger.info('[main.js] DOM 已准备好，直接初始化...');
  initApplication();
}

async function initApplication() {
  logger.info('[DOMContentLoaded] 页面开始加载...');
  logger.info(
    '[DOMContentLoaded] 初始 WORDS 长度:',
    typeof WORDS !== 'undefined' ? WORDS.length : 'undefined'
  );

  initFilterEventListeners();

  setupGlobalEventDelegation();

  try {
    await initApp();
    logger.info('[DOMContentLoaded] 最终 WORDS 长度:', WORDS.length);
  } catch (error) {
    logger.error('应用初始化失败:', error);
    UI.toast('应用加载失败，请刷新页面重试', 'error');
  }
}
