const { loadCommonJS, assert } = require('./load-module.cjs');

const mockStorage = {};
const wx = {
  getStorageSync: key => mockStorage[key] ?? '',
  setStorageSync: (key, value) => { mockStorage[key] = value; },
  removeStorageSync: key => { delete mockStorage[key]; },
  clearStorageSync: () => {},
  getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }),
};

function run() {
  const { getReviewWords, isDueForReview } = loadCommonJS('utils/vocab.js', { wx });
  const now = Date.now();
  const words = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  const progress = {
    '1': { status: 'review', nextReview: now - 100 },
    '2': { status: 'mastered', nextReview: now - 200 },
    '3': { status: 'mastered', nextReview: now + 10000 },
    '4': { status: 'new', nextReview: now - 100 },
  };
  const due = getReviewWords(words, progress, 10);
  assert(due.length === 2, '到期队列应包含 review 和 mastered');
  assert(due[0].id === 2 && due[1].id === 1, '到期队列按时间排序');
  assert(!isDueForReview(progress['3'], now), '未到期 mastered 不进入队列');
  assert(!isDueForReview(progress['4'], now), 'new 不进入复习队列');

  const fsrs = loadCommonJS('utils/fsrs.js', { wx });
  const base = {
    status: 'review',
    stability: 10,
    difficulty: 5,
    lastStudy: now - 5 * 86400000,
    reviewCount: 5,
  };
  fsrs.setTargetRetention(0.85);
  const interval85 = fsrs.calculateInterval({ ...base }, 3);
  fsrs.setTargetRetention(0.95);
  const interval95 = fsrs.calculateInterval({ ...base }, 3);
  assert(Number.isFinite(interval85) && interval85 > 0, '间隔必须是有限正数');
  assert(interval85 >= interval95, '更高留存率不应产生更长间隔');
  assert(interval85 <= 365 * 86400000, '间隔不超过 365 天');

  console.log('scheduler.test.cjs passed');
}

run();
