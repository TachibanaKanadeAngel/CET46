import { calculateLevenshtein, updateFSRS } from '../core.js';
import { UI, playTone, fireConfetti, speak } from '../ui.js';

let spellingMode = 'meaning';
let spellingChecked = false;
let currentHintLevel = 0;
let lastSpellingQuality = 5;

let studyQueue = [];
let studyIndex = 0;
let getWordData = null;
let setWordData = null;
let addWrongWord = null;
let removeWrongWord = null;
let saveStudySession = null;
let updateStats = null;
let updateProgress = null;
let showStudyWord = null;

function init(config) {
  studyQueue = config.studyQueue;
  studyIndex = config.studyIndex;
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
  studyQueue = queue;
  studyIndex = index;
}

function getSpellingMode() {
  return spellingMode;
}

function setSpellingMode(mode) {
  spellingMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`mode-${mode}`).classList.add('active');

  const w = studyQueue[studyIndex];
  if (!w) return;

  const meaningEl = document.getElementById('spelling-meaning');
  const phoneticEl = document.getElementById('spelling-phonetic');
  const soundBtn = document.getElementById('spelling-sound');

  meaningEl.style.display = 'block';
  phoneticEl.style.display = 'block';
  soundBtn.style.display = 'none';

  if (mode === 'meaning') {
    meaningEl.textContent = w.meaning;
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
  const w = studyQueue[studyIndex];
  if (w) speak(w.word);
}

function giveSpellingHint() {
  const w = studyQueue[studyIndex];
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
  hintBtn.textContent = `💡 再提示 (${lastSpellingQuality}分)`;
}

function openSpellingChallenge() {
  const w = studyQueue[studyIndex];
  if (!w) return;

  currentHintLevel = 0;
  lastSpellingQuality = 5;

  document.getElementById('spelling-modal').classList.add('active');
  document.getElementById('spelling-input').value = '';
  document.getElementById('spelling-input').className = 'spelling-input';
  document.getElementById('spelling-input').placeholder = '输入单词...';
  document.getElementById('spelling-result').className = 'spelling-result';
  document.getElementById('spelling-result').innerHTML = '<div id="spelling-result-text"></div><div class="spelling-answer" id="spelling-answer"></div>';
  document.getElementById('hint-level-display').style.display = 'none';
  document.getElementById('hint-btn').textContent = '💡 提示';
  spellingChecked = false;
  document.getElementById('spelling-submit').textContent = '提交';

  setSpellingMode(spellingMode);

  setTimeout(() => document.getElementById('spelling-input').focus(), 100);
}

function closeSpellingModal() {
  document.getElementById('spelling-modal').classList.remove('active');
}

function checkSpelling() {
  if (spellingChecked) {
    closeSpellingModal();
    showStudyWord();
    return;
  }

  const w = studyQueue[studyIndex];
  const input = document.getElementById('spelling-input').value.trim().toLowerCase();
  const correct = w.word.toLowerCase();

  const inputEl = document.getElementById('spelling-input');
  const resultEl = document.getElementById('spelling-result');
  const resultTextEl = document.getElementById('spelling-result-text');
  const answerEl = document.getElementById('spelling-answer');

  const distance = calculateLevenshtein(input, correct);
  spellingChecked = true;

  if (distance === 0) {
    inputEl.className = 'spelling-input correct';
    resultEl.className = 'spelling-result show success';
    resultTextEl.textContent = '🎉 完美！拼写完全正确';
    answerEl.textContent = `+${w.word}`;
    
    processSpellingResult(w, 5);
    fireConfetti();
    playTone('success');

  } else if (distance === 1 && correct.length >= 4) {
    inputEl.className = 'spelling-input warning';
    inputEl.style.borderColor = 'var(--warning)';
    resultEl.className = 'spelling-result show warning';
    resultEl.style.background = '#feebc8';
    resultEl.style.color = '#c05621';
    
    resultTextEl.textContent = '💡 几乎正确！检测到微小笔误';
    answerEl.textContent = `正确答案: ${w.word}`;
    
    processSpellingResult(w, 3);
    playTone('success');

  } else {
    inputEl.className = 'spelling-input wrong';
    resultEl.className = 'spelling-result show error';
    resultTextEl.textContent = '❌ 拼写错误，差距过大';
    answerEl.textContent = `正确答案: ${w.word}`;
    
    processSpellingResult(w, 1);
    playTone('fail');
    addWrongWord(w.id);
  }

  document.getElementById('spelling-submit').textContent = '继续';
}

function processSpellingResult(w, quality) {
  let wd = getWordData(w.id);
  const fsrs = updateFSRS(wd, quality);
  
  wd.stability = fsrs.stability;
  wd.difficulty = fsrs.difficulty;
  wd.status = quality >= 3 ? 'mastered' : 'review';
  wd.level = quality >= 3 ? 10 : 0;
  wd.lastStudy = Date.now();
  wd.reviewCount++;
  
  setWordData(w.id, wd);
  if (quality >= 3) {
    studyQueue.splice(studyIndex, 1);
    removeWrongWord(w.id);
  }
  
  saveStudySession();
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
