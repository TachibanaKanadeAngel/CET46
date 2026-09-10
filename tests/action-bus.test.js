// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerAction, registerActions, unregisterAction, getRegisteredActions, setupGlobalEventDelegation } from '../js/utils/action-bus.js';

describe('ActionBus', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"><button data-action="test-action">Test</button></div>';
  });

  afterEach(() => {
    unregisterAction('test-action');
    unregisterAction('test-action-2');
  });

  describe('registerAction', () => {
    it('registers a single handler', () => {
      const fn = () => {};
      registerAction('test-action', fn);
      expect(getRegisteredActions()).toContain('test-action');
    });

    it('overwrites existing handler for same action', () => {
      const fn1 = () => {};
      const fn2 = () => {};
      registerAction('test-action', fn1);
      registerAction('test-action', fn2);
      expect(getRegisteredActions().filter(a => a === 'test-action')).toHaveLength(1);
    });
  });

  describe('registerActions', () => {
    it('registers multiple handlers', () => {
      registerActions({
        'test-action': () => {},
        'test-action-2': () => {},
      });
      expect(getRegisteredActions()).toContain('test-action');
      expect(getRegisteredActions()).toContain('test-action-2');
    });
  });

  describe('unregisterAction', () => {
    it('removes a registered handler', () => {
      registerAction('test-action', () => {});
      expect(getRegisteredActions()).toContain('test-action');
      unregisterAction('test-action');
      expect(getRegisteredActions()).not.toContain('test-action');
    });
  });

  describe('setupGlobalEventDelegation', () => {
    it('calls handler when element with data-action is clicked', () => {
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      document.querySelector('[data-action="test-action"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('passes the click event to the handler', () => {
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      const btn = document.querySelector('[data-action="test-action"]');
      btn.click();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('does not error for unregistered actions', () => {
      const btn = document.querySelector('[data-action="test-action"]');
      setupGlobalEventDelegation();
      expect(() => btn.click()).not.toThrow();
    });

    it('ignores clicks on elements without data-action', () => {
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      document.getElementById('app').click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('handles keyboard Enter on [role="button"] elements', () => {
      document.body.innerHTML = '<div id="kbd-test" data-action="test-action" role="button" tabindex="0">Btn</div>';
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      const el = document.getElementById('kbd-test');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(handler).toHaveBeenCalled();
    });

    it('handles keyboard Space on [role="button"] elements', () => {
      document.body.innerHTML = '<div id="kbd-space" data-action="test-action" role="button" tabindex="0">Btn</div>';
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      const el = document.getElementById('kbd-space');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(handler).toHaveBeenCalled();
    });

    it('does not trigger on non-button elements for keyboard events', () => {
      document.body.innerHTML = '<input id="kbd-input" data-action="test-action" />';
      const handler = vi.fn();
      registerAction('test-action', handler);
      setupGlobalEventDelegation();

      const el = document.getElementById('kbd-input');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
