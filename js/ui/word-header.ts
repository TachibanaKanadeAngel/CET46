import logger from '../utils/logger.js';

export function setSafeWordHeader(elementId: string, word?: string, level?: string): void {
  const el = document.getElementById(elementId);
  if (!el) {
    logger.warn('[setSafeWordHeader] 元素不存在:', elementId);
    return;
  }

  el.textContent = word || '加载中...';
  el.setAttribute('role', 'heading');
  el.setAttribute('aria-level', '2');
  el.setAttribute('aria-label', `单词: ${word || '加载中'}`);

  if (level !== undefined && level !== null) {
    const small = document.createElement('small');
    small.textContent = level;
    small.setAttribute('aria-label', `级别: ${level}`);
    el.appendChild(small);
  }

  logger.info('[setSafeWordHeader] 设置单词:', word, '级别:', level, '元素:', elementId);
}

export default setSafeWordHeader;
