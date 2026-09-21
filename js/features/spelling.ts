import { calculateLevenshtein, updateFSRS } from '../fsrs.js';
import { playTone, fireConfetti, speak, UI } from '../ui.js';
import { byId, qsa, createFocusTrap } from '../utils/dom.js';
import logger from '../utils/logger.js';

import type { WordProgress } from '../../ts/types/word';
import type { StudyQueueItem, SpellingMode, SpellingInitConfig } from '../../ts/types/features';

export interface SpellingSessionState {
  mode: SpellingMode;
  checked: boolean;
  submitting: boolean;
  hintLevel: number;
  lastQuality: number;
  cleanupFocusTrap: (() => void) | null;
  viewportResizeHandler: (() => void) | null;
}

export const SpellingSession: SpellingSessionState = {
  mode: 'meaning',
  checked: false,
  submitting: false,
  hintLevel: 0,
  lastQuality: 4,
  cleanupFocusTrap: null,
  viewportResizeHandler: null,
};

export function resetSpellingSession(): void {
  SpellingSession.checked = false;
  SpellingSession.submitting = false;
  SpellingSession.hintLevel = 0;
  SpellingSession.lastQuality = 4;
  if (SpellingSession.cleanupFocusTrap) {
    SpellingSession.cleanupFocusTrap();
    SpellingSession.cleanupFocusTrap = null;
  }
}

interface SpellingDepsContainer {
  getStudyQueue: () => StudyQueueItem[];
  getStudyIndex: () => number;
  getWordData: ((id: number | string) => WordProgress | any) | null;
  setWordData: ((id: number | string, data: WordProgress | any) => Promise<any>) | null;
  addWrongWord: ((id: number | string, word: any) => void) | null;
  removeWrongWord: ((id: number | string) => void) | null;
  saveStudySession: (() => Promise<any>) | null;
  updateStats: (() => void) | null;
  updateProgress: (() => void) | null;
  showStudyWord: (() => void) | null;
  removeStudyWord: ((id: number | string) => void) | null;
}

const spellingDeps: SpellingDepsContainer = {
  getStudyQueue: () => [],
  getStudyIndex: () => 0,
  getWordData: null,
  setWordData: null,
  addWrongWord: null,
  removeWrongWord: null,
  saveStudySession: null,
  updateStats: null,
  updateProgress: null,
  showStudyWord: null,
  removeStudyWord: null,
};

export interface SpellingEvaluation {
  distance: number;
  quality: number;
  fsrsGrade: number;
  isExact: boolean;
  isClose: boolean;
}

export function evaluateSpellingAttempt(
  input: string,
  target: string,
  baseQuality: number = 4
): SpellingEvaluation {
  const normalizedInput = (input || '').trim().toLowerCase();
  const normalizedTarget = (target || '').trim().toLowerCase();
  const distance = calculateLevenshtein(normalizedInput, normalizedTarget);

  if (distance === 0) {
    return {
      distance: 0,
      quality: baseQuality,
      fsrsGrade: Math.min(baseQuality, 4),
      isExact: true,
      isClose: false,
    };
  }

  if (distance === 1 && normalizedTarget.length >= 4) {
    const quality = Math.max(2, baseQuality - 2);
    return {
      distance,
      quality,
      fsrsGrade: Math.min(quality, 4),
      isExact: false,
      isClose: true,
    };
  }

  return {
    distance,
    quality: 1,
    fsrsGrade: 1,
    isExact: false,
    isClose: false,
  };
}

export function getStudyQueue(): StudyQueueItem[] {
  return spellingDeps.getStudyQueue();
}

export function getStudyIndex(): number {
  return spellingDeps.getStudyIndex();
}

export function init(config: SpellingInitConfig | any): void {
  spellingDeps.getStudyQueue =
    typeof config.getStudyQueue === 'function'
      ? config.getStudyQueue
      : () => config.studyQueue || [];

  spellingDeps.getStudyIndex =
    typeof config.getStudyIndex === 'function'
      ? config.getStudyIndex
      : () => Number(config.studyIndex || 0);

  spellingDeps.getWordData = config.getWordData || null;
  spellingDeps.setWordData = config.setWordData || null;
  spellingDeps.addWrongWord = config.addWrongWord || null;
  spellingDeps.removeWrongWord = config.removeWrongWord || null;
  spellingDeps.saveStudySession = config.saveStudySession || null;
  spellingDeps.updateStats = config.updateStats || null;
  spellingDeps.updateProgress = config.updateProgress || null;
  spellingDeps.showStudyWord = config.showStudyWord || null;
  spellingDeps.removeStudyWord = config.removeStudyWord || null;
}

export function setStudyQueue(queue?: StudyQueueItem[], index?: number): void {
  if (Array.isArray(queue)) {
    spellingDeps.getStudyQueue = () => queue;
  }
  if (typeof index === 'number') {
    spellingDeps.getStudyIndex = () => index;
  }
}

export function getSpellingMode(): SpellingMode {
  return SpellingSession.mode;
}

export function setSpellingMode(mode: SpellingMode): void {
  SpellingSession.mode = mode;
  qsa('.mode-btn').forEach(btn => btn.classList.remove('active'));
  const modeBtn = byId(`mode-${mode}`);
  if (modeBtn) modeBtn.classList.add('active');

  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) return;

  const meaningEl = byId('spelling-meaning');
  const phoneticEl = byId('spelling-phonetic');
  const soundBtn = byId('spelling-sound');

  if (meaningEl) meaningEl.style.display = 'block';
  if (phoneticEl) phoneticEl.style.display = 'block';
  if (soundBtn) soundBtn.style.display = 'none';

  if (mode === 'meaning') {
    if (meaningEl) meaningEl.textContent = w.meaning || (w as any).translation || '';
    if (phoneticEl) phoneticEl.textContent = '';
  } else if (mode === 'phonetic') {
    if (meaningEl) meaningEl.textContent = '';
    if (phoneticEl) phoneticEl.textContent = w.phonetic || '';
  } else if (mode === 'audio') {
    if (meaningEl) meaningEl.textContent = '';
    if (phoneticEl) phoneticEl.textContent = '';
    if (soundBtn) soundBtn.style.display = 'flex';
    speak(w.word);
  }
}

export function replaySpellingAudio(): void {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (w) speak(w.word);
}

export function giveSpellingHint(): void {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) return;

  SpellingSession.hintLevel++;
  const word = w.word;
  const hintLevelDisplay = byId('hint-level-display');

  let hint = '';
  if (SpellingSession.hintLevel === 1) {
    hint = `首字母: ${word[0].toUpperCase()}`;
  } else if (SpellingSession.hintLevel === 2) {
    hint = `前两字母: ${word.substring(0, 2)}`;
  } else if (SpellingSession.hintLevel >= 3) {
    const showCount = Math.min(SpellingSession.hintLevel, Math.floor(word.length / 2) + 1);
    hint = `提示: ${word.substring(0, showCount)}${'_'.repeat(word.length - showCount)}`;
  }

  const spellingInputEl = byId('spelling-input') as HTMLInputElement | null;
  if (spellingInputEl) spellingInputEl.placeholder = hint;
  if (!hintLevelDisplay) return;
  hintLevelDisplay.style.display = 'inline';
  hintLevelDisplay.textContent = `提示等级: ${SpellingSession.hintLevel}`;

  SpellingSession.lastQuality = Math.max(2, 5 - SpellingSession.hintLevel);

  const hintBtn = byId('hint-btn');
  if (hintBtn) hintBtn.textContent = `再提示 (${SpellingSession.lastQuality} 分)`;
}

function setupViewportAdaptation(modalEl: HTMLElement | null): void {
  if (typeof window === 'undefined' || !window.visualViewport || !modalEl) return;
  const contentEl = typeof modalEl.querySelector === 'function' ? modalEl.querySelector<HTMLElement>('.modal-content') : null;
  if (!contentEl) return;

  SpellingSession.viewportResizeHandler = () => {
    if (!modalEl.classList || !modalEl.classList.contains('active')) return;
    const vpHeight = window.visualViewport?.height ?? window.innerHeight;
    const winHeight = window.innerHeight;
    if (vpHeight < winHeight * 0.8) {
      const offset = (winHeight - vpHeight) / 2;
      if (contentEl.style) {
        contentEl.style.transform = `translateY(-${Math.min(offset, 120)}px) translateZ(0)`;
      }
    } else {
      if (contentEl.style) {
        contentEl.style.transform = 'translateZ(0)';
      }
    }
  };

  window.visualViewport.addEventListener('resize', SpellingSession.viewportResizeHandler);
  window.visualViewport.addEventListener('scroll', SpellingSession.viewportResizeHandler);
}

function removeViewportAdaptation(modalEl: HTMLElement | null): void {
  if (SpellingSession.viewportResizeHandler && typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', SpellingSession.viewportResizeHandler);
    window.visualViewport.removeEventListener('scroll', SpellingSession.viewportResizeHandler);
    SpellingSession.viewportResizeHandler = null;
  }
  if (modalEl && typeof modalEl.querySelector === 'function') {
    const contentEl = modalEl.querySelector<HTMLElement>('.modal-content');
    if (contentEl && contentEl.style) contentEl.style.transform = '';
  }
}

export function openSpellingChallenge(): void {
  const currentQueue = getStudyQueue();
  const currentIndex = getStudyIndex();
  const w = currentQueue[currentIndex];
  if (!w) {
    UI.toast('当前没有可拼写的单词', 'warning');
    return;
  }

  SpellingSession.hintLevel = 0;
  SpellingSession.lastQuality = 5;

  const spellingModal = byId('spelling-modal');
  if (spellingModal) {
    spellingModal.classList.add('active');
    SpellingSession.cleanupFocusTrap = createFocusTrap(spellingModal);
    setupViewportAdaptation(spellingModal);
  }
  const spellingInput = byId('spelling-input') as HTMLInputElement | null;
  if (spellingInput) {
    spellingInput.value = '';
    spellingInput.className = 'spelling-input';
    spellingInput.style.borderColor = '';
    spellingInput.placeholder = '输入单词...';
  }

  const resultEl = byId('spelling-result');
  if (!resultEl) return;
  resultEl.className = 'spelling-result';
  resultEl.style.background = '';
  resultEl.style.color = '';
  resultEl.replaceChildren();

  const resultTextEl = document.createElement('div');
  resultTextEl.id = 'spelling-result-text';

  const answerEl = document.createElement('div');
  answerEl.className = 'spelling-answer';
  answerEl.id = 'spelling-answer';

  resultEl.appendChild(resultTextEl);
  resultEl.appendChild(answerEl);

  const hintDisplay = byId('hint-level-display');
  if (hintDisplay) hintDisplay.style.display = 'none';
  const hintBtn = byId('hint-btn');
  if (hintBtn) hintBtn.textContent = '提示';
  SpellingSession.checked = false;
  const spellingSubmit = byId('spelling-submit');
  if (spellingSubmit) spellingSubmit.textContent = '提交';

  setSpellingMode(SpellingSession.mode);

  setTimeout(() => {
    const el = byId('spelling-input') as HTMLInputElement | null;
    if (el) el.focus();
  }, 100);
}

export function closeSpellingModal(): void {
  const spellingModal = byId('spelling-modal');
  if (spellingModal) {
    spellingModal.classList.remove('active');
    removeViewportAdaptation(spellingModal);
    resetSpellingSession();
  }
}

export async function checkSpelling(): Promise<void> {
  if (SpellingSession.submitting) return;
  if (SpellingSession.checked) {
    closeSpellingModal();
    if (spellingDeps.showStudyWord) spellingDeps.showStudyWord();
    return;
  }

  SpellingSession.submitting = true;

  try {
    const currentQueue = getStudyQueue();
    const currentIndex = getStudyIndex();
    const w = currentQueue[currentIndex];
    if (!w) {
      UI.toast('当前没有可拼写的单词', 'warning');
      return;
    }

    const inputEl = byId('spelling-input') as HTMLInputElement | null;
    const resultEl = byId('spelling-result');
    const resultTextEl = byId('spelling-result-text');
    const answerEl = byId('spelling-answer');
    if (!inputEl || !resultEl || !resultTextEl || !answerEl) {
      logger.warn('[checkSpelling] 拼写面板 DOM 元素缺失');
      return;
    }

    const input = inputEl.value;
    const evaluation = evaluateSpellingAttempt(input, w.word, SpellingSession.lastQuality);

    if (evaluation.isExact) {
      inputEl.className = 'spelling-input correct';
      resultEl.className = 'spelling-result show success';
      resultTextEl.textContent =
        SpellingSession.hintLevel > 0
          ? `拼写正确（使用了 ${SpellingSession.hintLevel} 次提示）`
          : '拼写完全正确';
      answerEl.textContent = `答案: ${w.word}`;

      try {
        await processSpellingResult(w, evaluation.quality);
        SpellingSession.checked = true;
      } catch (e) {
        logger.error('[checkSpelling] 保存结果失败:', e);
      }
      fireConfetti();
      playTone('success');
    } else if (evaluation.isClose) {
      inputEl.className = 'spelling-input warning';
      inputEl.style.borderColor = 'var(--warning)';
      resultEl.className = 'spelling-result show warning';
      resultEl.style.background = '#feebc8';
      resultEl.style.color = '#c05621';

      resultTextEl.textContent = '几乎正确，检测到轻微拼写误差';
      answerEl.textContent = `正确答案: ${w.word}`;

      try {
        await processSpellingResult(w, evaluation.quality);
        SpellingSession.checked = true;
      } catch (e) {
        logger.error('[checkSpelling] 保存结果失败:', e);
      }
      playTone('success');
    } else {
      inputEl.className = 'spelling-input wrong';
      resultEl.className = 'spelling-result show error';
      resultTextEl.textContent = '拼写错误，和正确答案差距较大';
      answerEl.textContent = `正确答案: ${w.word}`;

      try {
        await processSpellingResult(w, evaluation.quality);
        SpellingSession.checked = true;
      } catch (e) {
        logger.error('[checkSpelling] 保存结果失败:', e);
      }
      playTone('fail');
      if (spellingDeps.addWrongWord) spellingDeps.addWrongWord(w.id, w);
    }

    const spellingSubmit = byId('spelling-submit');
    if (spellingSubmit) spellingSubmit.textContent = '继续';
  } finally {
    SpellingSession.submitting = false;
  }
}

async function processSpellingResult(w: StudyQueueItem, quality: number): Promise<void> {
  const raw = spellingDeps.getWordData ? spellingDeps.getWordData(w.id) : null;
  const wd: WordProgress = raw
    ? { ...raw }
    : { status: 'new', level: 0, reviewCount: 0, ef: 2.5, stability: 1.0, difficulty: 5.0, lastStudy: 0, nextReview: 0 };
  const fsrsQuality = Math.min(quality, 4);
  const fsrs = updateFSRS(wd, fsrsQuality);

  wd.stability = fsrs.stability;
  wd.difficulty = fsrs.difficulty;

  if (quality >= 4) {
    wd.level = Math.min((wd.level || 0) + 2, 10);
  } else if (quality === 3) {
    wd.level = Math.min((wd.level || 0) + 1, 10);
  } else if (quality === 2) {
    wd.level = Math.min((wd.level || 0) + 1, 10);
  } else {
    wd.level = Math.max(0, Math.floor((wd.level || 0) / 2));
  }

  wd.status = wd.level >= 10 ? 'mastered' : 'review';
  wd.lastStudy = Date.now();
  wd.reviewCount = (wd.reviewCount || 0) + 1;

  if (spellingDeps.setWordData) await spellingDeps.setWordData(w.id, wd);
  if (quality >= 3) {
    if (spellingDeps.removeStudyWord) {
      spellingDeps.removeStudyWord(w.id);
    } else {
      const currentQueue = getStudyQueue();
      const currentIndex = getStudyIndex();
      if (
        currentQueue &&
        currentIndex < currentQueue.length &&
        currentQueue[currentIndex]?.id === w.id
      ) {
        currentQueue.splice(currentIndex, 1);
      }
    }
    if (spellingDeps.removeWrongWord) spellingDeps.removeWrongWord(w.id);
  }

  try {
    if (spellingDeps.saveStudySession) await spellingDeps.saveStudySession();
  } catch (e) {
    logger.warn('[spelling] saveStudySession failed:', e);
  }
  if (spellingDeps.updateStats) spellingDeps.updateStats();
  if (spellingDeps.updateProgress) spellingDeps.updateProgress();
}

export function handleSpellingKeydown(e: KeyboardEvent): void {
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
  handleSpellingKeydown,
  resetSpellingSession,
  evaluateSpellingAttempt,
  session: SpellingSession,
};

export default SpellingFeature;
