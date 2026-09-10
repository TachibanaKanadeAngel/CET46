// 词书系列配置：新增内置词书只需在 SERIES 追加一项（含 id / 名称 / 分包根），
// 并保证该分包可被 vocab-loader 加载（words.js 导出 WORDS）。
const SERIES = [
  { id: 'CET4', name: '四级核心', pkg: 'packages/level4' },
  { id: 'CET4_HIGH', name: '四级高频', pkg: 'packages/level5' },
  { id: 'CET6', name: '六级核心', pkg: 'packages/level6' },
];

const DEFAULT_SERIES = 'CET4';

function isValidSeries(id) {
  return SERIES.some(s => s.id === id) || id === 'SPOKEN';
}

function getSeries(id) {
  if (id === 'SPOKEN') {
    return { id: 'SPOKEN', name: '四级高频', pkg: 'packages/level5' };
  }
  return SERIES.find(s => s.id === id) || null;
}

// 词书唯一 id → 分包根路径；未知 id 回退到 CET4 默认（保持旧行为）
function getPackageRoot(id) {
  if (id === 'SPOKEN') return 'packages/level5';
  const s = getSeries(id);
  return s ? s.pkg : 'packages/level4';
}

// 词书下拉选项（选择页/首页）
function getOptions() {
  return SERIES.map(s => ({ value: s.id, label: s.name }));
}

module.exports = { SERIES, DEFAULT_SERIES, isValidSeries, getSeries, getPackageRoot, getOptions };