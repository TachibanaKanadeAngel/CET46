// 统计相关工具函数

const { localDateStr } = require('./date');
const { CONFIG, WORD_STATUS } = require('./config');

/**
 * 计算连续学习天数
 * @param {Object} heatmap 热力图数据 { 'YYYY-MM-DD': { total, correct, new } }
 * @param {Date} [referenceDate=new Date()]
 * @returns {number}
 */
function calculateStreakDays(heatmap, referenceDate = new Date()) {
  const today = localDateStr(referenceDate);
  let streak = 0;
  const checkDate = new Date(referenceDate);

  while (true) {
    const dateStr = localDateStr(checkDate);
    if (heatmap[dateStr] && heatmap[dateStr].total > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streak === 0 && dateStr === today) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateUpcomingReviews(progress, days = 7, referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const dayMs = CONFIG.CONSTANTS.MS_PER_DAY;
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * dayMs);
    return {
      date: localDateStr(date),
      label: index === 0 ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`,
      count: 0,
      percent: 0,
    };
  });

  Object.values(progress || {}).forEach((data: any) => {
    if (!data || ![WORD_STATUS.REVIEW, WORD_STATUS.MASTERED].includes(data.status) || !Number.isFinite(data.nextReview)) return;
    const rawIndex = Math.floor((data.nextReview - start.getTime()) / dayMs);
    const index = rawIndex < 0 ? 0 : rawIndex;
    if (index < buckets.length) buckets[index].count++;
  });
  const maxCount = Math.max(1, ...buckets.map(item => item.count));
  buckets.forEach(item => {
    item.percent = Math.round((item.count / maxCount) * 100);
  });
  return buckets;
}

function calculateMemoryMetrics(progress) {
  let learned = 0;
  let mastered = 0;
  let totalReviews = 0;
  let totalErrors = 0;
  const stabilities = [];
  const difficulties = [];
  Object.values(progress || {}).forEach((data: any) => {
    if (!data || !data.status || data.status === WORD_STATUS.NEW) return;
    learned++;
    if (data.status === WORD_STATUS.MASTERED) mastered++;
    totalReviews += Math.max(0, Number(data.reviewCount) || 0);
    totalErrors += Math.max(0, Number(data.errorCount) || 0);
    if (Number.isFinite(data.stability)) stabilities.push(data.stability);
    if (Number.isFinite(data.difficulty)) difficulties.push(data.difficulty);
  });
  const average = values => values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  return {
    learned,
    mastered,
    totalReviews,
    totalErrors,
    averageStability: average(stabilities),
    averageDifficulty: average(difficulties),
  };
}

function estimateCompletion(totalWords, learnedWords, heatmap, dailyFallback = 20, referenceDate = new Date()) {
  const total = Number(totalWords);
  const learned = Number(learnedWords);
  if (!Number.isFinite(total) || total <= 0) return { days: null, text: '请先加载词库' };
  const remaining = Math.max(0, total - learned);
  if (remaining === 0) return { days: 0, text: '当前词库已完成' };

  let recentNew = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - i);
    recentNew += Math.max(0, Number(heatmap[localDateStr(date)]?.new) || 0);
  }
  const observedRate = recentNew / 7;
  const rate = observedRate > 0 ? observedRate : Math.max(1, Number(dailyFallback) || 20);
  const days = Math.max(1, Math.ceil(remaining / rate));
  const endDate = new Date(referenceDate);
  endDate.setDate(endDate.getDate() + days);
  const dateLabel = endDate.getFullYear() === referenceDate.getFullYear()
    ? `${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日`
    : `${endDate.getFullYear()} 年 ${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日`;
  return {
    days,
    text: `预计 ${dateLabel}完成（约 ${days} 天）`,
  };
}

/**
 * 压缩/紧缩久远历史打卡数据，防止 Storage 膨胀
 * 保留近 keepDays 天详细记录，更早之前的记录仅保留精简统计
 */
function compactOldHeatmap(heatmap, keepDays = 90, referenceDate = new Date()) {
  if (!heatmap || typeof heatmap !== 'object') return heatmap;
  const cutoffTime = referenceDate.getTime() - keepDays * 24 * 60 * 60 * 1000;
  const compacted = {};

  for (const [dateStr, dataVal] of Object.entries(heatmap)) {
    const data: any = dataVal;
    if (!data) continue;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime()) || itemDate.getTime() >= cutoffTime) {
      compacted[dateStr] = data;
    } else {
      // 久远历史仅保留基础打卡汇总，剔除冗余字段
      compacted[dateStr] = {
        total: Math.max(0, Number(data.total) || 0),
        correct: Math.max(0, Number(data.correct) || 0),
      };
    }
  }
  return compacted;
}

module.exports = {
  calculateStreakDays,
  calculateUpcomingReviews,
  calculateMemoryMetrics,
  estimateCompletion,
  compactOldHeatmap,
};
