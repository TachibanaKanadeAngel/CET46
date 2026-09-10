const { loadCommonJS, assert } = require('./load-module.cjs');

function testDynamicDifficulty(battle) {
  const { createOpponent } = battle;

  // 不注入随机源时始终可创建
  const opp = createOpponent();
  assert(typeof opp.currentAccuracy === 'function', 'has currentAccuracy');
  assert(typeof opp.answer === 'function', 'has answer');
  assert(typeof opp.observe === 'function', 'has observe');

  // 初始难度 = base
  const acc0 = opp.currentAccuracy();
  assert(acc0 === battle.DEFAULT_OPTS.baseAccuracy, 'initial accuracy equals base');

  // 领先 → AI 应变得更准（正向偏移、难度上升）
  const accAhead = opp.observe(50, 10, 0);
  assert(accAhead > acc0, 'player ahead -> AI accuracy increases');

  // 落后 → AI 放水（难度下降）
  const accBehind = opp.observe(10, 50, 0);
  assert(accBehind < accAhead, 'player behind -> AI accuracy drops');

  // 难度被钳制在区间内
  const accClamp = opp.currentAccuracy();
  assert(accClamp >= 0.2 && accClamp <= 0.98, 'accuracy clamped within [0.2, 0.98]');

  // answer 尊重注入的概率：random()=0 -> 必对；random()=0.999 -> 视阈值（一般必错）
  const alwaysRight = opp.answer(() => 0);
  assert(alwaysRight === true, 'random 0 -> always correct');
}

function testSettlement(battle) {
  const { settleBattle, aiRoundPoint } = battle;
  assert(settleBattle(100, 90) === 'win', 'higher player -> win');
  assert(settleBattle(90, 100) === 'lose', 'higher ai -> lose');
  assert(settleBattle(50, 50) === 'draw', 'equal -> draw');
  assert(aiRoundPoint(true) === 10, 'AI correct -> 10 pts');
  assert(aiRoundPoint(false) === 0, 'AI wrong -> 0 pts');
}

function testHomophoneHint(multiModal) {
  // 谐音词典存在于词典中，且 getMnemonicHints 会把它作为助记行输出
  assert(multiModal.HOMOPHONE_MNEMONICS && multiModal.HOMOPHONE_MNEMONICS.ambulance, 'has ambulance homophone');
  assert(multiModal.HOMOPHONE_MNEMONICS.ambulance.sound === '俺不能死', 'sound is 俺不能死');

  const hints = multiModal.getMnemonicHints({ id: 1, word: 'ambulance', meaning: '救护车' }, []);
  const joined = (hints || []).join('|');
  assert(joined.includes('谐音'), 'homophone hint present');

  // 未收录谐音的单词不应出现谐音行，也不报错
  const plain = multiModal.getMnemonicHints({ id: 2, word: 'spectacle', meaning: '景象' }, []);
  assert(!((plain || []).join('|')).includes('谐音'), 'no homophone line for uncatalogued word');
}

function run() {
  const battle = loadCommonJS('utils/battle.js');
  const multiModal = loadCommonJS('utils/multi-modal.js');

  testDynamicDifficulty(battle);
  testSettlement(battle);
  testHomophoneHint(multiModal);
  console.log('battle.test.cjs passed');
}

run();