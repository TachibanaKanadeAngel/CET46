function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

const { calculateInterval } = require('../../utils/fsrs');
const { getReviewWords } = require('../../utils/vocab');
const { CONFIG } = require('../../utils/config');
const { createAnswerHandler, goNextWord, goHome } = require('../../utils/study-common');
const { stopWordAudio } = require('../../utils/audio');
const studyReviewMixin = require('../../utils/study-review-mixin');

Page({
  data: {
    words: [],
    currentIndex: 0,
    currentWord: null,
    // 复习页直接展示释义，用户只需评估记忆程度
    showAnswer: true,
    total: 0,
    finished: false,
    empty: false,
    todayCount: 0,
    reviewProgress: 0,
    ...studyReviewMixin.data,
  },
  ...studyReviewMixin.methods,

  onLoad() {
    this._isAnswering = false;
    const app = getAppInstance();
    if (!app) return;
    if (typeof app.clearAnswerActions === 'function') app.clearAnswerActions();
    const words = app.getWords ? app.getWords() : [];
    if (!words || words.length === 0) {
      wx.showToast({ title: '请先返回首页加载词库', icon: 'none' });
      goHome();
      return;
    }

    const reviewWords = getReviewWords(words, app.globalData.progress, 50);
    if (reviewWords.length === 0) {
      this.setData({ empty: true, words: [], currentWord: null, total: 0, reviewProgress: 0 });
      return;
    }

    this.setData({
      words: reviewWords,
      currentWord: reviewWords[0],
      total: reviewWords.length,
      empty: false,
      todayCount: 0,
      reviewProgress: Math.round(100 / reviewWords.length),
      showAnswer: true,
      clozeMode: false,
      ...this.getWordExtras(reviewWords[0]),
    });
  },

  onUnload() {
    stopWordAudio();
  },

  onHide() {
    stopWordAudio();
  },

  onHard() {
    this.answer(1);
  },

  onGood() {
    this.answer(3);
  },

  onEasy() {
    this.answer(4);
  },

  onSkip() {
    this.nextWord();
  },

  onChopWord() {
    const { currentWord } = this.data;
    if (!currentWord) return;

    const app = getAppInstance();
    if (!app) return;

    const wd = app.getWordData(currentWord.id);
    wd.status = 'mastered';
    wd.stability = 100;
    wd.difficulty = 1;
    wd.reviewCount = (wd.reviewCount || 0) + 1;
    wd.lastStudy = Date.now();
    wd.nextReview = Date.now() + 365 * 24 * 3600 * 1000;

    app.setWordData(currentWord.id, wd);
    app.removeWrongWord(currentWord.id);
    app.recordHeatmap(true, false);

    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'heavy' });
    }
    wx.showToast({ title: '⚡ 斩！已标记永久掌握', icon: 'none' });

    this.nextWord();
  },

  answer: createAnswerHandler(function answerReview(quality) {
    const { currentWord } = this.data;
    const app = getAppInstance();
    if (!app) return;
    const wd = app.getWordData(currentWord.id);
    const wasMastered = wd.status === 'mastered';
    const interval = calculateInterval(wd, quality);

    wd.lastStudy = Date.now();
    wd.reviewCount = (wd.reviewCount || 0) + 1;

    const known = quality >= 3;
    if (known) {
      wd.nextReview = Date.now() + interval;
      wd.status = wasMastered ||
        (wd.reviewCount >= CONFIG.CONSTANTS.LEVEL_MASTERED && wd.stability >= 10)
        ? 'mastered'
        : 'review';
      app.removeWrongWord(currentWord.id);
    } else {
      wd.nextReview = Date.now() + CONFIG.CONSTANTS.MS_PER_DAY;
      wd.status = 'review';
      app.addWrongWord(currentWord.id);
    }

    app.setWordData(currentWord.id, wd);
    app.recordHeatmap(known, false);
  }),

  nextWord() {
    goNextWord(this, 'reviewProgress');
    if (!this.data.finished) {
      this.setData({
        showAnswer: true,
        clozeMode: false,
        ...this.getWordExtras(this.data.currentWord),
      });
    }
  },

  goStudy() {
    wx.redirectTo({ url: '/pages/study/index' });
  },

  finish: goHome,
});
