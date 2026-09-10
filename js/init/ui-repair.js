import { INITIAL_STUDY_EMPTY_STATE } from '../features/study.js';
import { setText, setHtml } from '../utils/dom.ts';
import { isFileProtocol } from '../utils/worker-pool.js';

const INITIAL_SUBTITLE_TEXT = 'FSRS 4.5 算法 · 本地记忆同步';
const CORRUPTED_PLACEHOLDER_PATTERN = /(?:\?{2,}|锟斤拷|�)/;
const CORRUPTED_GARBLED_PATTERN =
  /(?:瀹|鐨|鍜|搴|淇|绛|瑙|濂|範|淓|闂|銆|榛|蹇|鎴|鍚|涓|浠|妯|鍓|暱)/;

function hasCorruptedPlaceholderText(value) {
  return (
    !value ||
    CORRUPTED_PLACEHOLDER_PATTERN.test(value.trim()) ||
    CORRUPTED_GARBLED_PATTERN.test(value.trim())
  );
}

function repairInitialPlaceholderText() {
  const subtitleEl = document.querySelector('.engine-header .subtitle');
  const titleEl = document.querySelector('.engine-header h1');
  const wordEl = document.getElementById('study-word');
  const meaningEl = document.getElementById('study-meaning');
  const pronEl = document.getElementById('study-pron');
  const exampleEl = document.getElementById('study-example');
  const startBtn = document.getElementById('start-btn');
  const soundBtn = document.getElementById('study-sound-btn');

  document.title = '46英语 v1.4.0';

  if (titleEl && hasCorruptedPlaceholderText(titleEl.textContent || '')) {
    titleEl.textContent = '46英语 v1.4.0';
  }

  if (subtitleEl && hasCorruptedPlaceholderText(subtitleEl.textContent || '')) {
    subtitleEl.textContent = INITIAL_SUBTITLE_TEXT;
  }

  if (wordEl && hasCorruptedPlaceholderText(wordEl.textContent || '')) {
    wordEl.textContent = INITIAL_STUDY_EMPTY_STATE.word;
  }

  if (meaningEl && hasCorruptedPlaceholderText(meaningEl.textContent || '')) {
    meaningEl.textContent = INITIAL_STUDY_EMPTY_STATE.meaning;
  }

  if (pronEl && hasCorruptedPlaceholderText(pronEl.textContent || '')) {
    pronEl.textContent = INITIAL_STUDY_EMPTY_STATE.pronunciation;
  }

  if (exampleEl && hasCorruptedPlaceholderText(exampleEl.textContent || '')) {
    exampleEl.textContent = INITIAL_STUDY_EMPTY_STATE.example;
  }

  if (startBtn && hasCorruptedPlaceholderText(startBtn.textContent || '')) {
    startBtn.textContent = '开始学习';
    startBtn.setAttribute('aria-label', '开始学习');
  }

  if (soundBtn && hasCorruptedPlaceholderText(soundBtn.textContent || '')) {
    soundBtn.textContent = '发音';
    soundBtn.setAttribute('title', '发音');
    soundBtn.setAttribute('aria-label', '播放单词发音');
  }
}

function setInputText(selector, { placeholder, ariaLabel, title, value } = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (placeholder !== undefined) el.setAttribute('placeholder', placeholder);
  if (ariaLabel !== undefined) el.setAttribute('aria-label', ariaLabel);
  if (title !== undefined) el.setAttribute('title', title);
  if (value !== undefined && !el.value) el.value = value;
}

function restoreTextIfCorrupted(selector, text) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (hasCorruptedPlaceholderText(el.textContent || '')) {
    el.textContent = text;
  }
}

function _restoreHtmlIfCorrupted(selector, html) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (hasCorruptedPlaceholderText(el.textContent || '')) {
    setHtml(selector, html);
  }
}

function setSelectOptions(selector, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  const currentValue = el.value;
  el.replaceChildren(); // 清空选项
  for (const { value, label } of options) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label;
    el.appendChild(option);
  }
  if (options.some(option => option.value === currentValue)) {
    el.value = currentValue;
  }
}

function repairVisibleUIText() {
  repairInitialPlaceholderText();

  setText('.engine-header h1', '46英语 v1.4.0');
  setText('.engine-header .subtitle', INITIAL_SUBTITLE_TEXT);
  setText('#engine-fuel-label', '燃料 20%');
  setText('#engine-heat-label', '温度 0%');
  setText('#engine-status-text', '引擎待机中');

  setText('[data-tab="study"] .tab-label', '学习');
  setText('[data-tab="review"] .tab-label', '复习');
  setText('[data-tab="wrong"] .tab-label', '错题');
  setText('[data-tab="stats"] .tab-label', '统计');
  setText('[data-tab="list"] .tab-label', '词库');

  setInputText('#study-level', { ariaLabel: '选择学习范围' });
  setSelectOptions('#study-level', [
    { value: 'all', label: '全部词库' },
    { value: 'CET4', label: 'CET-4' },
    { value: 'CET6', label: 'CET-6' },
  ]);
  setText('label[for="study-level"]', '选择学习范围');

  setText('#study-sound-btn', '发音');
  setInputText('#study-sound-btn', { ariaLabel: '播放发音', title: '播放发音' });
  setText('#save-mnemonic-btn', '保存联想');
  setText('.flip-hint.card-hint', '点击卡片或按空格键查看释义');
  setHtml('#retention-display', '记忆留存: <strong id="retention-value">--</strong>');
  setText('#btn-unknown', '不认识');
  setText('#btn-spell', '拼写');
  setText('#btn-known', '认识');
  setInputText('#btn-unknown', { ariaLabel: '标记为不认识' });
  setInputText('#btn-spell', { ariaLabel: '进入拼写模式' });
  setInputText('#btn-known', { ariaLabel: '标记为认识' });
  setText('#btn-cloze', '完形填空：关闭');
  setHtml('#study-estimate', '预计完成：<strong id="study-est-date">--</strong>');
  setText('#progress-text', '学习进度: 0 / 0 (0%)');
  setInputText('#start-btn', { ariaLabel: '开始学习' });
  setText('#start-btn', '开始学习');
  setText('#reset-progress-btn span:last-child', '重置进度');
  setText('#undo-btn span:last-child', '撤销');

  const shortcutChips = document.querySelectorAll('.controls-row .action-chip[aria-hidden="true"]');
  if (shortcutChips.length >= 4) {
    setHtml(shortcutChips[0], '<kbd>←</kbd><span>不认识</span>');
    setHtml(shortcutChips[1], '<kbd>空格</kbd><span>翻转</span>');
    setHtml(shortcutChips[2], '<kbd>→</kbd><span>认识</span>');
    setHtml(shortcutChips[3], '<kbd>S</kbd><span>拼写</span>');
  }

  setText('#review-count + .review-stat-label', '待复习');
  setText('#review-overdue + .review-stat-label', '已过期');
  setText('#review-sound-btn', '发音');
  setInputText('#review-sound-btn', { ariaLabel: '播放发音', title: '播放发音' });
  setText('#review-word', '暂无待复习单词');
  setHtml('#review-retention-display', '记忆留存: <strong id="review-retention-value">--</strong>');
  setText('#btn-review-unknown', '还是不会');
  setText('#btn-review-known', '记住了');

  setText('#wrong-count + .review-stat-label', '错词总数');
  setText('#wrong-total-errors + .review-stat-label', '累计错误');
  setText('#wrong-study-btn', '专项复习错题');
  setHtml('#error-analysis-panel > div:first-child', '错误病理分析');

  setText('.heatmap-container .heatmap-title span:first-child', '学习热力图');
  setText('#heatmap-streak', '连续 0 天');
  const secondHeatmapTitle = document.querySelectorAll('.heatmap-container .heatmap-title')[1];
  if (secondHeatmapTitle) {
    secondHeatmapTitle.children[0].textContent = '未来 7 天复习工作量预测';
  }
  setText('#total-upcoming', '总计：0 词');
  setText('#stats-total-words + .review-stat-label', '总学习词数');
  setText('#stats-avg-ef + .review-stat-label', '平均 EF');
  setText('#stats-days + .review-stat-label', '学习天数');
  const statsEstLabel = document.querySelector('#stats-est-date + .review-stat-label');
  if (statsEstLabel) statsEstLabel.textContent = '预计达成日期';

  const dataPanelTitles = document.querySelectorAll('.data-panel h3');
  if (dataPanelTitles[0]) dataPanelTitles[0].textContent = 'WebDAV 云同步';
  if (dataPanelTitles[1]) dataPanelTitles[1].textContent = '算法实验室';
  if (dataPanelTitles[2]) dataPanelTitles[2].textContent = '本地数据管理';

  setInputText('#webdav-url', { placeholder: 'WebDAV 服务器地址' });
  setInputText('#webdav-master-key', { placeholder: '主密码（用于加密凭证）' });
  setInputText('#webdav-username', { placeholder: '用户名' });
  setInputText('#webdav-password', { placeholder: '密码' });
  const autoSyncLabel = document.querySelector('label[for="webdav-auto-sync"]');
  if (autoSyncLabel) autoSyncLabel.textContent = '启动时自动增量同步';
  setText('#save-webdav-btn', '保存配置');
  setText('#test-webdav-btn', '测试连接');
  setText('#sync-up-btn', '同步到云端');
  setText('#sync-down-btn', '从云端恢复');
  setText('#toggle-config-btn', '配置');
  setText('#export-key-btn', '导出凭证');
  setText('#webdav-status', isFileProtocol() ? '本地模式下部分云同步功能可能不可用' : '');

  const fsrsTuning = document.querySelector('.fsrs-tuning');
  if (fsrsTuning) {
    const topRow = fsrsTuning.querySelector('div > span');
    if (topRow) topRow.textContent = '当前模型 Log-Loss:';
    const targetRow = fsrsTuning.querySelector('div[style*="align-items: center"] span');
    if (targetRow) targetRow.textContent = '目标留存率';
    const hint = fsrsTuning.querySelector(
      'div[style*="font-size: 0.75rem; color: var(--gray); margin-top: 0.5rem;"]'
    );
    if (hint) hint.textContent = '留存率越高，复习越频繁，记忆越牢固';
  }
  setText('#train-fsrs-btn', '基于历史数据训练');
  setText('#reset-fsrs-btn', '恢复默认权重');
  setText('#export-btn', '导出进度');
  setText('#import-btn', '导入进度');
  setText('#load-vocab-btn', '加载词库（JSON/CSV）');

  setInputText('#search-input', { placeholder: '搜索词库...', ariaLabel: '搜索词库' });
  setText('label[for="search-input"]', '搜索词库');
  setText('label[for="filter-level"]', '筛选词库');
  setText('label[for="filter-status"]', '筛选状态');
  setSelectOptions('#filter-level', [
    { value: 'all', label: '全部词库' },
    { value: 'CET4', label: 'CET-4' },
    { value: 'CET6', label: 'CET-6' },
  ]);
  setSelectOptions('#filter-status', [
    { value: 'all', label: '全部状态' },
    { value: 'new', label: '未学习' },
    { value: 'review', label: '待复习' },
    { value: 'mastered', label: '已掌握' },
  ]);
  setText('#btn-apply-filter', '应用筛选');

  setText('#spelling-title', '拼写挑战');
  setText('.spelling-hint', '根据提示拼写单词');
  setText('#spelling-sound', '发音');
  setText('#hint-btn', '提示');
  setText('#hint-level-display', '提示等级: 0');
  setText('#spelling-cancel-btn', '取消');
  setText('#spelling-submit', '提交');
  setText('#keep-local', '保留本地');
  setText('#use-cloud', '使用云端');
}

function repairRuntimeCorruptedUIText() {
  restoreTextIfCorrupted('#engine-status-text', '当前状态正常，可以开始学习');
  restoreTextIfCorrupted('#engine-fuel-label', '燃料 20%');
  restoreTextIfCorrupted('#engine-heat-label', '温度 0%');
  restoreTextIfCorrupted('#stats-est-date', '继续学习后生成预测');
  restoreTextIfCorrupted('#fsrs-fit-score', '--');
  restoreTextIfCorrupted(
    '#webdav-status',
    isFileProtocol() ? '本地模式下部分云同步功能可能不可用' : '当前状态正常'
  );
  restoreTextIfCorrupted('#study-estimate', '预计完成：--');
  restoreTextIfCorrupted('#review-word', '暂无待复习单词');
  restoreTextIfCorrupted('#retention-value', '--');
  restoreTextIfCorrupted('#review-retention-value', '--');

  const semanticWarning = document.getElementById('semantic-warning');
  if (semanticWarning && hasCorruptedPlaceholderText(semanticWarning.textContent || '')) {
    setHtml(semanticWarning, '<strong>当前状态正常，可以开始学习</strong>');
  }
}

const _uiRepairObserver = null;

function ensureUIRepairObserver() {
  // no-op: uiRepairObserver is const null, MutationObserver check unnecessary
}

export {
  hasCorruptedPlaceholderText,
  repairInitialPlaceholderText,
  setInputText,
  restoreTextIfCorrupted,
  _restoreHtmlIfCorrupted,
  setSelectOptions,
  repairVisibleUIText,
  repairRuntimeCorruptedUIText,
  ensureUIRepairObserver,
};
