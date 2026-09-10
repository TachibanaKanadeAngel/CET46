import { CONFIG } from '../config.js';

const THEME_KEY: string = CONFIG.STORAGE_KEYS.THEME;

function getSystemPrefersDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean): void {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const toggleEl = document.querySelector('.theme-toggle');
  if (toggleEl) {
    toggleEl.textContent = isDark ? '☀️' : '🌙';
    toggleEl.setAttribute('aria-label', isDark ? '切换到浅色主题' : '切换到深色主题');
  }
}

function toggleTheme(): void {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const nextIsDark = !isDark;
  try {
    localStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
  } catch (_e) {
    // 隐私模式下 localStorage 可能不可用，仅应用主题不持久化
  }
  applyTheme(nextIsDark);
}

function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved ? saved === 'dark' : getSystemPrefersDark();
  applyTheme(isDark);

  // R-P2: 监听系统主题变化，仅在用户未显式设置偏好时跟随系统
  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const userPref = localStorage.getItem(THEME_KEY);
      if (!userPref) {
        applyTheme(e.matches);
      }
    };
    // addEventListener 在现代浏览器可用，旧 Safari 需 addListener
    const addListener = (mql as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener;
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else if (typeof addListener === 'function') {
      addListener(handler);
    }
  }
}

export { THEME_KEY, toggleTheme, initTheme };