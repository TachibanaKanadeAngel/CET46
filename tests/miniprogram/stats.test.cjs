/**
 * 小程序统计与日志紧缩测试
 */

const { loadCommonJS } = require('./load-module.cjs');
const {
  calculateStreakDays,
  calculateUpcomingReviews,
  calculateMemoryMetrics,
  estimateCompletion,
  compactOldHeatmap,
} = loadCommonJS('../../miniprogram/utils/stats.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function runTests() {
  console.log('开始 stats 小程序版测试...\n');

  // 测试 1：连续打卡天数
  const heatmap1 = {
    '2026-08-31': { total: 10, correct: 9 },
    '2026-08-30': { total: 15, correct: 14 },
    '2026-08-29': { total: 20, correct: 18 },
  };
  const streak = calculateStreakDays(heatmap1, new Date('2026-08-31'));
  assert(streak === 3, `连续天数应为 3，实际为 ${streak}`);
  console.log('✓ 连续学习天数计算');

  // 测试 2：久远打卡日志紧缩归档
  const oldDate = '2026-01-01';
  const recentDate = '2026-08-30';
  const heatmap2 = {
    [oldDate]: { total: 50, correct: 45, extraLog: [1, 2, 3], detailNotes: 'long text' },
    [recentDate]: { total: 20, correct: 19, new: 5 },
  };

  const compacted = compactOldHeatmap(heatmap2, 90, new Date('2026-08-31'));
  assert(compacted[recentDate].new === 5, '近期数据应完整保留所有字段');
  assert(compacted[oldDate].total === 50, '久远数据应保留总计');
  assert(compacted[oldDate].correct === 45, '久远数据应保留正确数');
  assert(compacted[oldDate].extraLog === undefined, '久远数据应剥离冗余明细');
  console.log('✓ 久远打卡日志紧缩归档');

  console.log('\n所有 stats 测试通过 ✓');
}

runTests();
