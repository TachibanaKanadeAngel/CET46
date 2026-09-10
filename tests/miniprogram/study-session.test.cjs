/**
 * CET46 小程序版 study-session（断点续学）单元测试
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
    showToast() {},
  };
}

global.wx = createMockWx();

const { loadCommonJS } = require('./load-module.cjs');
const { saveSession, loadSession, clearSession } = loadCommonJS(
  '../../miniprogram/utils/study-session.js'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function runTests() {
  console.log('开始 study-session（断点续学）测试...\n');

  // 测试 1：当前词库等级可保存并读取
  saveSession({ level: 'CET4', queueIds: ['a', 'b', 'c'], currentIndex: 1, todayCount: 2, totalCount: 3 });
  const loaded = loadSession('CET4');
  assert(!!loaded, 'CET4 会话应能读取');
  assert(loaded.level === 'CET4', '等级应正确');
  assert(Array.isArray(loaded.queueIds) && loaded.queueIds.length === 3, '队列 ids 应完整');
  assert(loaded.currentIndex === 1, '当前索引应保留');
  assert(loaded.todayCount === 2, '今日计数应保留');
  console.log('✓ 保存并读取当前等级会话');

  // 测试 2：不同等级会话不混用
  const otherLevel = loadSession('CET6');
  assert(otherLevel === null, 'CET6 不应读取到 CET4 的会话（应返回 null）');
  console.log('✓ 等级隔离');

  // 测试 3：已全部学完（currentIndex >= queueIds.length）视为无会话
  saveSession({ level: 'CET4', queueIds: ['a', 'b'], currentIndex: 2, todayCount: 3, totalCount: 2 });
  assert(loadSession('CET4') === null, '学完后不应再提示续学');
  console.log('✓ 完成后清除续学提示');

  // 测试 4：空队列不保存/不视为有效
  saveSession({ level: 'CET4', queueIds: [], currentIndex: 0, todayCount: 0 });
  assert(loadSession('CET4') === null, '空队列不应有会话');
  console.log('✓ 空队列防护');

  // 测试 5：清除会话后无法读取
  saveSession({ level: 'CET6', queueIds: ['x'], currentIndex: 0, todayCount: 0, totalCount: 1 });
  assert(loadSession('CET6') !== null, 'CET6 会话应存在');
  clearSession();
  assert(loadSession('CET6') === null, '清除后应返回 null');
  console.log('✓ 清除会话');

  // 测试 6：未学完（中间索引）仍是有效会话
  saveSession({ level: 'CET4', queueIds: ['a', 'b', 'c', 'd'], currentIndex: 2, todayCount: 1, totalCount: 4 });
  const midLoad = loadSession('CET4');
  assert(midLoad !== null && midLoad.currentIndex === 2, '中间进度应被视为有效续学点');
  console.log('✓ 中间进度可续学');

  console.log('\n所有 study-session 测试通过 ✓');
}

runTests();