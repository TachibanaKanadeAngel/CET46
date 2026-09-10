const { app, BrowserWindow, Menu, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const util = require('util');
const { showMasterPasswordPrompt } = require('./password-prompt');

const scryptAsync = util.promisify(crypto.scrypt);

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

// 初始化用户数据存储目录逻辑，必须在 electron-store 等使用该路径的库初始化前运行
function setupUserDataPath() {
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR;
  let userDataPath;

  if (process.env.CET46_USER_DATA_DIR) {
    userDataPath = process.env.CET46_USER_DATA_DIR;
  } else if (isPortable) {
    userDataPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'CET46-Data');
  } else {
    userDataPath = path.join(app.getPath('appData'), 'CET46');
  }

  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    app.setPath('userData', userDataPath);
    console.log('CET46 用户数据目录已设置为：', userDataPath);
  } catch (err) {
    console.error('配置自定义 userData 路径失败:', err);
  }
}

setupUserDataPath();

const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

/**
 * 生成或加载 electron-store 的加密主密钥
 * 安全设计：
 * 1. 首次运行生成 256 位随机密钥（非派生自可预测标识）
 * 2. 优先使用 OS 密钥链（safeStorage）加密存储密钥文件
 * 3. M6 修复：safeStorage 不可用时从用户主密码派生密钥（scrypt），
 *    仅存储盐值+验证器，不再明文存储密钥
 * @returns {Promise<string>} 64 字符 hex 密钥
 */
async function loadOrCreateStoreKey() {
  const keyFilePath = path.join(app.getPath('userData'), 'store.key');
  const saltFilePath = keyFilePath + '.salt';

  // 尝试加载已有密钥
  if (await pathExists(keyFilePath)) {
    try {
      const rawData = (await fsp.readFile(keyFilePath, 'utf8')).trim();
      // 检测是否为 safeStorage 加密格式（base64）
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(rawData, 'base64');
        if (buffer.length > 0) {
          try {
            const decrypted = safeStorage.decryptString(buffer);
            if (/^[0-9a-f]{64}$/.test(decrypted)) return decrypted;
          } catch (e) {
            console.warn('safeStorage 解密失败，可能跨平台/跨用户迁移，尝试主密码派生:', e.message);
          }
        }
      }
      // M6: safeStorage 不可用或解密失败 - 检查是否有主密码盐值
      if (await pathExists(saltFilePath)) {
        return await deriveKeyFromMasterPassword(saltFilePath, false);
      }
      // 旧版明文 hex 密钥（向后兼容，不再生成新明文密钥）
      if (/^[0-9a-f]{64}$/.test(rawData)) {
        console.warn('⚠️ 检测到旧版明文密钥。建议在启用 OS 密钥链后迁移以增强安全性。');
        return rawData;
      }
    } catch (e) {
      console.error('读取密钥文件失败:', e.message);
    }
  }

  // 生成新密钥
  if (safeStorage.isEncryptionAvailable()) {
    const newKey = crypto.randomBytes(32).toString('hex');
    try {
      const encrypted = safeStorage.encryptString(newKey).toString('base64');
      await fsp.writeFile(keyFilePath, encrypted, { mode: 0o600 });
      console.log('✅ store.key 已用 OS 密钥链加密保存');
    } catch (e) {
      console.error('保存密钥文件失败:', e.message);
    }
    return newKey;
  }

  // M6: safeStorage 不可用 - 从主密码派生密钥（不再明文存储）
  return await deriveKeyFromMasterPassword(saltFilePath, true);
}

/**
 * 从用户主密码派生 store 加密密钥（scrypt + 盐值 + 验证器）
 * @param {string} saltFilePath - 盐值文件路径
 * @param {boolean} isFirstTime - true=首次设置，false=已有盐值需验证
 * @returns {Promise<string>} 64 字符 hex 密钥
 */
async function deriveKeyFromMasterPassword(saltFilePath, isFirstTime) {
  let salt;
  let storedVerifier = null;

  if (isFirstTime) {
    salt = crypto.randomBytes(32);
  } else {
    const saltContent = (await fsp.readFile(saltFilePath, 'utf8')).trim().split('\n');
    salt = Buffer.from(saltContent[0], 'hex');
    storedVerifier = saltContent[1] || null;
  }

  while (true) {
    const password = await showMasterPasswordPrompt(null, isFirstTime);
    if (password === null) {
      app.quit();
      throw new Error('用户取消主密码输入');
    }

    if (isFirstTime && password.length < 8) {
      dialog.showErrorBox('密码过短', '主密码至少需要 8 个字符。请重新设置。');
      continue;
    }

    // scrypt: 内存困难 KDF，参数 N=16384, r=8, p=1 (Node.js 默认)
    const derivedKey = await scryptAsync(password, salt, 32);
    const keyHex = derivedKey.toString('hex');
    const verifier = crypto
      .createHmac('sha256', derivedKey)
      .update('cet46-store-verifier')
      .digest('hex');

    if (isFirstTime) {
      await fsp.writeFile(saltFilePath, salt.toString('hex') + '\n' + verifier, { mode: 0o600 });
      console.log('✅ store.key 已从主密码派生（safeStorage 不可用，首次设置）');
      return keyHex;
    }

    // P0-1/P0-2 修复：verifier 缺失时拒绝解锁（避免任意密码通过）；
    // 使用恒定时间比较防时序攻击
    if (!storedVerifier) {
      dialog.showErrorBox(
        '凭证文件损坏',
        '主密码校验文件缺失或损坏。为安全起见，已拒绝解锁。\n\n请使用备份的 store.key 文件恢复，或重置应用数据。'
      );
      app.quit();
      throw new Error('store.key verifier 缺失，拒绝解锁');
    }
    const verifierBuf = Buffer.from(verifier, 'hex');
    const storedBuf = Buffer.from(storedVerifier, 'hex');
    const ok = verifierBuf.length === storedBuf.length
      && crypto.timingSafeEqual(verifierBuf, storedBuf);
    if (ok) {
      console.log('✅ store.key 已从主密码派生（safeStorage 不可用，验证成功）');
      return keyHex;
    }

    dialog.showErrorBox('密码错误', '主密码不正确，请重试。');
  }
}

// 延迟初始化 store：safeStorage 在部分平台需 app ready 后才可用
let store = null;
async function initStore() {
  const encryptionKey = await loadOrCreateStoreKey();
  store = new Store({
    name: 'cet46-data',
    encryptionKey,
  });
  console.log('✅ electron-store 已初始化（' +
    (safeStorage.isEncryptionAvailable() ? 'safeStorage 保护' : '主密码派生') +
    '）');
}


let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../icons/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#f3c951'
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const devUrl = 'http://localhost:5173';

  // 1. 检查物理构建文件是否存在
  if (await pathExists(distPath)) {
    mainWindow.loadFile(distPath).catch(err => {
      console.error('页面加载失败:', err);
      showErrorAndQuit('页面加载失败', `无法加载构建文件: ${err.message}`);
    });
  } else if (app.isPackaged) {
    // P2-6 修复：生产环境（已打包）禁止回退到 dev server，避免加载不可信来源
    console.error(`❌ 生产环境缺失构建文件: ${distPath}`);
    showErrorAndQuit(
      '构建文件缺失 (Build Missing)',
      '应用打包不完整：找不到前端构建目录 (dist)。\n\n请重新安装应用，或联系开发者。'
    );
  } else {
    // 2. 开发环境：找不到构建文件，尝试降级到 Vite 开发服务器
    console.warn(`⚠️ 未找到构建文件: ${distPath}`);
    console.log(`🔄 尝试连接本地开发服务器: ${devUrl}`);

    mainWindow.loadURL(devUrl).catch(() => {
      // 3. 终极防御：本地也没有开发服务器，弹出系统级对话框
      showErrorAndQuit(
        '环境缺失 (Build Missing)',
        '无法启动应用！\n\n找不到前端构建目录 (dist)，且本地开发服务器未启动。\n\n请先在终端运行:\n1. npm install\n2. npm run build\n\n或者启动开发服务器:\n  npm run dev'
      );
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 安全：禁止导航到外部 URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // R-P1-4: 异常时 fail-closed（防止畸形 URL 抛错导致 preventDefault 未执行）
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      event.preventDefault();
      return;
    }
    // P1-11 修复：file:// 仅允许导航到应用自身 dist 目录；http 仅允许本地 dev server
    // R-P1-4: distDir 显式加尾斜杠，防止 dist-evil 等兄弟目录前缀绕过
    const distDir = path.join(__dirname, '../dist/').replace(/\\/g, '/') + '/';
    if (parsed.protocol === 'file:') {
      // R-P1-4: decodeURIComponent 处理非 ASCII 路径的百分号编码
      let normalized;
      try {
        normalized = decodeURIComponent(parsed.pathname).replace(/\\/g, '/');
      } catch (e) {
        normalized = parsed.pathname.replace(/\\/g, '/');
      }
      if (!normalized.startsWith(distDir)) {
        event.preventDefault();
      }
      return;
    }
    if (parsed.origin !== 'http://localhost:5173' && parsed.origin !== 'http://localhost:3001') {
      event.preventDefault();
    }
  });

  // 安全：禁止 window.open 打开新窗口
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  createMenu();
}

function showErrorAndQuit(title, message) {
  dialog.showErrorBox(title, message);
  app.quit();
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '强制刷新',
          accelerator: 'Ctrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        { type: 'separator' },
        {
          label: '导出数据',
          accelerator: 'Ctrl+E',
          click: async () => {
            mainWindow.webContents.send('export-data');
          }
        },
        {
          label: '导入数据',
          accelerator: 'Ctrl+I',
          click: async () => {
            mainWindow.webContents.send('import-data');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        // P1-12 修复：DevTools 仅在开发环境暴露，packaged 构建隐藏菜单项
        ...(!app.isPackaged ? [{
          label: '开发者工具',
          accelerator: 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }] : []),
        { type: 'separator' },
        {
          label: '重置缩放',
          accelerator: 'Ctrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: '放大',
          accelerator: 'Ctrl+=',
          click: () => {
            const level = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(level + 0.5);
          }
        },
        {
          label: '缩小',
          accelerator: 'Ctrl+-',
          click: () => {
            const level = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(level - 0.5);
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '检查更新',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 46英语',
              message: '46英语 v1.4.0',
              detail: '基于 FSRS 4.5 算法的英语学习系统\n支持 CET-4/6 词汇学习与多设备同步\n\nCopyright © 2024-2026 46英语团队'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 处理：存储操作（带输入校验）
const ALLOWED_STORAGE_KEYS = [
  'cet46_progress', 'cet46_wrongWords', 'cet46_heatmap',
  'cet46_fsrs_weights', 'cet46_target_retention', 'cet46_settings'
];

// R-P2-4: 校验 IPC 调用来源为主窗口，防止未来新增窗口/webview 注入
function validateSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error('未授权的 IPC 调用来源');
  }
}

// R-P2-4: 精确匹配白名单键或以 白名单键 + '_' 开头，防止 cet46_settings__proto__ 等前缀绕过
function isAllowedKey(key) {
  return ALLOWED_STORAGE_KEYS.some(allowed => key === allowed || key.startsWith(allowed + '_'));
}

function validateStorageKey(key) {
  if (typeof key !== 'string' || key.length === 0 || key.length > 256) {
    throw new Error('无效的存储键名');
  }
  return true;
}

ipcMain.handle('storage-get', (event, key) => {
  validateSender(event);
  validateStorageKey(key);
  if (!isAllowedKey(key)) {
    throw new Error('不允许读取该键: ' + key);
  }
  return store.get(key);
});

ipcMain.handle('storage-set', (event, { key, value }) => {
  validateSender(event);
  validateStorageKey(key);
  if (!isAllowedKey(key)) {
    throw new Error('不允许写入该键: ' + key);
  }
  store.set(key, value);
  return true;
});

ipcMain.handle('storage-delete', (event, key) => {
  validateSender(event);
  validateStorageKey(key);
  if (!isAllowedKey(key)) {
    throw new Error('不允许删除该键: ' + key);
  }
  store.delete(key);
  return true;
});

ipcMain.handle('storage-clear', (event) => {
  validateSender(event);
  // 仅清除白名单内的键
  const keys = Object.keys(store.store);
  keys.forEach(key => {
    if (isAllowedKey(key)) {
      store.delete(key);
    }
  });
  return true;
});

ipcMain.handle('storage-keys', (event) => {
  validateSender(event);
  // 仅返回白名单内的键
  return Object.keys(store.store).filter(isAllowedKey);
});

ipcMain.handle('storage-get-all', (event) => {
  validateSender(event);
  // 仅返回白名单内的键值
  const result = {};
  for (const [key, value] of Object.entries(store.store)) {
    if (isAllowedKey(key)) {
      result[key] = value;
    }
  }
  return result;
});

// 自动更新配置
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (error) => {
  console.error('Auto updater error:', error);
});

app.whenReady().then(async () => {
  // safeStorage 在 app ready 后才可用（部分平台），必须先初始化 store
  // M6: initStore 现在是 async（safeStorage 不可用时需弹出主密码输入窗口）
  await initStore();

  await createWindow();

  // 启动时检查更新
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

// 单实例锁定
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
