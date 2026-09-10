// 错词本
const { loadVocab } = require('../../utils/vocab-loader');
const { playWordAudio, addAudioListener } = require('../../utils/audio');
const { getPackageRoot } = require('../../utils/series');

const PAGE_SIZE = 100;

function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

Page({
  data: {
    wordsGroup: [],
    totalCount: 0,
    loadedCount: 0,
    hasMore: false,
    empty: false,
    loading: false,
    loadError: '',
    currentLevel: 'CET4',
    totalErrors: 0,
    dueWrongCount: 0,
    hardestWord: '暂无',
    playingWord: '',
  },
  onLoad() {
    this._wrongWords = [];
    this._loadGeneration = 0;
    this._unsubAudio = addAudioListener((event, word) => {
      if (event === 'play') {
        this.setData({ playingWord: word || '' });
      } else if (event === 'ended' || event === 'stop' || event === 'error') {
        if (this.data.playingWord === word) {
          this.setData({ playingWord: '' });
        }
      }
    });
  },

  onShow() {
    const app = getAppInstance();
    const currentLevel = (app && app.globalData && app.globalData.currentLevel) || 'CET4';
    this.setData({ currentLevel });
    if (app && app.getWords && app.getWords(currentLevel).length === 0) this.requestVocab(currentLevel);
    else this.loadWrongWords();
  },

  onUnload() {
    this._loadGeneration = (this._loadGeneration || 0) + 1;
    if (typeof this._unsubAudio === 'function') {
      this._unsubAudio();
    }
  },

  loadWrongWords() {
    const app = getAppInstance();
    const level = (app && app.globalData && app.globalData.currentLevel) || 'CET4';
    const allWords = (app && app.getWords && app.getWords(level)) || [];
    const wrongIds = (app && app.globalData && app.globalData.wrongWords) || [];

    if (!allWords.length) {
      this.requestVocab(level);
      return;
    }

    const wordMap = new Map(allWords.map((word: any) => [String(word.id), word]));
    const now = Date.now();
    this._wrongWords = wrongIds.map((id: any) => {
      const word: any = wordMap.get(String(id));
      if (!word) return null;
      const data = (app && app.globalData && app.globalData.progress && app.globalData.progress[String(id)]) || {};
      return {
        ...word,
        errorCount: Math.max(0, Number(data.errorCount) || 0),
        reviewCount: Math.max(0, Number(data.reviewCount) || 0),
        lastWrongAt: Number(data.lastWrongAt) || 0,
        due: Number.isFinite(data.nextReview) && data.nextReview <= now,
      };
    }).filter(Boolean).sort((a: any, b: any) => b.errorCount - a.errorCount || b.lastWrongAt - a.lastWrongAt);
    const initial = this._wrongWords.slice(0, PAGE_SIZE);
    const totalErrors = this._wrongWords.reduce((sum, word) => sum + word.errorCount, 0);
    const dueWrongCount = this._wrongWords.filter(word => word.due).length;
    this.setData({
      currentLevel: level,
      wordsGroup: initial.length ? [initial] : [],
      totalCount: this._wrongWords.length,
      loadedCount: initial.length,
      hasMore: initial.length < this._wrongWords.length,
      empty: this._wrongWords.length === 0,
      loadError: '',
      totalErrors,
      dueWrongCount,
      hardestWord: this._wrongWords.length ? this._wrongWords[0].word : '暂无',
    });
  },

  onReachBottom() {
    if (!this.data.hasMore) return;
    const start = this.data.loadedCount;
    const next = this._wrongWords.slice(start, start + PAGE_SIZE);
    if (!next.length) {
      this.setData({ hasMore: false });
      return;
    }
    const groupIndex = this.data.wordsGroup.length;
    this.setData({
      [`wordsGroup[${groupIndex}]`]: next,
      loadedCount: start + next.length,
      hasMore: start + next.length < this._wrongWords.length,
    });
  },

  async requestVocab(level) {
    if (this.data.loading) return;
    const generation = (this._loadGeneration || 0) + 1;
    this._loadGeneration = generation;
    this.setData({ loading: true, loadError: '' });
    wx.showLoading({ title: '加载词库' });

    try {
      const result = await loadVocab(level, {
        retries: 2,
        onRetry: ({ attempt, retries }) => {
          if (generation === this._loadGeneration) {
            wx.showToast({ title: `加载失败，正在重试 (${attempt}/${retries})`, icon: 'none' });
          }
        },
      });
      const app = getAppInstance();
      if (generation !== this._loadGeneration || (app && app.globalData && app.globalData.currentLevel !== result.level)) return;
      if (app && app.setWords) app.setWords(result.level, result.words);
      this.setData({ loading: false });
      this.loadWrongWords();
    } catch (error) {
      if (generation !== this._loadGeneration) return;
      const errMsg = error && (error as any).message ? (error as any).message : String(error);
      this.setData({ loading: false, loadError: errMsg });
      wx.showModal({
        title: '词库加载失败',
        content: `无法加载 ${level} 词库，请稍后重试。\n(${errMsg})`,
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: (res: any) => {
          if (res.confirm) this.onRetryVocab();
        },
      });
    } finally {
      if (generation === this._loadGeneration) wx.hideLoading();
    }
  },

  onRetryVocab() {
    const app = getAppInstance();
    const currentLevel = (app && app.globalData && app.globalData.currentLevel) || this.data.currentLevel || 'CET4';
    this.requestVocab(currentLevel);
  },

  onPlayAudio(e: any) {
    const { word } = e.currentTarget.dataset;
    if (word) {
      playWordAudio(word);
    }
  },

  onWordTap(e: any) {
    const { word } = e.currentTarget.dataset;
    wx.showModal({
      title: word.word,
      content: word.phonetic ? `${word.phonetic}\n${word.meaning}` : word.meaning,
      showCancel: false,
    });
  },

  onRemove(e: any) {
    const app = getAppInstance();
    if (app && app.removeWrongWord) app.removeWrongWord(e.currentTarget.dataset.id);
    this.loadWrongWords();
  },

  goReview() {
    wx.navigateTo({ url: '/pages/review/index' });
  },

  goWrongSpelling() {
    if (this.data.empty) {
      wx.showToast({ title: '当前没有错词', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/spelling/index?source=wrong' });
  },

  goVocabList() {
    const app = getAppInstance();
    const level = (app && app.globalData && app.globalData.currentLevel) || 'CET4';
    const packageRoot = getPackageRoot(level);
    wx.navigateTo({ url: `/${packageRoot}/pages/list/list` });
  },
});
