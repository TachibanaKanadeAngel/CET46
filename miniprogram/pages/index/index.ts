// 首页
const { getStats, getReviewWords } = require('../../utils/vocab');
const { calculateStreakDays } = require('../../utils/stats');
const { loadVocab } = require('../../utils/vocab-loader');
const { getOptions, getPackageRoot } = require('../../utils/series');

function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

const SERIES_OPTIONS = getOptions();

Page({
  data: {
    currentLevel: 'CET4',
    levelIndex: 0,
    levels: SERIES_OPTIONS,
    stats: { newCount: 0, reviewCount: 0, masteredCount: 0, total: 0 },
    todayReviewCount: 0,
    todayNewCount: 0,
    todayReviewDueCount: 0,
    streakDays: 0,
    dailyGoal: 20,
    todayGoalPercent: 0,
    goalReached: false,
    fuelPercent: 0,
    heatPercent: 0,
    engineStatus: '* 引擎正在休眠 *',
    loading: true,
    loadError: '',
  },
  onLoad() {
    this._loadGeneration = 0;
    this._failedLevel = null;
    const app = getAppInstance();
    const currentLevel = (app && app.globalData && app.globalData.currentLevel) || 'CET4';
    this.setData({ currentLevel, levelIndex: this.getLevelIndex(currentLevel) });
    this.requestVocab(currentLevel);
  },

  onShow() {
    const app = getAppInstance();
    const currentLevel = (app && app.globalData && app.globalData.currentLevel) || this.data.currentLevel;
    if (currentLevel !== this.data.currentLevel) {
      this.setData({ currentLevel, levelIndex: this.getLevelIndex(currentLevel) });
    }

    this.updateTodayStats();
    this.updateStats();

    if (app && app.globalData && app.globalData.loadedLevel !== currentLevel && !this.data.loading) {
      this.requestVocab(currentLevel);
    }
  },

  onUnload() {
    this._loadGeneration = (this._loadGeneration || 0) + 1;
  },

  getLevelIndex(level) {
    const index = this.data.levels.findIndex(item => item.value === level);
    return index >= 0 ? index : 0;
  },

  async requestVocab(level) {
    const generation = (this._loadGeneration || 0) + 1;
    this._loadGeneration = generation;
    const app = getAppInstance();
    const previousLevel = (app && app.globalData && app.globalData.currentLevel) || this.data.currentLevel;
    this.setData({ loading: true, loadError: '' });
    wx.showLoading({ title: '加载词库' });

    try {
      const result = await loadVocab(level, {
        timeoutMs: 15000,
        retries: 2,
        retryDelayMs: 1000,
        onRetry: ({ attempt, retries }) => {
          if (generation !== this._loadGeneration) return;
          wx.showToast({ title: `加载失败，正在重试 (${attempt}/${retries})`, icon: 'none' });
        },
      });
      if (generation !== this._loadGeneration) return false;

      if (app) {
        app.setWords(result.level, result.words);
        app.globalData.currentLevel = result.level;
        app.flushProgress();
      }
      this._failedLevel = null;
      this.setData({
        currentLevel: result.level,
        levelIndex: this.getLevelIndex(result.level),
        loading: false,
        loadError: '',
      });
      this.updateStats();
      this.updateTodayStats();
      return true;
    } catch (error) {
      if (generation !== this._loadGeneration) return false;
      const errMsg = error && error.message ? error.message : String(error);
      this._failedLevel = level;
      this.setData({
        currentLevel: previousLevel,
        levelIndex: this.getLevelIndex(previousLevel),
        loading: false,
        loadError: errMsg,
      });
      this.updateStats();
      this.updateTodayStats();
      wx.showModal({
        title: '词库加载失败',
        content: `无法加载 ${level} 词库，请稍后重试。\n(${errMsg})`,
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: res => {
          if (res.confirm) this.onRetryVocab();
        },
      });
      return false;
    } finally {
      if (generation === this._loadGeneration) wx.hideLoading();
    }
  },

  onRetryVocab() {
    this.requestVocab(this._failedLevel || this.data.currentLevel);
  },

  updateStats() {
    const app = getAppInstance();
    if (!app) return;
    const words = app.getWords ? app.getWords(this.data.currentLevel) : [];
    const progress = (app.globalData && app.globalData.progress) || {};
    const stats = getStats(words, progress);
    const learned = stats.total > 0 ? Math.min(100, Math.round((stats.masteredCount / stats.total) * 100)) : 0;
    const fuelPercent = stats.total > 0 ? Math.max(5, learned) : 0;
    const { engineStatus } = this.calculateEngineStatus(fuelPercent, this.data.heatPercent);
    this.setData({ stats, fuelPercent, engineStatus });
  },

  updateTodayStats() {
    const app = getAppInstance();
    if (!app) return;
    const { localDateStr } = require('../../utils/date');
    const today = localDateStr();
    const heatmap = (app.globalData && app.globalData.heatmap && app.globalData.heatmap[today]) || { total: 0, correct: 0 };
    const streak = calculateStreakDays((app.globalData && app.globalData.heatmap) || {});
    const words = app.getWords ? app.getWords(this.data.currentLevel) : [];
    const progress = (app.globalData && app.globalData.progress) || {};
    const reviewDue = getReviewWords(words, progress, Number.MAX_SAFE_INTEGER).length;

    // 每日目标进度：今日学习+复习合计 vs 每日目标
    const dailyGoal = (app.globalData.settings && app.globalData.settings.dailyGoal) || 20;
    const todayGoalPercent = Math.min(100, Math.round((heatmap.total / dailyGoal) * 100));
    const goalReached = heatmap.total >= dailyGoal;

    const heatPercent = Math.min(100, streak * 10);
    const { engineStatus } = this.calculateEngineStatus(this.data.fuelPercent, heatPercent);

    this.setData({
      todayReviewCount: heatmap.total,
      todayNewCount: heatmap.new || 0,
      todayReviewDueCount: reviewDue,
      streakDays: streak,
      dailyGoal,
      todayGoalPercent,
      goalReached,
      heatPercent,
      engineStatus,
    });
  },

  calculateEngineStatus(fuelPercent, heatPercent) {
    let engineStatus = '* 引擎正在休眠 *';
    if (fuelPercent >= 80 && heatPercent >= 60) engineStatus = '* 引擎全速运转 *';
    else if (fuelPercent >= 40 || heatPercent >= 30) engineStatus = '* 引擎运转正常 *';
    else if (fuelPercent > 5 || heatPercent > 0) engineStatus = '* 引擎怠速中 *';
    return { engineStatus };
  },

  onLevelChange(e) {
    const index = Number(e.detail.value);
    const option = this.data.levels[index];
    if (!option || option.value === this.data.currentLevel) return;
    this.setData({ currentLevel: option.value, levelIndex: index, loading: true });
    this.requestVocab(option.value);
  },

  canOpenCurrentVocab() {
    if (this.data.loading) {
      wx.showToast({ title: '词库加载中', icon: 'none' });
      return false;
    }
    const app = getAppInstance();
    if (app && app.getWords && app.getWords(this.data.currentLevel).length === 0) {
      wx.showToast({ title: '请先重新加载词库', icon: 'none' });
      return false;
    }
    return true;
  },

  goStudy() {
    if (this.canOpenCurrentVocab()) wx.navigateTo({ url: '/pages/study/index' });
  },

  goReview() {
    if (this.canOpenCurrentVocab()) wx.navigateTo({ url: '/pages/review/index' });
  },

  goSpelling() {
    if (this.canOpenCurrentVocab()) wx.navigateTo({ url: '/pages/spelling/index' });
  },

  goGame() {
    if (this.canOpenCurrentVocab()) wx.navigateTo({ url: '/pages/game/index' });
  },

  goVocabList() {
    if (!this.canOpenCurrentVocab()) return;
    const packageRoot = getPackageRoot(this.data.currentLevel);
    wx.navigateTo({ url: `/${packageRoot}/pages/list/list` });
  },
});
