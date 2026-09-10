const { createPage, assert } = require('./load-module.cjs');

function createWx() {
  const values = {};
  return {
    showToast() {},
    showModal(opts) {
      if (opts && typeof opts.success === 'function') {
        opts.success({ confirm: true });
      }
    },
    navigateBack() {},
    getStorageSync(key) { return values[key] ?? ''; },
    setStorageSync(key, value) { values[key] = value; },
    removeStorageSync(key) { delete values[key]; },
    clearStorageSync() { Object.keys(values).forEach(k => delete values[k]); },
    getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  };
}

function run() {
  const wx = createWx();
  const words = [
    { id: 1, word: 'ability', meaning: '能力', phonetic: '/əˈbɪləti/' },
    { id: 2, word: 'abandon', meaning: '放弃' },
    { id: 3, word: 'accurate', meaning: '准确的' },
    { id: 4, word: 'benefit', meaning: '益处' },
    { id: 5, word: 'confirm', meaning: '确认' },
    { id: 6, word: 'decide', meaning: '决定' },
    { id: 7, word: 'enable', meaning: '使能够' },
    { id: 8, word: 'feature', meaning: '特征' },
  ];
  const app = {
    globalData: {
      progress: {},
      wrongWords: [],
      settings: { spellingLimit: 10 },
    },
    getWords() { return words; },
    getWordData(id) {
      const key = String(id);
      return this.globalData.progress[key] || (this.globalData.progress[key] = { status: 'new', reviewCount: 0 });
    },
    setWordData(id, data) { this.globalData.progress[String(id)] = data; },
    addWrongWord(id) { this.globalData.wrongWords.push(String(id)); },
    removeWrongWord(id) { this.globalData.wrongWords = this.globalData.wrongWords.filter(item => item !== String(id)); },
    recordHeatmap() {},
    flushProgress() { return true; },
  };

  const spelling = createPage('pages/spelling/index.js', { wx, getApp: () => app });
  spelling.onLoad({ source: 'mixed' });
  assert(spelling.data.currentWord, '拼写页可生成题目');
  const firstWord = spelling.data.currentWord;
  spelling.onInput({ detail: { value: firstWord.word } });
  spelling.onSubmit();
  assert(spelling.data.checked && spelling.data.resultType === 'correct', '拼写页可提交正确答案');
  assert(app.globalData.progress[String(firstWord.id)].status === 'review', '拼写结果写入学习进度');
  spelling.nextWord();
  assert(!spelling.data.checked && spelling.data.inputValue === '', '下一道拼写题重置输入状态');
  const spellingIndex = spelling.data.currentIndex;
  spelling.onSkip();
  assert(spelling.data.currentIndex === spellingIndex + 1, '拼写训练可跳过当前题');
  assert(spelling.data.skippedCount === 1, '拼写训练单独统计跳过题数');

  const game = createPage('pages/game/index.js', { wx, getApp: () => app });
  game.onLoad();
  game.startGame();
  assert(game.data.gameActive && game.data.choices.length >= 2, '游戏可生成匹配网格');
  game.onSkip();
  assert(game.data.skipped === 1 && game.data.streak === 0, '游戏可跳过当前题且中断连击');
  game.onChoiceTap({ currentTarget: { dataset: { id: String(game.data.target.id) } } });
  assert(game.data.selectedState === 'correct' && game.data.score > 0, '点击正确单词增加得分');
  game.clearTimers();

  // Settings page test
  wx.getStorageInfoSync = () => ({ currentSize: 12, limitSize: 10240 });
  const settings = createPage('pages/settings/index.js', { wx, getApp: () => ({ ...app, saveProgress: () => true }) });
  settings.onShow();
  // 主题已迁移为原生主题跟随（settings 页不再提供主题切换 UI），仅断言仍保留的发音/自动发音项
  assert(settings.data.accentLabel === '美式发音 (US)', '默认发音为美式发音');

  settings.onAccentChange({ detail: { value: 1 } });
  assert(settings.data.accentLabel === '英式发音 (UK)', '切换英音成功');

  settings.onAutoPlayChange({ detail: { value: true } });
  assert(settings.data.autoPlay === true, '开启自动发音成功');

  settings.exportData();
  assert(settings.data.exportModalVisible, '导出备份打开弹窗');
  assert(settings.data.exportJsonText && settings.data.exportJsonText.includes('46英语'), '导出备份生成有效 JSON');
  settings.closeExportModal();
  assert(!settings.data.exportModalVisible, '可关闭导出弹窗');

  settings.importData();
  assert(settings.data.importModalVisible && settings.data.importModalType === 'backup', '打开恢复备份弹窗');
  settings.closeImportModal();
  assert(!settings.data.importModalVisible, '关闭恢复备份弹窗');

  settings.importCustomVocab();
  assert(settings.data.importModalVisible && settings.data.importModalType === 'custom', '打开自定义词库弹窗');
  settings.closeImportModal();
  assert(!settings.data.importModalVisible, '关闭自定义词库弹窗');

  settings.clearData();
  assert(settings.data.autoPlay === false, '清除数据重置设置项');
  assert(settings.data.targetRetention === 0.9, '清除数据重置留存率');
  assert(settings.data.customWordCount === 0, '清除数据重置个人词库计数');

  console.log('feature-pages.test.cjs passed');
}

run();
