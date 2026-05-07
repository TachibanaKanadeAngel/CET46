import { calculateLevenshtein, updateFSRS } from '../core.js';
import { playTone, fireConfetti, speak } from '../ui.js';

let spellingMode = 'meaning';
let spellingChecked = false;
let currentHintLevel = 0;
let lastSpellingQuality = 5;

let getStudyQueueFn = null;
let getStudyIndexFn = null;
let getWordData = null;
let setWordData = null;
let addWrongWord = null;
let removeWrongWord = null;
let saveStudySession = null;
let updateStats = null;
let updateProgress = null;
let showStudyWord = null;

function getStudyQueue() {
  return getStudyQueueFn ? getStudyQueueFn() : [];
}

function getStudyIndex() {
  return getStudyIndexFn ? getStudyIndexFn() : 0;
}

function init(config) {
  // 兼容两种注入方式：
  // 1. getStudyQueue/getStudyIndex 方法
  // 2. studyQueue/studyIndex getter
  getStudyQueueFn = typeof config.getStudyQueue === 'function'
    ? config.getStudyQueue
    : (() => (config.studyQueue || []));

  getStudyIndexFn = typeof config.getStudyIndex === 'function'
    ? config.getStudyIndex
    : (() => Number(config.studyIndex || 0));

  getWordData = config.getWordData;
  setWordData = config.setWordData;
  addWrongWord = config.addWrongWord;
  removeWrongWord = config.removeWrongWord;
  saveStudySession = config.saveStudySession;
  updateStats = config.updateStats;
  updateProgress = config.updateProgress;
  showStudyWord = config.showStudyWord;
}

function setStudyQueue(queue, index) {
  void queue;
  void index;
}

function getSpellingMode() {
  return spellingMode;
}

function setSpellingMode(mode) {
  spellingMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`mode-${mode}`).classList.add('active');

  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) return;

  const meaningEl = document.getElementById('spelling-meaning');
  const phoneticEl = document.getElementById('spelling-phonetic');
  const soundBtn = document.getElementById('spelling-sound');

  meaningEl.style.display = 'block';
  phoneticEl.style.display = 'block';
  soundBtn.style.display = 'none';

  if (mode === 'meaning') {
    meaningEl.textContent = w.meaning || w.translation || '';
    phoneticEl.textContent = '';
  } else if (mode === 'phonetic') {
    meaningEl.textContent = '';
    phoneticEl.textContent = w.phonetic;
  } else if (mode === 'audio') {
    meaningEl.textContent = '';
    phoneticEl.textContent = '';
    soundBtn.style.display = 'flex';
    speak(w.word);
  }
}

function replaySpellingAudio() {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (w) speak(w.word);
}

function giveSpellingHint() {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) return;

  currentHintLevel++;
  const word = w.word;
  const hintLevelDisplay = document.getElementById('hint-level-display');

  let hint = '';
  if (currentHintLevel === 1) {
    hint = `首字母: ${word[0].toUpperCase()}`;
  } else if (currentHintLevel === 2) {
    hint = `前两字母: ${word.substring(0, 2)}`;
  } else if (currentHintLevel >= 3) {
    const showCount = Math.min(currentHintLevel, Math.floor(word.length / 2) + 1);
    hint = `提示: ${word.substring(0, showCount)}${'_'.repeat(word.length - showCount)}`;
  }

  document.getElementById('spelling-input').placeholder = hint;
  hintLevelDisplay.style.display = 'inline';
  hintLevelDisplay.textContent = `提示等级: ${currentHintLevel}`;

  lastSpellingQuality = Math.max(2, 5 - currentHintLevel);

  const hintBtn = document.getElementById('hint-btn');
  hintBtn.textContent = `再提示 (${lastSpellingQuality} 分)`;
}

function openSpellingChallenge() {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) return;

  currentHintLevel = 0;
  lastSpellingQuality = 5;

  document.getElementById('spelling-modal').classList.add('active');
  document.getElementById('spelling-input').value = '';
  document.getElementById('spelling-input').className = 'spelling-input';
  document.getElementById('spelling-input').placeholder = '输入单词...';

  const resultEl = document.getElementById('spelling-result');
  resultEl.className = 'spelling-result';
  resultEl.replaceChildren();

  const resultTextEl = document.createElement('div');
  resultTextEl.id = 'spelling-result-text';

  const answerEl = document.createElement('div');
  answerEl.className = 'spelling-answer';
  answerEl.id = 'spelling-answer';

  resultEl.appendChild(resultTextEl);
  resultEl.appendChild(answerEl);

  document.getElementById('hint-level-display').style.display = 'none';
  document.getElementById('hint-btn').textContent = '提示';
  spellingChecked = false;
  document.getElementById('spelling-submit').textContent = '提交';

  setSpellingMode(spellingMode);

  setTimeout(() => document.getElementById('spelling-input').focus(), 100);
}

function closeSpellingModal() {
  document.getElementById('spelling-modal').classList.remove('active');
}

async function checkSpelling() {
  if (spellingChecked) {
    closeSpellingModal();
    showStudyWord();
    return;
  }

  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) {
    console.warn('[checkSpelling] 当前无单词数据');
    return;
  }

  const inputEl = document.getElementById('spelling-input');
  const resultEl = document.getElementById('spelling-result');
  const resultTextEl = document.getElementById('spelling-result-text');
  const answerEl = document.getElementById('spelling-answer');
  if (!inputEl || !resultEl || !resultTextEl || !answerEl) {
    console.warn('[checkSpelling] 拼写面板 DOM 元素缺失');
    return;
  }

  const input = inputEl.value.trim().toLowerCase();
  const correct = w.word.toLowerCase();

  const distance = calculateLevenshtein(input, correct);
  spellingChecked = true;

  if (distance === 0) {
    inputEl.className = 'spelling-input correct';
    resultEl.className = 'spelling-result show success';
    resultTextEl.textContent = '拼写完全正确';
    answerEl.textContent = `答案: ${w.word}`;

    await processSpellingResult(w, 5);
    fireConfetti();
    playTone('success');
  } else if (distance === 1 && correct.length >= 4) {
    inputEl.className = 'spelling-input warning';
    inputEl.style.borderColor = 'var(--warning)';
    resultEl.className = 'spelling-result show warning';
    resultEl.style.background = '#feebc8';
    resultEl.style.color = '#c05621';

    resultTextEl.textContent = '几乎正确，检测到轻微拼写误差';
    answerEl.textContent = `正确答案: ${w.word}`;

    await processSpellingResult(w, 3);
    playTone('success');
  } else {
    inputEl.className = 'spelling-input wrong';
    resultEl.className = 'spelling-result show error';
    resultTextEl.textContent = '拼写错误，和正确答案差距较大';
    answerEl.textContent = `正确答案: ${w.word}`;

    await processSpellingResult(w, 1);
    playTone('fail');
    addWrongWord(w.id, w);
  }

  document.getElementById('spelling-submit').textContent = '继续';
}

async function processSpellingResult(w, quality) {
  const wd = { ...getWordData(w.id) };
  const fsrsQuality = Math.min(quality, 4);
  const fsrs = updateFSRS(wd, fsrsQuality);

  wd.stability = fsrs.stability;
  wd.difficulty = fsrs.difficulty;
  wd.status = quality >= 3 ? 'mastered' : 'review';
  wd.level = quality >= 3 ? 10 : 0;
  wd.lastStudy = Date.now();
  wd.reviewCount++;

  await setWordData(w.id, wd);
  if (quality >= 3) {
    const currentQueue = getStudyQueue();
    const currentIndex = getStudyIndex();
    currentQueue.splice(currentIndex, 1);
    removeWrongWord(w.id);
  }

  try {
    await saveStudySession();
  } catch (e) {
    console.warn('[spelling] saveStudySession failed:', e);
  }
  updateStats();
  updateProgress();
}

function handleSpellingKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkSpelling();
  }
  if (e.key === 'Escape') {
    closeSpellingModal();
  }
}

export const SpellingFeature = {
  init,
  setStudyQueue,
  getSpellingMode,
  setSpellingMode,
  replaySpellingAudio,
  giveSpellingHint,
  openSpellingChallenge,
  closeSpellingModal,
  checkSpelling,
  handleSpellingKeydown
};
