const { loadCommonJS, assert } = require('./load-module.cjs');

function run() {
  const stats = loadCommonJS('utils/stats.js');
  const reference = new Date(2026, 6, 13, 12, 0, 0);
  const start = new Date(2026, 6, 13, 0, 0, 0).getTime();
  const progress = {
    1: { status: 'review', nextReview: start - 1000, reviewCount: 2, errorCount: 1, stability: 5, difficulty: 4 },
    2: { status: 'mastered', nextReview: start + 86400000, reviewCount: 4, stability: 15, difficulty: 6 },
    3: { status: 'new', nextReview: start, reviewCount: 0 },
  };
  const upcoming = stats.calculateUpcomingReviews(progress, 7, reference);
  assert(upcoming[0].count === 1, '逾期任务计入今天');
  assert(upcoming[1].count === 1, '未来任务进入对应日期');
  const metrics = stats.calculateMemoryMetrics(progress);
  assert(metrics.learned === 2 && metrics.mastered === 1, '记忆指标统计状态');
  assert(metrics.totalReviews === 6 && metrics.totalErrors === 1, '累计作答与错误正确');
  assert(metrics.averageStability === 10, '平均稳定性正确');
  const estimate = stats.estimateCompletion(100, 30, {}, 10, reference);
  assert(estimate.days === 7, '无近期数据时使用每日目标估算');
  const crossYear = stats.estimateCompletion(1000, 0, {}, 1, reference);
  assert(crossYear.text.includes('年'), '跨年预计日期显示年份');

  console.log('stats-advanced.test.cjs passed');
}

run();
