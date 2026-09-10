// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initApp } from '../js/init/app-init.js';
import { db } from '../js/db.js';
import { UI } from '../js/ui.js';
import { initSemanticGraphUI } from '../js/utils/semantic-graph-ui.js';

describe('app-init.js test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="view-study"></div>
      <div id="study-card"></div>
      <div id="virtual-scroll-content"></div>
      <button id="start-study-btn"></button>
    `;
    localStorage.clear();

    initSemanticGraphUI({
      getWORDS: () => [{ id: 1, word: 'apple' }],
      getData: () => ({}),
      CONSTANTS: { SEMANTIC_GRAPH_DEFER_MS: 50 },
    });

    db.init = vi.fn().mockResolvedValue(undefined);
    db.instance = null;
    db.getAll = vi.fn().mockResolvedValue([{ id: 1, word: 'apple' }]);
    db.bulkSave = vi.fn().mockResolvedValue(undefined);
    db.save = vi.fn().mockResolvedValue(undefined);
    db.get = vi.fn().mockResolvedValue(null);

    vi.spyOn(UI, 'toast').mockImplementation(() => {});
    vi.spyOn(UI, 'showShortcutGuide').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('runs initApp in memory fallback mode when IndexedDB throws error', async () => {
    db.init.mockRejectedValueOnce(new Error('IndexedDB blocked'));
    db.instance = null;

    await initApp();

    const banner = Array.from(document.querySelectorAll('div')).find(d =>
      d.textContent.includes('本地数据库不可用')
    );
    expect(banner).toBeDefined();
    expect(banner?.textContent).toContain('本地数据库不可用');
  });

  it('triggers beforeunload cleanup hooks for particle, widgets, and monitor', async () => {
    await initApp();

    expect(() => window.dispatchEvent(new Event('beforeunload'))).not.toThrow();
  });

  it('triggers shortcut guide timer callback after delay', async () => {
    await initApp();

    // Advance 1.5s -> triggers shortcut guide
    vi.advanceTimersByTime(1500);
    expect(UI.showShortcutGuide).toHaveBeenCalled();
  });
});

