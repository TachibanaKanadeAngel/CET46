// 46英语微信小程序入口
const { storage, STORAGE_KEYS } = require('./utils/storage');
const {
  initFSRS,
  setTargetRetention,
  updateHourStats,
  getHourStatsSnapshot,
  restoreHourStats,
} = require('./utils/fsrs');
const { normalizeCustomStore, mergeWithBuiltIn } = require('./utils/custom-vocab');
const { syncNativeTheme } = require('./utils/theme');
const { isValidSeries, getOptions, DEFAULT_SERIES } = require('./utils/series');
const { CONFIG } = require('./utils/config');
const logger = require('./utils/logger');

App({
  globalData: {
    currentLevel: DEFAULT_SERIES,
    targetRetention: 0.9,
    words: [],
    baseWords: [],
    customWords: { CET4: [], CET6: [] },
    seriesOptions: getOptions(),
    progress: {},
    wrongWords: [],
    heatmap: {},
    settings: {},
    vocabLoaded: false,
    loadedLevel: null,
  },
  _saveTimer: null,
  _lastSaveErrorToastAt: 0,
  _answerActions: [],

  onLaunch() {
    logger.info('[App] 46英语小程序启动');

    // 初始化 FSRS
    initFSRS();

    // 加载用户设置
    const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
    // 每日目标默认值初始化（首次使用或旧版本无该字段时写入）
    if (typeof settings.dailyGoal !== 'number') {
      settings.dailyGoal = CONFIG.GOAL.DEFAULT_DAILY;
      this._dailyGoalInit = true;
    }
    if (typeof settings.autoShowMeaning !== 'boolean') {
      settings.autoShowMeaning = true;
      this._settingsInit = true;
    }
    if (this._dailyGoalInit || this._settingsInit) {
      storage.set(STORAGE_KEYS.SETTINGS, settings);
    }
    this.globalData.settings = settings;
    this.globalData.targetRetention = settings.targetRetention || 0.9;
    setTargetRetention(this.globalData.targetRetention);

    // 加载当前词库设置
    const currentLevel = storage.get(STORAGE_KEYS.CURRENT_LEVEL);
    this.globalData.currentLevel = isValidSeries(currentLevel) ? currentLevel : DEFAULT_SERIES;

    // 加载学习进度（优先使用分片读取）
    this.globalData.progress = storage.getChunked(STORAGE_KEYS.PROGRESS) || {};
    this.globalData.wrongWords = storage.get(STORAGE_KEYS.WRONG_WORDS) || [];
    this.globalData.heatmap = storage.get(STORAGE_KEYS.HEATMAP) || {};
    this.globalData.customWords = normalizeCustomStore(storage.get(STORAGE_KEYS.CUSTOM_WORDS));

    if (typeof wx !== 'undefined' && typeof wx.onThemeChange === 'function') {
      try {
        wx.onThemeChange(() => {
          if (this.globalData.theme === 'auto') {
            syncNativeTheme('auto');
          }
        });
      } catch (_) {}
    }
  },

  onHide() {
    // 切后台时立即保存，避免数据丢失
    this.flushProgress();
  },

  // 设置词库数据（由分包页面加载后调用）
  setWords(level, words) {
    if (!isValidSeries(level)) return false;
    this.globalData.baseWords = (words || []).filter(word => !word.custom);
    this.globalData.words = mergeWithBuiltIn(
      this.globalData.baseWords,
      this.globalData.customWords[level] || []
    );
    this.globalData.loadedLevel = level;
    this.globalData.vocabLoaded = this.globalData.words.length > 0;
    return this.globalData.vocabLoaded;
  },

  setCustomWords(customWords) {
    const normalized = normalizeCustomStore(customWords);
    if (!storage.set(STORAGE_KEYS.CUSTOM_WORDS, normalized)) return false;
    this.globalData.customWords = normalized;
    const level = this.globalData.loadedLevel;
    if (level) {
      this.globalData.words = mergeWithBuiltIn(
        this.globalData.baseWords,
        this.globalData.customWords[level] || []
      );
      this.globalData.vocabLoaded = this.globalData.words.length > 0;
    }
    return true;
  },

  // 获取当前词库
  getWords(level = this.globalData.currentLevel) {
    if (!this.globalData.vocabLoaded || this.globalData.loadedLevel !== level) return [];
    return this.globalData.words || [];
  },

  // 保存进度（防抖，500ms 内多次调用只保存一次）
  saveProgress(immediate = false) {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (immediate) {
      return this._flushProgress();
    }
    this._saveTimer = setTimeout(() => {
      this._flushProgress();
    }, 500);
    return true;
  },

  // 立即写入 Storage，并对大 progress 对象分片
  _flushProgress() {
    this._saveTimer = null;
    const progressSaved = storage.setChunked(STORAGE_KEYS.PROGRESS, this.globalData.progress, 600 * 1024);
    const metadataSaved = [
      storage.set(STORAGE_KEYS.WRONG_WORDS, this.globalData.wrongWords),
      storage.set(STORAGE_KEYS.HEATMAP, this.globalData.heatmap),
      storage.set(STORAGE_KEYS.CURRENT_LEVEL, this.globalData.currentLevel),
      storage.set(STORAGE_KEYS.SETTINGS, this.globalData.settings),
      storage.set(STORAGE_KEYS.CUSTOM_WORDS, this.globalData.customWords),
    ].every(Boolean);
    const saved = progressSaved && metadataSaved;
    if (!saved) this._notifySaveFailure();
    return saved;
  },

  _notifySaveFailure() {
    const now = Date.now();
    if (now - this._lastSaveErrorToastAt < 5000) return;
    this._lastSaveErrorToastAt = now;
    wx.showToast({ title: '学习进度保存失败，请检查存储空间', icon: 'none', duration: 3000 });
  },

  cancelPendingSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = null;
  },

  clearAnswerActions() {
    this._answerActions = [];
  },

  captureAnswerAction(wordId) {
    const { localDateStr } = require('./utils/date');
    const id = String(wordId);
    const today = localDateStr();
    const wordData = this.globalData.progress[id];
    const todayData = this.globalData.heatmap[today];
    this._answerActions.push({
      wordId: id,
      hadWordData: Boolean(wordData),
      wordData: wordData ? JSON.parse(JSON.stringify(wordData)) : null,
      wrongWords: this.globalData.wrongWords.slice(),
      today,
      hadTodayData: Boolean(todayData),
      todayData: todayData ? { ...todayData } : null,
      hourStats: getHourStatsSnapshot(),
    });
    if (this._answerActions.length > 20) this._answerActions.shift();
  },

  canUndoAnswer() {
    return this._answerActions.length > 0;
  },

  undoLastAnswer() {
    const action = this._answerActions.pop();
    if (!action) return { success: false, restored: false, message: '没有可撤销的操作' };
    if (action.hadWordData) this.globalData.progress[action.wordId] = action.wordData;
    else delete this.globalData.progress[action.wordId];
    this.globalData.wrongWords = action.wrongWords;
    if (action.hadTodayData) this.globalData.heatmap[action.today] = action.todayData;
    else delete this.globalData.heatmap[action.today];
    const saved = restoreHourStats(action.hourStats) && this.flushProgress();
    return { success: saved, restored: true, message: saved ? '已撤销上一题' : '撤销后保存失败' };
  },

  // 强制立即保存（切换级别、退出等场景）
  flushProgress() {
    return this.saveProgress(true);
  },

  // 获取或创建单词进度
  getWordData(wordId) {
    const id = String(wordId);
    if (!this.globalData.progress[id]) {
      this.globalData.progress[id] = {
        status: 'new',
        level: 0,
        reviewCount: 0,
        lastStudy: 0,
      };
    }
    return this.globalData.progress[id];
  },

  // 设置单词进度
  setWordData(wordId, data) {
    const id = String(wordId);
    data.isDirty = true;
    data.mtime = Date.now();
    this.globalData.progress[id] = data;
    this.saveProgress();
  },

  // 记录错题
  addWrongWord(wordId) {
    const id = String(wordId);
    const wordData = this.globalData.progress[id];
    if (wordData) {
      wordData.errorCount = (wordData.errorCount || 0) + 1;
      wordData.lastWrongAt = Date.now();
      wordData.isDirty = true;
      wordData.mtime = Date.now();
    }
    if (!this.globalData.wrongWords.includes(id)) {
      this.globalData.wrongWords.push(id);
    }
    this.saveProgress();
  },

  // 移除错题
  removeWrongWord(wordId) {
    const id = String(wordId);
    this.globalData.wrongWords = this.globalData.wrongWords.filter(wid => wid !== id);
    this.saveProgress();
  },

  // 记录热力图（isNew 标识本次是否为新词学习）
  recordHeatmap(correct, isNew = false) {
    const { localDateStr } = require('./utils/date');
    const today = localDateStr();
    if (!this.globalData.heatmap[today]) {
      this.globalData.heatmap[today] = { total: 0, correct: 0, new: 0 };
    }
    this.globalData.heatmap[today].total++;
    if (correct) this.globalData.heatmap[today].correct++;
    if (isNew) this.globalData.heatmap[today].new = (this.globalData.heatmap[today].new || 0) + 1;
    updateHourStats(new Date().getHours(), correct);
    this.saveProgress();
  },
});
