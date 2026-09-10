// 学习/复习页面公共逻辑
const logger = require('./logger');

/**
 * 创建带防重锁的答题处理函数
 * @param {Function} processAnswer - 实际处理答题的回调 (currentWord) => void
 * @returns {Function} 包装后的 answer 函数
 */
function createAnswerHandler(processAnswer) {
  return function answer(...args) {
    if (this._isAnswering) return;
    this._isAnswering = true;

    const app = typeof getApp === 'function' ? getApp() : null;
    const currentWord = this.data.currentWord;
    if (app && typeof app.captureAnswerAction === 'function' && currentWord) {
      app.captureAnswerAction(currentWord.id);
    }

    try {
      processAnswer.apply(this, args);
      this.setData({
        todayCount: this.data.todayCount + 1,
        canUndo: Boolean(app && typeof app.canUndoAnswer === 'function' && app.canUndoAnswer()),
      });
      this.nextWord();
    } catch (e) {
      logger.error('[study-common] processAnswer failed:', e);
      if (typeof wx !== 'undefined') {
        wx.showToast({ title: '答题处理失败，请重试', icon: 'none' });
      }
    } finally {
      this._isAnswering = false;
    }
  };
}

/**
 * 统一的下一题逻辑
 * @param {Page} page - 页面实例
 * @param {string} progressKey - 进度条字段名，如 'studyProgress'/'reviewProgress'
 */
function goNextWord(page, progressKey) {
  const nextIndex = page.data.currentIndex + 1;
  if (nextIndex >= page.data.words.length) {
    page.setData({ finished: true });
    return;
  }

  const progress = Math.min(100, Math.round((nextIndex + 1) / page.data.words.length * 100));
  const update = {
    currentIndex: nextIndex,
    currentWord: page.data.words[nextIndex],
    [progressKey]: progress,
  };
  page.setData(update);
}

/**
 * 返回首页 Tab。训练页可能没有可用的页面栈，不能依赖 navigateBack。
 */
function goHome() {
  wx.switchTab({ url: '/pages/index/index' });
}

/**
 * 返回上一页。若页面栈不可用时 fall back 到首页 Tab。
 */
function goBack() {
  const pages = getCurrentPages && typeof getCurrentPages === 'function' ? getCurrentPages() : [];
  if (pages.length > 1) {
    wx.navigateBack({ delta: 1 });
  } else {
    goHome();
  }
}

module.exports = {
  createAnswerHandler,
  goNextWord,
  goHome,
  goBack,
};
