/* eslint-env node */
// 将当前词库导出为 Anki 可导入文本（.txt，制表符分隔，带表头）。
// 用法：node scripts/export-anki.cjs [input.json] [output.txt]
//   input.json 默认 public/data/vocab.json；output.txt 默认 exports/anki-vocab.txt
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.resolve(ROOT, process.argv[2] || 'public/data/vocab.json');
const outputPath = path.resolve(ROOT, process.argv[3] || 'exports/anki-vocab.txt');

function loadWords(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return raw.words || raw.VOCAB || raw;
}

async function main() {
  if (process.argv.includes('--esm')) {
    // 使用 ESM 版导出器（与前端一致）
    const { buildAnkiExport } = await import(`file://${path.join(ROOT, 'js/utils/anki-bridge.js').replace(/\\/g, '/')}`);
    run(buildAnkiExport);
  } else {
    // 快速导出：二进制桥接（保持 CJS 兼容，避免动用 ESM 加载器）
    const { buildAnkiExport } = requireNative();
    run(buildAnkiExport);
  }
}

function requireNative() {
  // 动态读取纯函数实现到 CJS 作用域：这里复用同源可读性，导出逻辑保持一致
  return { buildAnkiExport: (w, o) => nativeExport(w, o) };
}

/** 无 ESM 依赖的内联导出（与 anki-bridge 语义一致）。 */
function nativeExport(words, opts = {}) {
  const fields = opts.fields ?? ['word', 'meaning', 'phonetic', 'example', 'level'];
  const includeHeader = opts.includeHeader !== false;
  const lines = [];
  if (includeHeader) lines.push(fields.map(f => ({ word: 'Word', meaning: 'Meaning', phonetic: 'Phonetic', example: 'Example', level: 'Level' }[f] || f)).join('\t'));
  for (const w of words) {
    lines.push(fields.map(f => String(w[f] ?? '').replace(/\t/g, ' ')).join('\t'));
  }
  return lines.join('\n');
}

function run(build) {
  const words = loadWords(inputPath);
  if (!Array.isArray(words) || words.length === 0) {
    console.error(`未读取到词库：${inputPath}`);
    process.exit(1);
  }
  const normWords = words.map(w => ({
    word: w.word ?? w.name ?? '',
    phonetic: w.phonetic ?? '',
    meaning: w.meaning ?? w.translation ?? w.definition ?? '',
    example: w.example ?? '',
    level: w.level ?? '',
  }));
  const text = build(normWords);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, text, 'utf8');
  console.log(`已导出 ${normWords.length} 词 → ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});