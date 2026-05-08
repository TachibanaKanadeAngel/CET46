import { CONFIG } from './config.js';
import { db } from './db.js';
import {
  FSRS_W,
  DEFAULT_FSRS_W,
  DEFAULT_EF,
  MIN_EF,
  MAX_EF,
  loadFSRSWeights,
  saveFSRSWeights,
  updateFSRS,
  calculateFSRSInterval,
  applyFuzz,
  calculateLevenshtein
} from './fsrs.js';
import { shuffle, escapeHTML } from './utils.js';
import {
  memoryCache,
  getMemoryCache,
  subscribeToStore,
  loadFromIndexedDB,
  getWordDataSync,
  updateWordData,
  deleteWordData,
  getWrongWords,
  saveWrongWords,
  addWrongWord,
  removeWrongWord,
  getHeatmap,
  saveHeatmap,
  recordHeatmap
} from './store.js';

const ACTION_STACK_MAX = CONFIG.MAX_ACTION_STACK;
const CIRCADIAN_MIN_SAMPLES = CONFIG.CIRCADIAN_MIN_SAMPLES;
const SCHEMA_VERSION = CONFIG.SCHEMA_VERSION;

const actionStack = [];

async function pushAction(wordId, prevState) {
  const action = { wordId, state: JSON.parse(JSON.stringify(prevState)), timestamp: Date.now() };
  actionStack.push(action);
  
  if (actionStack.length > ACTION_STACK_MAX) {
    const removed = actionStack.shift();
    if (db.instance) {
      const allActions = await db.getAll('actionStack');
      const toRemove = allActions.find(a => a.timestamp === removed.timestamp);
      if (toRemove) await db.delete('actionStack', toRemove.id);
    }
  }
  
  if (db.instance) {
    await db.save('actionStack', { action, timestamp: action.timestamp });
  }
  
  console.log(`📋 操作栈：${actionStack.length}/${ACTION_STACK_MAX}`);
}

function restoreActionStack(actions) {
  actionStack.length = 0;
  actionStack.push(...actions);
  console.log(`📋 ActionStack restored: ${actions.length} actions`);
}

async function undoLastAction() {
  const last = actionStack.pop();
  if (!last) {
    if (typeof window.UI !== 'undefined') {
      window.UI.toast('没有可撤销的操作', 'error');
    }
    return;
  }
  
  updateWordData(last.wordId, () => last.state);
  
  if (db.instance) {
    await db.save('progress', { id: last.wordId, ...last.state });
    const allActions = await db.getAll('actionStack');
    const toRemove = allActions.find(a => a.timestamp === last.timestamp);
    if (toRemove) await db.delete('actionStack', toRemove.id);
  }
  
  console.log(`↩️ 已回滚单词 ${last.wordId} 的状态`);
  if (typeof window.UI !== 'undefined') {
    window.UI.toast('已撤销上一步操作', 'success');
  }
}

function getData() {
  if (memoryCache.progress && typeof memoryCache.progress.toObject === 'function') {
    return memoryCache.progress.toObject();
  }
  return memoryCache.progress || {};
}

function saveData(data) {
  if (memoryCache.progress && typeof memoryCache.progress.fromObject === 'function') {
    memoryCache.progress.fromObject(data);
  } else {
    memoryCache.progress = data;
  }
}

function getWordData(id) {
  let raw;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    raw = memoryCache.progress.get(id);
  } else {
    raw = memoryCache.progress[id];
  }

  const migrated = raw ? migrateSM2ToFSRS(raw) : null;

  return migrated || {
    status: 'new',
    level: 0,
    nextReview: 0,
    lastStudy: 0,
    ef: DEFAULT_EF,
    reviewCount: 0,
    difficulty: DEFAULT_FSRS_W[1],
    stability: DEFAULT_FSRS_W[0]
  };
}

async function setWordData(id, wd) {
  let previousState;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    previousState = { ...memoryCache.progress.get(id) };
  } else {
    previousState = { ...(memoryCache.progress[id] || {}) };
  }

  wd.isDirty = true;
  wd.mtime = Date.now();

  if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
    memoryCache.progress.set(id, wd);
  } else {
    memoryCache.progress[id] = wd;
  }

  await pushAction(id, previousState);

  if (db.instance) {
    try {
      await db.save('progress', { id: parseInt(id), ...wd });
    } catch (err) {
      console.error(`单词 ${id} 持久化失败:`, err);
    }
  }

  return wd;
}

function markWordAsDeleted(id) {
  memoryCache.deletedIds.add(id);
  deleteWordData(id);
}

function getWordStatus(id) {
  if (memoryCache.deletedIds.has(id)) return 'deleted';
  return getWordData(id).status;
}

function migrateSM2ToFSRS(wd) {
  if (!wd) return null;
  
  if (wd.stability && wd.difficulty) {
    return wd;
  }

  const s = wd.ef ? (wd.ef - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1 : DEFAULT_FSRS_W[0];
  const d = wd.level ? Math.max(1, 10 - wd.level) : DEFAULT_FSRS_W[1];
  
  return {
    ...wd,
    stability: s,
    difficulty: d
  };
}

function getPersonalizedCircadianFactor() {
  const logs = collectReviewLogs();
  if (logs.length < CIRCADIAN_MIN_SAMPLES) return 1.0;

  const hourStats = Array(24).fill(0).map(() => ({ total: 0, fail: 0 }));

  logs.forEach(log => {
    if (log.timestamp) {
      const hour = new Date(log.timestamp).getHours();
      if (hour >= 0 && hour < 24) {
        hourStats[hour].total++;
        if (log.quality < 3) hourStats[hour].fail++;
      }
    }
  });

  const currentHour = new Date().getHours();
  const stats = hourStats[currentHour];

  if (stats.total > 30) {
    const errorRate = stats.fail / stats.total;
    const factor = Math.max(0.8, 1.2 - errorRate);
    console.log(`📊 个性化节律因子：${factor.toFixed(2)} (样本量：${stats.total}, 错误率：${(errorRate * 100).toFixed(1)}%)`);
    return factor;
  }

  return 1.0;
}

function collectReviewLogs() {
  const logs = [];
  const data = getData();
  
  Object.entries(data).forEach(([id, wd]) => {
    if (wd.reviewCount > 0 && wd.stability && wd.difficulty) {
      logs.push({
        wordId: parseInt(id),
        stability: wd.stability,
        difficulty: wd.difficulty,
        reviewCount: wd.reviewCount,
        level: wd.level || 0,
        lastResult: wd.level > 0 ? 1 : 0,
        elapsedDays: wd.lastStudy ? Math.max(1, Math.floor((Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000))) : 1,
        quality: wd.level > 5 ? 4 : (wd.level > 0 ? 3 : 1),
        timestamp: wd.lastStudy || Date.now()
      });
    }
  });
  
  return logs;
}

function migrateData(data) {
  if (!data.version) {
    console.log('检测到旧版本数据，进行迁移...');
    data.version = '1.0';
  }

  if (data.progress) {
    Object.keys(data.progress).forEach(id => {
      const wd = data.progress[id];
      if (wd && !wd.stability) {
        wd.stability = DEFAULT_FSRS_W[0];
      }
      if (wd && !wd.difficulty) {
        wd.difficulty = DEFAULT_FSRS_W[1];
      }
    });
  }

  if (data.wrongWords) {
    Object.keys(data.wrongWords).forEach(id => {
      const wrong = data.wrongWords[id];
      if (wrong && typeof wrong === 'object') {
        if (!wrong.firstWrong) wrong.firstWrong = Date.now();
        if (!wrong.lastWrong) wrong.lastWrong = Date.now();
      }
    });
  }

  data.version = SCHEMA_VERSION;
  return data;
}

loadFSRSWeights();

export {
  db,
  FSRS_W,
  DEFAULT_FSRS_W,
  DEFAULT_EF,
  MIN_EF,
  MAX_EF,
  ACTION_STACK_MAX,
  CIRCADIAN_MIN_SAMPLES,
  SCHEMA_VERSION,
  memoryCache,
  actionStack,
  getMemoryCache,
  subscribeToStore,
  loadFSRSWeights,
  saveFSRSWeights,
  loadFromIndexedDB,
  getWordDataSync,
  updateWordData,
  deleteWordData,
  pushAction,
  undoLastAction,
  restoreActionStack,
  getData,
  saveData,
  getWordData,
  setWordData,
  markWordAsDeleted,
  getWordStatus,
  getWrongWords,
  saveWrongWords,
  addWrongWord,
  removeWrongWord,
  getHeatmap,
  saveHeatmap,
  recordHeatmap,
  getPersonalizedCircadianFactor,
  collectReviewLogs,
  migrateData,
  migrateSM2ToFSRS,
  shuffle,
  updateFSRS,
  calculateFSRSInterval,
  applyFuzz,
  calculateLevenshtein,
  escapeHTML
};
