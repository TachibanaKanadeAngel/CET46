// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  setupGlobalEventDelegation,
  switchTab,
  removeVisualViewportListener,
  handleUndo,
  initFilterEventListeners,
} from '../js/init/event-delegation.js';
import { StudyFeature } from '../js/features/study.js';
import { ReviewFeature } from '../js/features/review.js';
import { SpellingFeature } from '../js/features/spelling.js';
import { loadSettingsFeature, loadWebDAVFeature } from '../js/init/module-loaders.js';

describe('event-delegation.js test suite', () => {
  beforeAll(() => {
    setupGlobalEventDelegation();
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="tabs">
        <button class="tab-btn" data-tab="study">学习</button>
        <button class="tab-btn" data-tab="review">复习</button>
        <button class="tab-btn" data-tab="wrong">错题</button>
        <button class="tab-btn" data-tab="stats">统计</button>
        <button class="tab-btn" data-tab="list">词库</button>
        <button class="tab-btn" data-tab="settings">设置</button>
      </div>
      <div id="view-study" class="view">
        <select id="study-level"><option value="CET4">CET4</option></select>
      </div>
      <div id="view-review" class="view"></div>
      <div id="view-wrong" class="view"></div>
      <div id="view-stats" class="view"></div>
      <div id="view-list" class="view"></div>
      <div id="view-settings" class="view"></div>
      <input type="file" id="import-file" style="display:none" />
      <input type="file" id="vocab-file" style="display:none" />
    `;
  });

  afterEach(() => {
    removeVisualViewportListener();
    vi.restoreAllMocks();
  });

  it('switchTab changes active tab button and view container', () => {
    switchTab('review');
    expect(document.querySelector('.tab-btn[data-tab="review"]').classList.contains('active')).toBe(true);
    expect(document.getElementById('view-review').classList.contains('active')).toBe(true);
    expect(document.getElementById('view-study').classList.contains('active')).toBe(false);

    switchTab('stats');
    expect(document.querySelector('.tab-btn[data-tab="stats"]').classList.contains('active')).toBe(true);
    expect(document.getElementById('view-stats').classList.contains('active')).toBe(true);
  });

  it('responds to cet46:switch-tab custom event', () => {
    window.dispatchEvent(new CustomEvent('cet46:switch-tab', { detail: { tab: 'wrong' } }));
    expect(document.getElementById('view-wrong').classList.contains('active')).toBe(true);
  });

  it('delegates navigation and study action clicks', () => {
    const navBtn = document.createElement('button');
    navBtn.dataset.action = 'nav-study';
    document.body.appendChild(navBtn);

    navBtn.click();
    expect(document.getElementById('view-study').classList.contains('active')).toBe(true);

    const startStudySpy = vi.spyOn(StudyFeature, 'startStudy').mockReturnValue(true);
    const startBtn = document.createElement('button');
    startBtn.dataset.action = 'start-study';
    document.body.appendChild(startBtn);

    startBtn.click();
    expect(startStudySpy).toHaveBeenCalled();

    const markKnownSpy = vi.spyOn(StudyFeature, 'markWord').mockImplementation(() => {});
    const markBtn = document.createElement('button');
    markBtn.dataset.action = 'mark-known';
    document.body.appendChild(markBtn);

    markBtn.click();
    expect(markKnownSpy).toHaveBeenCalledWith(true);

    const markUnknownBtn = document.createElement('button');
    markUnknownBtn.dataset.action = 'mark-unknown';
    document.body.appendChild(markUnknownBtn);

    markUnknownBtn.click();
    expect(markKnownSpy).toHaveBeenCalledWith(false);
  });

  it('delegates review actions (flip, known, unknown)', () => {
    const flipSpy = vi.spyOn(ReviewFeature, 'flipReviewCard').mockImplementation(() => {});
    const markReviewSpy = vi.spyOn(ReviewFeature, 'markReviewWord').mockImplementation(() => {});

    const flipBtn = document.createElement('button');
    flipBtn.dataset.action = 'flip-review';
    document.body.appendChild(flipBtn);
    flipBtn.click();
    expect(flipSpy).toHaveBeenCalled();

    const knownBtn = document.createElement('button');
    knownBtn.dataset.action = 'review-known';
    document.body.appendChild(knownBtn);
    knownBtn.click();
    expect(markReviewSpy).toHaveBeenCalledWith(true, expect.any(Object));

    const unknownBtn = document.createElement('button');
    unknownBtn.dataset.action = 'review-unknown';
    document.body.appendChild(unknownBtn);
    unknownBtn.click();
    expect(markReviewSpy).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it('delegates spelling actions (open, submit, hint, mode)', () => {
    const openSpy = vi.spyOn(SpellingFeature, 'openSpellingChallenge').mockImplementation(() => {});
    const submitSpy = vi.spyOn(SpellingFeature, 'checkSpelling').mockImplementation(() => {});
    const hintSpy = vi.spyOn(SpellingFeature, 'giveSpellingHint').mockImplementation(() => {});
    const modeSpy = vi.spyOn(SpellingFeature, 'setSpellingMode').mockImplementation(() => {});

    const openBtn = document.createElement('button');
    openBtn.dataset.action = 'open-spelling';
    document.body.appendChild(openBtn);
    openBtn.click();
    expect(openSpy).toHaveBeenCalled();

    const submitBtn = document.createElement('button');
    submitBtn.dataset.action = 'submit-spelling';
    document.body.appendChild(submitBtn);
    submitBtn.click();
    expect(submitSpy).toHaveBeenCalled();

    const hintBtn = document.createElement('button');
    hintBtn.dataset.action = 'spelling-hint';
    document.body.appendChild(hintBtn);
    hintBtn.click();
    expect(hintSpy).toHaveBeenCalled();

    const modeBtn = document.createElement('button');
    modeBtn.dataset.action = 'spelling-mode-meaning';
    document.body.appendChild(modeBtn);
    modeBtn.click();
    expect(modeSpy).toHaveBeenCalledWith('meaning');
  });

  it('delegates WebDAV and Settings actions', () => {
    const mockWebDAV = {
      toggleWebDAVConfig: vi.fn(),
      handleSaveWebDAVConfig: vi.fn(),
      handleTestWebDAVConnection: vi.fn(),
      handleSyncToWebDAV: vi.fn(),
      handleSyncFromWebDAV: vi.fn(),
      handleExportEncryptionKey: vi.fn(),
    };
    vi.spyOn(loadWebDAVFeature, 'get').mockReturnValue(mockWebDAV);

    const toggleBtn = document.createElement('button');
    toggleBtn.dataset.action = 'toggle-webdav';
    document.body.appendChild(toggleBtn);
    toggleBtn.click();
    expect(mockWebDAV.toggleWebDAVConfig).toHaveBeenCalled();

    const mockSettings = {
      trainFSRSWeights: vi.fn(),
      resetFSRSWeights: vi.fn(),
      resetProgress: vi.fn(),
      exportData: vi.fn(),
    };
    vi.spyOn(loadSettingsFeature, 'get').mockReturnValue(mockSettings);

    const trainBtn = document.createElement('button');
    trainBtn.dataset.action = 'train-fsrs';
    document.body.appendChild(trainBtn);
    trainBtn.click();
    expect(mockSettings.trainFSRSWeights).toHaveBeenCalled();
  });

  it('handles keyboard enter and space on role="button" action elements', () => {
    const actionSpan = document.createElement('span');
    actionSpan.setAttribute('role', 'button');
    actionSpan.dataset.action = 'nav-wrong';
    document.body.appendChild(actionSpan);

    const clickSpy = vi.spyOn(actionSpan, 'click');

    actionSpan.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clickSpy).toHaveBeenCalled();

    actionSpan.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handleUndo displays toast on success, failure, and catches errors', async () => {
    const { UI } = await import('../js/ui.js');
    const core = await import('../js/core.js');

    vi.spyOn(UI, 'toast');
    const undoSpy = vi.spyOn(core, 'undoLastAction');

    undoSpy.mockResolvedValueOnce({ success: true, message: '撤销成功' });
    await handleUndo();
    expect(UI.toast).toHaveBeenCalledWith('撤销成功', 'success');

    undoSpy.mockResolvedValueOnce({ success: false, message: '无法撤销' });
    await handleUndo();
    expect(UI.toast).toHaveBeenCalledWith('无法撤销', 'error');

    undoSpy.mockRejectedValueOnce(new Error('Undo crash'));
    await handleUndo();
    expect(UI.toast).toHaveBeenCalledWith('撤销操作失败，请重试', 'error');
  });

  it('initFilterEventListeners binds input, change, and scroll handlers', () => {
    initFilterEventListeners();

    const searchInput = document.getElementById('search-input');
    const levelSelect = document.getElementById('filter-level');
    const statusSelect = document.getElementById('filter-status');
    const virtualContainer = document.getElementById('virtual-scroll-container');
    const vocabFile = document.getElementById('vocab-file');

    if (searchInput) searchInput.dispatchEvent(new Event('input'));
    if (levelSelect) levelSelect.dispatchEvent(new Event('change'));
    if (statusSelect) statusSelect.dispatchEvent(new Event('change'));
    if (virtualContainer) virtualContainer.dispatchEvent(new Event('scroll'));
    if (vocabFile) vocabFile.dispatchEvent(new Event('change'));
  });

  it('delegates various audio, choice, spelling, and modal actions', async () => {
    const studySpies = {
      setStudyMode: vi.spyOn(StudyFeature, 'setStudyMode').mockImplementation(() => {}),
      onSelectChoice: vi.spyOn(StudyFeature, 'onSelectChoice').mockImplementation(() => {}),
      nextChoiceWord: vi.spyOn(StudyFeature, 'nextChoiceWord').mockImplementation(() => {}),
      toggleClozeMode: vi.spyOn(StudyFeature, 'toggleClozeMode').mockImplementation(() => {}),
      speakCurrentWord: vi.spyOn(StudyFeature, 'speakCurrentWord').mockImplementation(() => {}),
      handleSaveMnemonic: vi.spyOn(StudyFeature, 'handleSaveMnemonic').mockImplementation(() => {}),
    };

    const spellingSpies = {
      checkSpelling: vi.spyOn(SpellingFeature, 'checkSpelling').mockImplementation(() => {}),
      replaySpellingAudio: vi.spyOn(SpellingFeature, 'replaySpellingAudio').mockImplementation(() => {}),
      giveSpellingHint: vi.spyOn(SpellingFeature, 'giveSpellingHint').mockImplementation(() => {}),
      closeSpellingModal: vi.spyOn(SpellingFeature, 'closeSpellingModal').mockImplementation(() => {}),
    };

    const reviewSpies = {
      speakReviewWord: vi.spyOn(ReviewFeature, 'speakReviewWord').mockImplementation(() => {}),
    };

    const actions = [
      { action: 'set-study-mode', extra: { mode: 'choice' }, spy: studySpies.setStudyMode },
      { action: 'select-choice', extra: { choiceId: '10' }, spy: studySpies.onSelectChoice },
      { action: 'next-choice-word', spy: studySpies.nextChoiceWord },
      { action: 'toggle-cloze', spy: studySpies.toggleClozeMode },
      { action: 'save-mnemonic', spy: studySpies.handleSaveMnemonic },
      { action: 'speak-study-word', spy: studySpies.speakCurrentWord },
      { action: 'speak-review-word', spy: reviewSpies.speakReviewWord },
      { action: 'speak-spelling-word', spy: spellingSpies.replaySpellingAudio },
      { action: 'submit-spelling', spy: spellingSpies.checkSpelling },
      { action: 'spelling-hint', spy: spellingSpies.giveSpellingHint },
      { action: 'close-spelling', spy: spellingSpies.closeSpellingModal },
    ];

    for (const item of actions) {
      const btn = document.createElement('button');
      btn.dataset.action = item.action;
      if (item.extra) {
        Object.entries(item.extra).forEach(([k, v]) => {
          btn.dataset[k] = v;
        });
      }
      document.body.appendChild(btn);
      btn.click();
      expect(item.spy).toHaveBeenCalled();
    }
  });

  it('delegates resume-study session checks and recovery', async () => {
    const { UI } = await import('../js/ui.js');
    vi.spyOn(UI, 'toast');

    // Case 1: no session found
    vi.spyOn(StudyFeature, 'checkStudySession').mockResolvedValueOnce({ hasSession: false });
    const startStudySpy = vi.spyOn(StudyFeature, 'startStudy').mockReturnValue(true);

    const resumeBtn = document.createElement('button');
    resumeBtn.dataset.action = 'resume-study';
    document.body.appendChild(resumeBtn);
    resumeBtn.click();
    await new Promise(r => setTimeout(r, 10));
    expect(startStudySpy).toHaveBeenCalled();

    // Case 2: session found and resume success
    vi.spyOn(StudyFeature, 'checkStudySession').mockResolvedValueOnce({
      hasSession: true,
      session: { level: 'CET4', queueIds: [1, 2], currentIndex: 0 },
    });
    vi.spyOn(StudyFeature, 'resumeFromSession').mockResolvedValueOnce(true);

    resumeBtn.click();
    await new Promise(r => setTimeout(r, 10));
    expect(UI.toast).toHaveBeenCalledWith('已恢复上次学习会话', 'success');
  });

  it('handles unknown action and action errors gracefully', async () => {
    const { UI } = await import('../js/ui.js');
    vi.spyOn(UI, 'toast');

    const unknownBtn = document.createElement('button');
    unknownBtn.dataset.action = 'nonexistent-action-xyz';
    document.body.appendChild(unknownBtn);
    unknownBtn.click();

    expect(UI.toast).toHaveBeenCalledWith(expect.stringContaining('操作暂时不可用'), 'error');
  });
});

