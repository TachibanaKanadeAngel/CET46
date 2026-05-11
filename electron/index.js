const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

const store = new Store({
  name: 'cet46-data',
  encryptionKey: 'cet46-fsrs-secure-key'
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../icons/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#f3c951'
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const devUrl = 'http://localhost:5173';

  // 1. 检查物理构建文件是否存在
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath).catch(err => {
      console.error('页面加载失败:', err);
      showErrorAndQuit('页面加载失败', `无法加载构建文件: ${err.message}`);
    });
  } else {
    // 2. 找不到构建文件，尝试降级到 Vite 开发服务器
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
        {
          label: '开发者工具',
          accelerator: 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
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
              title: '关于 CET46 科学记忆引擎',
              message: 'CET46 科学记忆引擎 v1.3.6',
              detail: '基于 FSRS 4.5 算法的科学记忆系统\n支持 CET-4/6 词汇学习与多设备同步\n\nCopyright © 2024-2026 CET46 Team'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 处理：存储操作
ipcMain.handle('storage-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('storage-set', (event, { key, value }) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('storage-delete', (event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle('storage-clear', () => {
  store.clear();
  return true;
});

ipcMain.handle('storage-keys', () => {
  return Object.keys(store.store);
});

ipcMain.handle('storage-get-all', () => {
  return store.store;
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

app.whenReady().then(() => {
  createWindow();

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
    createWindow();
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
