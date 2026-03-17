import { db, memoryCache } from '../core.js';
import {
  webdavConfig, loadWebDAVConfig, decryptWebDAVCredentials,
  saveWebDAVConfig, testWebDAVConnection,
  syncToWebDAV, syncFromWebDAV,
  exportEncryptionKey, updateWebDAVStatus
} from '../sync.js';
import { UI } from '../ui.js';

let updateStats = null;
let renderList = null;

function init(config) {
  updateStats = config.updateStats;
  renderList = config.renderList;
}

function toggleWebDAVConfig() {
  const configDiv = document.getElementById('webdav-config');
  configDiv.style.display = configDiv.style.display === 'none' ? 'block' : 'none';
}

async function handleSaveWebDAVConfig() {
  const url = document.getElementById('webdav-url').value.trim();
  const masterKey = document.getElementById('webdav-master-key').value;
  const username = document.getElementById('webdav-username').value.trim();
  const password = document.getElementById('webdav-password').value;
  const autoSync = document.getElementById('webdav-auto-sync').checked;
  
  try {
    await saveWebDAVConfig(url, username, password, masterKey, autoSync);
    updateWebDAVStatus('✅ 配置已加密保存');
    toggleWebDAVConfig();
  } catch (e) {
    UI.toast(e.message, 'error');
  }
}

async function handleTestWebDAVConnection() {
  const url = document.getElementById('webdav-url').value.trim();
  const masterKey = document.getElementById('webdav-master-key').value;
  let username = document.getElementById('webdav-username').value.trim();
  let password = document.getElementById('webdav-password').value;
  
  if (!url) {
    UI.toast('请先输入 WebDAV 服务器地址', 'warning');
    return;
  }
  
  if (webdavConfig && webdavConfig.encryptedAuth && !username) {
    if (!masterKey) {
      UI.toast('请输入主密码解密凭证', 'warning');
      return;
    }
    const decrypted = await decryptWebDAVCredentials(masterKey);
    if (!decrypted) {
      UI.toast('主密码错误，无法解密凭证', 'error');
      return;
    }
    username = webdavConfig.username;
    password = webdavConfig.password;
  }
  
  if (!username || !password) {
    UI.toast('请输入用户名和密码', 'warning');
    return;
  }
  
  updateWebDAVStatus('🔄 测试连接中...');
  
  try {
    await testWebDAVConnection({ url, username, password });
    updateWebDAVStatus('✅ 连接成功！');
    UI.toast('WebDAV 连接测试成功！', 'success');
  } catch (err) {
    updateWebDAVStatus('❌ 连接失败');
    UI.toast(err.message, 'error');
  }
}

function handleExportEncryptionKey() {
  const keyData = exportEncryptionKey();
  if (!keyData) {
    UI.toast('⚠️ 暂无已加密配置', 'warning');
    return;
  }
  const blob = new Blob([JSON.stringify(keyData)], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'CET46_Identity.key';
  link.click();
  UI.toast('✅ 凭证已作为物理文件导出，请妥善保管。', 'success');
}

async function handleSyncToWebDAV() {
  if (!webdavConfig) {
    UI.toast('请先配置 WebDAV', 'warning');
    toggleWebDAVConfig();
    return;
  }
  
  const masterKey = document.getElementById('webdav-master-key').value;
  if (webdavConfig.encryptedAuth && !webdavConfig.username) {
    if (!masterKey) {
      const key = prompt('请输入主密码解密 WebDAV 凭证:');
      if (!key) return;
      document.getElementById('webdav-master-key').value = key;
      const decrypted = await decryptWebDAVCredentials(key);
      if (!decrypted) {
        UI.toast('主密码错误', 'error');
        return;
      }
    } else {
      const decrypted = await decryptWebDAVCredentials(masterKey);
      if (!decrypted) {
        UI.toast('主密码错误', 'error');
        return;
      }
    }
  }
  
  await UI.safeExecute(async () => {
    const deviceId = 'pwa-' + navigator.userAgent.slice(0, 50);
    const result = await syncToWebDAV(db, memoryCache, deviceId);
    if (result.status === 'no_changes') {
      updateWebDAVStatus('☁️ 数据已是最新，无需同步');
    } else {
      updateWebDAVStatus(`✅ 增量同步完成！${result.changes} 条变更`);
    }
    updateStats();
  }, '☁️ 正在打包同步至云端...');
}

async function handleSyncFromWebDAV() {
  if (!webdavConfig) {
    UI.toast('请先配置 WebDAV', 'warning');
    toggleWebDAVConfig();
    return;
  }
  
  const masterKey = document.getElementById('webdav-master-key').value;
  if (webdavConfig.encryptedAuth && !webdavConfig.username) {
    if (!masterKey) {
      const key = prompt('请输入主密码解密 WebDAV 凭证:');
      if (!key) return;
      document.getElementById('webdav-master-key').value = key;
      const decrypted = await decryptWebDAVCredentials(key);
      if (!decrypted) {
        UI.toast('主密码错误', 'error');
        return;
      }
    } else {
      const decrypted = await decryptWebDAVCredentials(masterKey);
      if (!decrypted) {
        UI.toast('主密码错误', 'error');
        return;
      }
    }
  }
  
  await UI.safeExecute(async () => {
    const deviceId = 'pwa-' + navigator.userAgent.slice(0, 50);
    const result = await syncFromWebDAV(db, memoryCache, deviceId);
    if (result.status === 'success') {
      updateWebDAVStatus('✅ 增量同步成功！');
      updateStats();
      renderList();
      UI.toast('✅ 数据已增量合并！', 'success');
    } else if (result.status === 'needs_full_sync') {
      updateWebDAVStatus('⚠️ 需要全量同步');
      UI.toast('云端词库更大，建议全量同步', 'warning');
    }
  }, '☁️ 正在从云端同步数据...');
}

export const WebDAVFeature = {
  init,
  toggleWebDAVConfig,
  handleSaveWebDAVConfig,
  handleTestWebDAVConnection,
  handleExportEncryptionKey,
  handleSyncToWebDAV,
  handleSyncFromWebDAV
};
