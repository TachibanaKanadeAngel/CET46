/**
 * CET46 FSRS 4.5 纯数学核心算法模块
 * 
 * 纯函数实现，无任何宿主环境依赖（无 window / document / localStorage / wx）。
 * Web 端与微信小程序端共享同一套数学计算核心，杜绝算法漂移与双轨维护。
 */

const DEFAULT_FSRS_W = Object.freeze([
  0.4025, 1.4612, 3.3458, 15.6941, 5.3611, 0.9971, 0.8807, 0.0424, 1.4946, 0.144, 0.9995,
  2.2107, 0.0578, 0.3267, 1.2691, 0.2314, 2.0583,
]);

const DEFAULT_TARGET_RETENTION = 0.9;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function validateWeights(weights) {
  if (!Array.isArray(weights) || weights.length !== 17) return false;
  return weights.every(w => typeof w === 'number' && Number.isFinite(w) && Math.abs(w) <= 100);
}

function calculateLevenshtein(s1, s2) {
  if (typeof s1 !== 'string') s1 = String(s1 ?? '');
  if (typeof s2 !== 'string') s2 = String(s2 ?? '');
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const len1 = s1.length;
  const len2 = s2.length;

  let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);
  let currRow = new Array(len2 + 1);

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    const char1 = s1[i - 1];
    for (let j = 1; j <= len2; j++) {
      const cost = char1 === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[len2];
}

function calculateFSRSInterval(s, r = null, circadianScore = 0, msPerDay = MS_PER_DAY) {
  const targetR = r ?? DEFAULT_TARGET_RETENTION;
  const defaultStability = DEFAULT_FSRS_W[0];
  let safeS = (typeof s === 'number' && Number.isFinite(s) && s > 0) ? s : defaultStability;
  if (typeof targetR !== 'number' || !Number.isFinite(targetR) || targetR <= 0 || targetR >= 1) {
    return msPerDay;
  }

  const safeCircadian = (typeof circadianScore === 'number' && Number.isFinite(circadianScore))
    ? Math.max(-1, Math.min(1, circadianScore))
    : 0;

  const intervalDays = 9 * safeS * (1 / targetR - 1);
  const k = 0.15;
  const circadianFactor = 1 + k * safeCircadian;
  const rawInterval = Math.max(1, Math.round(intervalDays * circadianFactor)) * msPerDay;
  return Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : msPerDay;
}

function calculateForgettingDecay(stability, daysSinceReview) {
  if (stability == null || daysSinceReview == null) return 1;
  const safeStability = Math.max(0.1, Number(stability) || DEFAULT_FSRS_W[0]);
  const safeDays = Math.max(0, Number(daysSinceReview) || 0);
  const decayFactor = Math.pow(1 + safeDays / (9 * safeStability), -1);
  return Math.max(0.1, Math.min(1, decayFactor));
}

function calculateShortTermMemory(reps = 0, lastReview = 0, quality = 3, now = Date.now(), windowMs = MS_PER_DAY) {
  let currentReps = Number(reps) || 0;
  const lastTime = Number(lastReview) || 0;
  const timeSinceLastReview = now - lastTime;

  if (timeSinceLastReview > windowMs) {
    currentReps = quality >= 3 ? 1 : 0;
  } else {
    if (quality >= 3) {
      currentReps = Math.min(currentReps + 1, 5);
    } else {
      currentReps = Math.max(0, currentReps - 1);
    }
  }

  const shortTermBonus = 1 + currentReps * 0.1;
  return { reps: currentReps, bonus: shortTermBonus, lastReview: now };
}

function applyFuzz(interval, msPerDay = MS_PER_DAY) {
  if (!Number.isFinite(interval) || interval <= 0) return msPerDay;
  if (interval < msPerDay) return interval;

  const fuzzRange = 0.05;
  const randomFactor = 1 + (Math.random() * fuzzRange * 2 - fuzzRange);
  return Math.round(interval * randomFactor);
}

function updateFSRS(wd, quality, weights = DEFAULT_FSRS_W, now = Date.now(), msPerDay = MS_PER_DAY) {
  if (quality < 1 || quality > 4) {
    throw new Error('Quality 必须介于 1 和 4 之间');
  }

  const W = (Array.isArray(weights) && weights.length === 17) ? weights : DEFAULT_FSRS_W;
  const isFirstReview = !wd || wd.stability == null || wd.difficulty == null ||
    Number.isNaN(wd.stability) || Number.isNaN(wd.difficulty);

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

  let next_s;
  if (quality >= 2) {
    const hard_penalty = quality === 2 ? W[15] : 1;
    const easy_bonus = quality === 4 ? W[16] : 1;

    const elapsedDays = (wd.lastStudy && Number.isFinite(wd.lastStudy))
      ? Math.max(0, (now - wd.lastStudy) / msPerDay)
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

module.exports = {
  DEFAULT_FSRS_W,
  DEFAULT_TARGET_RETENTION,
  MS_PER_DAY,
  validateWeights,
  calculateLevenshtein,
  calculateFSRSInterval,
  calculateForgettingDecay,
  calculateShortTermMemory,
  applyFuzz,
  updateFSRS,
};
