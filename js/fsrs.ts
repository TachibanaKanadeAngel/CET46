import { CONFIG } from './config.js';
import logger from './utils/logger.js';
import type { FSRSWeights, FSRSResult } from '../ts/types/fsrs';

export const DEFAULT_EF: number = CONFIG.FSRS.DEFAULT_EF;
export const MIN_EF: number = CONFIG.FSRS.MIN_EF;
export const MAX_EF: number = CONFIG.FSRS.MAX_EF;
export const TARGET_RETENTION: number = CONFIG.FSRS.TARGET_RETENTION;

export const DEFAULT_FSRS_W: FSRSWeights = Object.freeze([...CONFIG.FSRS.DEFAULT_W]) as unknown as FSRSWeights;
let internal_FSRS_W: FSRSWeights = [...CONFIG.FSRS.DEFAULT_W] as FSRSWeights;

/**
 * FSRS 四级评分对象（Again / Hard / Good / Easy）
 */
const FSRSGrade = Object.freeze({
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
} as const);

export type FSRSGrade = (typeof FSRSGrade)[keyof typeof FSRSGrade];

// 导出只读权重数组引用，杜绝复杂 Proxy 反射
let FSRS_W: readonly number[] = Object.freeze([...internal_FSRS_W]);

/**
 * 获取 FSRS 权重数组的副本（防止外部直接修改内部状态）
 */
function getFSRSWeights(): FSRSWeights {
  return [...internal_FSRS_W] as FSRSWeights;
}

/**
 * 直接读取指定索引的 FSRS 权重（热路径优化，绕过 Proxy）
 */
function getFSRSWeight(index: number): number {
  return internal_FSRS_W[index];
}

/**
 * 从 localStorage 加载用户自定义的 FSRS 权重
 */
function loadFSRSWeights(): void {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.FSRS_WEIGHTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.length === 17 &&
        parsed.every((w: unknown) => typeof w === 'number' && Number.isFinite(w))
      ) {
        internal_FSRS_W = parsed as FSRSWeights;
        FSRS_W = Object.freeze([...internal_FSRS_W]);
        logger.info('🔧 已加载用户自定义 FSRS 权重');
        return;
      } else {
        logger.warn('FSRS 权重包含非有限数值，使用默认值');
      }
    } catch (_e) {
      logger.warn('FSRS 权重解析失败，使用默认值');
    }
  }
  internal_FSRS_W = [...DEFAULT_FSRS_W] as FSRSWeights;
  FSRS_W = Object.freeze([...internal_FSRS_W]);
}

/**
 * 将当前 FSRS 权重持久化到 localStorage
 */
function saveFSRSWeights(): void {
  localStorage.setItem(CONFIG.STORAGE_KEYS.FSRS_WEIGHTS, JSON.stringify(internal_FSRS_W));
}

/**
 * 设置新的 FSRS 权重并持久化保存
 */
function setFSRSWeights(weights: number[]): boolean {
  if (!Array.isArray(weights) || weights.length !== 17) {
    logger.warn('无效的 FSRS 权重格式');
    return false;
  }
  if (!weights.every(w => typeof w === 'number' && Number.isFinite(w) && Math.abs(w) <= 100)) {
    logger.warn('FSRS 权重包含非有限数值或超出 [-100, 100] 范围');
    return false;
  }
  internal_FSRS_W = [...weights] as FSRSWeights;
  FSRS_W = Object.freeze([...internal_FSRS_W]);
  saveFSRSWeights();
  return true;
}

/**
 * 基于 FSRS 4.5 算法计算单词的下一次复习间隔
 */
function calculateFSRSInterval(s: number, r: number | null = null, circadianScore: number = 0): number {
  const targetR = r ?? CONFIG.FSRS.TARGET_RETENTION;
  let safeS = s;
  if (typeof safeS !== 'number' || !Number.isFinite(safeS) || safeS <= 0) safeS = DEFAULT_FSRS_W[0];
  if (typeof targetR !== 'number' || !Number.isFinite(targetR) || targetR <= 0 || targetR >= 1) {
    return CONFIG.CONSTANTS.MS_PER_DAY;
  }
  const safeCircadian =
    typeof circadianScore === 'number' && Number.isFinite(circadianScore)
      ? Math.max(-1, Math.min(1, circadianScore))
      : 0;
  const intervalDays = 9 * safeS * (1 / targetR - 1);

  const k = 0.15;
  const circadianFactor = 1 + k * safeCircadian;

  const rawInterval = Math.max(1, Math.round(intervalDays * circadianFactor)) * CONFIG.CONSTANTS.MS_PER_DAY;
  return Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : CONFIG.CONSTANTS.MS_PER_DAY;
}

let _hourStatsCache: Record<number, { total: number; correct: number }> | null = null;
let _hourStatsCacheDirty: boolean = true;

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === CONFIG.STORAGE_KEYS.HOUR_STATS) {
        _hourStatsCacheDirty = true;
      }
    });
  } catch (_e) {
    // Worker 环境无 window，忽略
  }
}

function _getHourStats(): Record<number, { total: number; correct: number }> {
  if (_hourStatsCache && !_hourStatsCacheDirty) return _hourStatsCache;
  try {
    _hourStatsCache = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HOUR_STATS) || '{}');
  } catch (e) {
    logger.warn('Failed to parse hour stats:', e);
    _hourStatsCache = {};
  }
  _hourStatsCacheDirty = false;
  return _hourStatsCache || {};
}

function getCircadianScore(): number {
  const hourStats = _getHourStats();
  const currentHour = new Date().getHours();
  const stats = hourStats[currentHour] || { total: 0, correct: 0 };

  if (stats.total < 10) return 0;

  const accuracy = stats.correct / stats.total;
  const validHourStats = Object.values(hourStats).filter(s => s.total >= 10);
  const avgAccuracy =
    validHourStats.reduce((sum, s) => sum + s.correct / s.total, 0) /
    Math.max(1, validHourStats.length);

  const circadianScore = accuracy - avgAccuracy;
  return Math.max(-1, Math.min(1, circadianScore));
}

/**
 * 更新指定时段的答题统计
 */
function updateHourStats(hour: number, correct: boolean): void {
  const hourStats = _getHourStats();
  if (!hourStats[hour]) {
    hourStats[hour] = { total: 0, correct: 0 };
  }
  hourStats[hour].total++;
  if (correct) hourStats[hour].correct++;
  localStorage.setItem(CONFIG.STORAGE_KEYS.HOUR_STATS, JSON.stringify(hourStats));
}

/**
 * 计算遗忘衰减因子
 */
function calculateForgettingDecay(
  wd: { stability?: number | null; lastStudy?: number | null },
  daysSinceReview: number
): number {
  if (wd.stability == null || wd.lastStudy == null) return 1;
  const stability = Math.max(0.1, wd.stability);
  const safeDays = Math.max(0, Number(daysSinceReview) || 0);
  const decayFactor = Math.pow(1 + safeDays / (9 * stability), -1);
  return Math.max(0.1, Math.min(1, decayFactor));
}

/**
 * 计算短期记忆状态及加成因子
 */
function calculateShortTermMemory(
  wd: { shortTermReps?: number; lastShortTermReview?: number },
  quality: number
): { reps: number; bonus: number } {
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
  const shortTermBonus = 1 + wd.shortTermReps * 0.1;

  return {
    reps: wd.shortTermReps,
    bonus: shortTermBonus,
  };
}

/**
 * 综合计算最优复习间隔
 */
function calculateOptimalInterval(wd: any, quality: number): number {
  const q = Math.max(1, Math.min(4, quality));
  if (wd.stability == null || !Number.isFinite(wd.stability)) {
    wd.stability = DEFAULT_FSRS_W[0];
  }
  const baseInterval = calculateFSRSInterval(wd.stability, null, getCircadianScore());
  const daysSinceReview = wd.lastStudy ? Math.max(0, (Date.now() - wd.lastStudy) / CONFIG.CONSTANTS.MS_PER_DAY) : 0;
  const decayFactor = calculateForgettingDecay(wd, daysSinceReview);
  const shortTerm = calculateShortTermMemory(wd, q);

  let adjustedInterval = baseInterval * decayFactor * shortTerm.bonus;

  if (q < 2) {
    adjustedInterval *= 0.5;
  } else if (q === 4) {
    adjustedInterval *= 1.2;
  }

  if (!Number.isFinite(adjustedInterval) || adjustedInterval <= 0) {
    adjustedInterval = CONFIG.CONSTANTS.MS_PER_DAY;
  }
  return Math.round(adjustedInterval);
}

/**
 * 对复习间隔应用随机扰动
 */
function applyFuzz(interval: number): number {
  if (!Number.isFinite(interval) || interval <= 0) return CONFIG.CONSTANTS.MS_PER_DAY;
  if (interval < CONFIG.CONSTANTS.MS_PER_DAY) return interval;

  const fuzzRange = 0.05;
  const randomFactor = 1 + (Math.random() * fuzzRange * 2 - fuzzRange);
  return Math.round(interval * randomFactor);
}

let levPrevBuffer = new Int32Array(64);
let levCurrBuffer = new Int32Array(64);

function calculateLevenshtein(s1: string, s2: string): number {
  if (typeof s1 !== 'string') s1 = String(s1 ?? '');
  if (typeof s2 !== 'string') s2 = String(s2 ?? '');
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len2 >= 64) {
    let prevRow: number[] = Array.from({ length: len2 + 1 }, (_, i) => i);
    let currRow: number[] = new Array(len2 + 1);
    for (let i = 1; i <= len1; i++) {
      currRow[0] = i;
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
      }
      [prevRow, currRow] = [currRow, prevRow];
    }
    return prevRow[len2];
  }

  for (let i = 0; i <= len2; i++) {
    levPrevBuffer[i] = i;
  }

  for (let i = 1; i <= len1; i++) {
    levCurrBuffer[0] = i;
    const char1 = s1[i - 1];
    for (let j = 1; j <= len2; j++) {
      const cost = char1 === s2[j - 1] ? 0 : 1;
      levCurrBuffer[j] = Math.min(
        levCurrBuffer[j - 1] + 1,
        levPrevBuffer[j] + 1,
        levPrevBuffer[j - 1] + cost
      );
    }
    const temp = levPrevBuffer;
    levPrevBuffer = levCurrBuffer;
    levCurrBuffer = temp;
  }
  return levPrevBuffer[len2];
}

/**
 * 基于 FSRS 4.5 算法更新单词的记忆状态
 */
function updateFSRS(wd: any, quality: number): FSRSResult {
  if (quality < 1 || quality > 4) {
    throw new Error('Quality 必须介于 1 和 4 之间');
  }

  const W = internal_FSRS_W;
  const isFirstReview = wd.stability == null || wd.difficulty == null || isNaN(wd.stability) || isNaN(wd.difficulty);

  if (isFirstReview) {
    const s = W[quality - 1];
    let next_d = W[4] - W[5] * (quality - 3);
    next_d = Math.min(Math.max(next_d, 1), 10);
    return { stability: Math.max(0.1, s), difficulty: next_d };
  }

  const s = wd.stability;
  const d = wd.difficulty;
  const qualityOffset = quality - 3;
  let next_d = d - W[6] * qualityOffset;
  next_d = W[7] * W[4] + (1 - W[7]) * next_d;
  next_d = Math.min(Math.max(next_d, 1), 10);

  let next_s: number;
  if (quality >= 2) {
    const hard_penalty = quality === 2 ? W[15] : 1;
    const easy_bonus = quality === 4 ? W[16] : 1;

    const elapsedDays = wd.lastStudy
      ? Math.max(0, (Date.now() - wd.lastStudy) / CONFIG.CONSTANTS.MS_PER_DAY)
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

function migrateSM2ToFSRS(wd: any): any {
  if (!wd) return null;
  if (wd.stability != null && wd.difficulty != null) {
    return wd;
  }

  const safeEf = typeof wd.ef === 'number' && Number.isFinite(wd.ef) ? wd.ef : null;
  const s = safeEf != null ? ((safeEf - MIN_EF) / (MAX_EF - MIN_EF)) * 10 + 1 : internal_FSRS_W[0];
  const d = wd.level != null ? Math.max(1, 10 - wd.level) : internal_FSRS_W[4];

  return {
    ...wd,
    stability: s,
    difficulty: d,
  };
}

function updateEF(currentEF: number, quality: number): number {
  let newEF = currentEF;
  if (quality >= 4) {
    newEF += 0.1;
  } else if (quality === 0) {
    newEF -= 0.15;
  }
  return Math.max(MIN_EF, Math.min(MAX_EF, newEF));
}

function calculateInterval(wd: any, quality: number): number {
  if (!wd) return CONFIG.CONSTANTS.MS_PER_DAY;
  const q = Math.max(1, Math.min(4, quality));
  const interval = applyFuzz(calculateOptimalInterval(wd, q));
  const updated = updateFSRS(wd, q);
  wd.stability = updated.stability;
  wd.difficulty = updated.difficulty;
  return interval;
}

function evaluateLogLoss(logs: any[], weights: number[]): number {
  if (logs.length === 0) return 0;
  let totalLoss = 0;
  let validCount = 0;

  for (const log of logs) {
    if (!log.elapsedDays || log.elapsedDays <= 0) {
      continue;
    }
    const t = log.elapsedDays;
    const s =
      weights[0] *
      Math.pow(Math.max(0.1, log.difficulty ?? 5), -weights[1]) *
      Math.pow(Math.max(1, log.reviewCount), weights[2] ?? 0);
    const r = Math.pow(1 + t / (9 * Math.max(0.1, s)), -1);
    const y = log.lastResult ?? (log.quality >= 3 ? 1 : 0);
    if (isNaN(r)) continue;
    const clippedR = Math.max(1e-10, Math.min(1 - 1e-10, r));
    totalLoss += -(y * Math.log(clippedR) + (1 - y) * Math.log(1 - clippedR));
    validCount++;
  }

  return validCount > 0 ? totalLoss / validCount : 0;
}

function calculateGradientsForLogLoss(logs: any[], weights: number[]): number[] {
  const gradients = new Array(weights.length).fill(0);
  const delta = 0.001;

  for (let i = 0; i < weights.length; i++) {
    const wPlus = [...weights];
    const wMinus = [...weights];
    wPlus[i] += delta;
    wMinus[i] -= delta;

    const lossPlus = evaluateLogLoss(logs, wPlus);
    const lossMinus = evaluateLogLoss(logs, wMinus);

    gradients[i] = (lossPlus - lossMinus) / (2 * delta);
  }

  return gradients;
}

loadFSRSWeights();

export {
  FSRSGrade,
  FSRS_W,
  getFSRSWeights,
  getFSRSWeight,
  setFSRSWeights,
  loadFSRSWeights,
  saveFSRSWeights,
  calculateFSRSInterval,
  calculateForgettingDecay,
  calculateShortTermMemory,
  calculateOptimalInterval,
  applyFuzz,
  calculateLevenshtein,
  updateFSRS,
  migrateSM2ToFSRS,
  updateEF,
  calculateInterval,
  evaluateLogLoss,
  calculateGradientsForLogLoss,
  getCircadianScore,
  updateHourStats,
};
