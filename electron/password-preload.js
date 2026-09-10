const { contextBridge, ipcRenderer } = require('electron');

// M6 修复：主密码弹窗 preload，仅暴露提交/取消两个通道
contextBridge.exposeInMainWorld('passwordPrompt', {
  submit: (password) => ipcRenderer.send('master-password-submit', password),
  cancel: () => ipcRenderer.send('master-password-cancel'),
});
