const { loadCommonJS, assert } = require('./load-module.cjs');

function run() {
  const aids = loadCommonJS('utils/learning-aids.js');
  const cloze = aids.generateCloze('study', 'She studies English and studied French.');
  assert(!cloze.toLowerCase().includes('studies'), '填空会隐藏单词变形');
  assert(!cloze.toLowerCase().includes('studied'), '填空会隐藏过去式');
  assert(cloze.includes('_'), '填空使用下划线占位');
  assert(aids.generateCloze('puzzling', 'a jigsaw puzzle').includes('_'), '可识别去掉 ing 后恢复 e 的词形');
  assert(aids.generateCloze('kid', 'no kidding').includes('_'), '可识别末尾辅音双写的词形');
  assert(aids.generateCloze('shrank', 'prices shrink').includes('_'), '可识别已配置的不规则词形');

  const unrelated = 'An unrelated sentence.';
  assert(aids.generateCloze('target', unrelated) === unrelated, '无目标词时保留原句，不伪造填空');
  assert(!aids.canGenerateCloze('target', unrelated), '无目标词时标记为不可挖空');
  assert(!aids.canGenerateCloze('its', 'as it were'), '不把 its 错当成 it 的普通复数');

  const words = [
    { id: 1, word: 'adapt', meaning: '适应' },
    { id: 2, word: 'adopt', meaning: '采用' },
    { id: 3, word: 'adept', meaning: '熟练的' },
    { id: 4, word: 'completely', meaning: '完全地' },
  ];
  const related = aids.findConfusingWords(words[0], words, 4);
  assert(related.some(word => word.word === 'adopt'), '找到编辑距离接近的易混词');
  assert(!related.some(word => word.word === 'completely'), '排除拼写差异大的单词');

  console.log('learning-aids.test.cjs passed');
}

run();
