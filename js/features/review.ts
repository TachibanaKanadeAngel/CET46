import { getWordData } from '../core.js';
import { shuffle } from '../utils.js';
import { applyFuzz, MIN_EF, MAX_EF, getFSRSWeight } from '../fsrs.js';
import { speak, setSafeWordHeader, UI, announceForAccessibility } from '../ui.js';
import logger from '../utils/logger.js';
import { byId } from '../utils/dom.js';
import { localDateStr } from '../utils/date.js';
import { CONFIG } from '../config.js';

import type { WordData } from '../../ts/types/word';
import type { StudyQueueItem, ReviewState } from '../../ts/types/features';

export interface ReviewSession {
  queue: StudyQueueItem[];
  index: number;
  flipped: boolean;
  currentWord: StudyQueueItem | null;
  submitting: boolean;
  getWordsFn: () => WordData[];
}

const createInitialReviewSession = (): ReviewSession => ({
  queue: [],
  index: 0,
  flipped: false,
  currentWord: null,
  submitting: false,
  getWordsFn: () => [],
});

export const reviewSession: ReviewSession = createInitialReviewSession();
const session = reviewSession;

export function resetReviewSession(): void {
  Object.assign(session, createInitialReviewSession());
}

export function setWords(words: WordData[] | (() => WordData[])): void {
  if (typeof words === 'function') {
    session.getWordsFn = words as () => WordData[];
  } else {
    session.getWordsFn = () => words;
  }
}

export function getWords(): WordData[] {
  return session.getWordsFn();
}

export function getReviewState(): ReviewState {
  return {
    queue: session.queue,
    index: session.index,
    flipped: session.flipped,
    current: session.currentWord,
  };
}

export function updateReview(getWordDataFn?: (id: number | string) => any): void {
  const now = Date.now();
  session.queue = [];

  let WORDS = session.getWordsFn();

  if (!WORDS || WORDS.length === 0) {
    logger.warn('[Review] 检测到词库为空，正在尝试从全局重新抓取...');
    WORDS = (typeof window !== 'undefined' ? (window as any).WORDS : []) || [];
  }

  const getWordDataInstance = getWordDataFn || getWordData;

  let overdueCount = 0;
  WORDS.forEach(w => {
    const wd = getWordDataInstance(w.id);
    if (wd && wd.status === 'review' && wd.nextReview > 0 && now >= wd.nextReview) {
      session.queue.push({ ...w, wordData: wd });
      if (now > wd.nextReview + CONFIG.CONSTANTS.MS_PER_DAY) overdueCount++;
    }
  });

  shuffle(session.queue);
  session.index = 0;

  const reviewCountEl = byId('review-count');
  const reviewOverdueEl = byId('review-overdue');
  if (reviewCountEl) reviewCountEl.textContent = String(session.queue.length);
  if (reviewOverdueEl) reviewOverdueEl.textContent = String(overdueCount);

  if (session.queue.length > 0) {
    showReviewWord();
    const reviewButtons = byId('review-buttons');
    if (reviewButtons) reviewButtons.style.display = 'flex';
  } else {
    const reviewWord = byId('review-word');
    const reviewPron = byId('review-pron');
    const reviewMeaning = byId('review-meaning');
    const reviewExample = byId('review-example');
    const reviewButtons = byId('review-buttons');
    const reviewEfDisplay = byId('review-ef-display');
    if (reviewWord) reviewWord.textContent = '暂无待复习单词';
    if (reviewPron) reviewPron.textContent = '';
    if (reviewMeaning) reviewMeaning.textContent = '';
    if (reviewExample) reviewExample.textContent = '';
    if (reviewButtons) reviewButtons.style.display = 'none';
    if (reviewEfDisplay) reviewEfDisplay.style.display = 'none';
  }
}

export function showReviewWord(): { needsUpdate: boolean } {
  if (session.index >= session.queue.length) {
    session.currentWord = null;
    session.submitting = false;
    const elWord = byId('review-word');
    if (elWord) elWord.textContent = '暂无待复习单词';
    const elPron = byId('review-pron');
    if (elPron) elPron.textContent = '';
    const elMeaning = byId('review-meaning');
    if (elMeaning) elMeaning.textContent = '';
    const elExample = byId('review-example');
    if (elExample) elExample.textContent = '';
    const reviewButtons = byId('review-buttons');
    if (reviewButtons) reviewButtons.style.display = 'none';
    const efDisplay = byId('review-ef-display');
    if (efDisplay) efDisplay.style.display = 'none';
    return { needsUpdate: true };
  }

  session.currentWord = session.queue[session.index];
  const w = session.currentWord;

  if (!w) {
    logger.warn('[showReviewWord] 当前索引无单词数据:', session.index);
    return { needsUpdate: true };
  }

  const reviewWord = byId('review-word');
  const reviewPron = byId('review-pron');
  const reviewMeaning = byId('review-meaning');
  const reviewExample = byId('review-example');
  const reviewCard = byId('review-card');
  const btnReviewUnknown = byId('btn-review-unknown') as HTMLButtonElement | null;
  const btnReviewKnown = byId('btn-review-known') as HTMLButtonElement | null;

  if (reviewWord) setSafeWordHeader('review-word', w.word, w.level);
  if (reviewPron) reviewPron.textContent = w.phonetic || '';
  if (reviewMeaning) reviewMeaning.textContent = w.meaning || (w as any).translation || '';
  if (reviewExample) reviewExample.textContent = w.example || '';

  session.flipped = false;
  if (reviewCard) {
    reviewCard.classList.remove('flipped');
    reviewCard.setAttribute('aria-pressed', 'false');
  }

  if (btnReviewUnknown) btnReviewUnknown.disabled = false;
  if (btnReviewKnown) btnReviewKnown.disabled = false;

  const wd = w.wordData || ({} as any);

  const efDisplay = byId('review-ef-display');
  const efValue = byId('review-ef-value');
  const efFill = byId('review-ef-fill');

  if (!efDisplay || !efValue || !efFill) {
    logger.warn('[showReviewWord] EF 显示元素不存在');
  } else {
    efDisplay.style.display = 'block';
    efValue.textContent = (wd.ef ?? 2.5).toFixed(2);
    const efPercent = (((wd.ef ?? 2.5) - MIN_EF) / (MAX_EF - MIN_EF)) * 100;
    efFill.style.width = `${efPercent}%`;
  }

  const stability = wd.stability ?? getFSRSWeight(0);
  const difficulty = wd.difficulty ?? getFSRSWeight(4);

  const stabilityValue = byId('review-stability-value');
  const difficultyValue = byId('review-difficulty-value');

  if (stabilityValue) stabilityValue.textContent = stability.toFixed(1);
  if (difficultyValue) difficultyValue.textContent = difficulty.toFixed(1);

  const retentionValue = byId('review-retention-value');

  if (wd.lastStudy) {
    const daysSinceReview = (Date.now() - wd.lastStudy) / CONFIG.CONSTANTS.MS_PER_DAY;
    const retention = Math.pow(1 + daysSinceReview / (9 * Math.max(0.1, stability)), -1) * 100;

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

export function flipReviewCard(): void {
  session.flipped = !session.flipped;

  const reviewCard = byId('review-card');
  if (reviewCard) {
    reviewCard.classList.toggle('flipped', session.flipped);
    reviewCard.setAttribute('aria-pressed', String(session.flipped));
  }

  if (typeof announceForAccessibility === 'function') {
    announceForAccessibility(session.flipped ? '已显示释义和例句' : '已隐藏释义，显示单词');
  }
}

export interface ReviewDeps {
  setWordData: (id: number | string, data: any) => Promise<any>;
  updateFSRS: (data: any, grade: number) => { stability: number; difficulty: number };
  calculateFSRSInterval: (stability: number) => number;
  adjustForSemanticInterference: (wordId: number | string, interval: number) => number;
  getPersonalizedCircadianFactor: () => number;
  addWrongWord: (id: any, word: any) => void;
  removeWrongWord: (id: any) => void;
  recordHeatmap: (date?: string, count?: number) => void;
  saveDailyProgressSnapshot: () => void;
  updateStats: () => void;
  showReviewWord: () => any;
  playTone: (type: string) => void;
  fireConfetti: () => void;
}

export async function markReviewWord(known: boolean, deps: ReviewDeps): Promise<void> {
  if (session.submitting) return;
  session.submitting = true;

  try {
    const {
      setWordData,
      updateFSRS,
      calculateFSRSInterval,
      adjustForSemanticInterference,
      getPersonalizedCircadianFactor,
      addWrongWord,
      removeWrongWord,
      recordHeatmap,
      saveDailyProgressSnapshot,
      updateStats,
      showReviewWord: showWordFn,
      playTone,
      fireConfetti,
    } = deps;

    const w = session.currentWord;
    if (!w) {
      logger.warn('[markReviewWord] 当前无复习单词');
      return;
    }

    const wd = w.wordData ? { ...w.wordData } : null;
    if (!wd) {
      logger.warn('[markReviewWord] 单词数据不存在:', w.id);
      return;
    }

    const quality = known ? ((wd.level || 0) >= 8 ? 4 : 3) : 1;
    const fsrs = updateFSRS(wd, quality);
    wd.stability = fsrs.stability;
    wd.difficulty = fsrs.difficulty;

    if (known) {
      wd.level = Math.min((wd.level || 0) + 1, CONFIG.CONSTANTS.LEVEL_CAP);

      if (wd.level >= CONFIG.CONSTANTS.LEVEL_MASTERED) {
        wd.status = 'mastered';
        if (wd.level === CONFIG.CONSTANTS.LEVEL_MASTERED) fireConfetti();
      }

      const circadian = getPersonalizedCircadianFactor();
      const baseInterval = calculateFSRSInterval(wd.stability);
      const fuzzedInterval = applyFuzz(baseInterval);
      const maxInterval = CONFIG.CONSTANTS.MAX_REVIEW_INTERVAL_MS;
      const semanticAdjusted = adjustForSemanticInterference(w.id, fuzzedInterval);
      wd.nextReview = Date.now() + Math.min(semanticAdjusted * circadian, maxInterval);
      wd.nextReviewDate = localDateStr(new Date(wd.nextReview));
      wd.reviewCount = (wd.reviewCount || 0) + 1;
      playTone('success');
      removeWrongWord(w.id);
    } else {
      wd.level = Math.max(0, Math.floor((wd.level || 0) / 2));
      const baseInterval = calculateFSRSInterval(wd.stability);
      const fuzzedInterval = applyFuzz(baseInterval);
      const maxInterval = CONFIG.CONSTANTS.MAX_REVIEW_INTERVAL_MS;
      wd.nextReview = Date.now() + Math.min(adjustForSemanticInterference(w.id, fuzzedInterval), maxInterval);

      const alreadyInQueue = session.queue.slice(session.index + 1).some(item => item.id === w.id);
      if (!alreadyInQueue) {
        w.wordData = wd;
        session.queue.push(w);
      }
      playTone('fail');
      addWrongWord(w.id, w);
    }

    wd.lastStudy = Date.now();
    await setWordData(w.id, wd);
    w.wordData = wd;
    session.index++;
    recordHeatmap();
    saveDailyProgressSnapshot();
    updateStats();
    showWordFn();
  } catch (e) {
    logger.error('[markReviewWord] error:', e);
    if (typeof UI !== 'undefined' && UI.toast) {
      UI.toast('标记复习结果失败，请重试', 'error');
    }
  } finally {
    session.submitting = false;
  }
}

export function speakReviewWord(): void {
  if (session.currentWord) speak(session.currentWord.word);
}

export const ReviewFeature = {
  setWords,
  getWords,
  getReviewState,
  resetReviewSession,
  updateReview,
  showReviewWord,
  flipReviewCard,
  markReviewWord,
  speakReviewWord,
  get reviewQueue() {
    return session.queue;
  },
  get reviewIndex() {
    return session.index;
  },
  get reviewFlipped() {
    return session.flipped;
  },
  get currentReviewWord() {
    return session.currentWord;
  },
  session: reviewSession,
};

export default ReviewFeature;
