import { AppState } from '../state.js';
import { shuffle, getWordData, setWordData as coreSetWordData, pushAction, updateFSRS, calculateFSRSInterval, applyFuzz, getPersonalizedCircadianFactor } from '../core.js';
import { UI, playTone, fireConfetti, speak, setSafeWordHeader } from '../ui.js';

let reviewQueue = [];
let reviewIndex = 0;
let reviewFlipped = false;
let currentReviewWord = null;
let WORDS = [];

function setWords(words) {
  WORDS = words;
}

function getWords() {
  return WORDS;
}

function getReviewState() {
  return { queue: reviewQueue, index: reviewIndex, flipped: reviewFlipped, current: currentReviewWord };
}

function updateReview(getWordData, MIN_EF, MAX_EF, FSRS_W) {
  const now = Date.now();
  reviewQueue = [];

  WORDS.forEach(w => {
    const wd = getWordData(w.id);
    if (wd.status === 'review' && wd.nextReview > 0 && now >= wd.nextReview) {
      reviewQueue.push({ ...w, wordData: wd });
    }
  });

  shuffle(reviewQueue);
  reviewIndex = 0;

  const overdueCount = reviewQueue.filter(w => now > w.wordData.nextReview + 24 * 60 * 60 * 1000).length;

  document.getElementById('review-count').textContent = reviewQueue.length;
  document.getElementById('review-overdue').textContent = overdueCount;

  if (reviewQueue.length > 0) {
    showReviewWord(MIN_EF, MAX_EF, FSRS_W);
    document.getElementById('review-buttons').style.display = 'flex';
  } else {
    document.getElementById('review-word').textContent = '暂无待复习单词';
    document.getElementById('review-pron').textContent = '';
    document.getElementById('review-meaning').textContent = '';
    document.getElementById('review-example').textContent = '';
    document.getElementById('review-buttons').style.display = 'none';
    document.getElementById('review-ef-display').style.display = 'none';
  }
}

function showReviewWord(MIN_EF, MAX_EF, FSRS_W) {
  if (reviewIndex >= reviewQueue.length) {
    return { needsUpdate: true };
  }

  currentReviewWord = reviewQueue[reviewIndex];
  const w = currentReviewWord;

  setSafeWordHeader('review-word', w.word, w.level);
  document.getElementById('review-pron').textContent = w.phonetic;
  document.getElementById('review-meaning').textContent = w.meaning;
  document.getElementById('review-example').textContent = w.example;

  reviewFlipped = false;
  document.getElementById('review-card').classList.remove('flipped');

  document.getElementById('btn-review-unknown').disabled = true;
  document.getElementById('btn-review-known').disabled = true;

  const efDisplay = document.getElementById('review-ef-display');
  const efValue = document.getElementById('review-ef-value');
  const efFill = document.getElementById('review-ef-fill');

  efDisplay.style.display = 'block';
  efValue.textContent = w.wordData.ef.toFixed(2);
  const efPercent = ((w.wordData.ef - MIN_EF) / (MAX_EF - MIN_EF)) * 100;
  efFill.style.width = `${efPercent}%`;

  const stability = w.wordData.stability || FSRS_W[0];
  const difficulty = w.wordData.difficulty || FSRS_W[1];
  
  document.getElementById('review-stability-value').textContent = stability.toFixed(1);
  document.getElementById('review-difficulty-value').textContent = difficulty.toFixed(1);

  if (w.wordData.lastStudy) {
    const daysSinceReview = (Date.now() - w.wordData.lastStudy) / (24 * 60 * 60 * 1000);
    const retention = Math.pow(0.9, daysSinceReview / stability) * 100;
    const retentionValue = document.getElementById('review-retention-value');
    
    retentionValue.textContent = retention.toFixed(0) + '%';
    
    if (retention < 50) {
      retentionValue.style.color = 'var(--danger)';
    } else if (retention < 80) {
      retentionValue.style.color = 'var(--warning)';
    } else {
      retentionValue.style.color = 'var(--success)';
    }
  } else {
    document.getElementById('review-retention-value').textContent = '--';
  }

  return { needsUpdate: false };
}

function flipReviewCard() {
  reviewFlipped = !reviewFlipped;
  document.getElementById('review-card').classList.toggle('flipped', reviewFlipped);

  const meaningEl = document.getElementById('review-meaning');
  const exampleEl = document.getElementById('review-example');

  if (reviewFlipped) {
    document.getElementById('btn-review-unknown').disabled = false;
    document.getElementById('btn-review-known').disabled = false;
    speak(currentReviewWord.word);

    if (meaningEl) meaningEl.setAttribute('aria-live', 'polite');
    if (exampleEl) exampleEl.setAttribute('aria-live', 'polite');
  } else {
    if (meaningEl) meaningEl.removeAttribute('aria-live');
    if (exampleEl) exampleEl.removeAttribute('aria-live');
  }
}

async function markReviewWord(known, deps) {
  const { getWordData, setWordData, pushAction, updateFSRS, calculateFSRSInterval, adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord, removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats, showReviewWord, playTone, fireConfetti } = deps;
  
  const w = currentReviewWord;
  let wd = w.wordData;
  
  await pushAction(w.id, { ...wd });

  const quality = known ? 4 : 1;
  const fsrs = updateFSRS(wd, quality);
  wd.stability = fsrs.stability;
  wd.difficulty = fsrs.difficulty;

  if (known) {
    wd.level = wd.level + 1;

    if (wd.level >= 10) {
      wd.status = 'mastered';
      if (wd.level === 10) fireConfetti();
    }

    const circadian = getPersonalizedCircadianFactor();
    const baseInterval = calculateFSRSInterval(wd.stability);
    const fuzzedInterval = applyFuzz(baseInterval);
    const maxInterval = 365 * 24 * 60 * 60 * 1000;
    const semanticAdjusted = adjustForSemanticInterference(w.id, fuzzedInterval);
    wd.nextReview = Date.now() + Math.min(semanticAdjusted * circadian, maxInterval);
    wd.nextReviewDate = new Date(wd.nextReview).toISOString().split('T')[0];
    wd.reviewCount++;
    reviewIndex++;
    playTone('success');
    removeWrongWord(w.id);
  } else {
    wd.level = Math.max(0, Math.floor(wd.level / 2));
    const baseInterval = calculateFSRSInterval(wd.stability);
    const fuzzedInterval = applyFuzz(baseInterval);
    wd.nextReview = Date.now() + adjustForSemanticInterference(w.id, fuzzedInterval);

    reviewQueue.push(w);
    reviewIndex++;
    playTone('fail');
    addWrongWord(w.id);
  }

  wd.lastStudy = Date.now();
  await setWordData(w.id, wd);
  recordHeatmap();
  saveDailyProgressSnapshot();
  updateStats();
  showReviewWord();
}

function speakReviewWord() {
  if (currentReviewWord) speak(currentReviewWord.word);
}

export const ReviewFeature = {
  setWords,
  getWords,
  getReviewState,
  updateReview,
  showReviewWord,
  flipReviewCard,
  markReviewWord,
  speakReviewWord,
  get reviewQueue() { return reviewQueue; },
  get reviewIndex() { return reviewIndex; },
  get reviewFlipped() { return reviewFlipped; },
  get currentReviewWord() { return currentReviewWord; }
};
