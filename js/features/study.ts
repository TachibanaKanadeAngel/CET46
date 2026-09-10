import { getWordData, setWordData } from '../core.js';
import { addWrongWord } from '../store.js';
import { generateCloze } from '../ui/cloze.js';
import { byId, setHtml } from '../utils/dom.js';
import { updateFSRS, calculateFSRSInterval, applyFuzz } from '../fsrs.js';
import { localDateStr } from '../utils/date.js';
import { CONFIG } from '../config.js';
import { UI, speak, playTone, fireConfetti } from '../ui.js';
import { AppState } from '../state.js';
import { shuffle } from '../utils.js';
import logger from '../utils/logger.js';
import type { WordData } from '../../ts/types/word';

export const INITIAL_STUDY_EMPTY_STATE = {
  word: '准备开始',
  meaning: '选择词库后点击开始学习',
  pronunciation: '',
  example: '',
};

export interface StudyFeatureType {
  studyQueue: any[];
  studyIndex: number;
  WORDS: WordData[];
  currentLevel: string;
  initialQueueSize: number;
  answeredCount: number;
  pendingSession: any;
  lastMemoryCache: any;
  lastDb: any;
  SESSION_KEY: string;
  _submitting: boolean;
  _retryCount: Record<string, number>;
  MAX_RETRY: number;
  studyMode: string;
  choiceOptions: any[];
  selectedChoiceId: string;
  choiceStatus: string;
  choiceLock: boolean;
  _choiceNextTimer: any;
  _originalExample?: string | null;
  [key: string]: any;
}

export const StudyFeature: StudyFeatureType = {
  studyQueue: [] as any[],
  studyIndex: 0,
  WORDS: [] as WordData[],
  currentLevel: 'all',
  initialQueueSize: 0,
  answeredCount: 0,
  pendingSession: null as any,
  lastMemoryCache: null as any,
  lastDb: null as any,
  SESSION_KEY: 'cet46_study_session',
  _submitting: false,
  _retryCount: {} as Record<string, number>,
  MAX_RETRY: 5,

  studyMode: 'card',
  choiceOptions: [] as any[],
  selectedChoiceId: '',
  choiceStatus: '',
  choiceLock: false,
  _choiceNextTimer: null as any,
  _originalExample: null,

  setWords(words: WordData[]) {
    if (!words || words.length === 0) {
      logger.error('[StudyFeature] empty words');
      return;
    }
    this.WORDS = words;
    logger.info(`[StudyFeature] words loaded: ${words.length}`);
  },

  async checkStudySession(_memoryCache?: any, db?: any) {
    let session: any = null;

    if (db && db.instance) {
      try {
        const row = await db.get('session', 'study_session');
        if (row && row.data) session = row.data;
      } catch (e) {
        logger.warn('[StudyFeature] failed to load session from db', e);
      }
    }

    if (!session) {
      try {
        const raw = localStorage.getItem(this.SESSION_KEY);
        if (raw) session = JSON.parse(raw);
      } catch (e) {
        logger.warn('[StudyFeature] failed to load session from localStorage', e);
      }
    }

    if (!session || !Array.isArray(session.queueIds) || session.queueIds.length === 0) {
      return { hasSession: false, session: null };
    }

    if (!this.WORDS || this.WORDS.length === 0) {
      return { hasSession: false, session: null };
    }

    const wordsMap = new Map(this.WORDS.map(w => [String(w.id), w]));
    const queue = session.queueIds.map((id: any) => wordsMap.get(String(id))).filter(Boolean);

    if (queue.length === 0) {
      return { hasSession: false, session: null };
    }

    const normalized = {
      level: session.level || 'all',
      mode: 'study',
      queue,
      currentIndex: Math.min(
        Math.max(Number(session.currentIndex || 0), 0),
        Math.max(queue.length - 1, 0)
      ),
      learnedCount: Number(session.learnedCount || 0),
      answeredCount: Number(session.answeredCount || session.learnedCount || 0),
      totalCount: Number(session.totalCount || queue.length),
      updatedAt: Number(session.updatedAt || Date.now()),
    };

    this.pendingSession = normalized;
    return { hasSession: true, session: normalized };
  },

  async saveStudySession(_memoryCache?: any, db?: any) {
    const activeDb = db || this.lastDb || null;

    if (
      !this.studyQueue ||
      this.studyQueue.length === 0 ||
      this.studyIndex >= this.studyQueue.length
    ) {
      this.pendingSession = null;
      this.answeredCount = 0;
      localStorage.removeItem(this.SESSION_KEY);
      if (activeDb && activeDb.instance) {
        try {
          await activeDb.delete('session', 'study_session');
        } catch (e) {
          logger.warn('[StudyFeature] failed to delete session from db', e);
        }
      }
      return null;
    }

    const totalCount = this.initialQueueSize || this.studyQueue.length;
    const learnedCount = Math.max(0, totalCount - this.studyQueue.length);

    const payload = {
      level: this.currentLevel || 'all',
      mode: 'study',
      queueIds: this.studyQueue.map(w => w.id),
      currentIndex: this.studyIndex,
      learnedCount,
      answeredCount: Math.max(this.answeredCount || 0, learnedCount),
      totalCount,
      updatedAt: Date.now(),
    };

    let lsFailed = false;
    let dbFailed = false;

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      lsFailed = true;
      logger.warn('[StudyFeature] failed to save session to localStorage', e);
    }

    if (activeDb && activeDb.instance) {
      try {
        await activeDb.save('session', { key: 'study_session', data: payload });
      } catch (e) {
        dbFailed = true;
        logger.warn('[StudyFeature] failed to save session to db', e);
      }
    }

    if (lsFailed && dbFailed) {
      UI.toast('学习进度保存失败，可能丢失会话进度', 'error');
    }

    return payload;
  },

  updateProgress() {
    const progressContainer = byId('study-progress');
    const progressText = byId('progress-text');
    const progressFill = byId('progress-fill');

    if (!progressContainer || !progressText || !progressFill) return;

    const total = this.initialQueueSize || this.studyQueue.length;
    const remaining = this.studyQueue.length;
    const learned = Math.max(0, total - remaining);
    const answered = Math.max(this.answeredCount || 0, learned);
    const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

    progressContainer.style.display = total > 0 ? 'block' : 'none';
    progressText.textContent = `已学习 ${learned} / ${total} 词 (${percent}%) · 已作答 ${answered} 次 · 待学习 ${remaining}`;
    progressFill.style.width = `${percent}%`;
  },

  resetStudyCard() {
    const elWord = byId('study-word');
    const elPron = byId('study-pron');
    const elMeaning = byId('study-meaning');
    const elExample = byId('study-example');

    if (elWord) {
      elWord.textContent = INITIAL_STUDY_EMPTY_STATE.word;
      elWord.style.display = 'block';
    }
    if (elPron) {
      elPron.textContent = INITIAL_STUDY_EMPTY_STATE.pronunciation;
      elPron.style.display = INITIAL_STUDY_EMPTY_STATE.pronunciation ? 'block' : 'none';
    }
    if (elMeaning) {
      elMeaning.textContent = INITIAL_STUDY_EMPTY_STATE.meaning;
      elMeaning.style.display = 'block';
    }
    if (elExample) {
      elExample.textContent = INITIAL_STUDY_EMPTY_STATE.example;
      elExample.style.display = INITIAL_STUDY_EMPTY_STATE.example ? 'block' : 'none';
    }

    this._resetChoiceState();
    const choicesEl = byId('study-choices');
    if (choicesEl) {
      choicesEl.replaceChildren();
      choicesEl.style.display = 'none';
    }
  },

  startStudy(level?: string, limit?: number, _getData?: any, memoryCache?: any, db?: any, options: any = {}) {
    const numLimit = typeof limit === 'number' && limit > 0 ? limit : 20;
    const {
      overrideQueue,
      overrideIndex = 0,
      totalCount = null,
      answeredCount = 0,
    } = options || {};

    if (!this.WORDS || this.WORDS.length === 0) {
      logger.error('[startStudy] words empty');
      UI.toast('词库尚未加载完成，请稍后重试', 'warning');
      return false;
    }

    if (overrideQueue && overrideQueue.length > 0) {
      this.studyQueue = overrideQueue.slice();
      this.studyIndex = Math.min(
        Math.max(overrideIndex, 0),
        Math.max(this.studyQueue.length - 1, 0)
      );
      this.initialQueueSize = totalCount || this.studyQueue.length;
      this.answeredCount = Math.max(
        Number(answeredCount || 0),
        Math.max(0, this.initialQueueSize - this.studyQueue.length)
      );
    } else {
      const newWords = this.WORDS.filter(w => {
        const matchLevel = level === 'all' || w.level === level;
        const wd = getWordData(w.id);
        const isNew = !wd || wd.status === 'new';
        return matchLevel && isNew;
      });

      if (newWords.length === 0) {
        UI.toast('当前级别的新词已学完', 'warning');
        return false;
      }

      this.studyQueue = shuffle(newWords).slice(0, numLimit);
      this.studyIndex = 0;
      this.initialQueueSize = this.studyQueue.length;
      this.answeredCount = 0;
    }

    this.currentLevel = level || 'all';
    this.lastMemoryCache = memoryCache || this.lastMemoryCache || null;
    this.lastDb = db || this.lastDb || null;
    this._retryCount = {};

    const startBtn = byId('start-btn');
    const studyButtons = byId('study-buttons');
    const clozeToggle = byId('cloze-toggle');
    const isChoiceMode = this.studyMode !== 'card';
    if (startBtn) startBtn.style.display = 'none';
    if (studyButtons) studyButtons.style.display = isChoiceMode ? 'none' : 'flex';
    if (clozeToggle) clozeToggle.style.display = isChoiceMode ? 'none' : 'flex';

    this.showStudyWord();
    this.updateProgress();
    this.saveStudySession(memoryCache, db).catch((e: any) => logger.warn('[StudyFeature] 保存学习会话失败:', e));
    return true;
  },

  showStudyWord() {
    if (this.studyIndex >= this.studyQueue.length) {
      UI.toast('本组单词学习完毕', 'success');
      const startBtn = byId('start-btn');
      const studyButtons = byId('study-buttons');
      if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.dataset.action = 'start-study';
        startBtn.textContent = '开始学习';
      }
      if (studyButtons) studyButtons.style.display = 'none';
      const clozeToggle = byId('cloze-toggle');
      if (clozeToggle) clozeToggle.style.display = 'none';
      if (AppState.clozeModeEnabled) AppState.set('clozeModeEnabled', false);
      const btnCloze = byId('btn-cloze');
      if (btnCloze) {
        btnCloze.textContent = '📝 完形填空: 关闭';
        btnCloze.setAttribute('aria-pressed', 'false');
      }
      this.resetStudyCard();
      this.updateProgress();
      this.saveStudySession().catch((e: any) => logger.warn('[StudyFeature] 保存学习会话失败:', e));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('cet46:switch-tab', { detail: { tab: 'review' } }));
      }
      return;
    }

    const w = this.studyQueue[this.studyIndex];
    const isChoiceMode = this.studyMode !== 'card';

    const elWord = byId('study-word');
    const elPron = byId('study-pron');
    const elMeaning = byId('study-meaning');
    const elExample = byId('study-example');
    const elProgress = byId('study-progress');

    if (elWord) {
      elWord.textContent = isChoiceMode && this.studyMode === 'listen' ? '听音辨义' : w.word || '未知单词';
      elWord.style.display = 'block';
    }
    if (elPron) {
      elPron.textContent = w.phonetic || '';
      elPron.style.display = 'block';
    }
    if (elMeaning) {
      if (isChoiceMode) {
        elMeaning.textContent = '';
        elMeaning.style.display = 'none';
      } else {
        elMeaning.textContent = w.meaning || (w as any).translation || '暂无释义';
        elMeaning.style.display = 'block';
      }
    }
    if (elExample) {
      if (isChoiceMode) {
        elExample.textContent = '';
        elExample.style.display = 'none';
      } else if (AppState.clozeModeEnabled && w.example) {
        elExample.innerHTML = '';
        setHtml(elExample, generateCloze(w.word, w.example));
        elExample.style.display = 'block';
      } else {
        elExample.textContent = w.example || '暂无例句';
        elExample.style.display = 'block';
      }
    }
    if (elProgress) elProgress.style.display = 'block';

    const studyButtons = byId('study-buttons');
    const clozeToggle = byId('cloze-toggle');
    const startBtn = byId('start-btn');

    if (isChoiceMode) {
      if (studyButtons) studyButtons.style.display = 'none';
      if (clozeToggle) clozeToggle.style.display = 'none';
      if (startBtn) startBtn.style.display = 'none';
      this._setupChoiceQuestion(w);
      if (this.studyMode === 'listen') {
        speak(w.word);
      }
    } else {
      if (studyButtons) studyButtons.style.display = 'flex';
      if (clozeToggle) clozeToggle.style.display = 'flex';
      if (startBtn) startBtn.style.display = 'none';
      this._resetChoiceState();
      const choicesEl = byId('study-choices');
      if (choicesEl) {
        choicesEl.replaceChildren();
        choicesEl.style.display = 'none';
      }
    }
  },

  async markWord(known: boolean) {
    if (this._submitting) return;
    this._submitting = true;

    try {
      const w = this.studyQueue[this.studyIndex];
      if (!w) return;

      const raw = getWordData(w.id);
      const wd = raw ? { ...raw } : { status: 'new', level: 0, reviewCount: 0 };

      const quality = known ? 4 : 1;
      const fsrs = updateFSRS(wd, quality);
      wd.stability = fsrs.stability;
      wd.difficulty = fsrs.difficulty;

      if (known) {
        wd.level = Math.min((wd.level || 0) + 1, CONFIG.CONSTANTS.LEVEL_CAP || 10);
        wd.status = wd.level >= CONFIG.CONSTANTS.LEVEL_MASTERED ? 'mastered' : 'review';

        if (wd.level >= CONFIG.CONSTANTS.LEVEL_MASTERED) {
          fireConfetti();
        }

        const interval = calculateFSRSInterval(wd.stability);
        const fuzzed = applyFuzz(interval);
        wd.nextReview = Date.now() + Math.min(fuzzed, CONFIG.CONSTANTS.MAX_REVIEW_INTERVAL_MS);
        wd.nextReviewDate = localDateStr(new Date(wd.nextReview));
        wd.lastStudy = Date.now();
        wd.reviewCount = (wd.reviewCount || 0) + 1;

        await setWordData(w.id, wd);
        playTone('success');
        this.studyQueue.splice(this.studyIndex, 1);
        this.answeredCount = (this.answeredCount || 0) + 1;
      } else {
        wd.status = 'review';
        wd.level = Math.max(0, Math.floor((wd.level || 0) / 2));
        wd.lastStudy = Date.now();
        wd.nextReview = Date.now() + 5 * 60 * 1000;
        wd.nextReviewDate = localDateStr(new Date(wd.nextReview));

        await setWordData(w.id, wd);
        playTone('fail');

        const retry = (this._retryCount[String(w.id)] || 0) + 1;
        this._retryCount[String(w.id)] = retry;

        this.studyQueue.splice(this.studyIndex, 1);

        if (retry < this.MAX_RETRY) {
          const insertOffset = Math.min(3, this.studyQueue.length);
          this.studyQueue.splice(this.studyIndex + insertOffset, 0, w);
          logger.info(`[StudyFeature] 错词 "${w.word}" (重试 ${retry}/${this.MAX_RETRY}) 已插回队列后 ${insertOffset} 位`);
        } else {
          delete this._retryCount[String(w.id)];
          delete this._retryCount[w.id];
          logger.warn(`[StudyFeature] 错词 "${w.word}" 已达最大重试次数 (${this.MAX_RETRY})，直接记入错题本`);
        }

        addWrongWord(w.id, w);
        this.answeredCount = (this.answeredCount || 0) + 1;
      }

      this.updateProgress();
      await this.saveStudySession();
      this.showStudyWord();
    } catch (e) {
      logger.error('[markWord] error:', e);
      UI.toast('标记单词状态失败，请重试', 'error');
    } finally {
      this._submitting = false;
    }
  },

  setStudyMode(mode: string) {
    if (!['card', 'choice', 'listen'].includes(mode)) return;
    this.studyMode = mode;
    this._resetChoiceState();

    const modeBtns = document.querySelectorAll('.study-mode-btn');
    modeBtns.forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      btn.classList.toggle('active', btnMode === mode);
      btn.setAttribute('aria-pressed', String(btnMode === mode));
    });

    if (this.studyQueue && this.studyQueue.length > 0 && this.studyIndex < this.studyQueue.length) {
      this.showStudyWord();
    }
  },

  _resetChoiceState() {
    if (this._choiceNextTimer) {
      clearTimeout(this._choiceNextTimer);
      this._choiceNextTimer = null;
    }
    this.choiceOptions = [];
    this.selectedChoiceId = '';
    this.choiceStatus = '';
    this.choiceLock = false;
  },

  _generateChoices(currentWord?: any) {
    const w = currentWord || this.studyQueue[this.studyIndex];
    if (w) {
      this._setupChoiceQuestion(w);
    }
  },

  _setupChoiceQuestion(currentWord: any) {
    this._resetChoiceState();

    const pool = (this.WORDS || []).filter(
      w => w.id !== currentWord.id && (w.meaning || (w as any).translation)
    );
    const shuffledPool = shuffle(pool);
    const wrongChoices = shuffledPool.slice(0, 3);

    const correctChoice = {
      id: currentWord.id,
      meaning: currentWord.meaning || currentWord.translation,
      isCorrect: true,
    };

    const options = shuffle([
      correctChoice,
      ...wrongChoices.map(w => ({
        id: w.id,
        meaning: w.meaning || (w as any).translation,
        isCorrect: false,
      })),
    ]);

    this.choiceOptions = options;
    this._renderChoiceButtons(options, currentWord);
  },

  _renderChoiceButtons(options: any[], _currentWord: any) {
    const choicesEl = byId('study-choices');
    if (!choicesEl) return;

    choicesEl.replaceChildren();
    choicesEl.style.display = 'grid';

    const LETTERS = ['A', 'B', 'C', 'D'];
    options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.setAttribute('data-choice-id', String(opt.id));
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', `选项 ${LETTERS[idx]}: ${opt.meaning}`);

      const letterSpan = document.createElement('span');
      letterSpan.className = 'choice-letter';
      letterSpan.textContent = LETTERS[idx];

      const textSpan = document.createElement('span');
      textSpan.className = 'choice-text';
      textSpan.textContent = opt.meaning;

      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);

      btn.addEventListener('click', () => this.onSelectChoice(opt.id));
      choicesEl.appendChild(btn);
    });
  },

  async onSelectChoice(choiceId: any) {
    if (this.choiceLock) return;
    this.choiceLock = true;

    this.selectedChoiceId = choiceId;
    const currentWord = this.studyQueue[this.studyIndex];
    if (!currentWord) return;

    const chosenOption = this.choiceOptions.find(opt => String(opt.id) === String(choiceId));
    const isCorrect = Boolean(chosenOption && chosenOption.isCorrect);
    this.choiceStatus = isCorrect ? 'correct' : 'wrong';

    const choicesEl = byId('study-choices');
    if (choicesEl) {
      const buttons = choicesEl.querySelectorAll('.choice-btn');
      buttons.forEach(btn => {
        const btnId = btn.getAttribute('data-choice-id');
        const opt = this.choiceOptions.find(o => String(o.id) === btnId);
        if (opt && opt.isCorrect) {
          btn.classList.add('choice-correct');
        } else if (btnId === String(choiceId) && !isCorrect) {
          btn.classList.add('choice-wrong');
        }
      });
    }

    if (isCorrect) {
      playTone('success');
      fireConfetti();
      this._choiceNextTimer = setTimeout(() => {
        this._choiceNextTimer = null;
        this.markWord(true);
      }, 600);
    } else {
      playTone('fail');
      this._revealStudyAnswer(currentWord);
    }
  },

  _revealStudyAnswer(w: any) {
    const elWord = byId('study-word');
    const elMeaning = byId('study-meaning');
    const elExample = byId('study-example');

    if (elWord && this.studyMode === 'listen') {
      elWord.textContent = w.word;
    }
    if (elMeaning) {
      elMeaning.textContent = w.meaning || w.translation || '暂无释义';
      elMeaning.style.display = 'block';
    }
    if (elExample && w.example) {
      elExample.textContent = w.example;
      elExample.style.display = 'block';
    }

    const choicesEl = byId('study-choices');
    if (choicesEl) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'choice-next-btn btn-primary';
      nextBtn.textContent = '记住了，下一个 →';
      nextBtn.addEventListener('click', () => this.nextChoiceWord());
      choicesEl.appendChild(nextBtn);
    }
  },

  selectChoiceByIndex(index: number) {
    const option = (this.choiceOptions || [])[index];
    if (option && !this.choiceLock) {
      this.onSelectChoice(option.id);
    }
  },

  nextChoiceWord() {
    this._resetChoiceState();
    this.markWord(false);
  },

  async resumeFromSession(session: any, memoryCache?: any, db?: any) {
    const target = session || this.pendingSession;
    if (!target || !Array.isArray(target.queue) || target.queue.length === 0) {
      return false;
    }

    return this.startStudy(target.level || 'all', undefined, null, memoryCache, db, {
      overrideQueue: target.queue,
      overrideIndex: target.currentIndex || 0,
      totalCount: target.totalCount || target.queue.length,
      answeredCount: target.answeredCount || target.learnedCount || 0,
    });
  },

  speakCurrentWord() {
    if (!this.studyQueue || !this.studyQueue[this.studyIndex]) {
      UI.toast('请先开始学习', 'warning');
      return;
    }

    const word = this.studyQueue[this.studyIndex].word;
    const SpeechUtterance = (typeof window !== 'undefined' && (window as any).SpeechSynthesisUtterance) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).SpeechSynthesisUtterance) ||
      (typeof SpeechSynthesisUtterance !== 'undefined' ? SpeechSynthesisUtterance : null);

    const synth = (typeof window !== 'undefined' && window.speechSynthesis) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).speechSynthesis);

    if (synth && SpeechUtterance) {
      try {
        const utterance = new SpeechUtterance(word);
        utterance.lang = 'en-US';
        synth.speak(utterance);
        return;
      } catch (_e) {
        // fallback
      }
    }
    speak(word);
  },

  toggleClozeMode() {
    const w = this.studyQueue[this.studyIndex];
    if (!w) {
      logger.warn('[StudyFeature] toggleClozeMode: 没有当前单词');
      return;
    }

    const elExample = byId('study-example');
    const btnCloze = byId('btn-cloze');
    if (!elExample || !btnCloze) return;

    const enabling = !AppState.clozeModeEnabled;
    AppState.set('clozeModeEnabled', enabling);

    if (enabling) {
      this._originalExample = w.example || '';
      const clozeHtml = generateCloze(w.word, w.example);
      elExample.innerHTML = '';
      setHtml(elExample, clozeHtml);
      btnCloze.textContent = '📝 完形填空: 开启';
      btnCloze.setAttribute('aria-pressed', 'true');
    } else {
      elExample.textContent = this._originalExample || w.example || '';
      this._originalExample = null;
      btnCloze.textContent = '📝 完形填空: 关闭';
      btnCloze.setAttribute('aria-pressed', 'false');
    }
  },

  async handleSaveMnemonic(saveMnemonicFn: (id: any, val: string) => void) {
    if (!this.studyQueue[this.studyIndex]) {
      UI.toast('请先开始学习', 'warning');
      return;
    }
    const w = this.studyQueue[this.studyIndex];
    const wd = getWordData(w.id);
    const existing = wd ? (wd.mnemonic || '') : '';
    const mnemonic = await UI.prompt('输入联想法记忆内容', '请输入联想法记忆：', existing || '');
    if (mnemonic !== null && typeof saveMnemonicFn === 'function') {
      saveMnemonicFn(w.id, mnemonic);
      UI.toast('联想法已保存', 'success');
    }
  },
};

export default StudyFeature;
