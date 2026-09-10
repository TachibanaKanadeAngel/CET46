function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

const { CONFIG } = require('../../utils/config');
const { calculateInterval } = require('../../utils/fsrs');
const { buildSpellingQueue, getSpellingHint, evaluateSpelling } = require('../../utils/training');

Page({
  data: {
    source: 'mixed',
    sourceIndex: 0,
    sourceOptions: [
      { value: 'mixed', label: '综合训练' },
      { value: 'wrong', label: '错词专项' },
      { value: 'learned', label: '已学单词' },
    ],
    mode: 'meaning',
    queue: [],
    currentIndex: 0,
    currentWord: null,
    total: 0,
    inputValue: '',
    hintLevel: 0,
    hintText: '',
    checked: false,
    resultType: '',
    resultText: '',
    answerText: '',
    correctCount: 0,
    skippedCount: 0,
    finished: false,
    progressPercent: 0,
  },

  onLoad(options) {
    const source = ['mixed', 'wrong', 'learned'].includes(options.source) ? options.source : 'mixed';
    const sourceIndex = this.data.sourceOptions.findIndex(item => item.value === source);
    this.setData({ source, sourceIndex: Math.max(0, sourceIndex) });
    this.loadQueue(source);
  },

  loadQueue(source) {
    const app = getAppInstance();
    const words = (app && app.getWords) ? app.getWords() : [];
    if (!words.length) {
      wx.showToast({ title: '请先返回首页加载词库', icon: 'none' });
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    const limit = (app && app.globalData && app.globalData.settings && app.globalData.settings.spellingLimit) || 20;
    const queue = buildSpellingQueue(
      words,
      (app && app.globalData && app.globalData.progress) || {},
      (app && app.globalData && app.globalData.wrongWords) || [],
      source,
      limit
    );
    if (!queue.length) {
      this.setData({ queue: [], currentWord: null, total: 0, finished: true });
      return;
    }
    this.setData({
      queue,
      currentWord: queue[0],
      currentIndex: 0,
      total: queue.length,
      inputValue: '',
      hintLevel: 0,
      hintText: '',
      checked: false,
      resultType: '',
      resultText: '',
      answerText: '',
      correctCount: 0,
      skippedCount: 0,
      finished: false,
      progressPercent: Math.round(100 / queue.length),
    });
  },

  onSourceChange(e) {
    const sourceIndex = Number(e.detail.value);
    const option = this.data.sourceOptions[sourceIndex];
    if (!option) return;
    this.setData({ sourceIndex, source: option.value });
    this.loadQueue(option.value);
  },

  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === 'meaning' || mode === 'phonetic') this.setData({ mode });
  },

  onInput(e) {
    if (!this.data.checked) this.setData({ inputValue: e.detail.value });
  },

  onHint() {
    if (this.data.checked || !this.data.currentWord) return;
    const hintLevel = Math.min(this.data.currentWord.word.length, this.data.hintLevel + 1);
    this.setData({
      hintLevel,
      hintText: getSpellingHint(this.data.currentWord.word, hintLevel),
    });
  },

  onSubmit() {
    if (this.data.checked) {
      this.nextWord();
      return;
    }
    const input = this.data.inputValue.trim();
    if (!input) {
      wx.showToast({ title: '请先输入单词', icon: 'none' });
      return;
    }

    const word = this.data.currentWord;
    const result = evaluateSpelling(input, word.word, this.data.hintLevel);
    const app = getAppInstance();
    const wd = (app && app.getWordData) ? app.getWordData(word.id) : {};
    const wasNew = !wd.status || wd.status === 'new';
    const wasMastered = wd.status === 'mastered';
    const interval = calculateInterval(wd, result.quality);
    const now = Date.now();

    wd.lastStudy = now;
    wd.nextReview = now + (result.quality === 1 ? CONFIG.CONSTANTS.MS_PER_DAY : interval);
    wd.reviewCount = (wd.reviewCount || 0) + 1;
    wd.lastResult = result.quality >= 3 ? 1 : 0;
    wd.lastQuality = result.quality;
    wd.status = result.quality >= 3 && (wasMastered ||
      (wd.reviewCount >= CONFIG.CONSTANTS.LEVEL_MASTERED && wd.stability >= 10))
      ? 'mastered'
      : 'review';
    app.setWordData(word.id, wd);

    if (result.quality >= 3) app.removeWrongWord(word.id);
    else app.addWrongWord(word.id);
    app.recordHeatmap(result.quality >= 3, wasNew);

    const resultText = result.type === 'correct'
      ? (this.data.hintLevel ? `拼写正确，使用了 ${this.data.hintLevel} 次提示` : '拼写完全正确')
      : result.type === 'close'
        ? '很接近，但仍需再巩固一次'
        : '拼写错误，已加入错词专项';

    this.setData({
      checked: true,
      resultType: result.type,
      resultText,
      answerText: word.word,
      correctCount: this.data.correctCount + (result.type === 'correct' ? 1 : 0),
    });
  },

  onSkip() {
    if (!this.data.currentWord || this.data.finished || this.data.checked) return;
    this.setData({ skippedCount: this.data.skippedCount + 1 });
    this.nextWord();
  },

  nextWord() {
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.queue.length) {
      const app = getAppInstance();
      if (app && typeof app.flushProgress === 'function') app.flushProgress();
      this.setData({ finished: true, currentWord: null, progressPercent: 100 });
      return;
    }
    this.setData({
      currentIndex: nextIndex,
      currentWord: this.data.queue[nextIndex],
      inputValue: '',
      hintLevel: 0,
      hintText: '',
      checked: false,
      resultType: '',
      resultText: '',
      answerText: '',
      progressPercent: Math.round(((nextIndex + 1) / this.data.queue.length) * 100),
    });
  },

  restart() {
    this.loadQueue(this.data.source);
  },

  finish() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
