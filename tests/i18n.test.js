// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  translate,
  t,
  setLocale,
  getLocale,
  listLocales,
  loadSavedLocale,
  applyTranslations,
  attachLocaleSelect,
  initI18n,
} from '../js/utils/i18n.ts';

describe('translate', () => {
  it('translates a known key per locale', () => {
    expect(translate('en', 'section.retention')).toBe('🧠 Predicted retention');
    expect(translate('zh-CN', 'stat.total')).toBe('总学习词数');
    expect(translate('en', 'stat.total')).toBe('Words learned');
  });
  it('falls back to key when missing', () => {
    expect(translate('zh-CN', 'missing.key')).toBe('missing.key');
    expect(translate('nonexistent', 'nav.stats')).toBe('📈 统计');
  });
  it('interpolates params', () => {
    expect(translate('zh-CN', 'stat.est')).toBe('🎯 预估达成日期');
  });
});

describe('locale state', () => {
  it('setLocale switches current language and returns it', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('stat.total')).toBe('Words learned');
    setLocale('zh-CN');
    expect(t('stat.total')).toBe('总学习词数');
  });
  it('setLocale ignores unknown locales', () => {
    setLocale('fr-FR');
    expect(getLocale()).toBe('zh-CN');
  });
  it('listLocales exposes both dictionaries', () => {
    const locales = listLocales();
    expect(locales).toContain('zh-CN');
    expect(locales).toContain('en');
  });
  it('loadSavedLocale defaults to zh-CN without storage', () => {
    expect(loadSavedLocale()).toBe('zh-CN');
  });

  it('applyTranslations updates DOM text and placeholder attributes', () => {
    document.body.innerHTML = `
      <span data-i18n="stat.total"></span>
      <input data-i18n-placeholder="nav.stats" />
      <select id="locale-select"></select>
    `;

    setLocale('en');
    applyTranslations();

    const span = document.querySelector('[data-i18n]');
    const input = document.querySelector('[data-i18n-placeholder]');
    expect(span.textContent).toBe('Words learned');
    expect(input.placeholder).toBe('📈 Stats');

    attachLocaleSelect('#locale-select');
    const select = document.getElementById('locale-select');
    expect(select.children.length).toBeGreaterThanOrEqual(2);

    select.value = 'zh-CN';
    select.dispatchEvent(new Event('change'));
    expect(span.textContent).toBe('总学习词数');

    initI18n();
  });
});