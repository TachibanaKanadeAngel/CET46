function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

const { calculateInterval } = require('../../utils/fsrs');
const { getNewWords } = require('../../utils/vocab');
const { createAnswerHandler, goNextWord, goHome } = require('../../utils/study-common');
const { generateChoiceOptions, createSentenceBuilding } = require('../../utils/multi-modal');
const { EarwormPlayer } = require('../../utils/earworm');
const { stopWordAudio } = require('../../utils/audio');
const studyReviewMixin = require('../../utils/study-review-mixin');
const { saveSession, loadSession, clearSession } = require('../../utils/study-session');

Page({
  data: {
    words: [],
    currentIndex: 0,
    currentWord: null,
    showAnswer: true,
    autoShowMeaning: true,
    total: 0,
    finished: false,
    todayCount: 0,
    studyLimit: 20,
    studyProgress: 0,
    
    // 多维学习模式: 'card' (抽认卡) | 'choice' (4选1辨义) | 'listen' (听音辨义)
    studyMode: 'card',
    choiceOptions: [],
    selectedChoiceId: '',
    choiceStatus: '', // 'correct' | 'wrong' | ''
    choiceLock: false,
    
    // 连击 Combo 系统
    combo: 0,
    maxCombo: 0,
    showComboAlert: false,
    
    // 错词回炉补刀提示
    retryCount: 0,
    
    // 造句排序（产出性练习自检）
    buildEnabled: false,
    buildShow: false,
    buildAnswer: [],
    buildBank: [],
    buildSlots: [],
    buildResult: '',
    
    // 磨耳朵模式状态
    isEarwormPlaying: false,
    showEarwormModal: false,
    
    ...studyReviewMixin.data,
  },
  ...studyReviewMixin.methods,

  onLoad(query) {
    this._isAnswering = false;
    this._allVocab = [];
    this._sessionTimer = null;
    this._earwormPlayer = new EarwormPlayer();

    const app = getAppInstance();
    if (!app) return;
    if (typeof app.clearAnswerActions === 'function') app.clearAnswerActions();
    const words = app.getWords ? app.getWords() : [];
    if (!words || words.length === 0) {
      wx.showToast({ title: '请先返回首页加载词库', icon: 'none' });
      goHome();
      return;
    }

    this._allVocab = words;
    const studyLimit = (app.globalData.settings && app.globalData.settings.studyLimit) || 20;

    // 检查是否有指定强制开启新一轮标记
    const forceNew = Boolean(query && (query.action === 'new' || query.restart === '1'));
    if (forceNew) {
      clearSession(app.globalData.currentLevel);
    }

    // 断点续学优先检测：存在同一词库的未完成会话时直接无缝恢复，绝不提前用新词覆盖！
    const saved = !forceNew ? loadSession(app.globalData.currentLevel) : null;
    if (saved && this._canRestoreSession(saved)) {
      this._restoreSession(saved);
      const remain = saved.queueIds.length - saved.currentIndex;
      wx.showToast({
        title: `已接续上次进度 (剩 ${remain} 词)`,
        icon: 'none',
        duration: 2000,
      });
    } else {
      const newWords = getNewWords(words, app.globalData.progress, studyLimit);
      if (newWords.length === 0) {
        wx.showToast({ title: '当前等级新词已全部学完！', icon: 'none' });
        goHome();
        return;
      }
      this._initQueue(newWords, studyLimit, 0);
    }

    this._initEarworm();
  },

  onShow() {
    const app = getAppInstance();
    const autoShowMeaning = (app && app.globalData && app.globalData.settings && app.globalData.settings.autoShowMeaning !== undefined)
      ? Boolean(app.globalData.settings.autoShowMeaning)
      : true;
    if (this.data.autoShowMeaning !== autoShowMeaning) {
      this.setData({
        autoShowMeaning,
        ...(this.data.studyMode === 'card' ? { showAnswer: autoShowMeaning } : {}),
      });
    }
  },

  onUnload() {
    stopWordAudio();
    if (this._earwormPlayer) {
      this._earwormPlayer.stop();
    }
    if (this._choiceNextTimer) {
      clearTimeout(this._choiceNextTimer);
      this._choiceNextTimer = null;
    }
    this._flushStudySession();
  },

  onHide() {
    stopWordAudio();
    if (this._earwormPlayer) {
      this._earwormPlayer.pause();
    }
    this._flushStudySession();
  },

  // 校验已保存的会话是否可在当前词库下安全恢复
  _canRestoreSession(saved) {
    if (!saved || !Array.isArray(saved.queueIds) || saved.queueIds.length === 0) return false;
    if (!this._allVocab || this._allVocab.length === 0) return false;
    const wordsMap = new Map(this._allVocab.map(w => [String(w.id), w]));
    const validCount = saved.queueIds.filter(id => wordsMap.has(String(id))).length;
    return validCount > 0 && Number(saved.currentIndex) < saved.queueIds.length;
  },

  // 以指定队列开启一轮学习
  _initQueue(queueWords, studyLimit, startIndex) {
    const app = getAppInstance();
    const autoShowMeaning = (app && app.globalData && app.globalData.settings && app.globalData.settings.autoShowMeaning !== undefined)
      ? Boolean(app.globalData.settings.autoShowMeaning)
      : true;
    const isCard = this.data.studyMode === 'card';
    const queue = queueWords.slice();
    const idx = Math.max(0, Math.min(startIndex, queue.length - 1));
    const currentWord = queue[idx];
    this.setData({
      words: queue,
      currentWord,
      currentIndex: idx,
      total: queue.length,
      todayCount: 0,
      studyLimit,
      finished: false,
      autoShowMeaning,
      showAnswer: isCard ? autoShowMeaning : false,
      studyProgress: queue.length > 0 ? Math.round(((idx + 1) / queue.length) * 100) : 0,
      choiceOptions: currentWord ? generateChoiceOptions(currentWord, this._allVocab, 4) : [],
      ...this.getWordExtras(currentWord),
    });
    if (this._earwormPlayer) this._earwormPlayer.setPlaylist(queue, idx);
    this._saveStudySession();
  },

  // 从已保存会话接续上次学习
  _restoreSession(saved) {
    if (!this._allVocab || this._allVocab.length === 0) return;
    const wordsMap = new Map(this._allVocab.map(w => [String(w.id), w]));
    const queue = saved.queueIds.map(id => wordsMap.get(String(id))).filter(Boolean);
    if (queue.length === 0) return; // 词库变化，保持新建队列

    const app = getAppInstance();
    const autoShowMeaning = (app && app.globalData && app.globalData.settings && app.globalData.settings.autoShowMeaning !== undefined)
      ? Boolean(app.globalData.settings.autoShowMeaning)
      : true;
    const isCard = this.data.studyMode === 'card';
    const idx = Math.min(Math.max(0, saved.currentIndex), queue.length - 1);
    const currentWord = queue[idx];
    this.setData({
      words: queue,
      currentWord,
      currentIndex: idx,
      total: queue.length,
      todayCount: saved.todayCount || 0,
      studyLimit: this.data.studyLimit,
      finished: false,
      autoShowMeaning,
      showAnswer: isCard ? autoShowMeaning : false,
      studyProgress: Math.round(((idx + 1) / queue.length) * 100),
      choiceOptions: generateChoiceOptions(currentWord, this._allVocab, 4),
      ...this.getWordExtras(currentWord),
    });
    if (this._earwormPlayer) this._earwormPlayer.setPlaylist(queue, idx);
    this._saveStudySession();
  },

  // 防抖保存学习会话（切后台/翻页时保存项）
  _saveStudySession() {
    const d = this.data;
    if (d.finished || !d.words || d.words.length === 0) return;
    const app = getAppInstance();
    if (!app) return;
    const payload = {
      level: app.globalData.currentLevel,
      queueIds: d.words.map(w => String(w.id)),
      currentIndex: d.currentIndex,
      todayCount: d.todayCount,
      totalCount: d.total,
    };
    if (this._sessionTimer) {
      clearTimeout(this._sessionTimer);
      this._sessionTimer = null;
    }
    this._sessionTimer = setTimeout(() => {
      this._sessionTimer = null;
      saveSession(payload);
    }, 300);
  },

  // 立即写入学习会话（页面卸载/切后台时置休）
  _flushStudySession() {
    if (this._sessionTimer) {
      clearTimeout(this._sessionTimer);
      this._sessionTimer = null;
    }
    const d = this.data;
    const app = getAppInstance();
    if (d.finished || !d.words || d.words.length === 0 || !app) return;
    saveSession({
      level: app.globalData.currentLevel,
      queueIds: d.words.map(w => String(w.id)),
      currentIndex: d.currentIndex,
      todayCount: d.todayCount,
      totalCount: d.total,
    });
  },

  // 清除学习会话（学习完成时）
  _clearStudySession() {
    if (this._sessionTimer) {
      clearTimeout(this._sessionTimer);
      this._sessionTimer = null;
    }
    const app = getAppInstance();
    const level = app && app.globalData && app.globalData.currentLevel;
    clearSession(level);
  },

  _initEarworm() {
    this._earwormPlayer.setPlaylist(this.data.words, this.data.currentIndex);
    this._earwormPlayer.onWordChange = (word, index) => {
      this.setData({
        currentIndex: index,
        currentWord: word,
        showAnswer: true,
        studyProgress: Math.round(((index + 1) / this.data.words.length) * 100),
        ...this.getWordExtras(word),
      });
    };
    this._earwormPlayer.onStateChange = (playing) => {
      this.setData({ isEarwormPlaying: playing });
    };
    this._earwormPlayer.onFinish = () => {
      this.setData({ isEarwormPlaying: false, finished: true });
      this._clearStudySession();
      wx.showToast({ title: '磨耳朵播放完毕', icon: 'success' });
    };
  },

  // 切换学习模式 (抽认卡 / 4选1 / 听音测验)
  onModeSwitch(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.studyMode) return;
    const isCard = mode === 'card';
    this.setData({
      studyMode: mode,
      showAnswer: isCard ? this.data.autoShowMeaning : false,
      choiceStatus: '',
      selectedChoiceId: '',
      choiceLock: false,
    });
    if (mode === 'choice' || mode === 'listen') {
      this._refreshChoices();
    }
  },

  // 抽认卡上方快捷胶囊：切换直接看释义与自测加难模式
  toggleMeaningMode() {
    const nextVal = !this.data.autoShowMeaning;
    const app = getAppInstance();
    if (app && app.globalData) {
      if (!app.globalData.settings) app.globalData.settings = {};
      app.globalData.settings.autoShowMeaning = nextVal;
      if (typeof app.saveProgress === 'function') {
        app.saveProgress();
      }
    }
    this.setData({
      autoShowMeaning: nextVal,
      showAnswer: this.data.studyMode === 'card' ? nextVal : false,
    });
    wx.showToast({
      title: nextVal ? '📖 已开启：直接看释义' : '🧠 已开启：自测加难模式',
      icon: 'none',
    });
  },

  // 造句排序：开启/关闭产出性练习面板
  toggleBuild() {
    if (!this.data.buildEnabled) {
      wx.showToast({ title: '本例过短，暂不支持造句', icon: 'none' });
      return;
    }
    const word = this.data.currentWord;
    if (this.data.buildShow) {
      this.setData({ buildShow: false, buildResult: '' });
      return;
    }
    const build = createSentenceBuilding(word && word.word, word && word.example);
    if (!build) {
      wx.showToast({ title: '本例过短，暂不支持造句', icon: 'none' });
      return;
    }
    this.setData({
      buildShow: true,
      buildAnswer: build.answer,
      buildBank: build.bank.map((text, i) => ({ text, uid: 'b' + i })),
      buildSlots: build.answer.map(() => ({ filled: false, text: '' })),
      buildResult: '',
    });
  },

  // 点击词块：填入第一个空位并从未选词块中移除
  onTapBuildToken(e) {
    const uid = String(e.currentTarget.dataset.uid);
    const bank = this.data.buildBank;
    const idx = bank.findIndex(x => String(x.uid) === uid);
    if (idx === -1) return;
    const slots = this.data.buildSlots.map(s => ({ ...s }));
    const target = slots.findIndex(s => !s.filled);
    if (target === -1) return;
    slots[target] = { filled: true, text: bank[idx].text };
    const nextBank = bank.filter((_, i) => i !== idx);
    this.setData({ buildBank: nextBank, buildSlots: slots, buildResult: '' });
  },

  // 检查重组结果
  checkBuild() {
    const got = this.data.buildSlots.map(s => s.text).filter(Boolean).join(' ');
    const ans = this.data.buildAnswer.join(' ');
    const correct = got === ans;
    this.setData({ buildResult: correct ? '正确' : '顺序还需调整' });
    wx.showToast({ title: correct ? '✅ 造句正确' : '再看一眼例句顺序', icon: correct ? 'success' : 'none' });
  },

  // 重置造句面板
  resetBuild() {
    const word = this.data.currentWord;
    const build = createSentenceBuilding(word && word.word, word && word.example);
    if (!build) return;
    this.setData({
      buildAnswer: build.answer,
      buildBank: build.bank.map((text, i) => ({ text, uid: 'b' + i })),
      buildSlots: build.answer.map(() => ({ filled: false, text: '' })),
      buildResult: '',
    });
  },

  _refreshChoices() {
    if (!this.data.currentWord) return;
    const choiceOptions = generateChoiceOptions(this.data.currentWord, this._allVocab, 4);
    this.setData({
      choiceOptions,
      selectedChoiceId: '',
      choiceStatus: '',
      choiceLock: false,
    });
  },

  // 4选1选项点击处理 (看英选汉 / 听音选义)
  onSelectChoice(e) {
    if (this.data.choiceLock) return;
    const choice = e.currentTarget.dataset.choice;
    if (!choice) return;

    this.setData({
      selectedChoiceId: choice.id,
      choiceLock: true,
    });

    const isCorrect = Boolean(choice.isCorrect);
    this.setData({
      choiceStatus: isCorrect ? 'correct' : 'wrong',
    });

    // 震动与连击反馈
    if (isCorrect) {
      const nextCombo = this.data.combo + 1;
      const maxCombo = Math.max(this.data.maxCombo, nextCombo);
      this.setData({
        combo: nextCombo,
        maxCombo,
        showComboAlert: nextCombo >= 3,
      });
      if (typeof wx.vibrateShort === 'function') {
        wx.vibrateShort({ type: 'light' });
      }
      // 延迟自动判为"认识"；若期间用户已手动切题则取消，避免误标记下一个单词
      if (this._choiceNextTimer) clearTimeout(this._choiceNextTimer);
      this._choiceNextTimer = setTimeout(() => {
        this._choiceNextTimer = null;
        this.onKnown();
      }, 450);
    } else {
      this.setData({ combo: 0, showComboAlert: false });
      if (typeof wx.vibrateShort === 'function') {
        wx.vibrateShort({ type: 'medium' });
      }
      // 答错后：记录错误并翻开卡片展示深度解析，同时锁定选项，防止重复点选导致重复入队/误切题
      this._recordUnknownWord();
      this.setData({
        showAnswer: true,
        choiceLock: true,
      });
    }
  },

  _recordUnknownWord() {
    const app = getAppInstance();
    const currentWord = this.data.currentWord;
    if (!currentWord) return;

    if (app && typeof app.captureAnswerAction === 'function') {
      app.captureAnswerAction(currentWord.id);
    }

    this._processAnswer(false);

    // 自动压入回炉重练队列（每词每次会话最多回炉一次，防止反复答错导致队列无限增长）
    if (!currentWord._isRetry) {
      const words = this.data.words.slice();
      words.push({ ...currentWord, _isRetry: true });
      this.setData({
        words,
        total: words.length,
        retryCount: this.data.retryCount + 1,
        canUndo: Boolean(app && typeof app.canUndoAnswer === 'function' && app.canUndoAnswer()),
      });
    }
    this._saveStudySession();
  },

  onKnown() {
    this._handleAnswer(true);
  },

  onUnknown() {
    this._handleAnswer(false);
  },

  onSkip() {
    this.nextWord();
  },

  // 一键斩词 (秒杀简单词，直接标记已掌握并不再安排后续复习)
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
    app.recordHeatmap(true, true);

    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'heavy' });
    }
    wx.showToast({ title: '⚡ 斩！已标记永久掌握', icon: 'none' });

    this.nextWord();
  },

  // 磨耳朵控制
  toggleEarworm() {
    if (this.data.isEarwormPlaying) {
      this._earwormPlayer.pause();
    } else {
      this._earwormPlayer.start();
    }
  },

  _handleAnswer(known) {
    if (this._isAnswering) return;
    this._isAnswering = true;

    const app = getAppInstance();
    const currentWord = this.data.currentWord;
    if (app && typeof app.captureAnswerAction === 'function' && currentWord) {
      app.captureAnswerAction(currentWord.id);
    }

    try {
      this._processAnswer(known);
      
      // 答错时自动加入即时回炉补刀队列 (Immediate Retry Queue，每词每次会话最多一次)
      if (!known && currentWord && !currentWord._isRetry) {
        const words = this.data.words.slice();
        words.push({ ...currentWord, _isRetry: true });
        this.setData({
          words,
          total: words.length,
          retryCount: this.data.retryCount + 1,
        });
      }

      this.setData({
        todayCount: this.data.todayCount + (known ? 1 : 0),
        canUndo: Boolean(app && typeof app.canUndoAnswer === 'function' && app.canUndoAnswer()),
      });
      this.nextWord();
    } catch (e) {
      console.error('[study] 处理答案异常:', e);
      wx.showToast({ title: '处理失败，请重试', icon: 'none' });
    } finally {
      this._isAnswering = false;
    }
  },

  _processAnswer(known) {
    const { currentWord } = this.data;
    const app = getAppInstance();
    if (!app || !currentWord) return;

    const wd = app.getWordData(currentWord.id);
    const quality = known ? 3 : 1;
    const interval = calculateInterval(wd, quality);

    wd.status = 'review';
    wd.nextReview = Date.now() + interval;
    wd.lastStudy = Date.now();
    wd.reviewCount = (wd.reviewCount || 0) + 1;

    app.setWordData(currentWord.id, wd);

    if (!known) {
      app.addWrongWord(currentWord.id);
    }
    app.recordHeatmap(known, true);
  },

  nextWord() {
    // 取消未触发的"答对自动判认识"延时，避免误标记下一个单词
    if (this._choiceNextTimer) {
      clearTimeout(this._choiceNextTimer);
      this._choiceNextTimer = null;
    }
    goNextWord(this, 'studyProgress');
    if (this.data.finished) {
      this._clearStudySession();
    } else {
      const isCard = this.data.studyMode === 'card';
      this.setData({
        showAnswer: isCard ? this.data.autoShowMeaning : false,
        clozeMode: false,
        selectedChoiceId: '',
        choiceStatus: '',
        choiceLock: false,
        ...this.getWordExtras(this.data.currentWord),
      });
      this._refreshChoices();
      this._saveStudySession();
    }
  },

  finish: goHome,
});
