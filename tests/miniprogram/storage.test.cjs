/**
 * 微信小程序存储封装单元测试
 */

// 模拟微信小程序全局对象
if (!global.wx) {
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
    getAccountInfoSync() {
      return { miniProgram: { envVersion: 'develop' } };
    },
  };
}

if (!global.__wxConfig) {
  global.__wxConfig = { envVersion: 'develop' };
}

const { loadCommonJS } = require('./load-module.cjs');
const { storage, STORAGE_KEYS } = loadCommonJS('../../miniprogram/utils/storage.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function runTests() {
  console.log('开始 storage 小程序版测试...\n');

  global.__mockStorage = {};

  // 测试 1：基本 set/get
  storage.set('key1', 'value1');
  assert(storage.get('key1') === 'value1', 'set/get 字符串值');
  console.log('✓ 基本 set/get');

  // 测试 2：数字、对象、数组
  storage.set('num', 42);
  assert(storage.get('num') === 42, '数字值保持类型');
  const obj = { a: 1, b: [2, 3] };
  storage.set('obj', obj);
  assert(JSON.stringify(storage.get('obj')) === JSON.stringify(obj), '对象值正确存储');
  console.log('✓ 多类型值存储');

  // 测试 3：remove
  storage.remove('key1');
  assert(!storage.get('key1'), 'remove 后返回空值');
  console.log('✓ remove');

  // 测试 4：clear
  storage.clear();
  assert(!storage.get('num'), 'clear 后数据清空');
  console.log('✓ clear');

  // 测试 5：小对象走非分片路径
  const small = { items: [1, 2, 3] };
  storage.setChunked('small', small, 100);
  assert(storage.get('small').items.length === 3, '小对象直接存储');
  assert(!storage.get('small_chunks'), '小对象不产生分片计数');
  console.log('✓ 小对象非分片存储');

  // 测试 6：大对象分片存储与读取
  const big = { text: 'a'.repeat(100) };
  storage.setChunked('big', big, 30);
  const chunkCount = storage.get('big_chunks');
  assert(typeof chunkCount === 'number' && chunkCount > 1, '大对象产生多个分片');
  const restored = storage.getChunked('big');;
  assert(restored.text === big.text, '分片数据可完整还原');
  console.log(`✓ 大对象分片存储（${chunkCount} 片）并还原`);

  // 测试 7：分片 → 非分片时清理旧分片
  storage.setChunked('big', { text: 'short' }, 30);
  assert(storage.get('big').text === 'short', '缩小为简单对象后读取正确');
  assert(!storage.get('big_chunks'), '旧分片计数已清理');
  assert(!storage.get('big_chunk_0'), '旧分片 chunk_0 已清理');
  console.log('✓ 分片缩小时清理孤儿数据');

  // 测试 8：分片数量减少时清理多余分片
  const bigger = { text: 'b'.repeat(200) };
  storage.setChunked('big', bigger, 30);
  const firstCount = storage.get('big_chunks');
  const smaller = { text: 'c'.repeat(50) };
  storage.setChunked('big', smaller, 30);
  const secondCount = storage.get('big_chunks');
  assert(secondCount < firstCount, '分片数量减少');
  assert(storage.getChunked('big').text === smaller.text, '减少分片后数据正确');
  assert(!storage.get(`big_chunk_${firstCount - 1}`), '超出新数量的旧分片已清理');
  console.log('✓ 分片数量减少时清理多余分片');

  console.log('\nstorage 测试通过 ✓');
}

runTests();
