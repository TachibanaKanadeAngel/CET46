// 补全例句上下文 (Backfill Examples)
// 依据"上下文学习"原则，为 `example` 为空的词条补上来自同根词族的真实例句。
// 词族的例句来源全部取自词库本身 (public/data/vocab.json)，不外部编造。
// 用法: node scripts/backfill-examples.cjs
const fs = require('fs');
const path = require('path');

// ---- 词根推导（与 miniprogram/utils/multi-modal.js 的 COMMON_PREFIXES/SUFFIXES 保持一致，
//      工具脚本自包含，避免在 "type":"module" 根项目下跨 CJS 解析）----
const PREFIXES = ['anti','auto','co','com','con','de','dis','em','en','ex','extra','fore',
  'im','in','inter','intra','macro','micro','mis','multi','non','over','post','pre','pro',
  're','sub','super','trans','tri','un','under'].sort((a,b) => b.length - a.length);
const SUFFIXES = ['able','ible','al','ance','ence','ant','ent','ate','ation','ition','dom',
  'ed','en','er','or','ful','fy','hood','ic','ical','ify','ing','ish','ism','ist','ity','ive',
  'ize','ise','less','like','ly','ment','ness','ous','ship','sion','tion','ward','wise','y']
  .sort((a,b) => b.length - a.length);

function getMorphologyRoot(wordText) {
  if (!wordText || typeof wordText !== 'string') return '';
  const word = wordText.trim().toLowerCase();
  if (word.length < 5) return word;
  let remaining = word;
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length - p.length >= 3) { remaining = remaining.slice(p.length); break; }
  }
  for (const s of SUFFIXES) {
    if (remaining.endsWith(s) && remaining.length - s.length >= 2) { remaining = remaining.slice(0, -s.length); break; }
  }
  return remaining;
}

const vocabPath = path.join(__dirname, '../public/data/vocab.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
const words = data.words;

// 预计算 wordId -> example 与 root，避免 O(n^2)
const rootMap = new Map(); // root -> [{word, example}]
for (const w of words) {
  const root = getMorphologyRoot(w.word);
  if (!root || root.length < 3) continue;
  if (!rootMap.has(root)) rootMap.set(root, []);
  rootMap.get(root).push(w);
}

const beforeTotal = words.length;
const beforeEmpty = words.filter(w => !w.example || !w.example.trim()).length;

let filled = 0;
let stillEmpty = 0;

for (const w of words) {
  if (w.example && w.example.trim()) continue;
  const root = getMorphologyRoot(w.word);
  const siblings = root && root.length >= 3 ? (rootMap.get(root) || []) : [];
  const source = siblings.find(x => String(x.id) !== String(w.id) && x.example && x.example.trim());
  if (!source) { stillEmpty++; continue; }
  w.example = source.example;
  w.exampleRoot = source.word; // 标注例句词源（词族代表词）
  filled++;
}

fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2), 'utf8');

const afterEmpty = words.filter(w => !w.example || !w.example.trim()).length;
console.log('=== 例句补全报告 ===');
console.log(`总词条: ${beforeTotal}`);
console.log(`补全前空例句: ${beforeEmpty}`);
console.log(`已补全: ${filled}`);
console.log(`补全后仍空: ${afterEmpty}`);
console.log(`例句覆盖率: ${(((beforeTotal - beforeEmpty) / beforeTotal) * 100).toFixed(2)}% → ${(((beforeTotal - afterEmpty) / beforeTotal) * 100).toFixed(2)}%`);