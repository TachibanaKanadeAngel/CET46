const { loadCommonJS, assert } = require('./load-module.cjs');

async function run() {
  let attempts = 0;
  const loader = loadCommonJS('utils/vocab-loader.js', {
    requireAsync: id => {
      attempts++;
      if (attempts < 3) return Promise.reject(new Error('temporary failure'));
      return Promise.resolve({ WORDS: [{ id: 1, word: id.includes('level6') ? 'six' : 'four' }] });
    },
  });

  const retries = [];
  const result = await loader.loadVocab('CET6', {
    retries: 2,
    retryDelayMs: 0,
    timeoutMs: 50,
    onRetry: info => retries.push(info.attempt),
  });
  assert(result.level === 'CET6' && result.words[0].word === 'six', '应返回指定等级词库');
  assert(attempts === 3 && retries.length === 2, '应按配置重试两次');

  let invalidRejected = false;
  try { await loader.loadVocab('CET8'); } catch (e) { invalidRejected = true; }
  assert(invalidRejected, '无效等级必须拒绝');

  const timeoutLoader = loadCommonJS('utils/vocab-loader.js', {
    requireAsync: () => new Promise(() => {}),
  });
  let timedOut = false;
  try { await timeoutLoader.loadVocab('CET4', { retries: 0, timeoutMs: 5 }); } catch (e) {
    timedOut = /超时/.test(e.message);
  }
  assert(timedOut, '加载超时必须拒绝');

  console.log('vocab-loader.test.cjs passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
