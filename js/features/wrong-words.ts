import { getWrongWords } from '../store.js';
import { findWordById } from '../data/vocab-store.js';
import { getDisplayMeaning, shuffle } from '../utils.js';
import { setHtml, escapeHtml } from '../utils/dom.js';

interface WrongData {
  count: number;
  lastWrong?: string;
}

interface WordEntry {
  id: string | number;
  word: string;
  phonetic?: string;
  level?: string;
  meaning?: string;
  [key: string]: unknown;
}

interface WrongWordItem extends WordEntry {
  wrongData: WrongData;
}

interface LengthDistribution {
  short: number;
  medium: number;
  long: number;
}

interface StudyFeatureLike {
  startStudy?: (
    mode: string,
    from?: number,
    to?: number | null,
    list?: unknown,
    opts?: unknown,
    extra?: { overrideQueue?: unknown[] }
  ) => void;
}

let StudyFeature: StudyFeatureLike | null = null;

function registerStudyFeature(feature: StudyFeatureLike): void {
  StudyFeature = feature;
}

function getWrongWordsList(): WrongWordItem[] {
  const wrongWords = getWrongWords();
  const list: WrongWordItem[] = [];
  const entries: Array<[string, WrongData]> =
    wrongWords && typeof wrongWords.entries === 'function'
      ? (wrongWords.entries() as Array<[string, WrongData]>)
      : (Object.entries(wrongWords || {}) as Array<[string, WrongData]>);

  for (const [id, wrongData] of entries) {
    const w = findWordById(parseInt(id, 10));
    if (w) {
      list.push({ ...w, meaning: getDisplayMeaning(w) || getDisplayMeaning(wrongData), wrongData });
    }
  }
  return list.sort((a, b) => b.wrongData.count - a.wrongData.count);
}

function renderWrongList(): void {
  const wrongWords = getWrongWordsList();
  const container = document.getElementById('wrong-list');
  if (!container) return;

  let totalErrors = 0;
  wrongWords.forEach(w => (totalErrors += w.wrongData.count));

  const wrongCountEl = document.getElementById('wrong-count');
  const wrongTotalErrorsEl = document.getElementById('wrong-total-errors');
  if (wrongCountEl) wrongCountEl.textContent = String(wrongWords.length);
  if (wrongTotalErrorsEl) wrongTotalErrorsEl.textContent = String(totalErrors);

  renderErrorAnalysis(wrongWords);

  if (wrongWords.length === 0) {
    setHtml(container, '<div class="empty-state"><p>当前没有错题</p></div>');
    return;
  }

  container.replaceChildren();
  wrongWords.forEach(w => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.dataset.action = 'show-detail';
    div.dataset.id = String(w.id);
    div.style.cursor = 'pointer';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'list-item-left';
    const wordDiv = document.createElement('div');
    wordDiv.className = 'list-item-word';
    wordDiv.textContent = String(w.word);
    const small = document.createElement('small');
    small.textContent = String(w.level || '');
    wordDiv.appendChild(small);
    const pronDiv = document.createElement('div');
    pronDiv.className = 'list-item-pron';
    pronDiv.textContent = String(w.phonetic || '');
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'list-item-meaning';
    meaningDiv.textContent = getDisplayMeaning(w) || '';
    leftDiv.appendChild(wordDiv);
    leftDiv.appendChild(pronDiv);
    leftDiv.appendChild(meaningDiv);
    const badge = document.createElement('span');
    badge.className = 'badge badge-danger';
    badge.textContent = `${w.wrongData.count} 次`;
    div.appendChild(leftDiv);
    div.appendChild(badge);
    container.appendChild(div);
  });
}

const COMMON_SUFFIXES: readonly string[] = [
  'tion',
  'sion',
  'ment',
  'ness',
  'ity',
  'able',
  'ible',
  'ous',
  'ive',
  'al',
  'er',
  'or',
  'ly',
  'ed',
  'ing',
  'ate',
  'fy',
  'ize',
];

function renderErrorAnalysis(wrongWords: WrongWordItem[]): void {
  const container = document.getElementById('error-analysis-content');
  if (!container || wrongWords.length === 0) {
    if (container) setHtml(container, '<div style="color: var(--success);">暂无错误数据</div>');
    return;
  }

  const suffixCount: Record<string, number> = {};
  const lengthDistribution: LengthDistribution = { short: 0, medium: 0, long: 0 };
  const timeDistribution: Record<string, number> = {};
  let totalErrorCount = 0;

  wrongWords.forEach(w => {
    const word = String(w.word);
    totalErrorCount += w.wrongData.count;
    COMMON_SUFFIXES.forEach(suffix => {
      if (word.endsWith(suffix)) suffixCount[suffix] = (suffixCount[suffix] || 0) + w.wrongData.count;
    });
    if (word.length <= 5) lengthDistribution.short++;
    else if (word.length <= 8) lengthDistribution.medium++;
    else lengthDistribution.long++;
    if (w.wrongData.lastWrong) {
      const d = new Date(w.wrongData.lastWrong);
      if (!isNaN(d.getTime())) {
        const hour = d.getHours();
        const timeSlot = Math.floor(hour / 4) * 4;
        const slotLabel = `${timeSlot}:00-${timeSlot + 4}:00`;
        timeDistribution[slotLabel] = (timeDistribution[slotLabel] || 0) + w.wrongData.count;
      }
    }
  });

  const fragment = document.createDocumentFragment();
  const topSuffix = Object.entries(suffixCount).sort((a, b) => b[1] - a[1])[0];
  if (topSuffix && topSuffix[1] >= 2) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    setHtml(
      div,
      `后缀提示：<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">-${escapeHtml(String(topSuffix[0]))}</code> 出现较多（${topSuffix[1]} 次），建议集中记忆这一类词形。`
    );
    fragment.appendChild(div);
  }

  const maxLenType = Object.entries(lengthDistribution).sort((a, b) => b[1] - a[1])[0];
  const lenLabels: Record<string, string> = {
    short: '短词（1-5 字母）',
    medium: '中等词（6-8 字母）',
    long: '长词（9 字母以上）',
  };
  if (maxLenType && maxLenType[1] >= 3) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    let text = `长度分布：错误更集中在 <strong>${lenLabels[maxLenType[0]]}</strong>（${maxLenType[1]} 词）。`;
    if (maxLenType[0] === 'long') text += ' 可以把长词拆分成词根词缀来记忆。';
    else if (maxLenType[0] === 'short') text += ' 注意区分近形词与常见短词混淆。';
    else text += ' 适合按主题批量复习。';
    setHtml(div, text);
    fragment.appendChild(div);
  }

  const topTimeSlot = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1])[0];
  if (topTimeSlot) {
    const hour = parseInt(topTimeSlot[0], 10);
    let timeAdvice = '';
    if (hour >= 22 || hour < 2) timeAdvice = '深夜学习效率偏低，建议调整到白天复习';
    else if (hour >= 14 && hour < 18) timeAdvice = '下午容易疲劳，建议缩短单次学习时长';
    else if (hour >= 6 && hour < 10) timeAdvice = '早晨学习前先进入状态，效果会更好';
    else timeAdvice = '注意保持专注，避免分心';
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom: 0.5rem;';
    setHtml(
      div,
      `${escapeHtml(timeAdvice)}。错误高峰时段：<strong>${escapeHtml(String(topTimeSlot[0]))}</strong>（${topTimeSlot[1]} 次）`
    );
    fragment.appendChild(div);
  }

  const avgErrors = (totalErrorCount / wrongWords.length).toFixed(1);
  const summaryDiv = document.createElement('div');
  summaryDiv.style.cssText =
    'margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);';
  setHtml(
    summaryDiv,
    `平均每个错词错误 <strong>${avgErrors}</strong> 次，当前共分析 <strong>${wrongWords.length}</strong> 个错词。`
  );
  fragment.appendChild(summaryDiv);

  container.replaceChildren();
  container.appendChild(fragment);
}

function startWrongWordsStudy(): void {
  const wrongWords = getWrongWordsList();
  if (wrongWords.length === 0) return;

  const wrongQueue = wrongWords.map(w => findWordById(Number(w.id))).filter(Boolean);
  shuffle(wrongQueue);
  if (StudyFeature && typeof StudyFeature.startStudy === 'function') {
    // 使用 overrideQueue 选项正确传递错词队列
    StudyFeature.startStudy('all', 0, null, null, null, {
      overrideQueue: wrongQueue,
    });
  }
  const tabBtn = document.querySelector('[data-tab="study"]');
  if (tabBtn) {
    tabBtn.classList.add('active');
    tabBtn.setAttribute('aria-selected', 'true');
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-study');
  if (view) view.classList.add('active');
}

export {
  getWrongWordsList,
  renderWrongList,
  renderErrorAnalysis,
  startWrongWordsStudy,
  registerStudyFeature,
};