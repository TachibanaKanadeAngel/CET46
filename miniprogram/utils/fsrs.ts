// 基于 FSRS 17 维权重的调度实现（微信小程序适配版）
// 从主项目 js/fsrs.js 迁移，移除浏览器 localStorage/window 依赖

const { CONFIG } = require('./config');
const logger = require('./logger');
const { storage, STORAGE_KEYS } = require('./storage');

const DEFAULT_TARGET_RETENTION = CONFIG.FSRS.TARGET_RETENTION;

let FSRS_W = [...CONFIG.FSRS.DEFAULT_W];
let currentTargetRetention = DEFAULT_TARGET_RETENTION;
const DEFAULT_FSRS_W = [...CONFIG.FSRS.DEFAULT_W];

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
      if (Array.isArray(parsed) && parsed.length === 17 &&
          parsed.every(w => typeof w === 'number' && Number.isFinite(w))) {
        FSRS_W = parsed;
        logger.info('已加载用户自定义 FSRS 权重');
        return;
      } else {
        logger.warn('FSRS 权重包含非有限数值，使用默认值');
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
  if (!Array.isArray(weights) || weights.length !== 17) {
    logger.warn('无效的 FSRS 权重格式');
    return false;
  }
  if (!weights.every(w => typeof w === 'number' && Number.isFinite(w) && Math.abs(w) <= 100)) {
    logger.warn('FSRS 权重包含非有限数值或超出 [-100, 100] 范围');
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
  if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0) s = DEFAULT_FSRS_W[0];
  if (typeof targetR !== 'number' || !Number.isFinite(targetR) || targetR <= 0 || targetR >= 1) {
    return CONFIG.CONSTANTS.MS_PER_DAY;
  }
  const safeCircadian = (typeof circadianScore === 'number' && Number.isFinite(circadianScore))
    ? Math.max(-1, Math.min(1, circadianScore))
    : 0;
  const intervalDays = 9 * s * (1 / targetR - 1);
  const k = 0.15;
  const circadianFactor = 1 + k * safeCircadian;
  const rawInterval = Math.max(1, Math.round(intervalDays * circadianFactor)) * CONFIG.CONSTANTS.MS_PER_DAY;
  return Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : CONFIG.CONSTANTS.MS_PER_DAY;
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
  if (wd.stability == null || wd.lastStudy == null) return 1;
  const stability = Math.max(0.1, wd.stability);
  const safeDays = Math.max(0, Number(daysSinceReview) || 0);
  const decayFactor = Math.pow(1 + safeDays / (9 * stability), -1);
  return Math.max(0.1, Math.min(1, decayFactor));
}

function calculateShortTermMemory(wd, quality) {
  if (!wd.shortTermReps) wd.shortTermReps = 0;
  if (!wd.lastShortTermReview) wd.lastShortTermReview = 0;

  const now = Date.now();
  const timeSinceLastReview = now - wd.lastShortTermReview;
  const SHORT_TERM_WINDOW = CONFIG.CONSTANTS.MS_PER_DAY;

  if (timeSinceLastReview > SHORT_TERM_WINDOW) {
    wd.shortTermReps = quality >= 3 ? 1 : 0;
  } else {
    if (quality >= 3) {
      wd.shortTermReps = Math.min(wd.shortTermReps + 1, 5);
    } else {
      wd.shortTermReps = Math.max(0, wd.shortTermReps - 1);
    }
  }

  wd.lastShortTermReview = now;
  return {
    reps: wd.shortTermReps,
    bonus: 1 + wd.shortTermReps * 0.1,
  };
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
  if (!Number.isFinite(interval) || interval <= 0) return CONFIG.CONSTANTS.MS_PER_DAY;
  if (interval < CONFIG.CONSTANTS.MS_PER_DAY) return interval;
  const fuzzRange = 0.05;
  const randomFactor = 1 + (Math.random() * fuzzRange * 2 - fuzzRange);
  return Math.round(interval * randomFactor);
}

function updateFSRS(wd, quality) {
  if (quality < 1 || quality > 4) {
    throw new Error('Quality 必须介于 1 和 4 之间');
  }

  const W = FSRS_W;
  const isFirstReview = wd.stability == null || wd.difficulty == null || isNaN(wd.stability) || isNaN(wd.difficulty);

  if (isFirstReview) {
    const s = W[quality - 1];
    let next_d = W[4] - W[5] * (quality - 3);
    next_d = Math.min(Math.max(next_d, 1), 10);
    return { stability: Math.max(0.1, s), difficulty: next_d };
  }

  const s = wd.stability;
  let next_d;
  const d = wd.difficulty;
  const qualityOffset = quality - 3;
  next_d = d - W[6] * qualityOffset;
  next_d = W[7] * W[4] + (1 - W[7]) * next_d;
  next_d = Math.min(Math.max(next_d, 1), 10);

  let next_s;
  if (quality >= 2) {
    const hard_penalty = quality === 2 ? W[15] : 1;
    const easy_bonus = quality === 4 ? W[16] : 1;
    const elapsedDays = wd.lastStudy
      ? Math.max(0, (Date.now() - wd.lastStudy) / (CONFIG.CONSTANTS.MS_PER_DAY))
      : 0;
    const R = Math.pow(1 + elapsedDays / (9 * Math.max(0.1, s)), -1);
    const expFactor = Math.exp(W[8]);
    const difficultyFactor = 11 - next_d;
    const stabilityFactor = Math.pow(Math.max(0.1, s), -W[9]);
    const retrievabilityFactor = Math.exp((1 - R) * W[10]) - 1;
    const success_factor = expFactor * difficultyFactor * stabilityFactor * retrievabilityFactor;
    next_s = s * (1 + success_factor * hard_penalty * easy_bonus);
  } else {
    const difficultyPow = Math.pow(Math.max(0.1, next_d), -W[12]);
    const stabilityPow = Math.pow(Math.max(0.1, s), W[13]);
    next_s = W[11] * difficultyPow * stabilityPow * Math.exp(W[14]);
  }

  if (!Number.isFinite(next_s) || next_s <= 0) next_s = W[quality - 1];
  if (!Number.isFinite(next_d)) next_d = W[4];

  return { stability: Math.max(0.1, next_s), difficulty: next_d };
}

function calculateInterval(wd, quality) {
  if (!wd) return CONFIG.CONSTANTS.MS_PER_DAY;
  const q = Math.max(1, Math.min(4, quality));
  // 先更新 FSRS 状态，再用新的 stability/difficulty 计算本次间隔
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
