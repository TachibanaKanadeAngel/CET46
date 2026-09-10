/**
 * CET46 小程序版 FSRS 算法单元测试
 * 通过 mock wx 对象，在 Node 环境中验证算法正确性
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 模拟微信小程序全局对象
global.wx = {
  getStorageSync(key) {
    return global.__mockStorage && global.__mockStorage[key] !== undefined
      ? global.__mockStorage[key]
      : '';
  },
  setStorageSync(key, value) {
    if (!global.__mockStorage) global.__mockStorage = {};
    global.__mockStorage[key] = value;
  },
  removeStorageSync(key) {
    if (global.__mockStorage) delete global.__mockStorage[key];
  },
  clearStorageSync() {
    global.__mockStorage = {};
  },
  getStorageInfoSync() {
    return { currentSize: 0, limitSize: 10240 };
  },
};

global.__wxConfig = { envVersion: 'develop' };

const { loadCommonJS } = require('./load-module.cjs');
const fsrs = loadCommonJS('../../miniprogram/utils/fsrs.js');
const {
  initFSRS,
  setTargetRetention,
  getTargetRetention,
  calculateInterval,
  updateFSRS,
  DEFAULT_TARGET_RETENTION,
} = fsrs;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function runTests() {
  console.log('开始 FSRS 小程序版测试...\n');

  // 测试 1：初始化
  initFSRS();
  assert(getTargetRetention() === DEFAULT_TARGET_RETENTION, '默认目标留存率应为 0.9');
  console.log('✓ 初始化成功');

  // 测试 2：新词学习
  const newWord = { status: 'new', level: 0, reviewCount: 0 };
  const intervalKnown = calculateInterval({ ...newWord }, 3);
  assert(Number.isFinite(intervalKnown) && intervalKnown > 0, '认识新词后间隔应为有限正数');
  console.log(`✓ 新词认识后间隔: ${intervalKnown}ms (${Math.round(intervalKnown / 86400000)} 天)`);

  // 测试 3：新词不认识
  const newWord2 = { status: 'new', level: 0, reviewCount: 0 };
  const intervalUnknown = calculateInterval({ ...newWord2 }, 1);
  assert(Number.isFinite(intervalUnknown) && intervalUnknown > 0, '不认识新词后间隔应为有限正数');
  console.log(`✓ 新词不认识后间隔: ${intervalUnknown}ms (${Math.round(intervalUnknown / 86400000)} 天)`);

  // 测试 4：认识的新词应获得比不认识更长的初始间隔
  assert(intervalKnown > intervalUnknown, '认识新词后的间隔应大于不认识新词的间隔');
  console.log(`✓ 新词间隔区分度: 认识=${Math.round(intervalKnown / 86400000)}天 > 不认识=${Math.round(intervalUnknown / 86400000)}天`);

  // 测试 5：复习单词
  const reviewWord = {
    status: 'review',
    stability: 5,
    difficulty: 5,
    lastStudy: Date.now() - 86400000,
    reviewCount: 3,
  };
  const reviewInterval = calculateInterval({ ...reviewWord }, 3);
  assert(Number.isFinite(reviewInterval) && reviewInterval > 0, '复习后间隔应为有限正数');
  console.log(`✓ 复习后间隔: ${reviewInterval}ms (${Math.round(reviewInterval / 86400000)} 天)`);

  // 测试 6：updateFSRS 直接调用
  const wd = { stability: 5, difficulty: 5 };
  const result = updateFSRS(wd, 3);
  assert(Number.isFinite(result.stability) && result.stability > 0, 'stability 应为正数');
  assert(Number.isFinite(result.difficulty) && result.difficulty >= 1 && result.difficulty <= 10, 'difficulty 应在 [1,10]');
  console.log(`✓ updateFSRS: stability=${result.stability.toFixed(2)}, difficulty=${result.difficulty.toFixed(2)}`);

  // 测试 7：目标留存率影响复习间隔
  // 首次学习不受目标留存率影响，使用有复习历史的单词测试
  const reviewWordForRetention = {
    status: 'review',
    stability: 10,
    difficulty: 5,
    lastStudy: Date.now() - 5 * 86400000,
    reviewCount: 5,
  };
  setTargetRetention(0.85);
  const interval85 = calculateInterval({ ...reviewWordForRetention }, 3);
  setTargetRetention(0.95);
  const interval95 = calculateInterval({ ...reviewWordForRetention }, 3);
  assert(interval85 >= interval95, '目标留存率越低，间隔应越长或相等');
  console.log(`✓ 目标留存率影响: 0.85=${Math.round(interval85 / 86400000)}天, 0.95=${Math.round(interval95 / 86400000)}天`);

  // 测试 8：最大复习间隔限制
  const maxInterval = 365 * 24 * 60 * 60 * 1000;
  const highStabilityWord = {
    status: 'review',
    stability: 1000,
    difficulty: 5,
    lastStudy: Date.now() - 30 * 86400000,
    reviewCount: 20,
  };
  const cappedInterval = calculateInterval({ ...highStabilityWord }, 4);
  assert(cappedInterval <= maxInterval, '高稳定性单词的复习间隔应被限制在 365 天内');
  assert(cappedInterval > 0, '间隔仍为正数');
  console.log(`✓ 最大间隔限制: ${Math.round(cappedInterval / 86400000)}天 <= 365天`);

  // 测试 9：昼夜节律统计影响
  const currentHour = new Date().getHours();
  if (!global.__mockStorage) global.__mockStorage = {};
  global.__mockStorage['cet46_hour_stats'] = JSON.stringify({});
  for (let i = 0; i < 15; i++) {
    fsrs.updateHourStats(currentHour, true);
  }
  const circadian = fsrs.getCircadianScore();
  assert(typeof circadian === 'number' && Number.isFinite(circadian), '昼夜节律分数应为有限数值');
  console.log(`✓ 昼夜节律分数: ${circadian.toFixed(3)}`);

  // 恢复默认
  setTargetRetention(DEFAULT_TARGET_RETENTION);

  console.log('\n所有测试通过 ✓');
}

runTests();
