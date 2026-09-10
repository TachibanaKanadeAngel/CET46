/**
 * CET46 小程序版 study-common 单元测试
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 模拟微信小程序全局对象
function createMockWx() {
  const storage = {};
  return {
    getStorageSync(key) {
      return storage[key] !== undefined ? storage[key] : '';
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    clearStorageSync() {
      for (const key of Object.keys(storage)) {
        delete storage[key];
      }
    },
    getStorageInfoSync() {
      return { currentSize: 0, limitSize: 10240 };
    },
    showToast() {},
    navigateBack() {},
    showLoading() {},
    hideLoading() {},
  };
}

function createMockGetCurrentPages(length = 2) {
  return () => Array.from({ length }, (_, i) => ({ route: `pages/mock/${i}` }));
}

global.wx = createMockWx();
global.__wxConfig = { envVersion: 'develop' };
global.getCurrentPages = createMockGetCurrentPages(2);

const { loadCommonJS } = require('./load-module.cjs');
const studyCommon = loadCommonJS('../../miniprogram/utils/study-common.js');
const { createAnswerHandler, goNextWord, goBack } = studyCommon;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function createMockPage(data = {}) {
  return {
    _isAnswering: false,
    data,
    setData(obj) {
      this.data = { ...this.data, ...obj };
    },
    nextWord() {
      this.visitedNextWord = true;
    },
  };
}

function runTests() {
  console.log('开始 study-common 小程序版测试...\n');

  // 测试 1：createAnswerHandler 正常答题
  const page1 = createMockPage({ todayCount: 0 });
  const handler = createAnswerHandler(function(quality) {
    this.processedQuality = quality;
  });
  page1.answer = handler;
  page1.answer(3);
  assert(page1.processedQuality === 3, '应处理传入的 quality');
  assert(page1.data.todayCount === 1, 'todayCount 应递增');
  assert(page1.visitedNextWord, '应调用 nextWord');
  assert(page1._isAnswering === false, '答题完成后应释放锁');
  console.log('✓ 答题处理正常流程');

  // 测试 2：防重点击
  const page2 = createMockPage({ todayCount: 0 });
  page2.answer = createAnswerHandler(function() {
    this.answerCount = (this.answerCount || 0) + 1;
  });
  page2._isAnswering = true;
  page2.answer(3);
  assert(page2.answerCount === undefined, '锁定时不应重复处理');
  assert(page2.data.todayCount === 0, '锁定时 todayCount 不变');
  console.log('✓ 防重点击锁定');

  // 测试 3：goNextWord 中间题
  const page3 = createMockPage({
    currentIndex: 0,
    words: [{ id: 1 }, { id: 2 }, { id: 3 }],
    finished: false,
    progress: 33,
  });
  goNextWord(page3, 'progress');
  assert(page3.data.currentIndex === 1, 'currentIndex 应递增');
  assert(page3.data.currentWord.id === 2, 'currentWord 应切换到下一个');
  assert(page3.data.progress === 67, '进度应更新为 67%');
  assert(page3.data.finished === false, '未完成状态不变');
  console.log('✓ 下一题逻辑');

  // 测试 4：goNextWord 最后一题
  const page4 = createMockPage({
    currentIndex: 2,
    words: [{ id: 1 }, { id: 2 }, { id: 3 }],
    finished: false,
    progress: 67,
  });
  goNextWord(page4, 'progress');
  assert(page4.data.finished === true, '最后一题后应标记完成');
  console.log('✓ 完成状态切换');

  // 测试 5：goBack 调用 navigateBack
  let backCalled = false;
  global.wx.navigateBack = () => { backCalled = true; };
  goBack();
  assert(backCalled, '应调用 wx.navigateBack');
  console.log('✓ 返回上一页');

  console.log('\n所有 study-common 测试通过 ✓');
}

runTests();
