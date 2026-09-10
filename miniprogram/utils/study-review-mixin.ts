const { canGenerateCloze, findConfusingWords } = require('./learning-aids');
const { findWordFamily, createSentenceBuilding, getMnemonicHints } = require('./multi-modal');
const { CONFIG } = require('./config');
const { calculateForgettingDecay } = require('./fsrs');

const data = {
  mnemonicDraft: '',
  memoryInfo: { stability: '0.0', difficulty: '0.0', reviewCount: 0, retention: '--', retentionColor: '' },
  clozeMode: false,
  hasClozeExample: false,
  hasMemoryHistory: false,
  relatedWords: [],
  wordFamily: [],
  mnemonicHints: [],
  buildEnabled: false,
  canUndo: false,
};

function getAppInstance() {
  return typeof getApp === 'function' ? getApp() : null;
}

function getWordExtras(wordOrId) {
  const app = getAppInstance();
  const words = app ? app.getWords() : [];
  const word = typeof wordOrId === 'object'
    ? wordOrId
    : words.find(item => String(item.id) === String(wordOrId));
  const data = app ? app.globalData.progress[String(word && word.id)] || {} : {};
  return {
    mnemonicDraft: data.mnemonic || '',
    relatedWords: word ? findConfusingWords(word, words, 4) : [],
    wordFamily: word ? findWordFamily(word, words, 6) : [],
    mnemonicHints: word ? getMnemonicHints(word, words) : [],
    hasClozeExample: Boolean(word && canGenerateCloze(word.word, word.example)),
    buildEnabled: Boolean(word && createSentenceBuilding(word.word, word.example)),
    hasMemoryHistory: (Number(data.reviewCount) || 0) > 0,
    memoryInfo: {
      stability: Number.isFinite(data.stability) ? data.stability.toFixed(1) : '0.0',
      difficulty: Number.isFinite(data.difficulty) ? data.difficulty.toFixed(1) : '0.0',
      reviewCount: Number(data.reviewCount) || 0,
      retention: retentionText(data),
      retentionColor: retentionColor(data),
    },
  };
}

// 基于 FSRS 幂律公式计算当前记忆保留率 (百分比)，并生成展示文本
function retentionText(data) {
  const r = retentionPercent(data);
  return r === null ? '--' : Math.round(r) + '%';
}

function retentionColor(data) {
  const r = retentionPercent(data);
  if (r === null) return 'var(--light-gray)';
  if (r < 50) return 'var(--danger)';
  if (r < 80) return 'var(--warning)';
  return 'var(--success)';
}

function retentionPercent(data) {
  const stability = Number(data && data.stability);
  const lastStudy = data && data.lastStudy;
  if (!Number.isFinite(stability) || !lastStudy) return null;
  const daysSinceReview = Math.max(0, (Date.now() - lastStudy) / CONFIG.CONSTANTS.MS_PER_DAY);
  return calculateForgettingDecay({ stability, lastStudy }, daysSinceReview) * 100;
}

function onShowAnswer() {
  const nextAnswerState = !this.data.showAnswer;
  this.setData({
    showAnswer: nextAnswerState,
    clozeMode: nextAnswerState ? this.data.hasClozeExample : false,
  });
}

function onMnemonicInput(e) {
  this.setData({ mnemonicDraft: e.detail.value });
}

function saveMnemonic() {
  if (!this.data.currentWord) return;
  const app = getAppInstance();
  if (!app || typeof app.getWordData !== 'function') return;
  const data = app.getWordData(this.data.currentWord.id);
  data.mnemonic = this.data.mnemonicDraft.trim().slice(0, 120);
  app.setWordData(this.data.currentWord.id, data);
  wx.showToast({ title: data.mnemonic ? '记忆提示已保存' : '记忆提示已清空', icon: 'none' });
}

function toggleCloze() {
  if (!this.data.hasClozeExample) return;
  this.setData({ clozeMode: !this.data.clozeMode });
}

function onRevealExample() {
  if (this.data.clozeMode) this.setData({ clozeMode: false });
}

function onRelatedTap(e) {
  const word = e.currentTarget.dataset.word;
  if (!word) return;
  wx.showModal({
    title: word.word,
    content: [word.phonetic, word.meaning, word.example].filter(Boolean).join('\n'),
    showCancel: false,
  });
}

function onUndo() {
  const app = getAppInstance();
  if (!app || typeof app.undoLastAnswer !== 'function') return;
  const result = app.undoLastAnswer();
  if (!result.restored) {
    wx.showToast({ title: result.message, icon: 'none' });
    return;
  }
  const index = this.data.finished
    ? this.data.currentIndex
    : Math.max(0, this.data.currentIndex - 1);
  const word = this.data.words[index];
  const progressKey = this.data.studyProgress !== undefined ? 'studyProgress' : 'reviewProgress';
  this.setData({
    finished: false,
    currentIndex: index,
    currentWord: word,
    todayCount: Math.max(0, this.data.todayCount - 1),
    canUndo: app.canUndoAnswer(),
    showAnswer: false,
    clozeMode: false,
    [progressKey]: Math.round(((index + 1) / this.data.words.length) * 100),
    ...getWordExtras(word),
  });
  wx.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
}

module.exports = {
  data,
  methods: {
    getWordExtras,
    onShowAnswer,
    onMnemonicInput,
    saveMnemonic,
    toggleCloze,
    onRevealExample,
    onRelatedTap,
    onUndo,
  },
};
