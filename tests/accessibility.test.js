// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { announceForAccessibility, trapFocus } from '../js/ui/accessibility.js';

describe('accessibility.js test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="a11y-announcer"></div>
      <button id="trigger-btn">Trigger</button>
      <div id="test-modal">
        <button id="btn1">Button 1</button>
        <input id="inp1" />
        <button id="btn2">Button 2</button>
      </div>
    `;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('announceForAccessibility clears and sets announcer text after delay', () => {
    announceForAccessibility('单词掌握成功');
    const announcer = document.getElementById('a11y-announcer');
    expect(announcer.textContent).toBe('');

    vi.advanceTimersByTime(60);
    expect(announcer.textContent).toBe('单词掌握成功');
  });

  it('trapFocus cycles focus forwards and backwards and restores focus on cleanup', () => {
    const trigger = document.getElementById('trigger-btn');
    trigger.focus();

    const modal = document.getElementById('test-modal');
    const cleanup = trapFocus(modal);

    const btn1 = document.getElementById('btn1');
    const btn2 = document.getElementById('btn2');

    expect(document.activeElement).toBe(btn1);

    // Tab at last element loops to first
    btn2.focus();
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab at first element loops to last
    btn1.focus();
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(btn2);

    // Cleanup restores focus
    cleanup();
    expect(document.activeElement).toBe(trigger);
  });

  it('trapFocus returns null when modal has no visible focusable elements', () => {
    const emptyModal = document.createElement('div');
    expect(trapFocus(emptyModal)).toBeNull();
    expect(trapFocus(null)).toBeNull();
  });
});
