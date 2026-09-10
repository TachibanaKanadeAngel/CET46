// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupDebugApi } from '../js/init/debug-api.js';
import { CONFIG } from '../js/config.js';
import { db } from '../js/db.js';
import { UI } from '../js/ui.js';
import { StudyFeature } from '../js/features/study.js';
import { ReviewFeature } from '../js/features/review.js';
import { initSemanticGraphUI } from '../js/utils/semantic-graph-ui.js';

describe('debug-api.js test suite', () => {
  beforeEach(() => {
    initSemanticGraphUI({
      getWORDS: () => [],
      getData: () => ({}),
      CONSTANTS: {},
    });
    vi.spyOn(UI, 'toast').mockImplementation(() => {});
    vi.spyOn(StudyFeature, 'setWords').mockImplementation(() => {});
    vi.spyOn(ReviewFeature, 'setWords').mockImplementation(() => {});
    db.clear = vi.fn().mockResolvedValue(undefined);
    db.bulkSave = vi.fn().mockResolvedValue(undefined);
  });

  it('skips registration when CONFIG.DEBUG is false', () => {
    const origDebug = CONFIG.DEBUG;
    CONFIG.DEBUG = false;
    delete window.resetVocabulary;

    setupDebugApi({
      getDefaultWords: vi.fn(),
      getDefaultWordsCacheLength: vi.fn(),
    });

    expect(window.resetVocabulary).toBeUndefined();
    CONFIG.DEBUG = origDebug;
  });

  it('registers debug APIs on window and runs resetVocabulary and checkVocabulary', async () => {
    const origDebug = CONFIG.DEBUG;
    CONFIG.DEBUG = true;

    const mockWords = [{ id: 1, word: 'apple' }, { id: 2, word: 'banana' }];
    const getDefaultWords = vi.fn().mockResolvedValue(mockWords);
    const getDefaultWordsCacheLength = vi.fn().mockReturnValue(2);

    setupDebugApi({ getDefaultWords, getDefaultWordsCacheLength });

    expect(window.resetVocabulary).toBeDefined();
    expect(window.checkVocabulary).toBeDefined();
    expect(window.showPerfPanel).toBeDefined();

    // Run resetVocabulary
    await window.resetVocabulary();
    expect(db.clear).toHaveBeenCalledWith('words');
    expect(db.bulkSave).toHaveBeenCalledWith('words', mockWords);
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('词库已重置'), 'success');

    // Run checkVocabulary
    const status = window.checkVocabulary();
    expect(status).toHaveProperty('wordsLength');
    expect(status).toHaveProperty('defaultWordsLength', 2);

    // Test resetVocabulary error branch
    db.clear.mockRejectedValueOnce(new Error('DB failure'));
    await window.resetVocabulary();
    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('重置词库失败'), 'error');

    CONFIG.DEBUG = origDebug;
  });
});
