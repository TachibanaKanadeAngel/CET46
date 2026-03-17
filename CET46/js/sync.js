import { CONFIG } from './config.js';
import { Network } from './network.js';

let webdavConfig = null;

const PBKDF2_ITERATIONS = 600000;

const cryptoWorkerCode = `
  const ITERATIONS = ${PBKDF2_ITERATIONS};
  self.onmessage = async (e) => {
    const { type, password, salt, iv, data, iterations } = e.data;
    const enc = new TextEncoder();
    const ITERATIONS = iterations || ${ITERATIONS};
    
    try {
      if (type === 'deriveKey') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
        );
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        self.postMessage({ type: 'key', key: exportedKey });
      } else if (type === 'encrypt') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
        );
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        self.postMessage({ type: 'encrypted', ciphertext }, [ciphertext]);
      } else if (type === 'decrypt') {
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        self.postMessage({ type: 'decrypted', data: decrypted }, [decrypted]);
      }
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
  };
`;

const asyncCrypto = {
  worker: null,
  init() {
    if (!this.worker) {
      this.worker = new Worker(URL.createObjectURL(new Blob([cryptoWorkerCode], { type: 'text/javascript' })));
    }
    return this.worker;
  },
  async encrypt(text, password) {
    return new Promise((resolve, reject) => {
      const worker = this.init();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(text);
      
      worker.onmessage = (e) => {
        if (e.data.type === 'encrypted') {
          const combined = new Uint8Array(salt.length + iv.length + e.data.ciphertext.byteLength);
          combined.set(salt, 0);
          combined.set(iv, salt.length);
          combined.set(new Uint8Array(e.data.ciphertext), salt.length + iv.length);
          resolve(btoa(String.fromCharCode(...combined)));
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
      };
      
      worker.postMessage({ type: 'encrypt', password, salt, iv, data, iterations: PBKDF2_ITERATIONS });
    });
  },
  async decrypt(encryptedBase64, password) {
    return new Promise((resolve, reject) => {
      try {
        const worker = this.init();
        const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const data = combined.slice(28);
        
        worker.onmessage = (e) => {
          if (e.data.type === 'decrypted') {
            resolve(new TextDecoder().decode(e.data.data));
          } else if (e.data.type === 'error') {
            resolve(null);
          }
        };
        
        worker.postMessage({ type: 'decrypt', password, salt, iv, data, iterations: PBKDF2_ITERATIONS });
      } catch (e) {
        resolve(null);
      }
    });
  }
};

const Security = {
  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  },
  async encrypt(text, password) {
    return asyncCrypto.encrypt(text, password);
  },
  async decrypt(encryptedBase64, password) {
    return asyncCrypto.decrypt(encryptedBase64, password);
  }
};

function loadWebDAVConfig() {
  const saved = localStorage.getItem('cet46_webdav_config');
  if (saved) {
    try {
      webdavConfig = JSON.parse(saved);
      return webdavConfig;
    } catch (e) {
      console.error('加载 WebDAV 配置失败:', e);
    }
  }
  return null;
}

async function decryptWebDAVCredentials(masterKey) {
  if (!webdavConfig || !webdavConfig.encryptedAuth) return false;
  
  const decrypted = await Security.decrypt(webdavConfig.encryptedAuth, masterKey);
  if (decrypted) {
    const [username, password] = decrypted.split(':');
    webdavConfig.username = username;
    webdavConfig.password = password;
    return true;
  }
  return false;
}

async function saveWebDAVConfig(url, username, password, masterKey, autoSync) {
  if (!url) throw new Error('请输入 WebDAV 服务器地址');
  if (!masterKey) throw new Error('请设置主密码用于加密凭证');
  if (masterKey.length < 6) throw new Error('主密码至少需要 6 个字符');
  
  const encryptedAuth = await Security.encrypt(username + ':' + password, masterKey);
  
  webdavConfig = {
    url: url,
    encryptedAuth: encryptedAuth,
    autoSync: autoSync || false
  };
  
  localStorage.setItem('cet46_webdav_config', JSON.stringify(webdavConfig));
  webdavConfig.username = username;
  webdavConfig.password = password;
  
  return webdavConfig;
}

async function testWebDAVConnection(config) {
  if (!config || !config.url || !config.username || !config.password) {
    throw new Error('WebDAV 配置不完整');
  }
  
  const response = await Network.fetchWithRetry(config.url, {
    method: 'PROPFIND',
    headers: {
      'Authorization': 'Basic ' + btoa(config.username + ':' + config.password),
      'Depth': '0'
    }
  });
  
  if (response.ok || response.status === 207) {
    return true;
  }
  throw new Error(`连接失败: ${response.status}`);
}

function generateVectorClock(deviceId) {
  const stored = localStorage.getItem('cet46_vector_clock');
  let clock = stored ? JSON.parse(stored) : {};
  
  if (!clock[deviceId]) {
    clock[deviceId] = 0;
  }
  clock[deviceId]++;
  
  localStorage.setItem('cet46_vector_clock', JSON.stringify(clock));
  return { ...clock };
}

function compareVectorClocks(clock1, clock2) {
  let dominated1 = false;
  let dominated2 = false;
  
  const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
  
  for (const key of allKeys) {
    const v1 = clock1[key] || 0;
    const v2 = clock2[key] || 0;
    
    if (v1 < v2) dominated1 = true;
    if (v1 > v2) dominated2 = true;
  }
  
  if (dominated1 && !dominated2) return -1;
  if (dominated2 && !dominated1) return 1;
  return 0;
}

function mergePropertyAware(localWd, cloudWd) {
  const localMnemonic = localWd.mnemonic || '';
  const cloudMnemonic = cloudWd.mnemonic || '';
  
  if (localMnemonic !== cloudMnemonic && localMnemonic && cloudMnemonic) {
    throw new ConflictError('助记词冲突', localWd, cloudWd, 'mnemonic');
  }
  
  let mergedMnemonic = localMnemonic;
  if (localMnemonic !== cloudMnemonic && cloudMnemonic) {
    mergedMnemonic = localMnemonic ? `${localMnemonic} | ${cloudMnemonic}` : cloudMnemonic;
  }

  const localWeight = (localWd.reviewCount || 0) + (localWd.level || 0);
  const cloudWeight = (cloudWd.reviewCount || 0) + (cloudWd.level || 0);
  
  const base = localWeight >= cloudWeight ? { ...localWd } : { ...cloudWd };
  base.mnemonic = mergedMnemonic;
  
  base.wrongCount = Math.max(localWd.wrongCount || 0, cloudWd.wrongCount || 0);

  return base;
}

class ConflictError extends Error {
  constructor(message, localWd, cloudWd, field) {
    super(message);
    this.name = 'ConflictError';
    this.localWd = localWd;
    this.cloudWd = cloudWd;
    this.field = field;
  }
}

async function mergePropertyAwareInteractive(localWd, cloudWd, wordId) {
  try {
    return mergePropertyAware(localWd, cloudWd);
  } catch (e) {
    if (e instanceof ConflictError) {
      const decision = await showConflictModal(localWd, cloudWd, e.field);
      return decision === 'local' ? localWd : cloudWd;
    }
    throw e;
  }
}

function showConflictModal(local, cloud, field) {
  return new Promise(resolve => {
    const modal = document.getElementById('conflict-modal');
    if (!modal) {
      console.warn('冲突弹窗不存在，自动合并');
      resolve('cloud');
      return;
    }
    
    document.getElementById('conflict-word').textContent = local.word || cloud.word || '未知单词';
    document.getElementById('conflict-diff').textContent = 
      `冲突字段：${field}\n\n本地：${local[field] || '空'}\n云端：${cloud[field] || '空'}`;
    
    const counter = document.getElementById('conflict-counter');
    if (counter) {
      counter.textContent = `请选择保留哪个版本的数据`;
    }
    
    modal.classList.add('active');
    
    const keepLocalBtn = document.getElementById('keep-local');
    const useCloudBtn = document.getElementById('use-cloud');
    
    const cleanup = () => {
      keepLocalBtn.onclick = null;
      useCloudBtn.onclick = null;
      modal.classList.remove('active');
    };
    
    keepLocalBtn.onclick = () => {
      cleanup();
      resolve('local');
    };
    
    useCloudBtn.onclick = () => {
      cleanup();
      resolve('cloud');
    };
  });
}

async function mergeLocalAndCloud(local, cloud, deviceId) {
  const mergedProgress = { ...cloud.progress };
  const mergedDeletedIds = new Set([...(local.deletedIds || []), ...(cloud.deletedIds || [])]);

  for (const id of mergedDeletedIds) {
    delete mergedProgress[id];
  }

  for (const [id, localWd] of Object.entries(local.progress)) {
    if (mergedDeletedIds.has(parseInt(id))) continue;
    
    const cloudWd = mergedProgress[id];
    
    if (!cloudWd) {
      mergedProgress[id] = localWd;
    } else {
      const merged = await mergePropertyAwareInteractive(localWd, cloudWd, id);
      mergedProgress[id] = merged;
    }
  }

  const mergedWrongWords = { ...cloud.wrongWords };
  for (const [id, localWrong] of Object.entries(local.wrongWords)) {
    const cloudWrong = mergedWrongWords[id];
    
    if (!cloudWrong) {
      mergedWrongWords[id] = localWrong;
    } else {
      mergedWrongWords[id] = {
        count: Math.max(localWrong.count, cloudWrong.count),
        firstWrong: Math.min(localWrong.firstWrong || Infinity, cloudWrong.firstWrong || Infinity),
        lastWrong: Math.max(localWrong.lastWrong || 0, cloudWrong.lastWrong || 0)
      };
    }
  }

  const mergedHeatmap = { ...cloud.heatmap };
  for (const [date, count] of Object.entries(local.heatmap)) {
    mergedHeatmap[date] = Math.max(mergedHeatmap[date] || 0, count);
  }

  return { 
    progress: mergedProgress, 
    wrongWords: mergedWrongWords, 
    heatmap: mergedHeatmap,
    deletedIds: Array.from(mergedDeletedIds)
  };
}

async function syncToWebDAV(db, memoryCache, deviceId) {
  if (!webdavConfig) throw new Error('请先配置 WebDAV');

  const snapshot = {
    timestamp: Date.now(),
    data: {
      progress: { ...memoryCache.progress },
      wrongWords: { ...memoryCache.wrongWords },
      heatmap: { ...memoryCache.heatmap },
      deletedIds: Array.from(memoryCache.deletedIds || [])
    }
  };
  await db.save('session', { key: 'last_snapshot', data: snapshot });

  const dirtyEntries = Object.entries(memoryCache.progress).filter(([id, wd]) => wd.isDirty);
  const deletedEntries = Array.from(memoryCache.deletedIds || []).map(id => ({
    id: id,
    action: 'delete',
    mtime: Date.now()
  }));

  const hasWrongWordsChanges = memoryCache.wrongWordsDirty === true;
  const hasHeatmapChanges = memoryCache.heatmapDirty === true;

  if (dirtyEntries.length === 0 && deletedEntries.length === 0 && !hasWrongWordsChanges && !hasHeatmapChanges) {
    return { status: 'no_changes', message: '数据已是最新，无需同步' };
  }

  const vectorClock = generateVectorClock(deviceId);

  const patchData = {
    version: '1.0',
    timestamp: Date.now(),
    deviceId: deviceId,
    vectorClock: vectorClock,
    changes: [
      ...dirtyEntries.map(([id, wd]) => ({
        id: parseInt(id),
        action: 'update',
        data: { ...wd },
        mtime: wd.mtime || Date.now(),
        vectorClock: wd.vectorClock || vectorClock
      })),
      ...deletedEntries
    ],
    meta: {}
  };

  if (hasWrongWordsChanges) {
    patchData.meta.wrongWords = { ...memoryCache.wrongWords };
    patchData.meta.wrongWordsMtime = Date.now();
  }

  if (hasHeatmapChanges) {
    patchData.meta.heatmap = { ...memoryCache.heatmap };
    patchData.meta.heatmapMtime = Date.now();
  }

  let cloudETag = null;
  let existingPatch = null;

  try {
    const cloudResponse = await Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(webdavConfig.username + ':' + webdavConfig.password)
      }
    });
    if (cloudResponse.ok) {
      cloudETag = cloudResponse.headers.get('ETag');
      existingPatch = await cloudResponse.json();
    }
  } catch (e) {
    console.log('云端无增量日志，将创建新文件');
  }

  if (existingPatch && existingPatch.changes) {
    const localMtime = new Map(dirtyEntries.map(([id, wd]) => [parseInt(id), wd.mtime || 0]));
    const localDeleted = new Set(deletedEntries.map(d => d.id));

    for (const change of existingPatch.changes) {
      if (localDeleted.has(change.id)) continue;

      if (change.action === 'delete') {
        continue;
      }

      if (!localMtime.has(change.id) || (change.mtime || 0) > (localMtime.get(change.id) || 0)) {
        patchData.changes.push(change);
      }
    }

    patchData.changes.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
    if (patchData.changes.length > 1000) {
      patchData.changes = patchData.changes.slice(-1000);
    }

    if (existingPatch.meta) {
      if (!patchData.meta.wrongWords && existingPatch.meta.wrongWords) {
        patchData.meta.wrongWords = existingPatch.meta.wrongWords;
        patchData.meta.wrongWordsMtime = existingPatch.meta.wrongWordsMtime;
      }
      if (!patchData.meta.heatmap && existingPatch.meta.heatmap) {
        patchData.meta.heatmap = existingPatch.meta.heatmap;
        patchData.meta.heatmapMtime = existingPatch.meta.heatmapMtime;
      }
    }
  }

  const patchBlob = new Blob([JSON.stringify(patchData, null, 2)], { type: 'application/json' });

  const patchHeaders = {
    'Authorization': 'Basic ' + btoa(webdavConfig.username + ':' + webdavConfig.password),
    'Content-Type': 'application/json'
  };

  if (cloudETag) {
    patchHeaders['If-Match'] = cloudETag;
  }

  const patchResponse = await Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
    method: 'PUT',
    headers: patchHeaders,
    body: patchBlob
  });

  if (patchResponse.ok || patchResponse.status === 201) {
    const tx = db.instance.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    dirtyEntries.forEach(([id, wd]) => {
      delete wd.isDirty;
      memoryCache.progress[id] = wd;
      store.put({ id: parseInt(id), ...wd });
    });

    if (hasWrongWordsChanges) {
      memoryCache.wrongWordsDirty = false;
    }
    if (hasHeatmapChanges) {
      memoryCache.heatmapDirty = false;
    }

    const newETag = patchResponse.headers.get('ETag');
    if (newETag) localStorage.setItem('cet46_last_etag', newETag);

    localStorage.setItem('cet46_last_sync', Date.now().toString());

    return { status: 'success', changes: patchData.changes.length };
  } else if (patchResponse.status === 412) {
    throw new Error('云端数据已被其他设备修改，请重试');
  } else {
    throw new Error(`同步失败: ${patchResponse.status}`);
  }
}

async function syncFromWebDAV(db, memoryCache, deviceId) {
  if (!webdavConfig) throw new Error('请先配置 WebDAV');

  const snapshot = {
    timestamp: Date.now(),
    data: {
      progress: { ...memoryCache.progress },
      wrongWords: { ...memoryCache.wrongWords },
      heatmap: { ...memoryCache.heatmap },
      deletedIds: Array.from(memoryCache.deletedIds || [])
    }
  };
  await db.save('session', { key: 'last_snapshot', data: snapshot });

  let patchData = null;
  try {
    const patchResponse = await Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(webdavConfig.username + ':' + webdavConfig.password)
      }
    });
    if (patchResponse.ok) {
      patchData = await patchResponse.json();
    }
  } catch (e) {
    console.log('云端无增量日志');
  }

  if (patchData && patchData.meta) {
    if (patchData.meta.wrongWords) {
      const cloudWrongWords = patchData.meta.wrongWords;
      for (const [id, data] of Object.entries(cloudWrongWords)) {
        if (!memoryCache.wrongWords[id] ||
            (patchData.meta.wrongWordsMtime || 0) > (memoryCache.wrongWords[id].mtime || 0)) {
          memoryCache.wrongWords[id] = data;
          if (db.instance) {
            await db.save('wrongWords', { id: parseInt(id), data });
          }
        }
      }
    }

    if (patchData.meta.heatmap) {
      const cloudHeatmap = patchData.meta.heatmap;
      for (const [date, count] of Object.entries(cloudHeatmap)) {
        if (!memoryCache.heatmap[date] || count > memoryCache.heatmap[date]) {
          memoryCache.heatmap[date] = count;
          if (db.instance) {
            await db.save('heatmap', { date, count });
          }
        }
      }
    }
  }

  const response = await Network.fetchWithRetry(webdavConfig.url + '/cet46_backup.json', {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + btoa(webdavConfig.username + ':' + webdavConfig.password)
    }
  });

  if (response.ok) {
    const cloudData = await response.json();

    let merged = await mergeLocalAndCloud(
      {
        progress: memoryCache.progress,
        wrongWords: memoryCache.wrongWords,
        heatmap: memoryCache.heatmap,
        deletedIds: Array.from(memoryCache.deletedIds || [])
      },
      {
        progress: cloudData.progress || {},
        wrongWords: cloudData.wrongWords || {},
        heatmap: cloudData.heatmap || {},
        deletedIds: cloudData.deletedIds || []
      },
      deviceId
    );

    if (cloudData.words && cloudData.words.length > 0) {
      const localCount = Object.keys(memoryCache.progress).length;
      if (cloudData.words.length > localCount) {
        return {
          status: 'needs_full_sync',
          cloudData,
          merged,
          message: '云端词库更大，建议全量同步'
        };
      }
    }

    memoryCache.progress = merged.progress;
    memoryCache.wrongWords = merged.wrongWords;
    memoryCache.heatmap = merged.heatmap;
    memoryCache.deletedIds = new Set(merged.deletedIds || []);

    if (db.instance) {
      for (const [id, wd] of Object.entries(merged.progress)) {
        await db.save('progress', { id: parseInt(id), ...wd });
      }
      for (const [id, wrongData] of Object.entries(merged.wrongWords)) {
        await db.save('wrongWords', { id: parseInt(id), data: wrongData });
      }
      for (const [date, count] of Object.entries(merged.heatmap)) {
        await db.save('heatmap', { date, count });
      }
    }

    return { status: 'success', merged };
  } else if (response.status === 404) {
    throw new Error('云端没有找到备份文件');
  } else {
    throw new Error(`同步失败: ${response.status}`);
  }
}

function exportEncryptionKey() {
  if (!webdavConfig || !webdavConfig.encryptedAuth) {
    return null;
  }
  return {
    url: webdavConfig.url,
    auth: webdavConfig.encryptedAuth,
    autoSync: webdavConfig.autoSync
  };
}

function updateWebDAVStatus(message, type = 'info') {
  const statusEl = document.getElementById('webdav-status');
  if (statusEl) {
    statusEl.textContent = message;
    setTimeout(() => { statusEl.textContent = ''; }, 5000);
  }
}

export {
  Security, asyncCrypto,
  webdavConfig, loadWebDAVConfig, decryptWebDAVCredentials,
  saveWebDAVConfig, testWebDAVConnection,
  generateVectorClock, compareVectorClocks, mergePropertyAware, mergePropertyAwareInteractive, mergeLocalAndCloud, ConflictError,
  syncToWebDAV, syncFromWebDAV,
  exportEncryptionKey, updateWebDAVStatus
};
