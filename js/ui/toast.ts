import logger from '../utils/logger.js';
import { trapFocus } from './accessibility.js';

export interface ModalButton {
  text: string;
  className?: string;
  value: any;
  id?: string;
}

export interface ModalOptions {
  title: string;
  message: string;
  renderBody?: (cleanup: (value: any) => void) => HTMLElement;
  buttons: ModalButton[];
  escapeValue: any;
  overlayValue: any;
}

/**
 * 通用模态对话框工厂
 * 统一处理 confirm/prompt 等对话框的 DOM 创建、事件处理和焦点管理
 */
function createModal({ title, message, renderBody, buttons, escapeValue, overlayValue }: ModalOptions): Promise<any> {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = 'max-width: 400px; text-align: center;';

    const h3 = document.createElement('h3');
    h3.id = 'modal-dialog-title';
    h3.style.cssText = 'margin-bottom: 15px; color: var(--dark);';
    h3.textContent = title;
    overlay.setAttribute('aria-labelledby', 'modal-dialog-title');

    const p = document.createElement('p');
    p.style.cssText = 'margin-bottom: 20px; color: var(--gray);';
    p.textContent = message;

    content.appendChild(h3);
    content.appendChild(p);

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup(escapeValue);
      }
    };

    const releaseFocus = trapFocus(overlay) || (() => {});

    const cleanup = (value: any) => {
      releaseFocus();
      overlay.removeEventListener('keydown', escapeHandler);
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      resolve(value);
    };

    if (renderBody) {
      content.appendChild(renderBody(cleanup));
    }

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';
    btnGroup.style.cssText = 'justify-content: center;';

    buttons.forEach(btnConfig => {
      const btn = document.createElement('button');
      btn.className = btnConfig.className || 'btn';
      btn.textContent = btnConfig.text;
      if (btnConfig.id) {
        btn.id = btnConfig.id;
      }
      btn.addEventListener('click', () => cleanup(btnConfig.value));
      btnGroup.appendChild(btn);
    });

    content.appendChild(btnGroup);
    overlay.appendChild(content);
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(overlay);
    }

    overlay.addEventListener('keydown', escapeHandler);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        cleanup(overlayValue);
      }
    });
  });
}

export const UI = {
  toast(msg: string, type: string = 'info'): void {
    const container = document.getElementById('toast-container') || this._createToastContainer();
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  },

  _createToastContainer(): HTMLElement {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'toast-container';
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(div);
    }
    return div;
  },

  async confirm(title: string, message: string): Promise<boolean> {
    return createModal({
      title,
      message,
      buttons: [
        { id: 'confirm-yes', text: '确定', className: 'btn btn-primary', value: true },
        { id: 'confirm-no', text: '取消', value: false },
      ],
      escapeValue: false,
      overlayValue: false,
    });
  },

  async prompt(title: string, message: string, placeholder: string = ''): Promise<string | null> {
    let input: HTMLInputElement | null = null;

    const result = await createModal({
      title,
      message,
      renderBody: (cleanup) => {
        input = document.createElement('input');
        input.type = 'text';
        input.id = 'secure-prompt-input';
        input.placeholder = placeholder;
        input.autocomplete = 'current-password';
        input.style.cssText = `
          width: 100%;
          padding: 12px 15px;
          margin-bottom: 20px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
        `;
        input.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            cleanup(input ? input.value.trim() || null : null);
          }
        });
        return input;
      },
      buttons: [
        { text: '确定', className: 'btn btn-primary', value: true },
        { text: '取消', value: false },
      ],
      escapeValue: null,
      overlayValue: null,
    });

    if (result && input) {
      return (input as HTMLInputElement).value.trim() || null;
    }
    return null;
  },

  async safeExecute(promiseFn: () => Promise<any>, loadingMessage: string = '处理中...'): Promise<void> {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');

    if (overlay) {
      if (textEl) textEl.textContent = loadingMessage;
      overlay.style.display = 'flex';
    }

    try {
      await promiseFn();
    } catch (error: any) {
      logger.error('SafeExecute Error:', error);
      this.toast(`操作失败: ${error?.message || '未知错误'}`, 'error');
    } finally {
      if (overlay) overlay.style.display = 'none';
    }
  },
};

export default UI;
