import { CONFIG } from '../config.js';
import logger from '../utils/logger.js';

import { db } from '../db.js';

import { UI, playTone, fireConfetti, toggleTheme } from '../ui.js';

import {
  getPersonalizedCircadianFactor,
  pushAction,
  undoLastAction,
  getData,
  getWordData,
  setWordData,
} from '../core.js';

import { updateFSRS, calculateFSRSInterval } from '../fsrs.js';
import { adjustForSemanticInterference } from '../utils/semantic-graph-ui.js';
import {
  memoryCache,
  addWrongWord,
  removeWrongWord,
  recordHeatmap,
} from '../store.js';
import {
  updateStats,
  renderHeatmap,
  renderStorageInfo,
  saveDailyProgressSnapshot,
} from '../utils/stats.js';
import {
  renderWrongList,
  startWrongWordsStudy,
} from '../utils/wrong-words.ts';
import {
  renderList,
  showWordDetail,
  loadCustomVocab,
  debouncedRenderList,
  debouncedRenderVirtualList,
} from '../utils/vocab-list.js';
import {
  showResourceStatusPanel,
  showNetworkStatusPanel,
} from '../utils/network-status.ts';
import {
  repairVisibleUIText,
  repairRuntimeCorruptedUIText,
} from './ui-repair.js';

import { StudyFeature } from '../features/study.js';
import { ReviewFeature } from '../features/review.js';
import { SpellingFeature } from '../features/spelling.js';

import { loadSettingsFeature, loadWebDAVFeature } from './module-loaders.js';

// 懒加载模块未就绪时统一给用户 toast 提示，避免静默失败无感知
function withWebDAV(fn) {
  const w = loadWebDAVFeature.get();
  if (w) return fn(w);
  logger.warn('[WebDAV] 未加载');
  UI.toast('WebDAV 功能尚未加载，请刷新后重试', 'error');
  return null;
}

function withSettings(fn) {
  const s = loadSettingsFeature.get();
  if (s) return fn(s);
  logger.warn('[Settings] 未加载');
  UI.toast('设置功能尚未加载，请刷新后重试', 'error');
  return null;
}

let visualViewportHandler = null;

export function removeVisualViewportListener() {
  if (window.visualViewport && visualViewportHandler) {
    window.visualViewport.removeEventListener('resize', visualViewportHandler);
    visualViewportHandler = null;
  }
}

async function saveMnemonic(wordId, mnemonic) {
  const wd = { ...getWordData(wordId) };
  wd.mnemonic = mnemonic;
  setWordData(wordId, wd);

  if (db.instance) {
    await db.save('progress', { ...wd, id: Number(wordId) }).catch(err => logger.error('[setMnemonic] 保存失败:', err));
  }
}

export function switchTab(tab) {
  logger.info(`[switchTab] 切换到标签 ${tab}`);

  const activeBtn = document.querySelector(
    `.tab-btn[data-tab="${tab}"], .tab-button[data-tab="${tab}"]`
  );
  document.querySelectorAll('.tab-btn, .tab-button').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  } else {
    logger.error(`[switchTab] 未找到标签按钮 ${tab}`);
  }

  const targetView = document.getElementById(`view-${tab}`);
  if (!targetView) {
    logger.error(`[switchTab] 未找到视图 view-${tab}`);
    return;
  }

  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  targetView.classList.add('active');

  if (tab === 'review') {
    ReviewFeature.updateReview(getWordData);
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

export async function handleUndo() {
  try {
    const res = await undoLastAction();
    if (res && res.message) {
      UI.toast(res.message, res.success ? 'success' : 'error');
    }
  } catch (err) {
    logger.error('[handleUndo] 撤销操作失败:', err);
    UI.toast('撤销操作失败，请重试', 'error');
  }
}

export function getReviewCallbacks() {
  return {
    getWordData,
    setWordData,
    pushAction,
    updateFSRS,
    calculateFSRSInterval,
    adjustForSemanticInterference,
    getPersonalizedCircadianFactor,
    addWrongWord,
    removeWrongWord,
    recordHeatmap,
    saveDailyProgressSnapshot,
    updateStats,
    showReviewWord: () => ReviewFeature.showReviewWord(),
    playTone,
    fireConfetti,
  };
}

export function initFilterEventListeners() {
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

  const vocabFileInput = document.getElementById('vocab-file');
  if (vocabFileInput) {
    vocabFileInput.addEventListener('change', loadCustomVocab);
  }
}

export function setupGlobalEventDelegation() {
  // 监听其他模块发出的标签切换请求（避免依赖 window 全局污染）
  window.addEventListener('cet46:switch-tab', (e) => {
    const tab = e?.detail?.tab;
    if (tab) switchTab(tab);
  });

  const ACTION_HANDLERS = {
    'toggle-theme': () => toggleTheme(),
    'show-resource-status': () => showResourceStatusPanel(),
    'show-network-status': () => showNetworkStatusPanel(),
    'show-shortcut-guide': () => UI.showShortcutGuide(),

    'nav-study': () => {
      logger.info('[Nav] 切换到学习视图');
      switchTab('study');
    },
    'nav-review': () => {
      logger.info('[Nav] 切换到复习视图');
      switchTab('review');
    },
    'nav-wrong': () => {
      logger.info('[Nav] 切换到错题视图');
      switchTab('wrong');
    },
    'nav-stats': () => {
      logger.info('[Nav] 切换到统计视图');
      switchTab('stats');
    },
    'nav-list': () => {
      logger.info('[Nav] 切换到词库视图');
      switchTab('list');
    },

    'start-study': () => {
      const levelSelect = document.getElementById('study-level');
      const level = levelSelect ? levelSelect.value : 'all';
      logger.info(`[Start Study] 级别：${level}`);

      if (StudyFeature.startStudy) {
        const result = StudyFeature.startStudy(
          level,
          CONFIG.CONSTANTS.DEFAULT_STUDY_LIMIT,
          getData,
          memoryCache,
          db
        );
        if (result) {
          logger.info('[Start Study] 学习已启动');
        } else {
          logger.warn('[Start Study] 学习启动失败');
        }
      } else {
        logger.error('[Start Study] StudyFeature 未定义！');
        UI.toast('学习功能尚未就绪，请稍后重试', 'warning');
      }
    },
    'resume-study': async () => {
      logger.info('[Resume Study] 继续学习');
      try {
        const sessionResult = await StudyFeature.checkStudySession(memoryCache, db);
        if (!sessionResult || !sessionResult.hasSession || !sessionResult.session) {
          UI.toast && UI.toast('恢复学习会话失败，已开始新会话', 'warning');
          const levelSelect = document.getElementById('study-level');
          const level = levelSelect ? levelSelect.value : 'all';
          StudyFeature.startStudy(
            level,
            CONFIG.CONSTANTS.DEFAULT_STUDY_LIMIT,
            getData,
            memoryCache,
            db
          );
          return;
        }

        const session = sessionResult.session;
        const levelSelect = document.getElementById('study-level');
        if (levelSelect && session.level) {
          levelSelect.value = session.level;
        }

        const resumed = await StudyFeature.resumeFromSession(session, memoryCache, db);
        if (resumed) {
          UI.toast && UI.toast('已恢复上次学习会话', 'success');
        } else {
          UI.toast && UI.toast('恢复学习会话失败，已开始新会话', 'warning');
          StudyFeature.startStudy(
            session.level || 'all',
            CONFIG.CONSTANTS.DEFAULT_STUDY_LIMIT,
            getData,
            memoryCache,
            db
          );
        }
      } catch (e) {
        logger.error('[resume-study] 恢复学习会话失败:', e);
        UI.toast && UI.toast('恢复学习会话失败', 'error');
      }
    },
    'mark-known': () => {
      logger.info('[Mark Known] 标记为认识');
      if (StudyFeature.markWord) {
        StudyFeature.markWord(true);
      }
    },
    'mark-unknown': () => {
      logger.info('[Mark Unknown] 标记为不认识');
      if (StudyFeature.markWord) {
        StudyFeature.markWord(false);
      }
    },
    'set-study-mode': e => {
      const btn = e.target.closest('[data-action="set-study-mode"]');
      if (btn && btn.dataset.mode) StudyFeature.setStudyMode(btn.dataset.mode);
    },
    'select-choice': e => {
      const el = e.target.closest('[data-action="select-choice"]');
      if (el && el.dataset.choiceId) StudyFeature.onSelectChoice(el.dataset.choiceId);
    },
    'next-choice-word': () => StudyFeature.nextChoiceWord(),
    'open-spelling': () => SpellingFeature.openSpellingChallenge(),
    'toggle-cloze': () => StudyFeature.toggleClozeMode(),
    'save-mnemonic': () => StudyFeature.handleSaveMnemonic(saveMnemonic),
    'undo-action': () => handleUndo(),

    'flip-review': () => ReviewFeature.flipReviewCard(),
    'review-known': () => ReviewFeature.markReviewWord(true, getReviewCallbacks()),
    'review-unknown': () => ReviewFeature.markReviewWord(false, getReviewCallbacks()),

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

    'speak-study-word': e => {
      e.stopPropagation();
      StudyFeature.speakCurrentWord();
    },
    'speak-review-word': e => {
      e.stopPropagation();
      ReviewFeature.speakReviewWord();
    },
    'speak-spelling-word': () => SpellingFeature.replaySpellingAudio(),

    'toggle-webdav': () => withWebDAV(w => w.toggleWebDAVConfig()),
    'save-webdav': () => withWebDAV(w => w.handleSaveWebDAVConfig()),
    'test-webdav': () => withWebDAV(w => w.handleTestWebDAVConnection()),
    'sync-up': () => withWebDAV(w => w.handleSyncToWebDAV()),
    'sync-down': () => withWebDAV(w => w.handleSyncFromWebDAV()),
    'export-key': () => withWebDAV(w => w.handleExportEncryptionKey()),

    'train-fsrs': () => withSettings(s => s.trainFSRSWeights()),
    'reset-fsrs': () => withSettings(s => s.resetFSRSWeights()),
    'reset-progress': () => withSettings(s => s.resetProgress()),
    'export-data': () => withSettings(s => s.exportData()),
    'import-data': () => document.getElementById('import-file')?.click(),
    'load-vocab': () => document.getElementById('vocab-file')?.click(),

    'show-detail': e => {
      const target = e.target.closest('[data-action="show-detail"]');
      if (target && target.dataset.id) {
        showWordDetail(parseInt(target.dataset.id, 10));
      }
    },
  };

  document.addEventListener('click', e => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;
    const handler = ACTION_HANDLERS[action];

    if (typeof handler === 'function') {
      logger.info(`[Action] 执行动作: ${action}`);
      try {
        handler(e);
      } catch (err) {
        logger.error(`[Action Error] 动作 "${action}" 执行失败:`, err);
      }
    } else {
      logger.error(`[Missing Handler] 动作 "${action}" 没有对应的处理函数！`);
      UI.toast('操作暂时不可用，请刷新页面后重试', 'error');
    }
  });

  document.addEventListener('keydown', e => {
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

  logger.info('46英语 v1.4.0: 事件委托系统已启用 (模块化架构 + FSRS增强)');
  logger.info('[Debug] 已注册的动作处理器:', Object.keys(ACTION_HANDLERS));
}
