import { shuffle, getWordData, applyFuzz, MIN_EF, MAX_EF, FSRS_W } from '../core.js';
import { speak, setSafeWordHeader } from '../ui.js';

let reviewQueue = [];
let reviewIndex = 0;
let reviewFlipped = false;
let currentReviewWord = null;
let reviewSubmitting = false;
let getWordsFn = () => [];

function setWords(words) {
  if (typeof words === 'function') {
    getWordsFn = words;
  } else {
    getWordsFn = () => words;
  }
}

function getWords() {
  return getWordsFn();
}

function getReviewState() {
  return { queue: reviewQueue, index: reviewIndex, flipped: reviewFlipped, current: currentReviewWord };
}

function updateReview(getWordDataFn) {
  const now = Date.now();
  reviewQueue = [];

  let WORDS = getWordsFn();
  
  // 如果 getWordsFn 返回空，尝试从全局获取
  if (!WORDS || WORDS.length === 0) {
    console.warn('[Review] 检测到词库为空，正在尝试从全局重新抓取...');
    WORDS = window.WORDS || [];
  }
  
  const getWordDataInstance = getWordDataFn || getWordData;
  
  WORDS.forEach(w => {
    const wd = getWordDataInstance(w.id);
    if (wd && wd.status === 'review' && wd.nextReview > 0 && now >= wd.nextReview) {
      reviewQueue.push({ ...w, wordData: wd });
    }
  });

  shuffle(reviewQueue);
  reviewIndex = 0;

  const overdueCount = reviewQueue.filter(w => now > w.wordData.nextReview + 24 * 60 * 60 * 1000).length;

  document.getElementById('review-count').textContent = reviewQueue.length;
  document.getElementById('review-overdue').textContent = overdueCount;

  if (reviewQueue.length > 0) {
    showReviewWord();
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

function showReviewWord() {
  if (reviewIndex >= reviewQueue.length) {
    currentReviewWord = null;
    reviewSubmitting = false;
    document.getElementById('review-word').textContent = '暂无待复习单词';
    document.getElementById('review-pron').textContent = '';
    document.getElementById('review-meaning').textContent = '';
    document.getElementById('review-example').textContent = '';
    document.getElementById('review-buttons').style.display = 'none';
    document.getElementById('review-ef-display').style.display = 'none';
    return { needsUpdate: true };
  }

  currentReviewWord = reviewQueue[reviewIndex];
  const w = currentReviewWord;
  
  if (!w) {
    console.warn('[showReviewWord] 当前索引无单词数据:', reviewIndex);
    return { needsUpdate: true };
  }

  const reviewWord = document.getElementById('review-word');
  const reviewPron = document.getElementById('review-pron');
  const reviewMeaning = document.getElementById('review-meaning');
  const reviewExample = document.getElementById('review-example');
  const reviewCard = document.getElementById('review-card');
  const btnReviewUnknown = document.getElementById('btn-review-unknown');
  const btnReviewKnown = document.getElementById('btn-review-known');

  if (reviewWord) setSafeWordHeader('review-word', w.word, w.level);
  if (reviewPron) reviewPron.textContent = w.phonetic || '';
  if (reviewMeaning) reviewMeaning.textContent = w.meaning || w.translation || '';
  if (reviewExample) reviewExample.textContent = w.example || '';

  reviewFlipped = false;
  if (reviewCard) reviewCard.classList.remove('flipped');

  // 强制确保按钮处于可用状态（不再禁用按钮）
  if (btnReviewUnknown) btnReviewUnknown.disabled = false;
  if (btnReviewKnown) btnReviewKnown.disabled = false;

  const efDisplay = document.getElementById('review-ef-display');
  const efValue = document.getElementById('review-ef-value');
  const efFill = document.getElementById('review-ef-fill');

  if (!efDisplay || !efValue || !efFill) {
    console.warn('[showReviewWord] EF 显示元素不存在');
  } else {
    efDisplay.style.display = 'block';
    efValue.textContent = (w.wordData.ef || 2.5).toFixed(2);
    const efPercent = (((w.wordData.ef || 2.5) - MIN_EF) / (MAX_EF - MIN_EF)) * 100;
    efFill.style.width = `${efPercent}%`;
  }

  const stability = w.wordData.stability || FSRS_W[0];
  const difficulty = w.wordData.difficulty || FSRS_W[1];
  
  const stabilityValue = document.getElementById('review-stability-value');
  const difficultyValue = document.getElementById('review-difficulty-value');
  
  if (stabilityValue) stabilityValue.textContent = stability.toFixed(1);
  if (difficultyValue) difficultyValue.textContent = difficulty.toFixed(1);

  const retentionValue = document.getElementById('review-retention-value');
  
  if (w.wordData.lastStudy) {
    const daysSinceReview = (Date.now() - w.wordData.lastStudy) / (24 * 60 * 60 * 1000);
    const retention = Math.pow(0.9, daysSinceReview / stability) * 100;
    
    if (retentionValue) {
      retentionValue.textContent = retention.toFixed(0) + '%';
      
      if (retention < 50) {
        retentionValue.style.color = 'var(--danger)';
      } else if (retention < 80) {
        retentionValue.style.color = 'var(--warning)';
      } else {
        retentionValue.style.color = 'var(--success)';
      }
    }
  } else {
    if (retentionValue) retentionValue.textContent = '--';
  }

  return { needsUpdate: false };
}

function flipReviewCard() {
  reviewFlipped = !reviewFlipped;
  
  const reviewCard = document.getElementById('review-card');
  if (reviewCard) {
    reviewCard.classList.toggle('flipped', reviewFlipped);
  }

  const meaningEl = document.getElementById('review-meaning');
  const exampleEl = document.getElementById('review-example');

  // 移除翻转相关的 aria-live 设置，内容始终可见
  if (meaningEl) meaningEl.setAttribute('aria-live', 'polite');
  if (exampleEl) exampleEl.setAttribute('aria-live', 'polite');
}

/**
 * @param {boolean} known
 * @param {Object} deps
 * @returns {Promise<void>}
 */
async function markReviewWord(known, deps) {
  if (reviewSubmitting) return;
  reviewSubmitting = true;

  try {
    const { setWordData, updateFSRS, calculateFSRSInterval, adjustForSemanticInterference, getPersonalizedCircadianFactor, addWrongWord, removeWrongWord, recordHeatmap, saveDailyProgressSnapshot, updateStats, showReviewWord, playTone, fireConfetti } = deps;
  
  const w = currentReviewWord;
  if (!w) {
    console.warn('[markReviewWord] 当前无复习单词');
    return;
  }
  
  const wd = w.wordData ? { ...w.wordData } : null;
  if (!wd) {
    console.warn('[markReviewWord] 单词数据不存在:', w.id);
    return;
  }
  

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
    addWrongWord(w.id, w);
  }

  wd.lastStudy = Date.now();
  await setWordData(w.id, wd);
  recordHeatmap();
  saveDailyProgressSnapshot();
  updateStats();
  showReviewWord();
  reviewSubmitting = false;
} catch (e) {
  reviewSubmitting = false;
  console.error('[markReviewWord] error:', e);
  throw e;
}
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
