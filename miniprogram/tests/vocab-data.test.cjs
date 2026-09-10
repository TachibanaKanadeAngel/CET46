const fs = require('fs');
const path = require('path');
const { ROOT, loadCommonJS, assert } = require('./load-module.cjs');

function directorySize(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const full = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? directorySize(full) : fs.statSync(full).size);
  }, 0);
}

function run() {
  const level4 = loadCommonJS('packages/level4/words.js').WORDS;
  const level6 = loadCommonJS('packages/level6/words.js').WORDS;
  const spoken = loadCommonJS('packages/level5/words.js').WORDS;
  const all = level4.concat(level6);
  const ids = new Set();
  all.forEach(word => {
    assert(word.id !== undefined && word.word && word.meaning, `词条 ${word.id} 必填字段完整`);
    assert(typeof word.phonetic === 'string' && word.phonetic.trim(), `词条 ${word.id} 必须包含音标`);
    const id = String(word.id);
    assert(!ids.has(id), `词条 ID ${id} 不重复`);
    ids.add(id);
  });
  assert(all.length === 6662, '词库总数应为 6662');
  assert(Array.isArray(spoken) && spoken.length > 0, '高频词库非空');
  spoken.forEach(word => {
    assert(word.id !== undefined && word.word && word.meaning, `高频词条 ${word.id} 必填字段完整`);
    assert(typeof word.phonetic === 'string' && word.phonetic.trim(), `高频词条 ${word.id} 必须包含音标`);
    assert(typeof word.example === 'string' && word.example.trim(), `高频词条 ${word.id} 必须包含例句`);
    assert(!ids.has(String(word.id)), `高频词条 ID ${word.id} 与主词库冲突`);
  });
  assert(directorySize(path.join(ROOT, 'packages/level4')) < 2 * 1024 * 1024, 'CET4 分包低于 2MB');
  assert(directorySize(path.join(ROOT, 'packages/level6')) < 2 * 1024 * 1024, 'CET6 分包低于 2MB');
  assert(directorySize(path.join(ROOT, 'packages/level5')) < 2 * 1024 * 1024, 'level5 分包低于 2MB');
  console.log('vocab-data.test.cjs passed');
}

run();
