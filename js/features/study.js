﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { getWordData, setWordData, addWrongWord } from '../core.js';

export const INITIAL_STUDY_EMPTY_STATE = {
  word: '准备开始',
  meaning: '选择词库后点击开始学习',
  pronunciation: '',
  example: ''
};

export const StudyFeature = {
  studyQueue: [],
  studyIndex: 0,
  WORDS: [],
  currentLevel: 'all',
  initialQueueSize: 0,
  answeredCount: 0,
  pendingSession: null,
  lastMemoryCache: null,
  lastDb: null,
  SESSION_KEY: 'cet46_study_session',

  setWords(words) {
    if (!words || words.length === 0) {
      console.error('[StudyFeature] empty words');
      return;
    }
    this.WORDS = words;
    console.log(`[StudyFeature] words loaded: ${words.length}`);
  },

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  async checkStudySession(memoryCache, db) {
    let session = null;

    if (db && db.instance) {
      try {
        const row = await db.get('session', 'study_session');
        if (row && row.data) session = row.data;
      } catch (e) {
        console.warn('[StudyFeature] failed to load session from db', e);
      }
    }

    if (!session) {
      try {
        const raw = localStorage.getItem(this.SESSION_KEY);
        if (raw) session = JSON.parse(raw);
      } catch (e) {
        console.warn('[StudyFeature] failed to load session from localStorage', e);
      }
    }

    if (!session || !Array.isArray(session.queueIds) || session.queueIds.length === 0) {
      return { hasSession: false, session: null };
    }

    if (!this.WORDS || this.WORDS.length === 0) {
      return { hasSession: false, session: null };
    }

    const wordsMap = new Map(this.WORDS.map(w => [String(w.id), w]));
    const queue = session.queueIds
      .map(id => wordsMap.get(String(id)))
      .filter(Boolean);

    if (queue.length === 0) {
      return { hasSession: false, session: null };
    }

    const normalized = {
      level: session.level || 'all',
      mode: 'study',
      queue,
      currentIndex: Math.min(Math.max(Number(session.currentIndex || 0), 0), Math.max(queue.length - 1, 0)),
      learnedCount: Number(session.learnedCount || 0),
      answeredCount: Number(session.answeredCount || session.learnedCount || 0),
      totalCount: Number(session.totalCount || queue.length),
      updatedAt: Number(session.updatedAt || Date.now())
    };

    this.pendingSession = normalized;
    return { hasSession: true, session: normalized };
  },

  async saveStudySession(memoryCache, db) {
    const activeDb = db || this.lastDb || null;

    if (!this.studyQueue || this.studyQueue.length === 0 || this.studyIndex >= this.studyQueue.length) {
      this.pendingSession = null;
      this.answeredCount = 0;
      localStorage.removeItem(this.SESSION_KEY);
      if (activeDb && activeDb.instance) {
        try {
          await activeDb.delete('session', 'study_session');
        } catch (e) {
          console.warn('[StudyFeature] failed to delete session from db', e);
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
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[StudyFeature] failed to save session to localStorage', e);
    }

    if (activeDb && activeDb.instance) {
      try {
        await activeDb.save('session', { key: 'study_session', data: payload });
      } catch (e) {
        console.warn('[StudyFeature] failed to save session to db', e);
      }
    }

    return payload;
  },

  updateProgress() {
    const progressContainer = document.getElementById('study-progress');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');

    if (!progressContainer || !progressText || !progressFill) return;

    const total = this.initialQueueSize || this.studyQueue.length;
    const remaining = this.studyQueue.length;
    const learned = Math.max(0, total - remaining);
    const answered = Math.max(this.answeredCount || 0, learned);
    const percent = total > 0 ? Math.round((learned / total) * 100) : 0;

    progressContainer.style.display = total > 0 ? 'block' : 'none';
    progressText.textContent = answered > learned
      ? `学习进度: ${learned} / ${total} (${percent}%) · 已作答 ${answered} 次`
      : `学习进度: ${learned} / ${total} (${percent}%)`;
    progressFill.style.width = `${percent}%`;
  },

  resetStudyCard() {
    const elWord = document.getElementById('study-word');
    const elPron = document.getElementById('study-pron');
    const elMeaning = document.getElementById('study-meaning');
    const elExample = document.getElementById('study-example');

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
  },

  startStudy(level, limit, getData, memoryCache, db, options = {}) {
    const numLimit = (typeof limit === 'number' && limit > 0) ? limit : 20;
    const { overrideQueue, overrideIndex = 0, totalCount = null, answeredCount = 0 } = options || {};

    if (!this.WORDS || this.WORDS.length === 0) {
      console.error('[startStudy] words empty');
      alert('词库尚未加载完成，请稍后重试');
      return false;
    }

    if (overrideQueue && overrideQueue.length > 0) {
      this.studyQueue = overrideQueue.slice();
      this.studyIndex = Math.min(Math.max(overrideIndex, 0), Math.max(this.studyQueue.length - 1, 0));
      this.initialQueueSize = totalCount || this.studyQueue.length;
      this.answeredCount = Math.max(Number(answeredCount || 0), Math.max(0, this.initialQueueSize - this.studyQueue.length));
    } else {
      const newWords = this.WORDS.filter(w => {
        const matchLevel = level === 'all' || w.level === level;
        const wd = getWordData(w.id);
        const isNew = !wd || wd.status === 'new';
        return matchLevel && isNew;
      });

      if (newWords.length === 0) {
        alert('当前级别的新词已学完');
        return false;
      }

      this.studyQueue = this.shuffle(newWords).slice(0, numLimit);
      this.studyIndex = 0;
      this.initialQueueSize = this.studyQueue.length;
      this.answeredCount = 0;
    }

    this.currentLevel = level || 'all';
    this.lastMemoryCache = memoryCache || this.lastMemoryCache || null;
    this.lastDb = db || this.lastDb || null;

    const startBtn = document.getElementById('start-btn');
    const studyButtons = document.getElementById('study-buttons');
    if (startBtn) startBtn.style.display = 'none';
    if (studyButtons) studyButtons.style.display = 'flex';

    this.showStudyWord();
    this.updateProgress();
    void this.saveStudySession(memoryCache, db);
    return true;
  },

  showStudyWord() {
    if (this.studyIndex >= this.studyQueue.length) {
      alert('本组单词学习完毕');
      const startBtn = document.getElementById('start-btn');
      const studyButtons = document.getElementById('study-buttons');
      if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.dataset.action = 'start-study';
        startBtn.textContent = '开始学习';
      }
      if (studyButtons) studyButtons.style.display = 'none';
      this.resetStudyCard();
      this.updateProgress();
      void this.saveStudySession();
      if (typeof window.switchTab === 'function') window.switchTab('review');
      return;
    }

    const w = this.studyQueue[this.studyIndex];

    const elWord = document.getElementById('study-word');
    const elPron = document.getElementById('study-pron');
    const elMeaning = document.getElementById('study-meaning');
    const elExample = document.getElementById('study-example');
    const elProgress = document.getElementById('study-progress');

    if (elWord) {
      elWord.textContent = w.word || '未知单词';
      elWord.style.display = 'block';
    }
    if (elPron) {
      elPron.textContent = w.phonetic || '';
      elPron.style.display = 'block';
    }
    if (elMeaning) {
      elMeaning.textContent = w.meaning || w.translation || '暂无释义';
      elMeaning.style.display = 'block';
    }
    if (elExample) {
      elExample.textContent = w.example || '暂无例句';
      elExample.style.display = 'block';
    }
    if (elProgress) {
      elProgress.style.display = 'block';
    }

    this.updateProgress();
  },

  async markWord(known) {
    if (this.studyQueue.length === 0) return;

    const w = this.studyQueue[this.studyIndex];
    const source = getWordData(w.id);
    const wd = source ? { ...source } : {
      status: 'new',
      level: 0,
      lastStudy: Date.now(),
      reviewCount: 0
    };

    this.answeredCount = (this.answeredCount || 0) + 1;

    wd.status = 'review';
    wd.lastStudy = Date.now();

    if (known) {
      wd.level = Math.min((wd.level || 0) + 1, 5);
      wd.reviewCount = (wd.reviewCount || 0) + 1;
      this.studyQueue.splice(this.studyIndex, 1);
    } else {
      wd.level = 0;
      const currentWord = this.studyQueue.splice(this.studyIndex, 1)[0];
      const insertPos = Math.min(this.studyIndex + 2, this.studyQueue.length);
      this.studyQueue.splice(insertPos, 0, currentWord);
      addWrongWord(w.id, w);
    }

    await setWordData(w.id, wd);
    await this.saveStudySession();
    this.showStudyWord();
  },

  async resumeFromSession(session, memoryCache, db) {
    const target = session || this.pendingSession;
    if (!target || !Array.isArray(target.queue) || target.queue.length === 0) {
      return false;
    }

    return this.startStudy(
      target.level || 'all',
      null,
      null,
      memoryCache,
      db,
      {
        overrideQueue: target.queue,
        overrideIndex: target.currentIndex || 0,
        totalCount: target.totalCount || target.queue.length,
        answeredCount: target.answeredCount || target.learnedCount || 0
      }
    );
  },

  speakCurrentWord() {
    if (!this.studyQueue[this.studyIndex]) {
      alert('请先开始学习');
      return;
    }

    const word = this.studyQueue[this.studyIndex].word;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  },

  toggleClozeMode() {
    console.log('[StudyFeature] toggleClozeMode not yet implemented');
  },

  handleSaveMnemonic(saveMnemonicFn) {
    if (!this.studyQueue[this.studyIndex]) {
      alert('请先开始学习');
      return;
    }
    const w = this.studyQueue[this.studyIndex];
    const existing = typeof saveMnemonicFn === 'function' ? saveMnemonicFn() : '';
    const mnemonic = prompt('输入联想法记忆内容：', existing || '');
    if (mnemonic !== null && typeof saveMnemonicFn === 'function') {
      saveMnemonicFn(w.id, mnemonic);
      alert('联想法已保存');
    }
  }
};
