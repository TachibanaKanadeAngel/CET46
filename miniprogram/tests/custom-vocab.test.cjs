const { loadCommonJS, assert } = require('./load-module.cjs');

function run() {
  const custom = loadCommonJS('utils/custom-vocab.js');
  const input = [
    { word: 'Zephyr', meaning: '微风', level: 'CET6', example: 'A zephyr arrived.' },
    { word: 'zephyr', meaning: '重复项', level: 'CET6' },
    { word: 'localword', translation: '个人单词' },
    { word: '', meaning: '无效' },
  ];
  const normalized = custom.normalizeCustomWords(input, 'CET4');
  assert(normalized.CET6.length === 1, '按单词和等级去重');
  assert(normalized.CET4.length === 1, 'translation 可作为释义');
  assert(normalized.CET6[0].id.startsWith('custom:CET6:'), '个人词使用稳定字符串 ID');
  const second = custom.normalizeCustomWords([input[0]], 'CET4');
  assert(second.CET6[0].id === normalized.CET6[0].id, '相同单词生成相同 ID');

  const updated = custom.normalizeCustomWords([{ word: 'Zephyr', meaning: '和风', level: 'CET6' }]);
  const merged = custom.mergeCustomStores(normalized, updated);
  assert(merged.CET6.length === 1 && merged.CET6[0].meaning === '和风', '再次导入会更新同名单词');

  const withBuiltIn = custom.mergeWithBuiltIn(
    [{ id: 1, word: 'ability', meaning: '能力' }],
    [{ id: 'custom:1', word: 'Ability', meaning: '重复' }, normalized.CET4[0]]
  );
  assert(withBuiltIn.length === 2, '个人词不会覆盖内置同名单词');

  const oversized = Array.from({ length: 520 }, (_, index) => ({ word: `word${index}`, meaning: `释义${index}` }));
  const limited = custom.normalizeCustomWords(oversized);
  assert(limited.CET4.length === custom.MAX_CUSTOM_WORDS, '个人词库限制为 500 条');

  console.log('custom-vocab.test.cjs passed');
}

run();
