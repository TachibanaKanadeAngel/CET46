function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

Page({
  data: {
    todayTotal: 0,
    todayCorrect: 0,
    todayAccuracy: 0,
    totalLearned: 0,
    totalMastered: 0,
    streakDays: 0,
    heatmap: [],
    words: [],
    upcoming: [],
    upcomingTotal: 0,
    calendar: null,
    monthlyCount: 0,
    averageStability: '0.0',
    averageDifficulty: '0.0',
    totalReviews: 0,
    totalErrors: 0,
    estimateText: '开始学习后计算',
  },

  onShow() {
    const app = getAppInstance();
    if (!app) return;
    this.loadStats();
  },

  loadStats() {
    const app = getAppInstance();
    const progress = (app && app.globalData && app.globalData.progress) || {};
    const heatmap = (app && app.globalData && app.globalData.heatmap) || {};
    const { localDateStr } = require('../../utils/date');
    const {
      calculateStreakDays,
      calculateUpcomingReviews,
      calculateMemoryMetrics,
      estimateCompletion,
    } = require('../../utils/stats');
    const today = localDateStr();
    const todayData = heatmap[today] || { total: 0, correct: 0 };

    const metrics = calculateMemoryMetrics(progress);
    const totalLearned = metrics.learned;
    const totalMastered = metrics.mastered;

    // 连续学习天数
    const streak = calculateStreakDays(heatmap);

    // 近 7 天热力图
    const recentHeatmap = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateStr(d);
      const data = heatmap[dateStr] || { total: 0, correct: 0 };
      recentHeatmap.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        total: data.total,
        correct: data.correct,
        level: this.getHeatmapLevel(data.total),
      });
    }

    const upcoming = calculateUpcomingReviews(progress, 7);
    const words = (app && app.getWords) ? app.getWords() : [];
    const estimate = estimateCompletion(
      words.length || totalLearned,
      totalLearned,
      heatmap,
      (app && app.globalData && app.globalData.settings && app.globalData.settings.studyLimit) || 20
    );

    const calendar = this.buildCalendar(heatmap);

    this.setData({
      todayTotal: todayData.total,
      todayCorrect: todayData.correct,
      todayAccuracy: todayData.total > 0 ? Math.round((todayData.correct / todayData.total) * 100) : 0,
      totalLearned,
      totalMastered,
      streakDays: streak,
      heatmap: recentHeatmap,
      upcoming,
      upcomingTotal: upcoming.reduce((sum, item) => sum + item.count, 0),
      calendar: calendar.weeks,
      monthlyCount: calendar.monthCount,
      weekdays: calendar.weekdays,
      averageStability: metrics.averageStability.toFixed(1),
      averageDifficulty: metrics.averageDifficulty.toFixed(1),
      totalReviews: metrics.totalReviews,
      totalErrors: metrics.totalErrors,
      estimateText: estimate.text,
    });
  },

  // 构建本月打卡日历（7 列网格，按热力等级着色，标记"今天"）
  buildCalendar(heatmap) {
    const { localDateStr } = require('../../utils/date');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = firstDay.getDay();
    const today = now.getDate();
    const cells = [];
    let monthCount = 0;
    for (let i = 0; i < leading; i++) cells.push({ padding: true, key: 'pad-' + i });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const data = heatmap[localDateStr(dt)] || { total: 0 };
      if (data.total > 0) monthCount++;
      cells.push({
        day: d,
        isToday: d === today,
        total: data.total,
        level: this.getHeatmapLevel(data.total),
        key: 'day-' + d,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ padding: true, key: 'pad-' + cells.length });
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { weeks, monthCount, weekdays: ['日', '一', '二', '三', '四', '五', '六'] };
  },

  getHeatmapLevel(total) {
    if (total === 0) return 0;
    if (total < 10) return 1;
    if (total < 30) return 2;
    if (total < 60) return 3;
    return 4;
  },
});
