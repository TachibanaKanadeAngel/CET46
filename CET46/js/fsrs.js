import { CONFIG } from './config.js';

const DEFAULT_EF = CONFIG.FSRS.DEFAULT_EF;
const MIN_EF = CONFIG.FSRS.MIN_EF;
const MAX_EF = CONFIG.FSRS.MAX_EF;
const TARGET_RETENTION = CONFIG.FSRS.TARGET_RETENTION;

let FSRS_W = [...CONFIG.FSRS.DEFAULT_W];
const DEFAULT_FSRS_W = [...CONFIG.FSRS.DEFAULT_W];

function loadFSRSWeights() {
  const saved = localStorage.getItem('cet46_fsrs_weights');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 17) {
        FSRS_W = parsed;
        console.log('🔧 已加载用户自定义 FSRS 权重');
        return;
      }
    } catch (e) {}
  }
  FSRS_W = [...DEFAULT_FSRS_W];
}

function saveFSRSWeights() {
  localStorage.setItem('cet46_fsrs_weights', JSON.stringify(FSRS_W));
}

function calculateFSRSInterval(s, r = null, circadianScore = 0) {
  const targetR = r || TARGET_RETENTION;
  const intervalDays = s * (Math.log(targetR) / Math.log(0.9));
  
  const k = 0.15;
  const circadianFactor = 1 + k * circadianScore;
  
  const rawInterval = Math.max(1, Math.round(intervalDays * circadianFactor)) * 24 * 60 * 60 * 1000;
  return applyFuzz(rawInterval);
}

function getCircadianScore() {
  const heatmap = JSON.parse(localStorage.getItem('cet46_heatmap') || '{}');
  const hourStats = JSON.parse(localStorage.getItem('cet46_hour_stats') || '{}');
  
  const currentHour = new Date().getHours();
  const stats = hourStats[currentHour] || { total: 0, correct: 0 };
  
  if (stats.total < 10) return 0;
  
  const accuracy = stats.correct / stats.total;
  const avgAccuracy = Object.values(hourStats)
    .filter(s => s.total >= 10)
    .reduce((sum, s) => sum + (s.correct / s.total), 0) / Math.max(1, Object.values(hourStats).filter(s => s.total >= 10).length);
  
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
  
  const stability = wd.stability;
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

function updateFSRS(wd, quality) {
  let s = wd.stability || FSRS_W[0];
  let d = wd.difficulty || FSRS_W[4] || FSRS_W[1];

  let next_d = d - FSRS_W[6] * (quality - 3);
  next_d = Math.min(Math.max(next_d, 1), 10);
  next_d = FSRS_W[7] * (FSRS_W[4] || 5) + (1 - FSRS_W[7]) * next_d;

  let next_s;
  if (quality >= 3) {
    let hard_penalty = (quality === 2) ? FSRS_W[15] : 1;
    let easy_bonus = (quality === 4) ? FSRS_W[16] : 1;

    const success_factor = Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9]) * (Math.exp(1 - quality / 5) - 1);

    next_s = s * (1 + success_factor * FSRS_W[10] * easy_bonus * hard_penalty);
  } else {
    next_s = Math.min(
      s,
      FSRS_W[11] * Math.pow(d, -FSRS_W[12]) * Math.pow(s, FSRS_W[13]) * Math.exp(FSRS_W[14])
    );
  }

  return { stability: Math.max(0.1, next_s), difficulty: next_d };
}

function migrateSM2ToFSRS(wd) {
  if (!wd) return null;
  
  if (wd.stability && wd.difficulty) {
    return wd;
  }

  const s = wd.ef ? (wd.ef - MIN_EF) / (MAX_EF - MIN_EF) * 10 + 1 : FSRS_W[0];
  const d = wd.level ? Math.max(1, 10 - wd.level) : FSRS_W[1];
  
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
  
  return calculateOptimalInterval(wd, quality);
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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function escapeHTML(str) {
  return (str || '').replace(/[&<>'"]/g, 
    tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag)
  );
}

loadFSRSWeights();

export {
  FSRS_W,
  DEFAULT_FSRS_W,
  DEFAULT_EF,
  MIN_EF,
  MAX_EF,
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
  shuffle,
  escapeHTML,
  getCircadianScore,
  updateHourStats
};
