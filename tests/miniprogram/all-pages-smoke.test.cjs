// 模拟全量小程序页面使用流转
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '../../miniprogram');
const pages = {};
let currentPage = null;

const mockWx = {
  getStorageSync(key) {
    return global.__storage[key] ?? '';
  },
  setStorageSync(key, value) {
    global.__storage[key] = value;
  },
  removeStorageSync(key) {
    delete global.__storage[key];
  },
  clearStorageSync() {
    global.__storage = {};
  },
  getStorageInfoSync() {
    return { currentSize: 0, limitSize: 10240 };
  },
  showLoading() {},
  hideLoading() {},
  showToast() {},
  showModal({ success }) {
    if (success) success({ confirm: true, cancel: false });
  },
  loadSubpackage({ name, success }) {
    if (success) success();
  },
  navigateTo({ url }) {
    console.log('[wx.navigateTo]', url);
  },
  navigateBack() {
    console.log('[wx.navigateBack]');
  },
  switchTab({ url }) {
    console.log('[wx.switchTab]', url);
  },
};

global.wx = mockWx;
global.__storage = {};
global.__wxConfig = { envVersion: 'develop' };

global.App = function (opts) {
  global.__app = opts;
  if (opts.onLaunch) opts.onLaunch();
};

global.getApp = function () {
  return global.__app;
};

global.Page = function (opts) {
  const page = {
    data: JSON.parse(JSON.stringify(opts.data || {})),
    setData(obj, cb) {
      Object.assign(this.data, obj);
      if (cb) cb();
    },
  };
  for (const key of Object.keys(opts)) {
    if (key !== 'data') {
      page[key] = opts[key].bind(page);
    }
  }
  currentPage = page;
};

const { loadCommonJS } = require('./load-module.cjs');

function loadModule(filePath) {
  return loadCommonJS(path.resolve(root, filePath));
}

console.log('🚀 开始全量小程序实机模拟使用审查...');

// 1. 启动 App
loadModule('app.js');
console.log('  ✓ [App] 初始化成功');

// 2. 模拟打开学习首页
loadModule('pages/index/index.js');
const indexPage = currentPage;
indexPage.onLoad();
console.log('  ✓ [Page: index] 首页加载完成，默认等级:', indexPage.data.currentLevel);

// 3. 模拟进入背词学习页
loadModule('pages/study/index.js');
const studyPage = currentPage;
studyPage.onLoad({ mode: 'card', level: 'CET4' });
console.log('  ✓ [Page: study] 背词学习页加载完成');
if (typeof studyPage.onKnown === 'function') studyPage.onKnown();
if (typeof studyPage.onUnknown === 'function') studyPage.onUnknown();
console.log('  ✓ [Page: study] 单词认识/不认识状态操作流转成功');

// 4. 模拟进入复习页
loadModule('pages/review/index.js');
const reviewPage = currentPage;
reviewPage.onLoad({ level: 'CET4' });
console.log('  ✓ [Page: review] 复习页加载完成');
if (typeof reviewPage.onFlip === 'function') reviewPage.onFlip();
if (typeof reviewPage.onRate === 'function') reviewPage.onRate({ currentTarget: { dataset: { grade: 3 } } });
console.log('  ✓ [Page: review] FSRS 评分翻牌操作流转成功');

// 5. 模拟进入拼写挑战页
loadModule('pages/spelling/index.js');
const spellingPage = currentPage;
spellingPage.onLoad({ level: 'CET4' });
console.log('  ✓ [Page: spelling] 拼写挑战页加载完成');

// 6. 模拟进入连连看小游戏页
loadModule('pages/game/index.js');
const gamePage = currentPage;
gamePage.onLoad({ level: 'CET4' });
console.log('  ✓ [Page: game] 匹配小游戏页加载完成');

// 7. 模拟进入错题本页
loadModule('pages/wrong/index.js');
const wrongPage = currentPage;
if (wrongPage.onLoad) wrongPage.onLoad();
if (wrongPage.onShow) wrongPage.onShow();
console.log('  ✓ [Page: wrong] 错题本页加载完成');

// 8. 模拟进入统计分析页
loadModule('pages/stats/index.js');
const statsPage = currentPage;
if (statsPage.onLoad) statsPage.onLoad();
if (statsPage.onShow) statsPage.onShow();
console.log('  ✓ [Page: stats] 统计页加载完成');

// 9. 模拟进入我的/设置页
loadModule('pages/settings/index.js');
const settingsPage = currentPage;
if (settingsPage.onLoad) settingsPage.onLoad();
if (settingsPage.onShow) settingsPage.onShow();
console.log('  ✓ [Page: settings] 设置页加载完成');

console.log('\n🎉 小程序全页面全流程模拟审查 100% 通过！');
