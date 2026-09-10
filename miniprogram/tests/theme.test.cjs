const { loadCommonJS, assert } = require('./load-module.cjs');

function createWx(mockTheme = 'light') {
  let navColor = {};
  let bgColor = {};
  return {
    getAppBaseInfo() { return { theme: mockTheme }; },
    setNavigationBarColor(opts) { navColor = opts; },
    setBackgroundColor(opts) { bgColor = opts; },
    get navColor() { return navColor; },
    get bgColor() { return bgColor; },
  };
}

function run() {
  const wx = createWx('light');
  const app = { globalData: { settings: { theme: 'auto' } } };
  const getCurrentPages = () => [{}];
  const themeUtil = loadCommonJS('utils/theme.js', { wx, getApp: () => app, getCurrentPages });

  // 1. 测试 auto 模式跟随系统浅色
  assert(themeUtil.isDarkMode('auto') === false, 'auto 模式下系统为 light 应识别为 false');
  themeUtil.syncNativeTheme('auto');
  assert(wx.navColor.frontColor === '#000000', '浅色模式前景色应为黑色');
  assert(wx.navColor.backgroundColor === '#f6e6ba', '浅色模式导航背景应为 #f6e6ba');

  // 2. 测试主动指定 dark
  assert(themeUtil.isDarkMode('dark') === true, '指定 dark 应识别为 true');
  themeUtil.syncNativeTheme('dark');
  assert(wx.navColor.frontColor === '#ffffff', '深色模式前景色应为白色');
  assert(wx.navColor.backgroundColor === '#151322', '深色模式导航背景应为 #151322');

  // 3. 测试系统为 dark 时 auto 模式
  const wxDark = createWx('dark');
  const themeUtilDark = loadCommonJS('utils/theme.js', { wx: wxDark, getApp: () => app, getCurrentPages });
  assert(themeUtilDark.isDarkMode('auto') === true, 'auto 模式下系统为 dark 应识别为 true');
  themeUtilDark.syncNativeTheme('auto');
  assert(wxDark.navColor.frontColor === '#ffffff', '系统 dark 时 auto 模式前景色应为白色');

  console.log('theme.test.cjs passed');
}

run();
