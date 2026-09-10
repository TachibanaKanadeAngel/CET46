// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../js/data/vocab-store.js', () => ({
  WORDS: [
    { id: 1, word: 'hello', meaning: '你好' },
    { id: 2, word: 'world', meaning: '世界' },
  ],
  setWordsArray: vi.fn(),
}));

vi.mock('../js/features/study.js', () => ({
  StudyFeature: {
    setWords: vi.fn(),
    studyQueue: [],
    studyIndex: 0,
    saveStudySession: vi.fn(),
    updateProgress: vi.fn(),
    showStudyWord: vi.fn(),
  },
}));

vi.mock('../js/features/review.js', () => ({
  ReviewFeature: {
    setWords: vi.fn(),
  },
}));

vi.mock('../js/features/spelling.js', () => ({
  SpellingFeature: {
    init: vi.fn(),
  },
}));

vi.mock('../js/features/minigame.js', () => ({
  miniGame: {
    init: vi.fn(),
  },
}));

vi.mock('../js/features/engine-visualizer.js', () => ({
  engineVisualizer: {
    init: vi.fn(),
  },
}));

vi.mock('../js/widgets/pwa-widgets.js', () => ({
  pwaWidgets: {
    init: vi.fn(),
  },
}));

vi.mock('../js/store.js', () => ({
  memoryCache: {},
  addWrongWord: vi.fn(),
  removeWrongWord: vi.fn(),
}));

vi.mock('../js/db.js', () => ({
  db: {
    init: vi.fn(),
    instance: true,
  },
}));

vi.mock('../js/core.js', () => ({
  getWordData: vi.fn(),
  setWordData: vi.fn(),
}));

vi.mock('../js/utils/stats.js', () => ({
  updateStats: vi.fn(),
  registerStudyFeature: vi.fn(),
}));

vi.mock('../js/utils/wrong-words.ts', () => ({
  registerStudyFeature: vi.fn(),
}));

vi.mock('../js/utils/semantic-graph-ui.js', () => ({
  buildWordMaps: vi.fn(),
}));

vi.mock('../js/utils/vocab-list.js', () => ({
  renderList: vi.fn(),
}));

vi.mock('../js/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
}));

vi.mock('../js/features/settings.js', () => ({
  SettingsFeature: {
    setWords: vi.fn(),
    init: vi.fn(),
  },
}));

vi.mock('../js/features/webdav.js', () => ({
  WebDAVFeature: {
    init: vi.fn(),
  },
}));

import { initializeFeatures } from '../js/init/feature-init.js';
import { StudyFeature } from '../js/features/study.js';
import { ReviewFeature } from '../js/features/review.js';
import { SpellingFeature } from '../js/features/spelling.js';
import { miniGame } from '../js/features/minigame.js';
import { engineVisualizer } from '../js/features/engine-visualizer.js';
import { pwaWidgets } from '../js/widgets/pwa-widgets.js';
import { WORDS } from '../js/data/vocab-store.js';

describe('feature-init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeFeatures', () => {
    it('sets words for StudyFeature', async () => {
      await initializeFeatures();
      expect(StudyFeature.setWords).toHaveBeenCalledWith(WORDS);
    });

    it('sets words for ReviewFeature', async () => {
      await initializeFeatures();
      expect(ReviewFeature.setWords).toHaveBeenCalledWith(WORDS);
    });

    it('initializes SpellingFeature', async () => {
      await initializeFeatures();
      expect(SpellingFeature.init).toHaveBeenCalledWith(
        expect.objectContaining({
          getWordData: expect.any(Function),
          setWordData: expect.any(Function),
          addWrongWord: expect.any(Function),
          removeWrongWord: expect.any(Function),
          saveStudySession: expect.any(Function),
          updateStats: expect.any(Function),
          updateProgress: expect.any(Function),
          showStudyWord: expect.any(Function),
        })
      );
    });

    it('initializes miniGame', async () => {
      await initializeFeatures();
      expect(miniGame.init).toHaveBeenCalled();
    });

    it('initializes engineVisualizer', async () => {
      await initializeFeatures();
      expect(engineVisualizer.init).toHaveBeenCalled();
    });

    it('initializes pwaWidgets', async () => {
      await initializeFeatures();
      expect(pwaWidgets.init).toHaveBeenCalled();
    });

    it('throws error when initialization fails', async () => {
      const originalSetWords = StudyFeature.setWords;
      StudyFeature.setWords = vi.fn().mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(initializeFeatures()).rejects.toThrow('Initialization failed');
      StudyFeature.setWords = originalSetWords;
    });

    it('handles WORDS array', async () => {
      await initializeFeatures();
      expect(StudyFeature.setWords).toHaveBeenCalled();
    });
  });
});
