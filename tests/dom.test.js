// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  byId,
  qs,
  qsa,
  setText,
  escapeHtml,
  setHtml,
  setDisplay,
  setInputAttrs,
  createFocusTrap,
} from '../js/utils/dom.ts';

describe('dom.ts DOM Utilities & Sanitization test suite', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <span class="item" id="item-1">Item 1</span>
        <span class="item" id="item-2">Item 2</span>
        <input id="test-input" />
      </div>
    `;
  });

  it('byId, qs, and qsa query DOM elements', () => {
    expect(byId('container')).toBe(document.getElementById('container'));
    expect(byId('missing')).toBeNull();
    expect(qs('.item')).toBe(document.getElementById('item-1'));
    expect(qsa('.item').length).toBe(2);
  });

  it('setText, setDisplay, and setInputAttrs update element attributes', () => {
    setText('#item-1', 'Updated Item');
    expect(byId('item-1')?.textContent).toBe('Updated Item');

    setDisplay('#item-1', 'none');
    expect(byId('item-1')?.style.display).toBe('none');

    setInputAttrs('#test-input', {
      placeholder: 'Enter word',
      ariaLabel: 'Word input',
      title: 'Word',
      value: 'hello',
    });
    const input = byId('test-input');
    expect(input.placeholder).toBe('Enter word');
    expect(input.getAttribute('aria-label')).toBe('Word input');
    expect(input.title).toBe('Word');
    expect(input.value).toBe('hello');
  });

  it('escapeHtml sanitizes special HTML characters', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml('<script>alert("xss")</script> & \'test\'')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;'
    );
  });

  it('setHtml filters dangerous script tags, event handlers, and javascript: URLs', () => {
    const target = byId('item-1');

    // Script tags and on* attributes removed
    setHtml(
      target,
      '<p onclick="alert(1)">Safe Text <script>alert("hack")</script><img src="x" onerror="alert(2)"></p>'
    );
    expect(target.innerHTML).not.toContain('<script');
    expect(target.innerHTML).not.toContain('onclick');
    expect(target.innerHTML).not.toContain('onerror');
    expect(target.textContent).toContain('Safe Text');

    // javascript: and vbscript: protocols removed
    setHtml(target, '<a href="javascript:alert(1)">Dangerous Link</a>');
    expect(target.innerHTML).not.toContain('href');

    // Safe data-* and safe image data URLs preserved
    setHtml(
      target,
      '<div data-id="123" class="valid"><img src="data:image/png;base64,iVBORw0KGgo=" alt="test" /></div>'
    );
    expect(target.innerHTML).toContain('data-id="123"');
    expect(target.innerHTML).toContain('data:image/png;base64');
  });

  it('createFocusTrap traps keyboard Tab focus inside container and cleans up', () => {
    const trapContainer = document.createElement('div');
    trapContainer.innerHTML = `
      <button id="btn1">Btn 1</button>
      <input id="input1" />
      <button id="btn2">Btn 2</button>
    `;
    document.body.appendChild(trapContainer);

    const btn1 = trapContainer.querySelector('#btn1');
    const btn2 = trapContainer.querySelector('#btn2');

    const cleanup = createFocusTrap(trapContainer);

    // Initial focus moved to first element
    expect(document.activeElement).toBe(btn1);

    // Tab at last element loops to first
    btn2.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    trapContainer.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab at first element loops to last
    btn1.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    trapContainer.dispatchEvent(shiftTabEvent);
    expect(document.activeElement).toBe(btn2);

    cleanup();
  });
});
