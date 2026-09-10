// 46英语小程序 - 动态主题管理工具
// 支持跟随微信深色模式、主动切换主题，并安全同步原生导航栏与背景颜色

/**
 * 判断当前是否处于暗黑模式
 * @param {string} [themeSetting] 'auto' | 'light' | 'dark'
 * @returns {boolean}
 */
function isDarkMode(themeSetting) {
  const app = typeof getApp === 'function' ? getApp() : null;
  const currentSetting = themeSetting || (app && app.globalData && app.globalData.settings && app.globalData.settings.theme) || 'auto';

  if (currentSetting === 'dark') return true;
  if (currentSetting === 'light') return false;

  // 'auto' 模式：读取微信系统主题（使用免隐私授权的 getAppBaseInfo）
  try {
    if (typeof wx !== 'undefined') {
      if (typeof wx.getAppBaseInfo === 'function') {
        const baseInfo = wx.getAppBaseInfo();
        if (baseInfo && baseInfo.theme) return baseInfo.theme === 'dark';
      }
    }
  } catch (_) {}

  return false;
}

/**
 * 安全同步更新当前活跃页面的微信原生导航栏与窗口背景色
 * @param {string} [themeSetting]
 */
function syncNativeTheme(themeSetting) {
  const dark = isDarkMode(themeSetting);
  const navBg = dark ? '#151322' : '#f6e6ba';
  const navFront = dark ? '#ffffff' : '#000000';

  if (typeof wx !== 'undefined') {
    // 确保有活跃页面时才调用 setNavigationBarColor
    const hasActivePage = typeof getCurrentPages === 'function' && getCurrentPages().length > 0;
    if (hasActivePage && typeof wx.setNavigationBarColor === 'function') {
      try {
        wx.setNavigationBarColor({
          frontColor: navFront,
          backgroundColor: navBg,
          animation: { duration: 150, timingFunc: 'easeInOut' },
        });
      } catch (_) {}
    }

    if (typeof wx.setBackgroundColor === 'function') {
      try {
        wx.setBackgroundColor({
          backgroundColor: navBg,
          backgroundColorTop: navBg,
          backgroundColorBottom: navBg,
        });
      } catch (_) {}
    }
  }
}

module.exports = {
  isDarkMode,
  syncNativeTheme,
};
