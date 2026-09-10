const { loadCommonJS, assert } = require('./load-module.cjs');

function run() {
  const training = loadCommonJS('utils/training.js');
  const words = [
    { id: 1, word: 'ability', meaning: '能力' },
    { id: 2, word: 'abandon', meaning: '放弃' },
    { id: 3, word: 'accurate', meaning: '准确的' },
    { id: 4, word: 'benefit', meaning: '益处' },
    { id: 5, word: 'confirm', meaning: '确认' },
    { id: 6, word: 'decide', meaning: '决定' },
    { id: 7, word: 'enable', meaning: '使能够' },
    { id: 8, word: 'feature', meaning: '特征' },
  ];
  const progress = {
    '1': { status: 'review' },
    '2': { status: 'mastered' },
    '3': { status: 'new' },
  };

  const wrong = training.buildSpellingQueue(words, progress, ['2'], 'wrong', 20, () => 0.5);
  assert(wrong.length === 1 && wrong[0].id === 2, '错词专项只包含错词');
  const learned = training.buildSpellingQueue(words, progress, [], 'learned', 20, () => 0.5);
  assert(learned.length === 2, '已学训练排除新词');

  const exact = training.evaluateSpelling(' Ability ', 'ability', 0);
  assert(exact.type === 'correct' && exact.quality === 4, '完全正确得到最高质量');
  const hinted = training.evaluateSpelling('ability', 'ability', 2);
  assert(hinted.quality === 2, '使用提示会降低质量');
  const close = training.evaluateSpelling('abilty', 'ability', 0);
  assert(close.type === 'close' && close.quality === 2, '一处编辑误差判为接近');
  assert(training.getSpellingHint('ability', 2) === 'ab_____', '提示按等级透露字母');

  const pool = training.buildMatchPool(words, ['2'], progress, 24, () => 0.4);
  const round = training.createMatchRound(pool, 6, () => 0.4);
  assert(round && round.choices.some(item => item.id === round.target.id), '匹配题包含正确答案');
  assert(new Set(round.choices.map(item => item.id)).size === round.choices.length, '匹配选项不重复');

  console.log('training.test.cjs passed');
}

run();
