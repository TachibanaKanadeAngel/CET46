// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupReactiveBindings } from '../js/utils/reactive-bindings.ts';
import { ReactiveAppState } from '../js/state.js';
import * as statsModule from '../js/utils/stats.js';

describe('reactive-bindings.ts test suite', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="app"></div>
      <button id="sync-btn">同步</button>
      <div id="network-status-dot"></div>
    `;
    vi.spyOn(statsModule, 'updateStats').mockImplementation(() => {});
  });

  it('binds syncInProgress, isOnline, ui.isLoading and stats state changes to DOM', () => {
    Object.defineProperty(Object.prototype, 'ui', {
      get() {
        return ReactiveAppState.ui;
      },
      configurable: true,
    });

    try {
      setupReactiveBindings();

      const syncBtn = document.getElementById('sync-btn');
      const statusDot = document.getElementById('network-status-dot');
      const app = document.getElementById('app');

      // Test syncInProgress = true
      ReactiveAppState.set('syncInProgress', true);
      expect(syncBtn.disabled).toBe(true);
      expect(syncBtn.textContent).toBe('同步中...');

      // Test syncInProgress = false
      ReactiveAppState.set('syncInProgress', false);
      expect(syncBtn.disabled).toBe(false);
      expect(syncBtn.textContent).toBe('同步');

      // Test isOnline = false
      ReactiveAppState.set('isOnline', false);
      expect(statusDot.className).toContain('offline');

      // Test isOnline = true
      ReactiveAppState.set('isOnline', true);
      expect(statusDot.className).toContain('online');

      // Test ui.isLoading
      ReactiveAppState.ui = { isLoading: true };
      ReactiveAppState.notify('ui.isLoading', true);
      expect(app.classList.contains('loading')).toBe(true);

      ReactiveAppState.ui = { isLoading: false };
      ReactiveAppState.notify('ui.isLoading', false);
      expect(app.classList.contains('loading')).toBe(false);

      // Test stats watch
      ReactiveAppState.set('stats', { total: 10 });
      expect(statsModule.updateStats).toHaveBeenCalled();
    } finally {
      delete Object.prototype.ui;
    }
  });
});


