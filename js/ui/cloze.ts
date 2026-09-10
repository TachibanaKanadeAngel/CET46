import { escapeHTML, escapeRegExp } from '../utils.js';

export function generateCloze(word: string, example: string): string {
  if (!example || !word) return example || '';
  if (example.length < 3)
    return '<div class="cloze-fallback" style="color: var(--gray); font-style: italic;">该单词暂无语境例句，请直接记忆释义。</div>';
  const escapedExample = escapeHTML(example);
  const escapedWord = escapeHTML(word);
  const safeRegexWord = escapeRegExp(escapedWord);
  const regex = new RegExp(`\\b${safeRegexWord}(s|es|ed|ing|er|est)?\\b`, 'gi');
  return escapedExample.replace(
    regex,
    '<span class="cloze-gap" data-answer="$&" tabindex="0" role="button" aria-label="点击显示答案" style="background: rgba(102,126,234,0.3); padding: 2px 8px; border-radius: 4px; cursor: pointer; border-bottom: 2px dashed var(--primary);">____</span>'
  );
}

export function initClozeMode(): void {
  if (typeof document === 'undefined') return;
  const toggleGap = (el: HTMLElement) => {
    const answer = el.dataset.answer || '';
    if (el.textContent === '____') {
      el.textContent = answer;
      el.style.background = 'rgba(72,187,120,0.3)';
      el.style.borderBottom = 'none';
    } else {
      el.textContent = '____';
      el.style.background = 'rgba(102,126,234,0.3)';
      el.style.borderBottom = '2px dashed var(--primary)';
    }
  };
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.classList.contains('cloze-gap')) {
      toggleGap(target);
    }
  });
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.classList.contains('cloze-gap') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleGap(target);
    }
  });
}

initClozeMode();
