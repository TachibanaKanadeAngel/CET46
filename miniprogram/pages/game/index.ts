function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

const { storage, STORAGE_KEYS } = require('../../utils/storage');
const { buildMatchPool, createMatchRound } = require('../../utils/training');
const { createOpponent, aiRoundPoint, settleBattle } = require('../../utils/battle');

const GAME_SECONDS = 60;
const CHOICE_COUNT = 8;

Page({
  data: {
    gameActive: false,
    finished: false,
    gameMode: 'solo',
    timeLeft: GAME_SECONDS,
    score: 0,
    aiScore: 0,
    aiAccuracy: 0,
    aiResult: '',
    streak: 0,
    maxStreak: 0,
    errors: 0,
    skipped: 0,
    target: null,
    choices: [],
    selectedId: '',
    selectedState: '',
    bestScore: 0,
    bestStreak: 0,
    bestAiScore: 0,
    achievements: [],
  },

  onLoad() {
    this._pool = [];
    this._timer = null;
    this._roundTimer = null;
    this._opponent = createOpponent();
    const stats = storage.get(STORAGE_KEYS.MINIGAME_STATS) || {};
    this.setData({
      bestScore: Number(stats.bestScore) || 0,
      bestStreak: Number(stats.bestStreak) || 0,
      bestAiScore: Number(stats.bestAiScore) || 0,
      achievements: Array.isArray(stats.achievements) ? stats.achievements : [],
    });
  },

  onUnload() {
    this.clearTimers();
  },

  onHide() {
    this.clearTimers();
  },

  clearTimers() {
    if (this._timer) clearInterval(this._timer);
    if (this._roundTimer) clearTimeout(this._roundTimer);
    this._timer = null;
    this._roundTimer = null;
  },

  startGame(e) {
    const app = getAppInstance();
    const words = (app && app.getWords) ? app.getWords() : [];
    if (!words.length) {
      wx.showToast({ title: '请先返回首页加载词库', icon: 'none' });
      wx.switchTab({ url: '/pages/index/index' });
      return;
    }
    const progress = (app && app.globalData && app.globalData.progress) || {};
    const wrongWords = (app && app.globalData && app.globalData.wrongWords) || [];
    this._pool = buildMatchPool(words, wrongWords, progress, 30);
    if (this._pool.length < 2) {
      wx.showToast({ title: '可用词汇不足', icon: 'none' });
      return;
    }
    const mode = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.mode) || 'solo';
    // 对战模式初始化 AI 对手
    if (mode === 'battle') {
      this._opponent.reset();
      this._opponent = createOpponent();
    }
    this.clearTimers();
    this.setData({
      gameActive: true,
      finished: false,
      gameMode: mode,
      timeLeft: GAME_SECONDS,
      score: 0,
      aiScore: 0,
      aiAccuracy: mode === 'battle' ? Math.round(this._opponent.currentAccuracy() * 100) : 0,
      aiResult: '',
      streak: 0,
      maxStreak: 0,
      errors: 0,
      skipped: 0,
      selectedId: '',
      selectedState: '',
    });
    this.nextRound();
    this._timer = setInterval(() => {
      const next = this.data.timeLeft - 1;
      if (next <= 0) this.endGame();
      else this.setData({ timeLeft: next });
    }, 1000);
  },

  nextRound() {
    if (!this.data.gameActive) return;
    // 清理待触发的回合切换定时器，防止“答对后快速点跳过/再次作答”导致跳过额外回合
    if (this._roundTimer) {
      clearTimeout(this._roundTimer);
      this._roundTimer = null;
    }
    const round = createMatchRound(this._pool, CHOICE_COUNT);
    if (!round) {
      this.endGame();
      return;
    }
    this.setData({
      target: round.target,
      choices: round.choices.map(item => ({ ...item, choiceKey: String(item.id) })),
      selectedId: '',
      selectedState: '',
    });
  },

  onChoiceTap(e) {
    if (!this.data.gameActive || this.data.selectedState) return;
    const id = String(e.currentTarget.dataset.id);
    const targetId = String(this.data.target.id);
    if (id === targetId) {
      const streak = this.data.streak + 1;
      const score = this.data.score + 10 + Math.min(20, streak * 2);
      this.setData({
        selectedId: id,
        selectedState: 'correct',
        streak,
        maxStreak: Math.max(this.data.maxStreak, streak),
        score,
      });
      this.aiTurn();
      this._roundTimer = setTimeout(() => this.nextRound(), 350);
      return;
    }

    this.setData({
      selectedId: id,
      selectedState: 'wrong',
      streak: 0,
      errors: this.data.errors + 1,
      score: Math.max(0, this.data.score - 2),
    });
    this.aiTurn();
    this._roundTimer = setTimeout(() => this.nextRound(), 650);
  },

  // 对战模式：每轮玩家作答后，AI 并行作答一回合（同级动态难度）
  aiTurn() {
    if (this.data.gameMode !== 'battle') return;
    const accuracy = this._opponent.observe(this.data.score, this.data.aiScore, this.data.streak);
    const correct = this._opponent.answer();
    const aiScore = this.data.aiScore + aiRoundPoint(correct);
    this.setData({ aiScore, aiAccuracy: Math.round(accuracy * 100) });
  },

  onSkip() {
    if (!this.data.gameActive || this.data.selectedState) return;
    this.setData({
      skipped: this.data.skipped + 1,
      streak: 0,
    });
    this.aiTurn();
    this.nextRound();
  },

  endGame() {
    if (!this.data.gameActive) return;
    this.clearTimers();
    const achievements = new Set(this.data.achievements);
    achievements.add('完成首局');
    if (this.data.maxStreak >= 5) achievements.add('五连击');
    if (this.data.maxStreak >= 10) achievements.add('十连击');
    if (this.data.score >= 200) achievements.add('得分达人');
    if (this.data.errors === 0 && this.data.score > 0) achievements.add('零失误');
    // 对战模式：胜/负/平 + 战胜 AI 成就
    let aiResult = '';
    if (this.data.gameMode === 'battle') {
      aiResult = settleBattle(this.data.score, this.data.aiScore);
      if (aiResult === 'win' && this.data.aiScore >= 1) achievements.add('战胜AI');
    }

    const bestScore = Math.max(this.data.bestScore, this.data.score);
    const bestStreak = Math.max(this.data.bestStreak, this.data.maxStreak);
    const bestAiScore = Math.max(this.data.bestAiScore, this.data.aiScore);
    const nextAchievements = Array.from(achievements);
    const previous = storage.get(STORAGE_KEYS.MINIGAME_STATS) || {};
    storage.set(STORAGE_KEYS.MINIGAME_STATS, {
      games: (Number(previous.games) || 0) + 1,
      bestScore,
      bestStreak,
      bestAiScore,
      achievements: nextAchievements,
    });

    this.setData({
      gameActive: false,
      finished: true,
      timeLeft: 0,
      bestScore,
      bestStreak,
      bestAiScore,
      aiResult,
      achievements: nextAchievements,
    });
  },

  exitGame() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
