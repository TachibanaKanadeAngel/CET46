/**
 * 词库工具函数单元测试
 */

const { loadCommonJS } = require('./load-module.cjs');
const { getNewWords, getReviewWords, getStats } = loadCommonJS('../../miniprogram/utils/vocab.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

const sampleWords = [
  { id: 1, word: 'apple' },
  { id: 2, word: 'banana' },
  { id: 3, word: 'cherry' },
  { id: 4, word: 'date' },
  { id: 5, word: 'elderberry' },
];

function runTests() {
  console.log('开始 vocab 小程序版测试...\n');

  // 测试 1：全部为新词
  const progress1 = {};
  const newWords = getNewWords(sampleWords, progress1, 3, false);
  assert(newWords.length === 3, '应返回 3 个新词');
  assert(newWords[0].id === 1, '新词按原始顺序返回');
  console.log('✓ 获取新词列表');

  // 测试 2：部分已学习
  const progress2 = {
    '1': { status: 'review', nextReview: Date.now() - 1000 },
    '3': { status: 'mastered' },
  };
  const newWords2 = getNewWords(sampleWords, progress2, 10);
  assert(newWords2.length === 3, '应过滤掉已学习/已掌握的词');
  assert(newWords2.every(w => w.id !== 1 && w.id !== 3), '结果中不包含已学习词');
  console.log('✓ 新词过滤已学习状态');

  // 测试 3：复习队列按到期时间排序
  const now = Date.now();
  const progress3 = {
    '1': { status: 'review', nextReview: now + 86400000 },
    '2': { status: 'review', nextReview: now - 1000 },
    '4': { status: 'review', nextReview: now - 5000 },
    '5': { status: 'new' },
  };
  const reviewWords = getReviewWords(sampleWords, progress3, 10);
  assert(reviewWords.length === 2, '只返回已到期的复习词');
  assert(reviewWords[0].id === 4, '按 nextReview 升序排列');
  assert(reviewWords[1].id === 2, '按 nextReview 升序排列');
  console.log('✓ 复习队列排序与过滤');

  // 测试 4：复习限制数量
  const progress4 = {
    '1': { status: 'review', nextReview: now - 1000 },
    '2': { status: 'review', nextReview: now - 2000 },
    '3': { status: 'review', nextReview: now - 3000 },
  };
  const limited = getReviewWords(sampleWords, progress4, 2);
  assert(limited.length === 2, '应受 limit 限制');
  console.log('✓ 复习数量限制');

  // 测试 5：统计
  const progress5 = {
    '1': { status: 'new' },
    '2': { status: 'review', nextReview: now + 1000 },
    '3': { status: 'mastered' },
    '4': { status: 'review', nextReview: now - 1000 },
  };
  const stats = getStats(sampleWords, progress5);
  assert(stats.newCount === 2, '新词数正确（含无进度词）');
  assert(stats.reviewCount === 2, '复习数正确');
  assert(stats.masteredCount === 1, '掌握数正确');
  assert(stats.total === 5, '总数正确');
  console.log('✓ 统计计算');

  console.log('\nvocab 测试通过 ✓');
}

runTests();
