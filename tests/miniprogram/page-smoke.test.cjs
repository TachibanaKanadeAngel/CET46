// 小程序页面冒烟测试：模拟 wx/App/Page 运行首页逻辑

const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '../../miniprogram');

// 模拟 Page 实例
const pages = {};
let currentPage = null;

const mockWx = {
  getStorageSync(key) {
    try {
      return global.__storage[key] ?? '';
    } catch (e) {
      return '';
    }
  },
  setStorageSync(key, value) {
    global.__storage[key] = value;
  },
  removeStorageSync(key) {
    delete global.__storage[key];
  },
  clearStorageSync() {
    global.__storage = {};
  },
  getStorageInfoSync() {
    return { currentSize: 0, limitSize: 10240 };
  },
  showLoading() {},
  hideLoading() {},
  showToast() {},
  showModal() {},
  loadSubpackage({ name, success, fail }) {
    console.log('[wx.loadSubpackage]', name);
    // 模拟分包加载成功
    setTimeout(() => {
      if (success) success();
    }, 0);
  },
  navigateTo() {},
  navigateBack() {},
  switchTab() {},
};

global.wx = mockWx;
global.__storage = {};
global.__wxConfig = { envVersion: 'develop' };

global.App = function (opts) {
  global.__app = opts;
  if (opts.onLaunch) {
    try {
      opts.onLaunch();
      console.log('[App.onLaunch] success');
    } catch (e) {
      console.error('[App.onLaunch] error:', e);
    }
  }
};

global.getApp = function () {
  return global.__app;
};

global.Page = function (opts) {
  const page = {
    data: opts.data || {},
    setData(obj) {
      Object.assign(this.data, obj);
    },
  };
  for (const key of Object.keys(opts)) {
    if (key !== 'data') {
      page[key] = opts[key].bind(page);
    }
  }
  currentPage = page;
  pages.index = page;
};

// 辅助：加载 miniprogram 内 JS（替换相对路径）
function loadModule(filePath) {
  const fullPath = path.resolve(root, filePath);
  const code = fs.readFileSync(fullPath, 'utf-8');
  const wrapped = `(function (exports, require, module, __filename, __dirname) {\n${code}\n})`;
  const fn = eval(wrapped);
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id.startsWith('.')) {
      const resolved = path.resolve(path.dirname(fullPath), id);
      const relToRoot = path.relative(root, resolved);
      const targetPath = relToRoot.endsWith('.js') ? relToRoot : relToRoot + '.js';
      return loadModule(targetPath);
    }
    return require(id);
  };
  customRequire.async = (id) => {
    return new Promise((resolve, reject) => {
      try {
        resolve(customRequire(id));
      } catch (e) {
        reject(e);
      }
    });
  };
  fn(mod.exports, customRequire, mod, fullPath, path.dirname(fullPath));
  return mod.exports;
}

console.log('=== CET46 miniprogram smoke test ===');

try {
  loadModule('app.js');
} catch (e) {
  console.error('app.js failed:', e);
  process.exit(1);
}

try {
  loadModule('pages/index/index.js');
} catch (e) {
  console.error('index.js failed:', e);
  process.exit(1);
}

console.log('[Page] current page data:', JSON.stringify(currentPage.data, null, 2));

if (currentPage.onLoad) {
  try {
    currentPage.onLoad();
    console.log('[Page.onLoad] completed without throw');
    console.log('[Page] data after onLoad:', JSON.stringify(currentPage.data, null, 2));
  } catch (e) {
    console.error('[Page.onLoad] error:', e);
  }
}

setTimeout(() => {
  console.log('[Page] data after async (CET4):', JSON.stringify(currentPage.data.stats, null, 2));
  
  // Switch to CET6
  console.log('--- Switching to CET6 ---');
  if (currentPage.onLevelChange) {
    currentPage.onLevelChange({ detail: { value: 1 } }); // index 1 is CET6
  }
  
  setTimeout(() => {
    console.log('[Page] data after async (CET6):', JSON.stringify(currentPage.data.stats, null, 2));
    console.log('=== smoke test end ===');
  }, 500);
}, 500);
