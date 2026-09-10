import { CONFIG } from '../config.js';

export function renderAlgorithmTransparency(wordId: any, getWordData: (id: any) => any, FSRS_W: number[]): any | null {
  const wd = getWordData(wordId);
  if (!wd) return null;

  const stability = wd.stability || FSRS_W[0];
  const difficulty = wd.difficulty || FSRS_W[4];

  let retrievability = 1;
  if (wd.lastStudy && wd.status === 'review') {
    const daysSinceReview = (Date.now() - wd.lastStudy) / (CONFIG.CONSTANTS?.MS_PER_DAY || 86400000);
    retrievability = Math.pow(1 + daysSinceReview / (9 * Math.max(stability, 0.01)), -1);
  }

  const rPercent = Math.round(retrievability * 100);
  const sDays = Math.round(stability);
  const dScore = difficulty.toFixed(1);

  return {
    R: rPercent,
    S: sDays,
    D: dScore,
    explanation: `记忆留存率 ${rPercent}% | 稳定性 ${sDays}天 | 难度 ${dScore}`,
  };
}

export function createAlgorithmHeatmap(words: any[], getWordData: (id: any) => any, FSRS_W: number[]): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'algorithm-heatmap';
  container.style.cssText =
    'display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; margin-top: 1rem;';

  const sample = words.slice(0, 50);

  sample.forEach(w => {
    const wd = getWordData(w.id);
    const cell = document.createElement('div');
    cell.style.cssText =
      'width: 24px; height: 24px; border-radius: 4px; cursor: pointer; position: relative;';

    if (!wd || wd.status === 'new') {
      cell.style.background = 'var(--border-color)';
      cell.title = `${w.word}: 新词`;
    } else {
      const stability = wd.stability || FSRS_W[0];
      const difficulty = wd.difficulty || FSRS_W[4];

      let retrievability = 1;
      if (wd.lastStudy) {
        const daysSinceReview = (Date.now() - wd.lastStudy) / (CONFIG.CONSTANTS?.MS_PER_DAY || 86400000);
        retrievability = Math.pow(1 + daysSinceReview / (9 * Math.max(stability, 0.01)), -1);
      }

      const rPercent = Math.round(retrievability * 100);

      if (rPercent >= 90) {
        cell.style.background = 'var(--success)';
      } else if (rPercent >= 70) {
        cell.style.background = '#9ae6b4';
      } else if (rPercent >= 50) {
        cell.style.background = 'var(--warning)';
      } else {
        cell.style.background = 'var(--danger)';
      }

      cell.title = `${w.word}: R=${rPercent}% S=${Math.round(stability)}天 D=${difficulty.toFixed(1)}`;
    }

    container.appendChild(cell);
  });

  return container;
}

export function renderEFDisplay(
  prefix: string,
  wd: any,
  MIN_EF: number,
  MAX_EF: number,
  FSRS_W: number[],
  MS_PER_DAY: number = (CONFIG.CONSTANTS?.MS_PER_DAY || 86400000)
): void {
  const idPrefix = prefix ? `${prefix}-` : '';
  const efDisplay = document.getElementById(`${idPrefix}ef-display`);
  const efValue = document.getElementById(`${idPrefix}ef-value`);
  const efFill = document.getElementById(`${idPrefix}ef-fill`) as HTMLElement | null;

  if (!efDisplay || !wd) return;

  efDisplay.style.display = 'block';
  if (efValue) efValue.textContent = (wd.ef ?? 2.5).toFixed(2);
  if (efFill) efFill.style.width = `${(((wd.ef ?? 2.5) - MIN_EF) / (MAX_EF - MIN_EF)) * 100}%`;

  const stability = wd.stability || FSRS_W[0];
  const difficulty = wd.difficulty || FSRS_W[4];

  const stabilityEl = document.getElementById(`${idPrefix}stability-value`);
  const difficultyEl = document.getElementById(`${idPrefix}difficulty-value`);
  if (stabilityEl) stabilityEl.textContent = stability.toFixed(1);
  if (difficultyEl) difficultyEl.textContent = difficulty.toFixed(1);

  const retentionValue = document.getElementById(`${idPrefix}retention-value`);
  if (!retentionValue) return;

  if (wd.lastStudy && wd.status === 'review') {
    const days = (Date.now() - wd.lastStudy) / MS_PER_DAY;
    const r = Math.pow(1 + days / (9 * Math.max(stability, 0.01)), -1);
    retentionValue.textContent = `${Math.round(r * 100)}%`;
  } else {
    retentionValue.textContent = wd.status === 'new' ? '新词' : '--';
  }
}
