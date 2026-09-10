// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setupNetworkStatusListener,
  showResourceStatusPanel,
  showNetworkStatusPanel,
} from '../js/utils/network-status.ts';
import { UI } from '../js/ui.js';
import { ReactiveAppState } from '../js/state.js';
import { setWordsArray } from '../js/data/vocab-store.js';

describe('network-status.ts test suite', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="offline-banner" style="display: none;"></div>
      <div id="offline-indicator"></div>
      <div id="network-status-dot"></div>
    `;

    UI.showStatusPanel = vi.fn();
    setWordsArray([{ id: 1, word: 'apple' }, { id: 2, word: 'banana' }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setupNetworkStatusListener updates DOM and ReactiveAppState on online and offline events', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    globalThis.caches = {
      keys: vi.fn().mockResolvedValue(['cet46-audio-cache']),
      open: vi.fn().mockResolvedValue({
        keys: vi.fn().mockResolvedValue(new Array(150).fill('audio.mp3')),
      }),
    };

    navigator.serviceWorker = {
      controller: {},
    };

    setupNetworkStatusListener();
    await new Promise(r => setTimeout(r, 10));

    const banner = document.getElementById('offline-banner');
    const indicator = document.getElementById('offline-indicator');
    const statusDot = document.getElementById('network-status-dot');

    expect(banner.style.display).toBe('none');
    expect(indicator.textContent).toBe('📦');
    expect(indicator.title).toContain('已缓存 150 项离线资源');
    expect(statusDot.className).toContain('online');
    expect(ReactiveAppState.get('isOnline')).toBe(true);

    // Switch to offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    window.dispatchEvent(new Event('offline'));
    await new Promise(r => setTimeout(r, 10));

    expect(banner.style.display).toBe('block');
    expect(indicator.textContent).toBe('📴');
    expect(statusDot.className).toContain('offline');
    expect(ReactiveAppState.get('isOnline')).toBe(false);
  });

  it('showResourceStatusPanel opens UI modal with word count and mode', () => {
    showResourceStatusPanel();
    expect(UI.showStatusPanel).toHaveBeenCalledWith(
      '资源状态',
      expect.arrayContaining([
        expect.objectContaining({ label: '离线词库', value: expect.stringContaining('2 个词条') }),
      ]),
      expect.any(Object)
    );
  });

  it('showNetworkStatusPanel opens UI modal with online / offline info', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    showNetworkStatusPanel();
    expect(UI.showStatusPanel).toHaveBeenCalledWith(
      '网络状态',
      expect.arrayContaining([
        expect.objectContaining({ label: '网络连接', value: '在线' }),
      ]),
      expect.any(Object)
    );
  });
});
