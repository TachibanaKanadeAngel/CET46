const { loadCommonJS, assert } = require('./load-module.cjs');

async function run() {
  const values = {};
  let writes = 0;
  const wx = {
    getStorageSync: key => values[key] ?? '',
    setStorageSync: (key, value) => { writes++; values[key] = value; },
    removeStorageSync: key => { delete values[key]; },
    clearStorageSync: () => {},
    showToast: () => {},
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
  };
  let app = null;
  loadCommonJS('app.js', { wx, App: definition => { app = definition; } });
  assert(app, 'app.js 应注册 App');

  assert(app.setWords('CET4', [{ id: 1 }]), '合法等级可设置词库');
  assert(app.getWords('CET4').length === 1, '匹配等级返回词库');
  assert(app.getWords('CET6').length === 0, '不匹配等级不得返回旧词库');
  assert(app.setWords('CET8', [{ id: 8 }]) === false, '非法等级被拒绝');
  assert(app.setCustomWords({ CET4: [{ word: 'localword', meaning: '个人单词', level: 'CET4' }], CET6: [] }), '个人词可保存');
  app.setWords('CET4', [{ id: 1, word: 'ability', meaning: '能力' }]);
  assert(app.getWords('CET4').some(word => word.word === 'localword'), '个人词合并进当前词库');
  writes = 0;

  app.globalData.progress = { '1': { status: 'review' } };
  app.globalData.wrongWords = [];
  app.globalData.heatmap = {};
  app.globalData.settings = {};
  app.saveProgress();
  assert(app._saveTimer, '延迟保存已安排');
  app.cancelPendingSave();
  assert(app._saveTimer === null, '可取消待执行保存');
  await new Promise(resolve => setTimeout(resolve, 550));
  assert(writes === 0, '取消后不会延迟写回数据');

  app.globalData.progress = { '2': { status: 'review', errorCount: 1 } };
  app.globalData.wrongWords = [];
  app.addWrongWord('2');
  assert(app.globalData.progress['2'].errorCount === 2, '答错次数会累计到原进度');
  assert(app.globalData.wrongWords[0] === '2', '答错单词进入错词列表');
  app.cancelPendingSave();

  const { localDateStr } = loadCommonJS('utils/date.js');
  const today = localDateStr();
  app.globalData.progress = { '3': { status: 'new', reviewCount: 0 } };
  app.globalData.wrongWords = [];
  app.globalData.heatmap = { [today]: { total: 1, correct: 1, new: 1 } };
  app.clearAnswerActions();
  app.captureAnswerAction('3');
  app.globalData.progress['3'] = { status: 'review', reviewCount: 1 };
  app.globalData.wrongWords = ['3'];
  app.recordHeatmap(false, false);
  const undone = app.undoLastAnswer();
  assert(undone.restored, '撤销会找到上一题事务');
  assert(app.globalData.progress['3'].status === 'new', '撤销恢复原单词进度');
  assert(app.globalData.wrongWords.length === 0, '撤销恢复错词成员关系');
  assert(app.globalData.heatmap[today].total === 1, '撤销恢复当天统计');
  assert(JSON.stringify(JSON.parse(values.cet46_hour_stats)) === '{}', '撤销恢复按小时统计');

  console.log('app-state.test.cjs passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
