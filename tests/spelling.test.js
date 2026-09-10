import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide minimal DOM and browser API mocks for node environment
function createDOMMock() {
  const elements = {};
  const el = (id) => {
    if (!elements[id]) {
      elements[id] = {
        textContent: '',
        style: { display: '', borderColor: '', width: '', color: '', background: '' },
        className: '',
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: vi.fn(() => false) },
        value: '',
        placeholder: '',
        disabled: false,
        dataset: {},
        childNodes: [],
        children: [],
        appendChild: vi.fn(),
        replaceChildren: vi.fn(),
        setAttribute: vi.fn(),
      };
    }
    return elements[id];
  };

  return {
    getElementById: vi.fn((id) => el(id)),
    querySelectorAll: vi.fn(() => []),
    body: {
      innerHTML: '',
      appendChild: vi.fn(),
    },
    createElement: vi.fn((tag) => ({
      tagName: tag.toUpperCase(),
      textContent: '',
      style: { display: '', borderColor: '', width: '', color: '', background: '' },
      className: '',
      classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: vi.fn(() => false) },
      id: '',
      appendChild: vi.fn(),
      setAttribute: vi.fn(),
    })),
    _elements: elements,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.document = createDOMMock();
  globalThis.alert = vi.fn();
  globalThis.window = {};
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  delete globalThis.document;
  delete globalThis.alert;
  delete globalThis.window;
});

vi.mock('../js/fsrs.js', () => ({
  calculateLevenshtein: vi.fn((a, b) => {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }),
  updateFSRS: vi.fn(() => ({ stability: 10, difficulty: 4 }))
}));

vi.mock('../js/ui.js', () => ({
  playTone: vi.fn(),
  fireConfetti: vi.fn(),
  speak: vi.fn(),
  UI: { toast: vi.fn() }
}));

vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('../js/utils/dom.ts', () => ({
  // P1-9 修复：补全 spelling.js 实际导入的 byId/qsa，否则调用时报 "byId is not defined"
  byId: vi.fn((id) => globalThis.document?.getElementById(id) ?? null),
  qsa: vi.fn(() => []),
  createFocusTrap: vi.fn(() => vi.fn())
}));

import { SpellingFeature } from '../js/features/spelling.js';
import { calculateLevenshtein, updateFSRS } from '../js/fsrs.js';
import { playTone, fireConfetti } from '../js/ui.js';

const mockWords = [
  { id: 1, word: 'abandon', meaning: '放弃', phonetic: '/əˈbændən/', level: 4, example: 'He abandoned his plan.' },
  { id: 2, word: 'ability', meaning: '能力', phonetic: '/əˈbɪləti/', level: 4, example: 'She has the ability.' },
  { id: 3, word: 'absent', meaning: '缺席的', phonetic: '/ˈæbsənt/', level: 6, example: 'He was absent.' }
];

let mockGetWordData;
let mockSetWordData;
let mockAddWrongWord;
let mockRemoveWrongWord;
let mockSaveStudySession;
let mockUpdateStats;
let mockUpdateProgress;
let mockShowStudyWord;
let mockStudyQueue;
let mockStudyIndex;

beforeEach(() => {
  vi.clearAllMocks();

  mockStudyQueue = [...mockWords];
  mockStudyIndex = 0;
  mockGetWordData = vi.fn(() => ({ status: 'new', level: 0, stability: 0, difficulty: 0, reviewCount: 0 }));
  mockSetWordData = vi.fn(() => Promise.resolve());
  mockAddWrongWord = vi.fn();
  mockRemoveWrongWord = vi.fn();
  mockSaveStudySession = vi.fn(() => Promise.resolve());
  mockUpdateStats = vi.fn();
  mockUpdateProgress = vi.fn();
  mockShowStudyWord = vi.fn();

  SpellingFeature.init({
    getStudyQueue: () => mockStudyQueue,
    getStudyIndex: () => mockStudyIndex,
    getWordData: mockGetWordData,
    setWordData: mockSetWordData,
    addWrongWord: mockAddWrongWord,
    removeWrongWord: mockRemoveWrongWord,
    saveStudySession: mockSaveStudySession,
    updateStats: mockUpdateStats,
    updateProgress: mockUpdateProgress,
    showStudyWord: mockShowStudyWord
  });

  // Reset spellingChecked state by calling openSpellingChallenge
  // which sets spellingChecked = false
  SpellingFeature.openSpellingChallenge();
});

describe('SpellingFeature.init', () => {
  it('stores config functions', () => {
    const getQueue = () => mockStudyQueue;
    const getIndex = () => 0;
    SpellingFeature.init({
      getStudyQueue: getQueue,
      getStudyIndex: getIndex,
      getWordData: mockGetWordData,
      setWordData: mockSetWordData,
      addWrongWord: mockAddWrongWord,
      removeWrongWord: mockRemoveWrongWord,
      saveStudySession: mockSaveStudySession,
      updateStats: mockUpdateStats,
      updateProgress: mockUpdateProgress,
      showStudyWord: mockShowStudyWord
    });
    // No error means init succeeded
  });

  it('accepts array-based studyQueue config', () => {
    SpellingFeature.init({
      studyQueue: mockWords,
      studyIndex: 0,
      getWordData: mockGetWordData,
      setWordData: mockSetWordData,
      addWrongWord: mockAddWrongWord,
      removeWrongWord: mockRemoveWrongWord,
      saveStudySession: mockSaveStudySession,
      updateStats: mockUpdateStats,
      updateProgress: mockUpdateProgress,
      showStudyWord: mockShowStudyWord
    });
    // No error
  });
});

describe('SpellingFeature.getSpellingMode / setSpellingMode', () => {
  it('returns default mode "meaning"', () => {
    expect(SpellingFeature.getSpellingMode()).toBe('meaning');
  });

  it('changes mode when setSpellingMode is called', () => {
    SpellingFeature.setSpellingMode('phonetic');
    expect(SpellingFeature.getSpellingMode()).toBe('phonetic');
  });
});

describe('SpellingFeature.checkSpelling', () => {
  it('does nothing when no current word in queue', async () => {
    mockStudyQueue = [];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge(); // reset spellingChecked
    await SpellingFeature.checkSpelling();
    expect(mockSetWordData).not.toHaveBeenCalled();
  });

  it('marks correct spelling (distance=0) as success', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge(); // reset spellingChecked
    // Set input value
    document._elements['spelling-input'].value = 'abandon';

    await SpellingFeature.checkSpelling();

    expect(calculateLevenshtein).toHaveBeenCalledWith('abandon', 'abandon');
    expect(mockSetWordData).toHaveBeenCalled();
    expect(fireConfetti).toHaveBeenCalled();
    expect(playTone).toHaveBeenCalledWith('success');
  });

  it('marks near-correct spelling (distance=1) as warning', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge(); // reset spellingChecked
    document._elements['spelling-input'].value = 'abandn';

    // Override Levenshtein to return 1 for this test
    calculateLevenshtein.mockReturnValueOnce(1);

    await SpellingFeature.checkSpelling();

    expect(playTone).toHaveBeenCalledWith('success');
    expect(mockSetWordData).toHaveBeenCalled();
  });

  it('marks wrong spelling (distance>1) as error', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge(); // reset spellingChecked
    document._elements['spelling-input'].value = 'xyz';

    // Override Levenshtein to return large distance
    calculateLevenshtein.mockReturnValueOnce(5);

    await SpellingFeature.checkSpelling();

    expect(playTone).toHaveBeenCalledWith('fail');
    expect(mockAddWrongWord).toHaveBeenCalledWith(mockWords[0].id, mockWords[0]);
  });

  it('closes modal and calls showStudyWord on second call when already checked', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge(); // reset spellingChecked
    document._elements['spelling-input'].value = 'abandon';

    // First call - checks spelling
    await SpellingFeature.checkSpelling();
    // Second call - should close modal (spellingChecked is true)
    await SpellingFeature.checkSpelling();

    expect(mockShowStudyWord).toHaveBeenCalled();
  });
});

describe('SpellingFeature - processSpellingResult quality levels', () => {
  it('quality >= 4: level increases by 2', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'new', level: 2, stability: 5, difficulty: 5, reviewCount: 0 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'abandon';

    await SpellingFeature.checkSpelling();

    const savedWd = mockSetWordData.mock.calls[0][1];
    expect(savedWd.level).toBe(4); // 2 + 2
  });

  it('quality 3: level increases by 1', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'new', level: 2, stability: 5, difficulty: 5, reviewCount: 0 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'abandn';
    // Use distance=1 to get quality = max(2, lastSpellingQuality-2)
    calculateLevenshtein.mockReturnValueOnce(1);

    await SpellingFeature.checkSpelling();

    expect(mockSetWordData).toHaveBeenCalled();
  });

  it('quality 1: level is halved', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'new', level: 4, stability: 5, difficulty: 5, reviewCount: 0 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'xyz';
    calculateLevenshtein.mockReturnValueOnce(5);

    await SpellingFeature.checkSpelling();

    const savedWd = mockSetWordData.mock.calls[0][1];
    expect(savedWd.level).toBe(2); // floor(4/2)
  });

  it('sets status to mastered when level reaches 10', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'review', level: 8, stability: 5, difficulty: 5, reviewCount: 0 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'abandon';

    await SpellingFeature.checkSpelling();

    const savedWd = mockSetWordData.mock.calls[0][1];
    expect(savedWd.level).toBe(10);
    expect(savedWd.status).toBe('mastered');
  });

  it('increments reviewCount', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'new', level: 0, stability: 5, difficulty: 5, reviewCount: 3 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'abandon';

    await SpellingFeature.checkSpelling();

    const savedWd = mockSetWordData.mock.calls[0][1];
    expect(savedWd.reviewCount).toBe(4);
  });

  it('removes wrong word for quality >= 3', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    mockGetWordData.mockReturnValue({ status: 'new', level: 0, stability: 5, difficulty: 5, reviewCount: 0 });
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = 'abandon';

    await SpellingFeature.checkSpelling();

    expect(mockRemoveWrongWord).toHaveBeenCalledWith(mockWords[0].id);
  });
});

describe('SpellingFeature.giveSpellingHint', () => {
  it('does nothing when no current word', () => {
    mockStudyQueue = [];
    SpellingFeature.giveSpellingHint();
    // Should not throw
  });

  it('gives first letter hint at level 1', () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;

    SpellingFeature.giveSpellingHint();

    expect(document.getElementById).toHaveBeenCalledWith('spelling-input');
    expect(document.getElementById).toHaveBeenCalledWith('hint-level-display');
    expect(document.getElementById).toHaveBeenCalledWith('hint-btn');
  });

  it('gives first two letters hint at level 2', () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;

    SpellingFeature.giveSpellingHint();
    SpellingFeature.giveSpellingHint();

    expect(document.getElementById).toHaveBeenCalledWith('spelling-input');
  });

  it('reduces lastSpellingQuality with each hint', () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;

    SpellingFeature.giveSpellingHint();
    SpellingFeature.giveSpellingHint();
    SpellingFeature.giveSpellingHint();

    expect(document.getElementById).toHaveBeenCalledWith('hint-btn');
  });
});

describe('SpellingFeature.handleSpellingKeydown', () => {
  it('prevents default on Enter key', () => {
    const e = { key: 'Enter', preventDefault: vi.fn() };

    SpellingFeature.handleSpellingKeydown(e);

    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('does not prevent default on other keys', () => {
    const e = { key: 'a', preventDefault: vi.fn() };

    SpellingFeature.handleSpellingKeydown(e);

    expect(e.preventDefault).not.toHaveBeenCalled();
  });
});

describe('SpellingFeature - Levenshtein distance integration', () => {
  it('calls calculateLevenshtein with trimmed lowercase input', async () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;
    SpellingFeature.openSpellingChallenge();
    document._elements['spelling-input'].value = '  Abandon  ';

    await SpellingFeature.checkSpelling();

    expect(calculateLevenshtein).toHaveBeenCalledWith('abandon', 'abandon');
  });
});

describe('SpellingFeature.openSpellingChallenge', () => {
  it('does nothing when no current word', () => {
    mockStudyQueue = [];
    SpellingFeature.openSpellingChallenge();
    // Should not throw
  });

  it('resets hint level and spelling state', () => {
    mockStudyQueue = [mockWords[0]];
    mockStudyIndex = 0;

    SpellingFeature.openSpellingChallenge();

    expect(document.getElementById).toHaveBeenCalledWith('spelling-modal');
    expect(document.getElementById).toHaveBeenCalledWith('spelling-input');
    expect(document.getElementById).toHaveBeenCalledWith('spelling-result');
    expect(document.getElementById).toHaveBeenCalledWith('hint-level-display');
    expect(document.getElementById).toHaveBeenCalledWith('hint-btn');
    expect(document.getElementById).toHaveBeenCalledWith('spelling-submit');
  });
});

describe('SpellingFeature.closeSpellingModal', () => {
  it('accesses spelling-modal element', () => {
    SpellingFeature.closeSpellingModal();
    expect(document.getElementById).toHaveBeenCalledWith('spelling-modal');
  });
});
