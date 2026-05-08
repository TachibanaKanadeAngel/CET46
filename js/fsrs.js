import { CONFIG } from './config.js';

export const DEFAULT_EF = CONFIG.FSRS.DEFAULT_EF;
export const MIN_EF = CONFIG.FSRS.MIN_EF;
export const MAX_EF = CONFIG.FSRS.MAX_EF;
export const TARGET_RETENTION = CONFIG.FSRS.TARGET_RETENTION;

let internal_FSRS_W = [...CONFIG.FSRS.DEFAULT_W];
export const DEFAULT_FSRS_W = [...CONFIG.FSRS.DEFAULT_W];

const FSRS_W = new Proxy([], {
  get(target, prop) {
    if (prop === 'length') return internal_FSRS_W.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return internal_FSRS_W[Number(prop)];
    }
    if (prop === Symbol.iterator) return internal_FSRS_W[Symbol.iterator].bind(internal_FSRS_W);
    if (typeof internal_FSRS_W[prop] === 'function') {
      return internal_FSRS_W[prop].bind(internal_FSRS_W);
    }
    return internal_FSRS_W[prop];
  },
  set(target, prop, value) {
    if (prop === 'length') {
      internal_FSRS_W.length = value;
      return true;
    }
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      internal_FSRS_W[Number(prop)] = value;
      return true;
    }
    return false;
  }
});

function getFSRSWeights() {
  return [...internal_FSRS_W];
}

function loadFSRSWeights() {
  const saved = localStorage.getItem('cet46_fsrs_weights');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 17) {
        internal_FSRS_W = parsed;
        console.log('🔧 已加载用户自定义 FSRS 权重');
        return;
      }
    } catch (e) {
      console.warn('FSRS 权重解析失败，使用默认值');
    }
  }
  internal_FSRS_W = [...DEFAULT_FSRS_W];
}

function saveFSRSWeights() {
  localStorage.setItem('cet46_fsrs_weights', JSON.stringify(internal_FSRS_W));
}

function setFSRSWeights(weights) {
  if (!Array.isArray(weights) || weights.length !== 17) {
    console.warn('无效的 FSRS 权重格式');
    return false;
  }
  internal_FSRS_W = [...weights];
  saveFSRSWeights();
  return true;
}

/**
 * 基于 FSRS 4.5 算法计算单词的下一次复习间隔
 * @param {number} s - 当前稳定性 (Stability)
 * @param {number} [r=null] - 目标保持率，默认为 TARGET_RETENTION (0.9)
 * @param {number} [circadianScore=0] - 生物钟评分 (-1 到 1)
 * @returns {number} 下一次复习间隔（毫秒）
 * @throws {Error} 如果稳定性为负数
 */
function calculateFSRSInterval(s, r = null, circadianScore = 0) {
  const targetR = r ?? CONFIG.FSRS.TARGET_RETENTION;
  const intervalDays = s * (Math.log(targetR) / Math.log(0.9));
  
  const k = 0.15;
  const circadianFactor = 1 + k * circadianScore;
  
  const rawInterval = Math.max(1, Math.round(intervalDays * circadianFactor)) * 24 * 60 * 60 * 1000;
  return rawInterval;
}

function getCircadianScore() {
  const heatmap = JSON.parse(localStorage.getItem('cet46_heatmap') || '{}');
  const hourStats = JSON.parse(localStorage.getItem('cet46_hour_stats') || '{}');
  
  const currentHour = new Date().getHours();
  const stats = hourStats[currentHour] || { total: 0, correct: 0 };
  
  if (stats.total < 10) return 0;
  
  const accuracy = stats.correct / stats.total;
  const validHourStats = Object.values(hourStats).filter(s => s.total >= 10);
  const avgAccuracy = validHourStats.reduce((sum, s) => sum + (s.correct / s.total), 0) / Math.max(1, validHourStats.length);
  
  const circadianScore = accuracy - avgAccuracy;
  
  return Math.max(-1, Math.min(1, circadianScore));
}

function updateHourStats(hour, correct) {
  const hourStats = JSON.parse(localStorage.getItem('cet46_hour_stats') || '{}');
  
  if (!hourStats[hour]) {
    hourStats[hour] = { total: 0, correct: 0 };
  }
  
  hourStats[hour].total++;
  if (correct) hourStats[hour].correct++;
  
  localStorage.setItem('cet46_hour_stats', JSON.stringify(hourStats));
}

function calculateForgettingDecay(wd, daysSinceReview) {
  if (!wd.stability || !wd.lastStudy) return 1;
  
  const stability = Math.max(0.1, wd.stability);
  const decayFactor = Math.exp(-daysSinceReview / stability);
  
  return Math.max(0.1, Math.min(1, decayFactor));
}

function calculateShortTermMemory(wd, quality) {
  if (!wd.shortTermReps) wd.shortTermReps = 0;
  if (!wd.lastShortTermReview) wd.lastShortTermReview = 0;
  
  const now = Date.now();
  const timeSinceLastReview = now - wd.lastShortTermReview;
  const SHORT_TERM_WINDOW = 24 * 60 * 60 * 1000;
  
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
  
  const shortTermBonus = 1 + (wd.shortTermReps * 0.1);
  
  return {
    reps: wd.shortTermReps,
    bonus: shortTermBonus
  };
}

function calculateOptimalInterval(wd, quality) {
  const baseInterval = calculateFSRSInterval(wd.stability);
  
  const daysSinceReview = wd.lastStudy ? (Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000) : 0;
  const decayFactor = calculateForgettingDecay(wd, daysSinceReview);
  
  const shortTerm = calculateShortTermMemory(wd, quality);
  
  let adjustedInterval = baseInterval * decayFactor * shortTerm.bonus;
  
  if (quality < 3) {
    adjustedInterval *= 0.5;
  } else if (quality === 4) {
    adjustedInterval *= 1.2;
  }
  
  return Math.round(adjustedInterval);
}

function applyFuzz(interval) {
  if (interval < 24 * 60 * 60 * 1000) return interval;

  const fuzzRange = 0.05;
  const randomFactor = 1 + (Math.random() * fuzzRange * 2 - fuzzRange);
  return Math.round(interval * randomFactor);
}

function calculateLevenshtein(s1, s2) {
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let currRow = new Array(s2.length + 1);

  for (let i = 1; i <= s1.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[s2.length];
}

/**
 * 基于 FSRS 4.5 算法更新单词的记忆状态
 * @param {Object} wd - 当前单词的状态对象
 * @param {number} wd.stability - 当前稳定性 (S)
 * @param {number} wd.difficulty - 当前难度 (D)
 * @param {number} quality - 用户的回忆质量评分 (1:重来, 2:困难, 3:良好, 4:容易)
 * @returns {{stability: number, difficulty: number}} 计算后的新状态
 * @throws {Error} 如果传入的 quality 不在 1-4 范围内
 */
function updateFSRS(wd, quality) {
  if (quality < 1 || quality > 4) {
    throw new Error('Quality 必须介于 1 和 4 之间');
  }
  
  const W = internal_FSRS_W;
  const s = wd.stability || W[0];
  const d = wd.difficulty || W[4] || W[1];

  const qualityOffset = quality - 3;
  let next_d = d - W[6] * qualityOffset;
  next_d = Math.min(Math.max(next_d, 1), 10);
  next_d = W[7] * (W[4] || 5) + (1 - W[7]) * next_d;

  let next_s;
  if (quality >= 3) {
    const hard_penalty = (quality === 3) ? W[15] : 1;
    const easy_bonus = (quality === 4) ? W[16] : 1;

    const expFactor = Math.exp(W[8]);
    const difficultyFactor = 11 - d;
    const stabilityFactor = Math.pow(Math.max(0.1, s), -W[9]);
    const qualityFactor = Math.exp(1 - quality / 5) - 1;
    
    const success_factor = expFactor * difficultyFactor * stabilityFactor * qualityFactor;
    next_s = s * (1 + success_factor * W[10] * easy_bonus * hard_penalty);
  } else {
    const difficultyPow = Math.pow(Math.max(0.1, d), -W[12]);
    const stabilityPow = Math.pow(Math.max(0.1, s), W[13]);
    next_s = Math.min(
      s,
      W[11] * difficultyPow * stabilityPow * Math.exp(W[14])
    );
  }

  return { stability: Math.max(0.1, next_s), difficulty: next_d };
}

function migrateSM2ToFSRS(wd) {
  if (!wd) return null;
  
  if (wd.stability && wd.difficulty) {
    return wd;
  }

  const s = wd.ef ? (wd.ef - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1 : internal_FSRS_W[0];
  const d = wd.level ? Math.max(1, 10 - wd.level) : internal_FSRS_W[1];
  
  return {
    ...wd,
    stability: s,
    difficulty: d
  };
}

function updateEF(currentEF, quality) {
  let newEF = currentEF;
  if (quality >= 4) {
    newEF += 0.1;
  } else if (quality === 0) {
    newEF -= 0.15;
  }
  return Math.max(MIN_EF, Math.min(MAX_EF, newEF));
}

function calculateInterval(wd, quality) {
  if (!wd) return 24 * 60 * 60 * 1000;
  
  const updated = updateFSRS(wd, quality);
  wd.stability = updated.stability;
  wd.difficulty = updated.difficulty;
  
  return applyFuzz(calculateOptimalInterval(wd, quality));
}

function evaluateLogLoss(logs, weights) {
  if (logs.length === 0) return 0;
  let totalLoss = 0;
  let validCount = 0;
  
  for (const log of logs) {
    if (!log.elapsedDays || log.elapsedDays <= 0) {
      continue;
    }
    const t = log.elapsedDays;
    const s = weights[0] * Math.pow(Math.max(0.1, log.difficulty || 5), -weights[1]) * Math.pow(Math.max(1, log.reviewCount), weights[2] || 0);
    const r = Math.pow(0.9, t / Math.max(0.1, s));
    const y = log.lastResult || (log.quality >= 3 ? 1 : 0);
    const clippedR = Math.max(1e-10, Math.min(1 - 1e-10, r));
    totalLoss += -(y * Math.log(clippedR) + (1 - y) * Math.log(1 - clippedR));
    validCount++;
  }
  
  return validCount > 0 ? totalLoss / validCount : 0;
}

function calculateGradientsForLogLoss(logs, weights) {
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
  FSRS_W,
  getFSRSWeights,
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
  updateHourStats
};
