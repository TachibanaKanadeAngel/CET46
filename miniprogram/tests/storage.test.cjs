const { loadCommonJS, assert } = require('./load-module.cjs');

function createWx() {
  const values = {};
  let writes = 0;
  let failAt = -1;
  return {
    values,
    get writes() { return writes; },
    failNextWrite(offset = 1) { failAt = writes + offset; },
    getStorageSync(key) { return values[key] === undefined ? '' : values[key]; },
    setStorageSync(key, value) {
      writes++;
      if (writes === failAt) throw new Error('quota exceeded');
      values[key] = value;
    },
    removeStorageSync(key) { delete values[key]; },
    clearStorageSync() { Object.keys(values).forEach(key => delete values[key]); },
  };
}

function run() {
  const wx = createWx();
  const quietConsole = { log() {}, info() {}, warn() {}, error() {} };
  const { storage } = loadCommonJS('utils/storage.js', { wx, console: quietConsole });

  wx.values.legacy = { ok: true };
  assert(storage.getChunked('legacy').ok, '应读取旧简单对象');

  wx.values.legacy_chunks = 2;
  wx.values.legacy_chunk_0 = '{"text":"old';
  wx.values.legacy_chunk_1 = ' chunks"}';
  delete wx.values.legacy;
  assert(storage.getChunked('legacy').text === 'old chunks', '应读取旧分片');

  const first = { text: 'a'.repeat(2600), revision: 1 };
  assert(storage.setChunked('progress', first, 1024), '首次事务保存成功');
  assert(storage.getChunked('progress').revision === 1, '首次事务读取成功');
  assert(wx.values.progress_manifest.schemaVersion === 2, '应写入 v2 manifest');

  wx.failNextWrite(2);
  const failed = storage.setChunked('progress', { text: 'b'.repeat(2600), revision: 2 }, 1024);
  assert(failed === false, '中途写入失败应返回 false');
  assert(storage.getChunked('progress').revision === 1, '失败后保留上一份数据');

  assert(storage.setChunked('progress', { text: 'c'.repeat(2600), revision: 3 }, 1024), '第二代保存成功');
  const manifest = wx.values.progress_manifest;
  assert(manifest.previous && manifest.previous.id, 'manifest 应保留上一代');
  wx.values[`progress_g_${manifest.active.id}_0`] = 'corrupted';
  assert(storage.getChunked('progress').revision === 1, '活动代损坏时回退上一代');

  wx.values.to_migrate = { version: 'legacy' };
  assert(storage.setChunked('to_migrate', { version: 'v2' }, 1024), '旧简单对象可迁移');
  assert(wx.values.to_migrate_manifest === undefined, '小对象无需事务 manifest');
  assert(storage.getChunked('to_migrate').version === 'v2', '迁移后数据正确');

  console.log('storage.test.cjs passed');
}

run();
