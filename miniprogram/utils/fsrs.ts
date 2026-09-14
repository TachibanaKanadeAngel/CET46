// 基于 FSRS 17 维权重的调度实现（微信小程序适配版）
// 纯数学核心已抽取至 ./fsrs-core.js，本模块专注于小程序存储和运行时状态适配

const { CONFIG } = require('./config');
const logger = require('./logger');
const { storage, STORAGE_KEYS } = require('./storage');
const fsrsCore = require('./fsrs-core');

const DEFAULT_TARGET_RETENTION = fsrsCore.DEFAULT_TARGET_RETENTION;
const DEFAULT_FSRS_W = [...fsrsCore.DEFAULT_FSRS_W];

let FSRS_W = [...DEFAULT_FSRS_W];
let currentTargetRetention = DEFAULT_TARGET_RETENTION;

function getFSRSWeights() {
  return [...FSRS_W];
}

function getFSRSWeight(index) {
  return FSRS_W[index];
}

function loadFSRSWeights() {
  const saved = storage.get(STORAGE_KEYS.FSRS_WEIGHTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (fsrsCore.validateWeights(parsed)) {
        FSRS_W = parsed;
        logger.info('已加载用户自定义 FSRS 权重');
        return;
      } else {
        logger.warn('FSRS 权重包含非有限数值或超出范围，使用默认值');
      }
    } catch (e) {
      logger.warn('FSRS 权重解析失败，使用默认值');
    }
  }
  FSRS_W = [...DEFAULT_FSRS_W];
}

function saveFSRSWeights() {
  storage.set(STORAGE_KEYS.FSRS_WEIGHTS, JSON.stringify(FSRS_W));
}

function setFSRSWeights(weights) {
  if (!fsrsCore.validateWeights(weights)) {
    logger.warn('无效的 FSRS 权重格式或数值超出范围');
    return false;
  }
  FSRS_W = [...weights];
  saveFSRSWeights();
  return true;
}

function initFSRS() {
  loadFSRSWeights();
}

function setTargetRetention(r) {
  if (typeof r === 'number' && Number.isFinite(r) && r > 0 && r < 1) {
    currentTargetRetention = r;
    return true;
  }
  logger.warn('无效的目标留存率，必须在 (0, 1) 之间');
  return false;
}

function getTargetRetention() {
  return currentTargetRetention;
}

function calculateFSRSInterval(s, r = null, circadianScore = 0) {
  const targetR = r ?? currentTargetRetention;
  return fsrsCore.calculateFSRSInterval(s, targetR, circadianScore, CONFIG.CONSTANTS.MS_PER_DAY);
}

let _hourStatsCache = null;
let _hourStatsCacheDirty = true;

function _getHourStats() {
  if (_hourStatsCache && !_hourStatsCacheDirty) return _hourStatsCache;
  try {
    const saved = storage.get(STORAGE_KEYS.HOUR_STATS);
    _hourStatsCache = saved ? JSON.parse(saved) : {};
  } catch (e) {
    logger.warn('Failed to parse hour stats:', e);
    _hourStatsCache = {};
  }
  _hourStatsCacheDirty = false;
  return _hourStatsCache;
}

function getCircadianScore() {
  const hourStats = _getHourStats();
  const currentHour = new Date().getHours();
  const stats = hourStats[currentHour] || { total: 0, correct: 0 };
  if (stats.total < 10) return 0;

  const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
  const validHourStats = Object.values(hourStats).filter((s: any) => s && s.total >= 10);
  let totalAcc = 0;
  for (const s of validHourStats as any[]) {
    totalAcc += (Number(s.correct) || 0) / (Number(s.total) || 1);
  }
  const avgAccuracy = totalAcc / Math.max(1, validHourStats.length);

  return Math.max(-1, Math.min(1, accuracy - avgAccuracy));
}

function updateHourStats(hour, correct) {
  const safeHour = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : new Date().getHours();
  const hourStats = _getHourStats();
  if (!hourStats[safeHour]) {
    hourStats[safeHour] = { total: 0, correct: 0 };
  }
  hourStats[safeHour].total++;
  if (correct) hourStats[safeHour].correct++;
  storage.set(STORAGE_KEYS.HOUR_STATS, JSON.stringify(hourStats));
  _hourStatsCache = hourStats;
}

function getHourStatsSnapshot() {
  return JSON.parse(JSON.stringify(_getHourStats()));
}

function restoreHourStats(snapshot) {
  _hourStatsCache = snapshot && typeof snapshot === 'object'
    ? JSON.parse(JSON.stringify(snapshot))
    : {};
  _hourStatsCacheDirty = false;
  return storage.set(STORAGE_KEYS.HOUR_STATS, JSON.stringify(_hourStatsCache));
}

function calculateForgettingDecay(wd, daysSinceReview) {
  if (!wd || wd.stability == null || wd.lastStudy == null) return 1;
  return fsrsCore.calculateForgettingDecay(wd.stability, daysSinceReview);
}

function calculateShortTermMemory(wd, quality) {
  if (!wd) return { reps: 0, bonus: 1 };
  const res = fsrsCore.calculateShortTermMemory(
    wd.shortTermReps,
    wd.lastShortTermReview,
    quality,
    Date.now(),
    CONFIG.CONSTANTS.MS_PER_DAY
  );
  wd.shortTermReps = res.reps;
  wd.lastShortTermReview = res.lastReview;
  return { reps: res.reps, bonus: res.bonus };
}

function calculateOptimalInterval(wd, quality) {
  const q = Math.max(1, Math.min(4, quality));
  if (wd.stability == null || !Number.isFinite(wd.stability)) {
    wd.stability = DEFAULT_FSRS_W[0];
  }
  const baseInterval = calculateFSRSInterval(wd.stability, null, getCircadianScore());
  const daysSinceReview = wd.lastStudy ? Math.max(0, (Date.now() - wd.lastStudy) / (CONFIG.CONSTANTS.MS_PER_DAY)) : 0;
  const decayFactor = calculateForgettingDecay(wd, daysSinceReview);
  const shortTerm = calculateShortTermMemory(wd, q);

  let adjustedInterval = baseInterval * decayFactor * shortTerm.bonus;
  if (q < 2) adjustedInterval *= 0.5;
  else if (q === 4) adjustedInterval *= 1.2;

  if (!Number.isFinite(adjustedInterval) || adjustedInterval <= 0) {
    adjustedInterval = CONFIG.CONSTANTS.MS_PER_DAY;
  }
  return Math.round(adjustedInterval);
}

function applyFuzz(interval) {
  return fsrsCore.applyFuzz(interval, CONFIG.CONSTANTS.MS_PER_DAY);
}

function updateFSRS(wd, quality) {
  return fsrsCore.updateFSRS(wd, quality, FSRS_W, Date.now(), CONFIG.CONSTANTS.MS_PER_DAY);
}

function calculateInterval(wd, quality) {
  if (!wd) return CONFIG.CONSTANTS.MS_PER_DAY;
  const q = Math.max(1, Math.min(4, quality));
  const updated = updateFSRS(wd, q);
  wd.stability = updated.stability;
  wd.difficulty = updated.difficulty;
  const interval = applyFuzz(calculateOptimalInterval(wd, q));
  const maxInterval = CONFIG.CONSTANTS.MAX_REVIEW_INTERVAL_MS;
  return Math.min(Math.max(1, Math.round(interval)), maxInterval);
}

module.exports = {
  DEFAULT_TARGET_RETENTION,
  DEFAULT_FSRS_W,
  initFSRS,
  setTargetRetention,
  getTargetRetention,
  getFSRSWeights,
  setFSRSWeights,
  updateFSRS,
  calculateInterval,
  calculateForgettingDecay,
  getCircadianScore,
  updateHourStats,
  getHourStatsSnapshot,
  restoreHourStats,
};
