// 词库工具函数
const { WORD_STATUS } = require('./config');

/**
 * 获取新词列表（未学习或状态为 new 的词）
 * @param {Array} words 词库数组
 * @param {Object} progress 进度对象
 * @param {number} limit 数量限制
 * @returns {Array}
 */
function getNewWords(words, progress, limit = 20, shuffle = true) {
  const filtered = words.filter(w => {
    const wd = progress[String(w.id)];
    return !wd || wd.status === WORD_STATUS.NEW || wd.status === undefined;
  });

  if (shuffle) {
    // Fisher-Yates 随机打乱
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = filtered[i];
      filtered[i] = filtered[j];
      filtered[j] = temp;
    }
  }

  return filtered.slice(0, limit);
}

function isDueForReview(wordData, now = Date.now()) {
  if (!wordData || (wordData.status !== WORD_STATUS.REVIEW && wordData.status !== WORD_STATUS.MASTERED)) {
    return false;
  }
  return Number.isFinite(wordData.nextReview) && wordData.nextReview > 0 && now >= wordData.nextReview;
}

/**
 * 获取待复习列表
 * @param {Array} words 词库数组
 * @param {Object} progress 进度对象
 * @param {number} limit 数量限制
 * @returns {Array}
 */
function getReviewWords(words, progress, limit = 50) {
  const now = Date.now();
  return words
    .filter(w => {
      const wd = progress[String(w.id)];
      return isDueForReview(wd, now);
    })
    .sort((a, b) => {
      const wa = progress[String(a.id)];
      const wb = progress[String(b.id)];
      const ta = Number.isFinite(wa.nextReview) ? wa.nextReview : 0;
      const tb = Number.isFinite(wb.nextReview) ? wb.nextReview : 0;
      return ta - tb;
    })
    .slice(0, limit);
}

/**
 * 统计各类单词数量
 * @param {Array} words 词库数组
 * @param {Object} progress 进度对象
 * @returns {Object}
 */
function getStats(words, progress) {
  let newCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;

  words.forEach(w => {
    const wd = progress[String(w.id)];
    if (!wd || wd.status === WORD_STATUS.NEW || !wd.status) {
      newCount++;
    } else if (wd.status === WORD_STATUS.REVIEW) {
      reviewCount++;
    } else if (wd.status === WORD_STATUS.MASTERED) {
      masteredCount++;
    }
  });

  return { newCount, reviewCount, masteredCount, total: words.length };
}

module.exports = {
  getNewWords,
  getReviewWords,
  getStats,
  isDueForReview,
};
