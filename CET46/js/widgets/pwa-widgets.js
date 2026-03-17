import { getMemoryCache } from '../store.js';

class PWAWidgets {
  constructor() {
    this.updateTimer = null;
    this.widgetData = {
      pendingReviews: 0,
      todayLearned: 0,
      streak: 0,
      totalWords: 0,
      learnedWords: 0
    };
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('⚠️ 不支持 Service Worker，跳过 Widget 初始化');
      return;
    }

    try {
      await this.registerWidgetScript();
      this.startAutoUpdate();
      this.updateWidgetData();
      console.log('✅ PWA Widgets 初始化完成');
    } catch (e) {
      console.log('⚠️ PWA Widgets 初始化失败:', e.message);
    }
  }

  async registerWidgetScript() {
    const registration = await navigator.serviceWorker.ready;
    
    if ('widgets' in registration) {
      await registration.widgets.register({
        name: 'CET46 复习进度',
        src: 'js/widgets/review-widget.js',
        updateFrequency: 'frequent'
      });
    }
  }

  startAutoUpdate() {
    this.updateWidgetData();
    
    this.updateTimer = setInterval(() => {
      this.updateWidgetData();
    }, 5 * 60 * 1000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateWidgetData();
      }
    });
  }

  updateWidgetData() {
    const memoryCache = getMemoryCache();
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    const pendingReviews = Object.values(memoryCache.progress || {}).filter(wd => {
      if (!wd.nextReview) return false;
      return wd.nextReview <= now;
    }).length;

    const todayLearned = (memoryCache.heatmap || {})[today] || 0;

    const learnedWords = Object.values(memoryCache.progress || {}).filter(wd => {
      return wd.level && wd.level > 0;
    }).length;

    this.widgetData = {
      pendingReviews,
      todayLearned,
      streak: this.calculateStreak(memoryCache.heatmap),
      totalWords: Object.keys(memoryCache.progress || {}).length,
      learnedWords
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
      const dateStr = date.toISOString().split('T')[0];
      
      if (heatmap[dateStr] && heatmap[dateStr] > 0) {
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
        data: this.widgetData
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

    preview.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">📊 今日学习进度</h3>
        <button id="close-widget-preview" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 0 5px; opacity: 0.8;">×</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${this.widgetData.pendingReviews}</div>
          <div style="font-size: 12px; opacity: 0.9;">待复习</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${this.widgetData.todayLearned}</div>
          <div style="font-size: 12px; opacity: 0.9;">今日学习</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${this.widgetData.streak}🔥</div>
          <div style="font-size: 12px; opacity: 0.9;">连续天数</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${this.widgetData.learnedWords}</div>
          <div style="font-size: 12px; opacity: 0.9;">已掌握</div>
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 12px; opacity: 0.8;">
        💡 添加到桌面即可在桌面查看此微件
      </div>
    `;

    document.body.appendChild(preview);

    document.getElementById('close-widget-preview').onclick = () => {
      preview.remove();
    };

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
