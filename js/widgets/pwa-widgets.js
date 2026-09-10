import { getMemoryCache } from '../store.js';
import logger from '../utils/logger.js';
import { localDateStr } from '../utils/date.ts';

class PWAWidgets {
  constructor() {
    this.updateTimer = null;
    this.widgetData = {
      pendingReviews: 0,
      todayLearned: 0,
      streak: 0,
      totalWords: 0,
      learnedWords: 0,
    };
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      logger.info('⚠️ 不支持 Service Worker，跳过 Widget 初始化');
      return;
    }

    try {
      await this.registerWidgetScript();
      this.startAutoUpdate();
      this.updateWidgetData();
      logger.info('✅ PWA Widgets 初始化完成');
    } catch (e) {
      logger.info('⚠️ PWA Widgets 初始化失败:', e.message);
    }
  }

  async registerWidgetScript() {
    // PWA Widgets 功能已移除（review-widget.js 已删除）
    // 保留此方法以保持兼容性，但不执行任何操作
    return Promise.resolve();
  }

  startAutoUpdate() {
    this.updateWidgetData();

    this.updateTimer = setInterval(
      () => {
        this.updateWidgetData();
      },
      5 * 60 * 1000
    );

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.updateWidgetData();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  updateWidgetData() {
    const memoryCache = getMemoryCache();
    const now = Date.now();
    const today = localDateStr();

    const progress = memoryCache.progress?.toObject ? memoryCache.progress.toObject() : (memoryCache.progress || {});
    const heatmap = memoryCache.heatmap?.toObject ? memoryCache.heatmap.toObject() : (memoryCache.heatmap || {});

    const pendingReviews = Object.values(progress).filter(wd => {
      if (!wd.nextReview) return false;
      return wd.nextReview <= now;
    }).length;

    const todayLearned = heatmap[today] || 0;

    const learnedWords = Object.values(progress).filter(wd => {
      return wd.level && wd.level > 0;
    }).length;

    this.widgetData = {
      pendingReviews,
      todayLearned,
      streak: this.calculateStreak(heatmap),
      totalWords: Object.keys(progress).length,
      learnedWords,
    };

    this.notifyWidgetUpdate();
  }

  calculateStreak(heatmap) {
    if (!heatmap || Object.keys(heatmap).length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = localDateStr(date);

      const count = heatmap[dateStr] || 0;
      if (count > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  notifyWidgetUpdate() {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'WIDGET_UPDATE',
        data: this.widgetData,
      });
    }

    this.updateBadge();
  }

  updateBadge() {
    if ('setAppBadge' in navigator) {
      if (this.widgetData.pendingReviews > 0) {
        navigator.setAppBadge(this.widgetData.pendingReviews);
      } else {
        navigator.clearAppBadge();
      }
    }
  }

  getWidgetData() {
    return this.widgetData;
  }

  async showWidgetPreview() {
    const preview = document.createElement('div');
    preview.id = 'widget-preview';
    preview.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #e2a053 0%, #b16223 100%);
      color: #2b1100;
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9999;
      min-width: 200px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: widget-slide-in 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes widget-slide-in {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Header
    const header = document.createElement('div');
    header.style.cssText =
      'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';

    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600;';
    title.textContent = '📊 今日学习进度';

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText =
      'background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 0 5px; opacity: 0.8;';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => preview.remove();

    header.appendChild(title);
    header.appendChild(closeBtn);
    preview.appendChild(header);

    // Grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;';

    const createStatItem = (value, label) => {
      const item = document.createElement('div');
      item.style.cssText = 'text-align: center;';

      const valueDiv = document.createElement('div');
      valueDiv.style.cssText = 'font-size: 28px; font-weight: bold; margin-bottom: 5px;';
      valueDiv.textContent = value;

      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = 'font-size: 12px; opacity: 0.9;';
      labelDiv.textContent = label;

      item.appendChild(valueDiv);
      item.appendChild(labelDiv);
      return item;
    };

    grid.appendChild(createStatItem(this.widgetData.pendingReviews, '待复习'));
    grid.appendChild(createStatItem(this.widgetData.todayLearned, '今日学习'));
    grid.appendChild(createStatItem(this.widgetData.streak + '🔥', '连续天数'));
    grid.appendChild(createStatItem(this.widgetData.learnedWords, '已掌握'));

    preview.appendChild(grid);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText =
      'margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 12px; opacity: 0.8;';
    footer.textContent = '💡 添加到桌面即可在桌面查看此微件';
    preview.appendChild(footer);

    document.body.appendChild(preview);

    setTimeout(() => {
      if (preview.parentNode) {
        preview.remove();
      }
    }, 10000);
  }
}

const pwaWidgets = new PWAWidgets();

if (typeof window !== 'undefined') {
  window.pwaWidgets = pwaWidgets;
  window.showWidgetPreview = () => pwaWidgets.showWidgetPreview();
}

export { PWAWidgets, pwaWidgets };
