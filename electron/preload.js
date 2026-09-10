const { contextBridge, ipcRenderer } = require('electron');

// S6 修复：on* 回调返回 disposer，防止多次调用导致监听器累积
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,

  // 存储操作
  store: {
    get: (key) => ipcRenderer.invoke('storage-get', key),
    set: (key, value) => ipcRenderer.invoke('storage-set', { key, value }),
    delete: (key) => ipcRenderer.invoke('storage-delete', key),
    clear: () => ipcRenderer.invoke('storage-clear'),
    keys: () => ipcRenderer.invoke('storage-keys'),
    getAll: () => ipcRenderer.invoke('storage-get-all')
  },

  // 更新相关（返回 disposer 用于移除监听器）
  onUpdateAvailable: (callback) => {
    const handler = (event, info) => callback(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (event, info) => callback(info);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },

  // 数据导入导出（返回 disposer）
  onExportData: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('export-data', handler);
    return () => ipcRenderer.removeListener('export-data', handler);
  },
  onImportData: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('import-data', handler);
    return () => ipcRenderer.removeListener('import-data', handler);
  },

  // 移除监听器（限制可移除的通道）
  removeAllListeners: (channel) => {
    const allowedChannels = ['update-available', 'update-downloaded', 'export-data', 'import-data'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});
