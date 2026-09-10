import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide minimal DOM and browser API mocks for node environment
beforeEach(() => {
  if (typeof globalThis.document === 'undefined' || !globalThis.document.createElement) {
    globalThis.document = {
      getElementById: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn((tag) => {
        const el = {
          tagName: (tag || 'DIV').toUpperCase(),
          style: {},
          dataset: {},
          children: [],
          childNodes: [],
          textContent: '',
          innerHTML: '',
          setAttribute: vi.fn(),
          appendChild: vi.fn(c => { el.children.push(c); el.childNodes.push(c); }),
          append: vi.fn((...nodes) => { el.children.push(...nodes); el.childNodes.push(...nodes); }),
          replaceChildren: vi.fn(() => { el.children = []; el.childNodes = []; }),
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            toggle: vi.fn(),
          },
        };
        return el;
      }),
    };
  }
  if (typeof globalThis.alert === 'undefined') {
    globalThis.alert = vi.fn();
  }
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {};
  }
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.alert;
  delete globalThis.window;
  delete globalThis.speechSynthesis;
});

// Mock core.js before importing StudyFeature
vi.mock('../js/core.js', () => ({
  getWordData: vi.fn(() => ({ status: 'new', level: 0, reviewCount: 0 })),
  setWordData: vi.fn(() => Promise.resolve())
}));

vi.mock('../js/store.js', () => ({
  addWrongWord: vi.fn(),
  memoryCache: {
    progress: new Map(),
    wrongWords: new Map(),
    heatmap: new Map(),
    deletedIds: new Set(),
    session: null,
    studySession: null
  }
}));

vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('../js/ui.js', () => ({
  UI: { toast: vi.fn(), confirm: vi.fn(), prompt: vi.fn() },
  playTone: vi.fn(),
  fireConfetti: vi.fn(),
  speak: vi.fn()
}));

import { StudyFeature, INITIAL_STUDY_EMPTY_STATE } from '../js/features/study.js';
import { shuffle } from '../js/utils.js';
import { getWordData, setWordData } from '../js/core.js';
import { addWrongWord } from '../js/store.js';
import { UI } from '../js/ui.js';

const mockWords = [
  { id: 1, word: 'abandon', meaning: '放弃', phonetic: '/əˈbændən/', level: 4, example: 'He abandoned his plan.' },
  { id: 2, word: 'ability', meaning: '能力', phonetic: '/əˈbɪləti/', level: 4, example: 'She has the ability.' },
  { id: 3, word: 'absent', meaning: '缺席的', phonetic: '/ˈæbsənt/', level: 6, example: 'He was absent.' },
  { id: 4, word: 'absorb', meaning: '吸收', phonetic: '/əbˈzɔːrb/', level: 4, example: 'The sponge absorbs water.' },
  { id: 5, word: 'abstract', meaning: '抽象的', phonetic: '/ˈæbstrækt/', level: 6, example: 'Abstract art.' }
];

function resetStudyFeature() {
  StudyFeature.studyQueue = [];
  StudyFeature.studyIndex = 0;
  StudyFeature.WORDS = [];
  StudyFeature.currentLevel = 'all';
  StudyFeature.initialQueueSize = 0;
  StudyFeature.answeredCount = 0;
  StudyFeature.pendingSession = null;
  StudyFeature.lastMemoryCache = null;
  StudyFeature.lastDb = null;
  StudyFeature._submitting = false;
}

beforeEach(() => {
  resetStudyFeature();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('INITIAL_STUDY_EMPTY_STATE', () => {
  it('has expected default fields', () => {
    expect(INITIAL_STUDY_EMPTY_STATE.word).toBe('准备开始');
    expect(INITIAL_STUDY_EMPTY_STATE.meaning).toBe('选择词库后点击开始学习');
    expect(INITIAL_STUDY_EMPTY_STATE.pronunciation).toBe('');
    expect(INITIAL_STUDY_EMPTY_STATE.example).toBe('');
  });
});

describe('StudyFeature.setWords', () => {
  it('loads words into WORDS array', () => {
    StudyFeature.setWords(mockWords);
    expect(StudyFeature.WORDS).toEqual(mockWords);
  });

  it('ignores empty array', () => {
    StudyFeature.setWords([]);
    expect(StudyFeature.WORDS).toEqual([]);
  });

  it('ignores null/undefined', () => {
    StudyFeature.setWords(null);
    expect(StudyFeature.WORDS).toEqual([]);
  });
});

describe('shuffle (from utils)', () => {
  it('returns the same array reference', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });

  it('preserves all elements after shuffle', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles single-element array', () => {
    const arr = [42];
    shuffle(arr);
    expect(arr).toEqual([42]);
  });

  it('handles empty array', () => {
    const arr = [];
    shuffle(arr);
    expect(arr).toEqual([]);
  });
});

describe('StudyFeature.startStudy', () => {
  it('returns false when WORDS is empty', () => {
    const result = StudyFeature.startStudy('all', 20, null, null, null);
    expect(result).toBe(false);
  });

  it('returns false when no new words match the level', () => {
    StudyFeature.setWords(mockWords);
    // All words are already reviewed, so no new words
    getWordData.mockReturnValue({ status: 'review', level: 3, reviewCount: 1 });
    const result = StudyFeature.startStudy('all', 20, null, null, null);
    expect(result).toBe(false);
  });

  it('returns true and sets up queue for new words', () => {
    StudyFeature.setWords(mockWords);
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });
    const result = StudyFeature.startStudy('all', 20, null, null, null);
    expect(result).toBe(true);
    expect(StudyFeature.studyQueue.length).toBeGreaterThan(0);
    expect(StudyFeature.studyIndex).toBe(0);
    expect(StudyFeature.answeredCount).toBe(0);
  });

  it('respects the limit parameter', () => {
    StudyFeature.setWords(mockWords);
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });
    StudyFeature.startStudy('all', 2, null, null, null);
    expect(StudyFeature.studyQueue.length).toBeLessThanOrEqual(2);
  });

  it('filters by level when level is specified', () => {
    StudyFeature.setWords(mockWords);
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });
    StudyFeature.startStudy(6, 20, null, null, null);
    const allLevel6 = StudyFeature.studyQueue.every(w => w.level === 6);
    expect(allLevel6).toBe(true);
  });

  it('uses overrideQueue when provided', () => {
    StudyFeature.setWords(mockWords);
    const override = [mockWords[0], mockWords[1]];
    const result = StudyFeature.startStudy('all', 20, null, null, null, {
      overrideQueue: override,
      overrideIndex: 1,
      totalCount: 5,
      answeredCount: 2
    });
    expect(result).toBe(true);
    expect(StudyFeature.studyQueue).toEqual(override);
    expect(StudyFeature.studyIndex).toBe(1);
    expect(StudyFeature.initialQueueSize).toBe(5);
  });

  it('clamps overrideIndex to valid range', () => {
    StudyFeature.setWords(mockWords);
    const override = [mockWords[0]];
    StudyFeature.startStudy('all', 20, null, null, null, {
      overrideQueue: override,
      overrideIndex: 99
    });
    expect(StudyFeature.studyIndex).toBe(0);
  });
});

describe('StudyFeature.markWord', () => {
  it('does nothing when queue is empty', async () => {
    await StudyFeature.markWord(true);
    expect(setWordData).not.toHaveBeenCalled();
  });

  it('does nothing when _submitting is true', async () => {
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature._submitting = true;
    await StudyFeature.markWord(true);
    expect(setWordData).not.toHaveBeenCalled();
    StudyFeature._submitting = false;
  });

  it('removes word from queue when known=true', async () => {
    StudyFeature.studyQueue = [mockWords[0], mockWords[1]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 2;
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });

    await StudyFeature.markWord(true);

    expect(StudyFeature.studyQueue.length).toBe(1);
    expect(setWordData).toHaveBeenCalledWith(
      mockWords[0].id,
      expect.objectContaining({ status: 'review', level: 1 })
    );
  });

  it('reinserts word at later position when known=false', async () => {
    StudyFeature.studyQueue = [mockWords[0], mockWords[1], mockWords[2]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 3;
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });

    await StudyFeature.markWord(false);

    // Word should be reinserted at index 2 (studyIndex + 2)
    expect(StudyFeature.studyQueue.length).toBe(3);
    expect(addWrongWord).toHaveBeenCalledWith(mockWords[0].id, mockWords[0]);
    expect(setWordData).toHaveBeenCalledWith(
      mockWords[0].id,
      expect.objectContaining({ status: 'review', level: 0 })
    );
  });

  it('increments answeredCount on each call', async () => {
    StudyFeature.studyQueue = [mockWords[0], mockWords[1]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 2;
    StudyFeature.answeredCount = 0;
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });

    await StudyFeature.markWord(true);
    expect(StudyFeature.answeredCount).toBe(1);
  });

  it('caps level at CONFIG.CONSTANTS.LEVEL_CAP when known=true', async () => {
    // 修复后：study 与 review 共用 CONFIG.CONSTANTS.LEVEL_CAP (=10)，避免 mastered 永远无法达成
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    getWordData.mockReturnValue({ status: 'review', level: 10, reviewCount: 10 });

    await StudyFeature.markWord(true);

    expect(setWordData).toHaveBeenCalledWith(
      mockWords[0].id,
      expect.objectContaining({ level: 10 })
    );
  });

  it('adjusts studyIndex when it exceeds queue length after removal', async () => {
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 1;
    getWordData.mockReturnValue({ status: 'new', level: 0, reviewCount: 0 });

    await StudyFeature.markWord(true);

    // Queue is now empty, index should be clamped
    expect(StudyFeature.studyQueue.length).toBe(0);
  });
});

describe('StudyFeature.checkStudySession', () => {
  it('returns hasSession:false when no session exists', async () => {
    const result = await StudyFeature.checkStudySession(null, null);
    expect(result.hasSession).toBe(false);
  });

  it('returns hasSession:false when WORDS is empty', async () => {
    localStorage.setItem('cet46_study_session', JSON.stringify({
      queueIds: [1, 2], currentIndex: 0, learnedCount: 0, totalCount: 2
    }));
    const result = await StudyFeature.checkStudySession(null, null);
    expect(result.hasSession).toBe(false);
  });

  it('returns hasSession:true when valid session exists in localStorage', async () => {
    StudyFeature.setWords(mockWords);
    localStorage.setItem('cet46_study_session', JSON.stringify({
      queueIds: [1, 2], currentIndex: 0, learnedCount: 0, totalCount: 2
    }));

    const result = await StudyFeature.checkStudySession(null, null);

    expect(result.hasSession).toBe(true);
    expect(result.session.queue.length).toBe(2);
    expect(result.session.currentIndex).toBe(0);
  });

  it('loads session from db when available', async () => {
    StudyFeature.setWords(mockWords);
    const mockDb = {
      instance: {},
      get: vi.fn().mockResolvedValue({
        data: { queueIds: [1, 3], currentIndex: 1, learnedCount: 1, totalCount: 2 }
      })
    };

    const result = await StudyFeature.checkStudySession(null, mockDb);

    expect(result.hasSession).toBe(true);
    expect(mockDb.get).toHaveBeenCalledWith('session', 'study_session');
  });

  it('falls back to localStorage when db fails', async () => {
    StudyFeature.setWords(mockWords);
    const mockDb = {
      instance: {},
      get: vi.fn().mockRejectedValue(new Error('db error'))
    };
    localStorage.setItem('cet46_study_session', JSON.stringify({
      queueIds: [1], currentIndex: 0, learnedCount: 0, totalCount: 1
    }));

    const result = await StudyFeature.checkStudySession(null, mockDb);

    expect(result.hasSession).toBe(true);
  });

  it('returns hasSession:false when queueIds resolve to empty queue', async () => {
    StudyFeature.setWords(mockWords);
    localStorage.setItem('cet46_study_session', JSON.stringify({
      queueIds: [999, 998], currentIndex: 0, learnedCount: 0, totalCount: 2
    }));

    const result = await StudyFeature.checkStudySession(null, null);
    expect(result.hasSession).toBe(false);
  });

  it('clamps currentIndex to valid range', async () => {
    StudyFeature.setWords(mockWords);
    localStorage.setItem('cet46_study_session', JSON.stringify({
      queueIds: [1, 2], currentIndex: 99, learnedCount: 0, totalCount: 2
    }));

    const result = await StudyFeature.checkStudySession(null, null);
    expect(result.session.currentIndex).toBe(1); // max index = queue.length - 1
  });
});

describe('StudyFeature.saveStudySession', () => {
  it('returns null and clears session when queue is empty', async () => {
    StudyFeature.studyQueue = [];
    StudyFeature.studyIndex = 0;

    const result = await StudyFeature.saveStudySession(null, null);

    expect(result).toBeNull();
  });

  it('saves session to localStorage', async () => {
    StudyFeature.studyQueue = [mockWords[0], mockWords[1]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 2;
    StudyFeature.currentLevel = 'all';
    StudyFeature.answeredCount = 0;

    await StudyFeature.saveStudySession(null, null);

    const saved = JSON.parse(localStorage.getItem('cet46_study_session'));
    expect(saved.queueIds).toEqual([1, 2]);
    expect(saved.currentIndex).toBe(0);
    expect(saved.totalCount).toBe(2);
  });

  it('saves session to db when available', async () => {
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 1;
    const mockDb = { instance: {}, save: vi.fn().mockResolvedValue(true) };

    await StudyFeature.saveStudySession(null, mockDb);

    expect(mockDb.save).toHaveBeenCalledWith('session', expect.objectContaining({
      key: 'study_session',
      data: expect.objectContaining({ queueIds: [1] })
    }));
  });

  it('calculates learnedCount from initialQueueSize and remaining queue', async () => {
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 3;
    StudyFeature.answeredCount = 2;

    const result = await StudyFeature.saveStudySession(null, null);

    expect(result.learnedCount).toBe(2); // 3 - 1 = 2
    expect(result.answeredCount).toBe(2);
  });
});

describe('StudyFeature.resumeFromSession', () => {
  it('returns false when session is null', async () => {
    const result = await StudyFeature.resumeFromSession(null, null, null);
    expect(result).toBe(false);
  });

  it('returns false when session has empty queue', async () => {
    const result = await StudyFeature.resumeFromSession({ queue: [] }, null, null);
    expect(result).toBe(false);
  });

  it('delegates to startStudy with override options', async () => {
    StudyFeature.setWords(mockWords);
    const session = {
      level: 'all',
      queue: [mockWords[0], mockWords[1]],
      currentIndex: 1,
      totalCount: 5,
      answeredCount: 2,
      learnedCount: 2
    };

    const result = await StudyFeature.resumeFromSession(session, null, null);
    expect(result).toBe(true);
    expect(StudyFeature.studyQueue.length).toBe(2);
    expect(StudyFeature.studyIndex).toBe(1);
    expect(StudyFeature.initialQueueSize).toBe(5);
  });
});

describe('StudyFeature 多维模式（选汉测试/听音辨义）', () => {
  beforeEach(() => {
    StudyFeature.setWords(mockWords);
    StudyFeature.studyQueue = [mockWords[0], mockWords[1], mockWords[2]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 3;
    StudyFeature.studyMode = 'card';
    StudyFeature.choiceOptions = [];
    StudyFeature.selectedChoiceId = '';
    StudyFeature.choiceStatus = '';
    StudyFeature.choiceLock = false;
    if (StudyFeature._choiceNextTimer) clearTimeout(StudyFeature._choiceNextTimer);
    StudyFeature._choiceNextTimer = null;
  });

  it('切换模式会更新 studyMode 并重置选项状态', () => {
    StudyFeature.choiceOptions = [{ id: 'x', isCorrect: false }];
    StudyFeature.choiceLock = true;
    StudyFeature.selectedChoiceId = 'x';
    StudyFeature.setStudyMode('choice');
    expect(StudyFeature.studyMode).toBe('choice');
    expect(StudyFeature.choiceLock).toBe(false);
    expect(StudyFeature.selectedChoiceId).toBe('');
    expect(StudyFeature.choiceStatus).toBe('');
  });

  it('setStudyMode 忽略非法模式与重复模式', () => {
    StudyFeature.studyMode = 'choice';
    StudyFeature.setStudyMode('choice');
    expect(StudyFeature.studyMode).toBe('choice');
    StudyFeature.setStudyMode('bogus');
    expect(StudyFeature.studyMode).toBe('choice');
  });

  it('_generateChoices 生成 4 个选项且恰有 1 个正确', () => {
    StudyFeature.studyMode = 'choice';
    StudyFeature._generateChoices();
    expect(StudyFeature.choiceOptions.length).toBe(4);
    expect(StudyFeature.choiceOptions.filter(o => o.isCorrect).length).toBe(1);
  });

  it('onSelectChoice 答对锁定并自动推进队列', async () => {
    vi.useFakeTimers();
    try {
      StudyFeature.studyMode = 'choice';
      StudyFeature._generateChoices();
      const correct = StudyFeature.choiceOptions.find(o => o.isCorrect);
      StudyFeature.onSelectChoice(correct.id);
      expect(StudyFeature.choiceStatus).toBe('correct');
      expect(StudyFeature.choiceLock).toBe(true);
      // 600ms 后自动 markWord(true) → 当前词出队
      await vi.advanceTimersByTimeAsync(650);
      expect(StudyFeature.studyQueue.length).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('onSelectChoice 答错锁定并保留队列等待手动推进', async () => {
    StudyFeature.studyMode = 'choice';
    StudyFeature._generateChoices();
    const wrong = StudyFeature.choiceOptions.find(o => !o.isCorrect);
    StudyFeature.onSelectChoice(wrong.id);
    expect(StudyFeature.choiceStatus).toBe('wrong');
    expect(StudyFeature.choiceLock).toBe(true);
    expect(StudyFeature.studyQueue.length).toBe(3);
    // 手动"下一词" → markWord(false) 记入错词并回炉
    await StudyFeature.nextChoiceWord();
    expect(addWrongWord).toHaveBeenCalled();
    expect(StudyFeature.studyQueue.length).toBe(3);
  });

  it('selectChoiceByIndex 映射到对应选项', () => {
    StudyFeature.studyMode = 'choice';
    StudyFeature._generateChoices();
    const first = StudyFeature.choiceOptions[0];
    StudyFeature.selectChoiceByIndex(0);
    expect(StudyFeature.selectedChoiceId).toBe(first.id);
  });
});

describe('StudyFeature 扩展逻辑与边界覆盖', () => {
  beforeEach(() => {
    StudyFeature.setWords(mockWords);
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature.initialQueueSize = 1;
    StudyFeature.answeredCount = 0;
  });

  it('markWord(false) 超过 MAX_RETRY 后不再回炉插入队列', async () => {
    getWordData.mockReturnValue({ status: 'review', level: 1, reviewCount: 2 });
    StudyFeature._retryCount = { [mockWords[0].id]: 5 }; // Already retried 5 times

    await StudyFeature.markWord(false);

    // Queue should now be empty (not reinserted)
    expect(StudyFeature.studyQueue.length).toBe(0);
    expect(StudyFeature._retryCount[mockWords[0].id]).toBeUndefined();
  });

  it('showStudyWord 学习完毕时触发结算与切页事件', () => {
    const startBtn = { style: { display: 'none' }, dataset: {} };
    const studyButtons = { style: { display: 'flex' } };
    const clozeToggle = { style: { display: 'flex' } };
    const btnCloze = { textContent: '', setAttribute: vi.fn() };

    globalThis.document.getElementById = vi.fn(id => {
      if (id === 'start-btn') return startBtn;
      if (id === 'study-buttons') return studyButtons;
      if (id === 'cloze-toggle') return clozeToggle;
      if (id === 'btn-cloze') return btnCloze;
      return null;
    });

    globalThis.window.dispatchEvent = vi.fn();

    StudyFeature.studyQueue = [];
    StudyFeature.studyIndex = 0;
    StudyFeature.showStudyWord();

    expect(startBtn.style.display).toBe('block');
    expect(startBtn.dataset.action).toBe('start-study');
    expect(studyButtons.style.display).toBe('none');
    expect(globalThis.window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cet46:switch-tab' })
    );
  });

  it('toggleClozeMode 在有词时切换完形填空状态', async () => {
    const { AppState } = await import('../js/state.js');
    const elExample = { textContent: '', innerHTML: '' };
    const btnCloze = { textContent: '', setAttribute: vi.fn() };

    globalThis.document.getElementById = vi.fn(id => {
      if (id === 'study-example') return elExample;
      if (id === 'btn-cloze') return btnCloze;
      return null;
    });

    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;

    // Toggle ON
    StudyFeature.toggleClozeMode();
    expect(AppState.clozeModeEnabled).toBe(true);
    expect(btnCloze.textContent).toContain('开启');

    // Toggle OFF
    StudyFeature.toggleClozeMode();
    expect(AppState.clozeModeEnabled).toBe(false);
    expect(btnCloze.textContent).toContain('关闭');
  });

  it('speakCurrentWord 在空队列提示警告，有词时调用 speechSynthesis', () => {
    StudyFeature.studyQueue = [];
    StudyFeature.speakCurrentWord();
    expect(UI.toast).toHaveBeenCalledWith('请先开始学习', 'warning');

    const speakMock = vi.fn();
    globalThis.speechSynthesis = { speak: speakMock };
    globalThis.window.speechSynthesis = globalThis.speechSynthesis;
    globalThis.SpeechSynthesisUtterance = class MockUtterance {
      constructor(text) {
        this.text = text;
      }
    };

    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    StudyFeature.speakCurrentWord();
    expect(speakMock).toHaveBeenCalled();
  });

  it('handleSaveMnemonic 弹出输入框并执行回调', async () => {
    const saveFn = vi.fn();

    // Empty queue
    StudyFeature.studyQueue = [];
    await StudyFeature.handleSaveMnemonic(saveFn);
    expect(UI.toast).toHaveBeenCalledWith('请先开始学习', 'warning');

    // Active word
    StudyFeature.studyQueue = [mockWords[0]];
    StudyFeature.studyIndex = 0;
    UI.prompt.mockResolvedValueOnce('联想记忆内容');

    await StudyFeature.handleSaveMnemonic(saveFn);
    expect(saveFn).toHaveBeenCalledWith(mockWords[0].id, '联想记忆内容');
    expect(UI.toast).toHaveBeenCalledWith('联想法已保存', 'success');
  });
});

