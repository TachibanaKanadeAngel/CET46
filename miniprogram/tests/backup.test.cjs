const { loadCommonJS, assert } = require('./load-module.cjs');

function run() {
  const backup = loadCommonJS('utils/backup.js');
  const rootBackup = {
    version: '1.3.6',
    currentLevel: 'CET6',
    progress: {
      1: { status: 'review', reviewCount: 3 },
      2: { status: 'unknown-status' },
    },
    wrongWords: {
      1: { word: 'ability', errors: 2 },
      3: { word: 'abandon', errors: 1 },
    },
    heatmap: {
      '2026-07-13': 5,
      'bad-date': 100,
    },
    targetRetention: 0.95,
    fsrsWeights: Array(17).fill(1),
    words: [{ id: 99 }],
  };
  const parsed = backup.parseBackup(JSON.stringify(rootBackup));
  assert(parsed.currentLevel === 'CET6', '保留合法词库等级');
  assert(parsed.wrongWords.length === 2, '兼容 Web 版对象式错词');
  assert(parsed.heatmap['2026-07-13'].total === 5, '兼容 Web 版数字热力图');
  assert(!parsed.heatmap['bad-date'], '忽略非法日期');
  assert(parsed.progress['2'].status === 'new', '非法状态回退为 new');
  assert(parsed.settings.targetRetention === 0.95, '迁移顶层留存率');
  assert(parsed.ignoredCustomWords === true, '提示内置版忽略自定义词库');

  const generated = backup.createBackup({
    currentLevel: 'CET4',
    progress: { 1: { status: 'mastered' } },
    wrongWords: ['1'],
    heatmap: { '2026-07-13': { total: 1, correct: 1, new: 0 } },
    settings: { studyLimit: 25, spellingLimit: 100, dailyGoal: 50, targetRetention: 0.9 },
    customWords: {
      CET4: [{ word: 'localword', meaning: '个人单词', level: 'CET4' }],
      CET6: [],
    },
  }, Array(17).fill(1));
  const roundTrip = backup.parseBackup(JSON.stringify(generated));
  assert(roundTrip.progress['1'].status === 'mastered', '小程序备份可往返');
  assert(roundTrip.settings.studyLimit === 25, '内置预设25题量可往返');
  assert(roundTrip.settings.spellingLimit === 100, '内置预设100题量可往返');
  assert(roundTrip.settings.dailyGoal === 50, '每日目标可往返');
  assert(roundTrip.customWords.CET4.length === 1, '个人词库可随备份往返');

  console.log('backup.test.cjs passed');
}

run();
