import { UI } from './toast.js';
import { CONFIG } from '../config.js';

(UI as any).showShortcutGuide = function showShortcutGuidePatched(): void {
  const shown = localStorage.getItem(CONFIG.STORAGE_KEYS.SHORTCUT_GUIDE_SHOWN);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'shortcut-guide-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content shortcut-guide-panel';
  content.style.cssText = 'max-width: 420px; text-align: center;';

  const title = document.createElement('h3');
  title.style.cssText = 'margin-bottom: 20px; color: var(--primary); font-size: 1.3rem;';
  title.textContent = '快捷键指南';

  const shortcuts = [
    { key: 'Space', desc: '翻转卡片' },
    { key: '←', desc: '不认识' },
    { key: '→', desc: '认识' },
    { key: 'S', desc: '拼写模式' },
    { key: 'Ctrl+Z', desc: '撤销操作' },
  ];

  const shortcutsContainer = document.createElement('div');
  shortcutsContainer.style.cssText =
    'display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;';

  shortcuts.forEach(({ key, desc }) => {
    const row = document.createElement('div');
    row.className = 'shortcut-guide-row';
    row.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;';

    const leftSide = document.createElement('div');
    leftSide.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'shortcut-guide-dot';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = '·';

    const descSpan = document.createElement('span');
    descSpan.textContent = desc;
    descSpan.style.cssText = 'color: var(--text-color);';

    leftSide.appendChild(iconSpan);
    leftSide.appendChild(descSpan);

    const keyBadge = document.createElement('kbd');
    keyBadge.className = 'shortcut-guide-kbd';
    keyBadge.textContent = key;
    keyBadge.style.cssText = 'font-family: monospace; font-size: 0.85rem;';

    row.appendChild(leftSide);
    row.appendChild(keyBadge);
    shortcutsContainer.appendChild(row);
  });

  const gestureHint = document.createElement('div');
  gestureHint.className = 'shortcut-guide-hint';
  gestureHint.style.cssText =
    'margin-top: 15px; padding: 12px; font-size: 0.85rem; color: var(--text-color);';
  const strongNode = document.createElement('strong');
  strongNode.textContent = '移动端手势';
  gestureHint.appendChild(strongNode);
  gestureHint.appendChild(document.createTextNode('：左滑 = 不认识，右滑 = 认识'));

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group shortcut-guide-actions';
  btnGroup.style.cssText = 'justify-content: center; margin-top: 15px;';

  const gotItBtn = document.createElement('button');
  gotItBtn.className = 'btn shortcut-guide-close-btn';
  gotItBtn.textContent = '关闭说明';

  const dontShowBtn = document.createElement('button');
  dontShowBtn.className = 'btn shortcut-guide-dismiss-btn';
  dontShowBtn.textContent = '不再提示';

  btnGroup.appendChild(gotItBtn);
  btnGroup.appendChild(dontShowBtn);

  content.appendChild(title);
  content.appendChild(shortcutsContainer);
  content.appendChild(gestureHint);
  content.appendChild(btnGroup);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const closeGuide = (dontShow: boolean = false) => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
    if (dontShow) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SHORTCUT_GUIDE_SHOWN, 'true');
    }
  };

  gotItBtn.addEventListener('click', () => closeGuide(false));
  dontShowBtn.addEventListener('click', () => closeGuide(true));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGuide(false);
  });

  if (!shown) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SHORTCUT_GUIDE_SHOWN, 'true');
  }
};

(UI as any).showStatusPanel = function showStatusPanelPatched(title: string, rows: Array<{ label: string; value: string }> = [], options: any = {}): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';

  const content = document.createElement('div');
  content.className = 'modal-content toolbar-status-panel';
  content.style.cssText = 'max-width: 360px; text-align: left;';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const list = document.createElement('div');
  list.className = 'toolbar-status-list';

  rows.forEach(({ label, value }) => {
    const row = document.createElement('div');
    row.className = 'toolbar-status-row';

    const labelNode = document.createElement('span');
    labelNode.className = 'toolbar-status-label';
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.className = 'toolbar-status-value';
    valueNode.textContent = value;

    row.appendChild(labelNode);
    row.appendChild(valueNode);
    list.appendChild(row);
  });

  content.appendChild(heading);
  content.appendChild(list);

  if (options.note) {
    const note = document.createElement('p');
    note.className = 'toolbar-status-note';
    note.textContent = options.note;
    content.appendChild(note);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn toolbar-status-close-btn';
  closeBtn.textContent = options.closeText || '关闭说明';
  content.appendChild(closeBtn);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const closePanel = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePanel();
  });
};
