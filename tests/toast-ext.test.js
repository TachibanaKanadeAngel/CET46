// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UI } from '../js/ui/toast.js';
import '../js/ui/toast-ext.js';

describe('UI Toast, Modals, Status Panel, and Shortcut Guide test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('UI.toast creates toast elements, sets ARIA roles, and removes after timeout', () => {
    UI.toast('Info message', 'info');
    let toast = document.querySelector('.toast.info');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('Info message');
    expect(toast?.getAttribute('role')).toBe('status');

    UI.toast('Error alert', 'error');
    let errorToast = document.querySelector('.toast.error');
    expect(errorToast?.getAttribute('role')).toBe('alert');
    expect(errorToast?.getAttribute('aria-live')).toBe('assertive');

    vi.advanceTimersByTime(3350);
    expect(document.querySelector('.toast.info')).toBeNull();
    expect(document.querySelector('.toast.error')).toBeNull();
  });

  it('UI.confirm resolves true on confirm button and false on cancel / Escape / overlay', async () => {
    // Confirm Yes
    const promiseYes = UI.confirm('删除', '确定要删除吗？');
    const confirmBtn = document.getElementById('confirm-yes');
    confirmBtn?.click();
    expect(await promiseYes).toBe(true);
    vi.advanceTimersByTime(350);

    // Confirm No
    const promiseNo = UI.confirm('取消测试', '测试取消');
    const buttons = document.querySelectorAll('.modal-content button');
    const cancelBtn = buttons[buttons.length - 1];
    cancelBtn?.click();
    expect(await promiseNo).toBe(false);
    vi.advanceTimersByTime(350);

    // Escape key
    const promiseEscape = UI.confirm('ESC测试', '测试ESC');
    const overlay = document.querySelector('.modal-overlay');
    overlay?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await promiseEscape).toBe(false);
    vi.advanceTimersByTime(350);
  });

  it('UI.prompt handles user text input and keyboard enter', async () => {
    const promisePrompt = UI.prompt('输入主密码', '请输入密码', 'master password');
    const input = document.getElementById('secure-prompt-input');
    expect(input).not.toBeNull();

    input.value = 'my-secret-pass';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(await promisePrompt).toBe('my-secret-pass');
  });

  it('UI.safeExecute manages loading overlay and catches exceptions', async () => {
    document.body.innerHTML = `
      <div id="loading-overlay" style="display: none;">
        <span id="loading-text"></span>
      </div>
    `;

    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');

    let ran = false;
    await UI.safeExecute(async () => {
      expect(overlay.style.display).toBe('flex');
      expect(textEl.textContent).toBe('同步中...');
      ran = true;
    }, '同步中...');

    expect(ran).toBe(true);
    expect(overlay.style.display).toBe('none');

    // Test error branch
    await UI.safeExecute(async () => {
      throw new Error('Async error');
    });
    expect(overlay.style.display).toBe('none');
    expect(document.querySelector('.toast.error')).not.toBeNull();
  });

  it('UI.showShortcutGuide renders shortcuts and handles close / dismiss buttons', () => {
    UI.showShortcutGuide();
    const overlay = document.getElementById('shortcut-guide-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('快捷键指南');

    // Click "不再提示"
    const dismissBtn = overlay.querySelector('.shortcut-guide-dismiss-btn');
    dismissBtn.click();

    expect(localStorage.getItem('cet46_shortcut_guide_shown')).toBe('true');
    vi.advanceTimersByTime(350);
    expect(document.getElementById('shortcut-guide-overlay')).toBeNull();
  });

  it('UI.showStatusPanel renders list of status items and note', () => {
    UI.showStatusPanel(
      '系统状态',
      [
        { label: 'CPU', value: '15%' },
        { label: '内存', value: '120MB' },
      ],
      { note: '一切运行正常', closeText: '知道了' }
    );

    const overlay = document.querySelector('.modal-overlay.active');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('系统状态');
    expect(overlay.textContent).toContain('CPU');
    expect(overlay.textContent).toContain('15%');
    expect(overlay.textContent).toContain('一切运行正常');

    const closeBtn = overlay.querySelector('.toolbar-status-close-btn');
    closeBtn.click();
    vi.advanceTimersByTime(350);
    expect(document.querySelector('.modal-overlay')).toBeNull();
  });
});
