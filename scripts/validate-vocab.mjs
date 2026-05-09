import { DEFAULT_WORDS } from '../js/data/default_vocab.js';

const errors = [];
const warnings = [];

console.log('=== CET46 词库校验 ===\n');

if (!Array.isArray(DEFAULT_WORDS)) {
  errors.push('DEFAULT_WORDS 不是数组');
  console.error('❌ DEFAULT_WORDS 不是数组');
  process.exit(1);
}

console.log(`词库加载完成，共 ${DEFAULT_WORDS.length} 条记录\n`);

const idMap = new Map();
const wordMap = new Map();
const validLevels = new Set(['CET4', 'CET6']);
let cet4Count = 0;
let cet6Count = 0;
let emptyPhoneticCount = 0;
let emptyMeaningCount = 0;
let emptyExampleCount = 0;

for (const entry of DEFAULT_WORDS) {
  if (idMap.has(entry.id)) {
    errors.push(`id 重复: ${entry.id} (词: "${idMap.get(entry.id)}" 与 "${entry.word}")`);
  }
  idMap.set(entry.id, entry.word);

  const lowerWord = entry.word.toLowerCase();
  if (wordMap.has(lowerWord)) {
    errors.push(`word 重复: "${entry.word}" (id: ${wordMap.get(lowerWord)} 与 ${entry.id})`);
  }
  wordMap.set(lowerWord, entry.id);

  if (!entry.phonetic || entry.phonetic.trim() === '') {
    emptyPhoneticCount++;
    warnings.push(`id ${entry.id} "${entry.word}" 音标为空`);
  }

  if (!entry.meaning || entry.meaning.trim() === '') {
    emptyMeaningCount++;
    errors.push(`id ${entry.id} "${entry.word}" 释义为空`);
  }

  if (!entry.example || entry.example.trim() === '') {
    emptyExampleCount++;
  }

  if (!validLevels.has(entry.level)) {
    errors.push(`id ${entry.id} "${entry.word}" level 无效: "${entry.level}" (仅允许 CET4/CET6)`);
  }

  if (entry.level === 'CET4') cet4Count++;
  if (entry.level === 'CET6') cet6Count++;
}

console.log('--- 统计 ---');
console.log(`总词数:     ${DEFAULT_WORDS.length}`);
console.log(`CET4 数量:  ${cet4Count}`);
console.log(`CET6 数量:  ${cet6Count}`);
console.log(`例句为空:   ${emptyExampleCount}`);

if (warnings.length > 0) {
  console.log(`\n--- 警告 (${warnings.length}) ---`);
  for (const w of warnings) {
    console.warn(`  ⚠ ${w}`);
  }
}

if (errors.length > 0) {
  console.log(`\n--- 错误 (${errors.length}) ---`);
  for (const e of errors) {
    console.error(`  ❌ ${e}`);
  }
  process.exit(1);
}

console.log('\n✅ 词库校验通过，无错误');