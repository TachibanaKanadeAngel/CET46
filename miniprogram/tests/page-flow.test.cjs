const path = require('path');
const { ROOT, loadCommonJS, createPage, assert } = require('./load-module.cjs');

function createWx() {
  const calls = [];
  return {
    calls,
    showToast() {},
    showLoading() {},
    hideLoading() {},
    showModal() {},
    navigateBack() {},
    navigateTo() {},
    redirectTo() {},
    switchTab(options) { calls.push({ type: 'switchTab', options }); },
    getStorageSync() { return ''; },
    setStorageSync() {},
    removeStorageSync() {},
    getAccountInfoSync() { return { miniProgram: { envVersion: 'develop' } }; },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function run() {
  const wx = createWx();
  const words = [
    { id: 1, word: 'alpha', example: 'alpha test' },
    { id: 2, word: 'beta', example: 'beta test' },
  ];
  const app = {
    globalData: { currentLevel: 'CET4', loadedLevel: 'CET4', progress: {}, wrongWords: [], heatmap: {} },
    getWords(level = 'CET4') { return level === this.globalData.loadedLevel ? words : []; },
    getWordData(id) { return this.globalData.progress[id] || (this.globalData.progress[id] = { status: 'new' }); },
    setWordData(id, data) { this.globalData.progress[id] = data; },
    addWrongWord() {},
    removeWrongWord() {},
    recordHeatmap() {},
  };

  const study = createPage('pages/study/index.js', { wx, getApp: () => app });
  study.onLoad();
  assert(study.data.currentWord, '学习页应初始化当前词');
  // 卡片模式默认 autoShowMeaning=true，进入即显示释义（旧的"初始隐藏"UX 已被产品反转）
  assert(study.data.showAnswer === true, '卡片模式默认直接显示释义');
  assert(study.data.hasMemoryHistory === false, '新词不显示无意义的零值记忆参数');
  study.onShowAnswer();
  assert(study.data.showAnswer === false, '可隐藏释义进入自测');
  study.onShowAnswer();
  assert(study.data.showAnswer === true && study.data.clozeMode === true, '再次显示释义时优先展示例句填空');
  study.onRevealExample();
  assert(study.data.clozeMode === false, '可主动显示完整原句');
  study.nextWord();
  assert(study.data.showAnswer === true && study.data.clozeMode === false, '下一题重置释义和例句状态');
  study.finish();
  assert(wx.calls.some(call => call.type === 'switchTab' && call.options.url === '/pages/index/index'), '完成页始终可返回首页');

  app.globalData.progress = {};
  const reviewEmpty = createPage('pages/review/index.js', { wx, getApp: () => app });
  reviewEmpty.onLoad();
  assert(reviewEmpty.data.empty === true && reviewEmpty.data.words.length === 0, '无到期词显示空状态，不混入新词');

  const now = Date.now();
  app.globalData.progress = {
    '1': { status: 'mastered', nextReview: now - 1000, stability: 12, difficulty: 5, reviewCount: 10 },
  };
  const review = createPage('pages/review/index.js', { wx, getApp: () => app });
  review.onLoad();
  assert(review.data.hasMemoryHistory === true, '复习词显示已有记忆参数');
  assert(review.data.showAnswer === true && review.data.clozeMode === false, '复习页进入即显示释义和完整例句');
  review.toggleCloze();
  assert(review.data.clozeMode === true, '复习页可切换到例句填空');
  review.toggleCloze();
  assert(review.data.clozeMode === false, '复习页可切换到完整原句');
  review.onGood();
  assert(app.globalData.progress['1'].status === 'mastered', '已掌握词答对后保持 mastered');

  let wordCardDefinition = null;
  loadCommonJS('components/word-card/word-card.js', {
    Component: definition => { wordCardDefinition = definition; },
  });
  const componentEvents = [];
  const wordCard = {
    data: {
      word: words[0],
      flipped: true,
      cloze: true,
      displayExample: '',
    },
    setData(update) { Object.assign(this.data, update); },
    triggerEvent(name) { componentEvents.push(name); },
  };
  wordCardDefinition.observers['word, cloze'].call(wordCard, words[0], true);
  assert(wordCard.data.displayExample.includes('_'), '单词卡在填空模式下隐藏目标词');
  wordCardDefinition.methods.onRevealCloze.call(wordCard);
  assert(componentEvents.includes('revealexample'), '点击填空句请求页面显示原句');
  assert(wordCard.data.displayExample.includes('_'), '组件不会私自切换成页面未知的原句状态');
  wordCardDefinition.methods.onFlip.call(wordCard);
  assert(!componentEvents.includes('flip'), '已展开卡片不重复触发显示释义');

  const cet4 = deferred();
  const cet6 = deferred();
  const appForIndex = {
    globalData: { currentLevel: 'CET4', loadedLevel: null, progress: {}, heatmap: {}, settings: {} },
    setWords(level, loadedWords) { this.globalData.loadedLevel = level; this.words = loadedWords; },
    getWords(level) { return this.globalData.loadedLevel === level ? this.words || [] : []; },
    flushProgress() {},
  };
  const loaderPath = path.resolve(ROOT, 'utils/vocab-loader.js');
  const index = createPage('pages/index/index.js', {
    wx,
    getApp: () => appForIndex,
    moduleOverrides: {
      [loaderPath]: {
        loadVocab(level) { return level === 'CET6' ? cet6.promise : cet4.promise; },
      },
    },
  });
  const oldRequest = index.requestVocab('CET4');
  const newRequest = index.requestVocab('CET6');
  cet6.resolve({ level: 'CET6', words: [{ id: 6 }] });
  await newRequest;
  cet4.resolve({ level: 'CET4', words: [{ id: 4 }] });
  await oldRequest;
  assert(appForIndex.globalData.loadedLevel === 'CET6', '晚到旧请求不能覆盖新等级');
  assert(index.data.currentLevel === 'CET6', '页面等级与已加载词库一致');

  console.log('page-flow.test.cjs passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
