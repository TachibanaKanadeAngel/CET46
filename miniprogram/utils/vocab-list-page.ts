const PAGE_SIZE = 100;
const { playWordAudio, addAudioListener } = require('./audio');
const { getSeries } = require('./series');

function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

function createVocabListPage(level, wordsModule) {
  const WORDS = wordsModule.WORDS;
  const seriesInfo = getSeries(level);
  const levelTitle = (seriesInfo && seriesInfo.name) ? seriesInfo.name : level;
  return {
    data: {
      wordsGroup: [],
      totalCount: 0,
      libraryTotal: WORDS.length,
      loadedCount: 0,
      hasMore: false,
      level,
      levelTitle,
      query: '',
      statusIndex: 0,
      playingWord: '',
      statusOptions: [
        { value: 'all', label: '全部状态' },
        { value: 'new', label: '未学习' },
        { value: 'review', label: '学习中' },
        { value: 'mastered', label: '已掌握' },
        { value: 'wrong', label: '错词' },
      ],
    },

    onLoad() {
      this._filterTimer = null;
      const app = getAppInstance();
      const customStore = (app && app.globalData && app.globalData.customWords) || {};
      const customWords = customStore[level] || [];
      const seen = new Set();
      this._allWords = [...WORDS, ...customWords].filter(word => {
        const key = String(word.word || '').toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      this._filteredWords = this._allWords;
      this.setData({ libraryTotal: this._allWords.length });
      this.applyFilters();

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

    onUnload() {
      if (this._filterTimer) clearTimeout(this._filterTimer);
      if (typeof this._unsubAudio === 'function') {
        this._unsubAudio();
      }
    },

    getWordStatus(word) {
      const app = getAppInstance();
      const progress = (app && app.globalData && app.globalData.progress) || {};
      const data = progress[String(word.id)];
      return data && data.status ? data.status : 'new';
    },

    decorateWords(words) {
      const app = getAppInstance();
      const wrongList = (app && app.globalData && app.globalData.wrongWords) || [];
      const wrongSet = new Set(wrongList.map(String));
      return words.map(word => {
        const status = this.getWordStatus(word);
        const statusLabel = wrongSet.has(String(word.id))
          ? '错词'
          : status === 'mastered'
            ? '已掌握'
            : status === 'review'
              ? '学习中'
              : '未学习';
        return { ...word, status, statusLabel };
      });
    },

    applyFilters() {
      const query = this.data.query.trim().toLowerCase();
      const status = this.data.statusOptions[this.data.statusIndex].value;
      const app = getAppInstance();
      const wrongList = (app && app.globalData && app.globalData.wrongWords) || [];
      const wrongSet = status === 'wrong'
        ? new Set(wrongList.map(String))
        : null;
      this._filteredWords = this._allWords.filter(word => {
        const textMatched = !query || String(word.word).toLowerCase().includes(query) ||
          String(word.meaning || '').toLowerCase().includes(query);
        if (!textMatched) return false;
        if (status === 'all') return true;
        if (status === 'wrong') return wrongSet.has(String(word.id));
        return this.getWordStatus(word) === status;
      });
      const initial = this.decorateWords(this._filteredWords.slice(0, PAGE_SIZE));
      this.setData({
        wordsGroup: initial.length ? [initial] : [],
        totalCount: this._filteredWords.length,
        loadedCount: initial.length,
        hasMore: initial.length < this._filteredWords.length,
      });
    },

    onSearchInput(e) {
      this.setData({ query: e.detail.value });
      if (this._filterTimer) clearTimeout(this._filterTimer);
      this._filterTimer = setTimeout(() => this.applyFilters(), 200);
    },

    clearSearch() {
      if (this._filterTimer) clearTimeout(this._filterTimer);
      this.setData({ query: '' });
      this.applyFilters();
    },

    onStatusChange(e) {
      this.setData({ statusIndex: Number(e.detail.value) });
      this.applyFilters();
    },

    onReachBottom() {
      if (!this.data.hasMore) return;
      const start = this.data.loadedCount;
      const next = this.decorateWords(this._filteredWords.slice(start, start + PAGE_SIZE));
      const groupIndex = this.data.wordsGroup.length;
      this.setData({
        [`wordsGroup[${groupIndex}]`]: next,
        loadedCount: start + next.length,
        hasMore: start + next.length < this._filteredWords.length,
      });
    },

    onPlayAudio(e) {
      const { word } = e.currentTarget.dataset;
      if (word) {
        playWordAudio(word);
      }
    },

    onWordTap(e) {
      const { word } = e.currentTarget.dataset;
      const details = [word.phonetic, word.meaning, word.example].filter(Boolean).join('\n');
      wx.showModal({ title: word.word, content: details, showCancel: false });
    },
  };
}

module.exports = { createVocabListPage };
