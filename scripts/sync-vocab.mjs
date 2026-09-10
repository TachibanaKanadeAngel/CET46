#!/usr/bin/env node

/**
 * CET46 统一数据源 (SSOT) 同步与编译脚本
 * 权威数据源: public/data/vocab.json
 * 产物 1: js/data/default_vocab.js (Web/PWA 紧凑数组格式)
 * 产物 2: miniprogram/packages/level4/ (小程序分片与入口)
 * 产物 3: miniprogram/packages/level6/ (小程序分片与入口)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const vocabPath = path.resolve(PROJECT_ROOT, 'public', 'data', 'vocab.json');
const defaultVocabPath = path.resolve(PROJECT_ROOT, 'js', 'data', 'default_vocab.js');
const mpPackagesDir = path.resolve(PROJECT_ROOT, 'miniprogram', 'packages');

console.log('=== CET46 词库同步与编译 (SSOT) ===\n');

if (!fs.existsSync(vocabPath)) {
  console.error('❌ 未找到权威词库数据源: ' + vocabPath);
  process.exit(1);
}

const rawJson = fs.readFileSync(vocabPath, 'utf8');
const data = JSON.parse(rawJson);
const words = data.words;
const hash = crypto.createHash('sha256').update(rawJson).digest('hex').slice(0, 8);

console.log(`📖 权威数据源加载成功: 共 ${words.length} 条单词记录 (SHA-256: ${hash})`);

// 1. 编译 js/data/default_vocab.js (紧凑数组格式)
const compactArray = words.map(w => {
  if (w.exampleRoot) {
    return [w.id, w.word, w.phonetic, w.meaning, w.example || '', w.level, w.exampleRoot];
  }
  return [w.id, w.word, w.phonetic, w.meaning, w.example || '', w.level];
});

const defaultVocabHeader = `/**
 * 46英语默认词库
 * 核心词汇量：${words.length}
 * 数据状态：音标已补全，例句与词族已对齐
 *
 * ⚠️ 自动生成自 public/data/vocab.json（SSOT 单一权威数据源）
 * 请勿手动修改本文件。如需更新词库，请修改 public/data/vocab.json 并运行 npm run build:vocab
 *
 * 优化说明：采用紧凑数组格式存储以减小 bundle 体积
 * 运行时由 expandWords() 展开为对象数组，对外接口保持不变
 */

/** 紧凑格式的原始词库数据 */
const COMPACT_WORDS = ${JSON.stringify(compactArray)};

/**
 * 将紧凑数组格式展开为完整对象数组
 * @returns {Array<{id: number, word: string, phonetic: string, meaning: string, example: string, level: string, exampleRoot?: string}>}
 */
function expandWords() {
  return COMPACT_WORDS.map(([id, word, phonetic, meaning, example, level, exampleRoot]) => {
    const item = { id, word, phonetic, meaning, example, level };
    if (exampleRoot) item.exampleRoot = exampleRoot;
    return item;
  });
}

/** 默认词库数据（展开后的对象数组，对外接口保持兼容） */
export const DEFAULT_WORDS = expandWords();
`;

fs.writeFileSync(defaultVocabPath, defaultVocabHeader, 'utf8');
const jsSizeKb = (fs.statSync(defaultVocabPath).size / 1024).toFixed(2);
console.log(`✅ [Web] 已生成 js/data/default_vocab.js (${jsSizeKb} KB)`);

// 2. 编译小程序分包 (按首字母分片 + 聚合入口)
function splitLevel(levelDir, levelName) {
  const root = path.join(mpPackagesDir, levelDir);
  const wordsPath = path.join(root, 'words.js');
  const lettersDir = path.join(root, 'letters');
  fs.mkdirSync(lettersDir, { recursive: true });

  const levelWords = words.filter(w => w.level === levelName);
  const groups = {};
  for (const w of levelWords) {
    const first = w.word ? String(w.word).trim().charAt(0).toLowerCase() : '#';
    const key = /^[a-z]$/.test(first) ? first : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }

  const letters = Object.keys(groups).sort();
  const indexImports = [];
  const indexArrays = [];

  for (const letter of letters) {
    const list = groups[letter];
    const fileName = `${letter}.js`;
    const filePath = path.join(lettersDir, fileName);
    const content = `// ${levelDir.toUpperCase()} 词库：以 "${letter.toUpperCase()}" 开头（${list.length} 词）\n` +
      `// 自动从 public/data/vocab.json 生成\n` +
      `const WORDS_${letter.toUpperCase()} = ${JSON.stringify(list, null, 2)};\n\n` +
      `module.exports = { WORDS_${letter.toUpperCase()} };\n`;
    fs.writeFileSync(filePath, content, 'utf8');
    indexImports.push(`const { WORDS_${letter.toUpperCase()} } = require('./${fileName}');`);
    indexArrays.push(`WORDS_${letter.toUpperCase()}`);
  }

  const finalIndexContent = `// ${levelDir.toUpperCase()} 词库聚合（按首字母分片）\n` +
    `// 自动从 public/data/vocab.json 生成\n\n` +
    indexImports.join('\n') + '\n\n' +
    `const WORDS = [\n  ${indexArrays.join(',\n  ')}\n].reduce((all, words) => all.concat(words), []);\n\n` +
    `module.exports = { WORDS };\n`;
  fs.writeFileSync(path.join(lettersDir, 'index.js'), finalIndexContent, 'utf8');

  const reexportContent = `// ${levelDir.toUpperCase()} 词库入口\n` +
    `// 当前按首字母分片加载，入口统一导出 WORDS\n` +
    `// 自动从 public/data/vocab.json 生成\n\n` +
    `module.exports = require('./letters/index.js');\n`;
  fs.writeFileSync(wordsPath, reexportContent, 'utf8');

  console.log(`✅ [小程序] 已编译 ${levelDir} (${levelName}): ${levelWords.length} 词，拆分为 ${letters.length} 个字母分片`);
}

splitLevel('level4', 'CET4');
splitLevel('level6', 'CET6');

console.log('\n🎉 所有端词库同步完成，数据源 100% 一致！');
