// 国际化（i18n）
// 轻量翻译模块：语言包 + t() 插值 + DOM 批量应用（[data-i18n] 元素）。
// 核心翻译逻辑为纯函数，便于单元测试；DOM 操作已做环境守卫。

const DEFAULT_LOCALE = 'zh-CN';

type LocaleKey = string;
type LocaleDict = Record<LocaleKey, string>;

// 语言包。
export const LOCALES: Record<string, LocaleDict> = {
  'zh-CN': {
    'nav.lib': '📚 词库',
    'nav.study': '🎯 学习',
    'nav.review': '🔄 复习',
    'nav.spell': '✍️ 拼写',
    'nav.wrong': '❌ 错词',
    'nav.stats': '📈 统计',
    'nav.settings': '⚙️ 设置',
    'stat.total': '总学习词数',
    'stat.ef': '平均EF',
    'stat.days': '学习天数',
    'stat.est': '🎯 预估达成日期',
    'section.heatmap': '📅 学习热力图',
    'section.upcoming': '📈 未来7天复习工作量预测',
    'section.retention': '🧠 预计记忆保持率（遗忘曲线）',
    'settings.language': '语言',
  },
  en: {
    'nav.lib': '📚 Words',
    'nav.study': '🎯 Study',
    'nav.review': '🔄 Review',
    'nav.spell': '✍️ Spelling',
    'nav.wrong': '❌ Wrong',
    'nav.stats': '📈 Stats',
    'nav.settings': '⚙️ Settings',
    'stat.total': 'Words learned',
    'stat.ef': 'Avg EF',
    'stat.days': 'Study days',
    'stat.est': '🎯 Est. finish',
    'section.heatmap': '📅 Study heatmap',
    'section.upcoming': '📈 Next 7d review load',
    'section.retention': '🧠 Predicted retention',
    'settings.language': 'Language',
  },
};

let currentLocale: string = DEFAULT_LOCALE;

/** 语言翻译（纯函数）。 */
export function translate(locale: string, key: string, params?: Record<string, string | number>): string {
  const dict = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];
  let text = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}

/** 使用当前语言翻译。 */
export function t(key: string, params?: Record<string, string | number>): string {
  return translate(currentLocale, key, params);
}

export function getLocale(): string {
  return currentLocale;
}

export function listLocales(): string[] {
  return Object.keys(LOCALES);
}

/** 从 localStorage 读取用户语言（无环境时回退默认）。 */
export function loadSavedLocale(): string {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('cet46_locale') : null;
    return saved && LOCALES[saved] ? saved : DEFAULT_LOCALE;
  } catch (_error) {
    return DEFAULT_LOCALE;
  }
}

/** 切换语言并持久化。 */
export function setLocale(locale: string): string {
  currentLocale = LOCALES[locale] ? locale : DEFAULT_LOCALE;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cet46_locale', currentLocale);
    }
  } catch (_error) {
    // 忽略存储失败
  }
  return currentLocale;
}

function onReady(cb: () => void): void {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  } else {
    cb();
  }
}

/** 初始化：读取语言、应用 [data-i18n] 文本、填充语言下拉。 */
export function initI18n(): void {
  currentLocale = loadSavedLocale();
  onReady(() => {
    applyTranslations();
    attachLocaleSelect('#locale-select');
  });
}

/** 将当前语言应用到所有 [data-i18n] 元素与 [data-i18n-placeholder]。 */
export function applyTranslations(): void {
  if (typeof document === 'undefined') return;
  setLocale(currentLocale);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    (el as HTMLElement).textContent = t(el.getAttribute('data-i18n') as string);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    (el as HTMLInputElement).placeholder = t(el.getAttribute('data-i18n-placeholder') as string);
  });
}

/** 为语言下拉绑定切换（select 的 value 与 LOCALES 键一一对应）。 */
export function attachLocaleSelect(selector: string): void {
  if (typeof document === 'undefined') return;
  const select = document.querySelector<HTMLSelectElement>(selector);
  if (!select) return;
  for (const key of listLocales()) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    select.appendChild(option);
  }
  select.value = currentLocale;
  select.addEventListener('change', () => {
    setLocale(select.value);
    applyTranslations();
  });
}

export default {
  LOCALES,
  translate,
  t,
  getLocale,
  listLocales,
  setLocale,
  loadSavedLocale,
  initI18n,
  applyTranslations,
  attachLocaleSelect,
};