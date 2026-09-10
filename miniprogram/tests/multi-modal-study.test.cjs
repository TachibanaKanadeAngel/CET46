const { loadCommonJS, assert } = require('./load-module.cjs');

function testMorphology(multiModal) {
  const res1 = multiModal.analyzeMorphology('predict');
  assert(res1 !== null, 'predict should be broken down');
  assert(res1.parts.some(p => p.type === 'prefix' && p.text === 'pre-'), 'should have prefix pre-');

  const res2 = multiModal.analyzeMorphology('helpless');
  assert(res2 !== null, 'helpless should be broken down');
  assert(res2.parts.some(p => p.type === 'suffix' && p.text === '-less'), 'should have suffix -less');

  const res3 = multiModal.analyzeMorphology('hi');
  assert(res3 === null, 'short word should return null');
}

function testCollocations(multiModal) {
  const example = 'He made a major breakthrough in quantum physics.';
  const collocations = multiModal.extractCollocations('breakthrough', example);
  assert(Array.isArray(collocations), 'should return array');
  assert(collocations.length > 0, 'should extract collocations');
  assert(collocations.some(c => c.toLowerCase().includes('breakthrough')), 'should contain target word');
}

function testChoiceOptions(multiModal) {
  const words = [
    { id: '1', word: 'apple', meaning: '苹果' },
    { id: '2', word: 'banana', meaning: '香蕉' },
    { id: '3', word: 'orange', meaning: '橙子' },
    { id: '4', word: 'grape', meaning: '葡萄' },
    { id: '5', word: 'peach', meaning: '桃子' },
  ];

  const currentWord = words[0];
  const options = multiModal.generateChoiceOptions(currentWord, words, 4);

  assert(options.length === 4, 'should generate 4 options');
  const correctOption = options.find(o => o.isCorrect);
  assert(correctOption !== undefined, 'should contain one correct option');
  assert(correctOption.meaning === '苹果', 'correct meaning must match');

  const distractors = options.filter(o => !o.isCorrect);
  assert(distractors.length === 3, 'should have 3 distractors');
  const meanings = new Set(options.map(o => o.meaning));
  assert(meanings.size === 4, 'all 4 options must have unique meanings');
}

function testEarwormPlayer(earwormModule) {
  const { EarwormPlayer } = earwormModule;
  const player = new EarwormPlayer();
  const words = [
    { id: '1', word: 'apple' },
    { id: '2', word: 'banana' },
  ];

  player.setPlaylist(words);
  assert(player.words.length === 2, 'playlist length 2');
  assert(player.currentIndex === 0, 'initial index 0');

  let stateNotified = false;
  player.onStateChange = (playing) => {
    stateNotified = playing;
  };

  player.start();
  assert(player.isPlaying === true, 'player is playing');
  assert(stateNotified === true, 'state is true');

  player.next();
  assert(player.currentIndex === 1, 'index moves to 1');

  player.prev();
  assert(player.currentIndex === 0, 'index moves back to 0');

  player.pause();
  assert(player.isPlaying === false, 'player is paused');
  assert(stateNotified === false, 'state is false');

  player.stop();
  assert(player.isPlaying === false, 'player is stopped');
}

function testWordFamily(multiModal) {
  // 词根推导（先剥前缀再剥后缀）
  assert(multiModal.getMorphologyRoot('actor') === 'act', 'root of actor should be act');
  assert(multiModal.getMorphologyRoot('helpless') === 'help', 'root of helpless should be help');

  const words = [
    { id: '1', word: 'act', meaning: '行动' },
    { id: '2', word: 'actor', meaning: '演员' },
    { id: '3', word: 'active', meaning: '活跃的' },
    { id: '4', word: 'action', meaning: '行动' },
    { id: '5', word: 'banana', meaning: '香蕉' },
  ];

  const family = multiModal.findWordFamily(words[1], words, 6); // actor
  assert(Array.isArray(family), 'should return array');
  assert(family.length >= 2, 'actor should have family (act, active, action)');
  assert(family.every(f => f.word !== 'actor'), 'should exclude self');
  const famWords = family.map(f => f.word);
  assert(famWords.includes('act') && famWords.includes('active'), 'family should include act & active');
  assert(!famWords.includes('banana'), 'family should not include unrelated word');

  // 词根过短时不推导
  const shortFamily = multiModal.findWordFamily({ id: '5', word: 'banana' }, words, 6);
  assert(shortFamily.length === 0, 'short/no root should not infer family');
}

function testSentenceBuilding(multiModal) {
  // getRootMeaning：已知词根返回真实词根义
  const rm = multiModal.getRootMeaning('actor');
  assert(rm.root === 'act', 'root of actor should be act');
  assert(typeof rm.meaning === 'string' && rm.meaning.length > 0, 'should have root meaning');

  // createSentenceBuilding：词块为 answer 的乱序排列，且 token 集合一致
  const build = multiModal.createSentenceBuilding('abandon', 'He had to abandon the plan. (他不得不放弃计划。)');
  assert(build, 'should build sentence');
  const ansSorted = [...build.answer].sort();
  const bankSorted = [...build.bank].sort();
  assert(ansSorted.join('|') === bankSorted.join('|'), 'bank should be permutation of answer');
  assert(build.answer.length >= 4, 'answer length >= 4');

  // 例句过短或无例句时返回 null
  assert(multiModal.createSentenceBuilding('go', '') === null, 'empty example -> null');
  assert(multiModal.createSentenceBuilding('go', 'Go. (走。)') === null, 'too short -> null');
  assert(multiModal.createSentenceBuilding('go', null) === null, 'null example -> null');
}

function testMnemonicHints(multiModal) {
  const pool = [
    { id: 1, word: 'inspect', meaning: '检查', phonetic: '/ɪnˈspekt/' },
    { id: 2, word: 'respect', meaning: '尊重', phonetic: '/rɪˈspekt/' },
    { id: 3, word: 'prospect', meaning: '前景', phonetic: '/ˈprɒspekt/' },
  ];
  const hints = multiModal.getMnemonicHints(pool[0], pool);
  assert(Array.isArray(hints) && hints.length > 0, '有信息时应生成助记联想');
  const joined = hints.join('|');
  assert(joined.includes('词根'), '助记含词根义');
  assert(joined.includes('同根'), '助记含同根词族');
}

function run() {
  const multiModal = loadCommonJS('utils/multi-modal.js');
  const earwormModule = loadCommonJS('utils/earworm.js');

  testMorphology(multiModal);
  testCollocations(multiModal);
  testChoiceOptions(multiModal);
  testWordFamily(multiModal);
  testSentenceBuilding(multiModal);
  testMnemonicHints(multiModal);
  testEarwormPlayer(earwormModule);
  console.log('multi-modal-study.test.cjs passed');
}

run();
