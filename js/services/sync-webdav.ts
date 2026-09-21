import { Network } from '../network.js';
import { Security } from './sync-crypto.js';
import { CONFIG } from '../config.js';
import {
  getCacheData,
  getCacheEntries,
  setCacheValue,
  getCacheValue,
  getCacheSize,
  generateVectorClock,
  mergeLocalAndCloud,
  generateBackupData,
  saveSyncBase,
} from './sync-core.js';
import { mergeWithId } from '../utils.js';
import logger from '../utils/logger.js';

/** 同步状态提示自动清空延时（毫秒） */
const STATUS_AUTO_CLEAR_MS = 5000;
const WEBDAV_STATUS_ELEMENT_ID = 'webdav-status';
let statusClearTimer: any = null;

/**
 * 更新 WebDAV 同步状态提示，延时后自动清空
 */
export function updateWebDAVStatus(message: string): void {
  if (typeof document === 'undefined') return;
  const statusEl = document.getElementById(WEBDAV_STATUS_ELEMENT_ID);
  if (!statusEl) return;

  statusEl.textContent = message;
  clearTimeout(statusClearTimer);
  statusClearTimer = setTimeout(() => {
    statusEl.textContent = '';
    statusClearTimer = null;
  }, STATUS_AUTO_CLEAR_MS);
}

export let webdavConfig: any = null;
let syncToPromise: Promise<any> | null = null;
let syncFromPromise: Promise<any> | null = null;
let syncMutexQueue: Promise<any> = Promise.resolve();

function buildLocalSyncData(memoryCache: any): any {
  return {
    progress: getCacheData(memoryCache.progress),
    wrongWords: getCacheData(memoryCache.wrongWords),
    heatmap: getCacheData(memoryCache.heatmap),
    deletedIds: Array.from(memoryCache.deletedIds || []),
  };
}

function buildAuthHeader(): string {
  if (!webdavConfig || !webdavConfig.username || !webdavConfig.password) {
    throw new Error('WebDAV 凭证未解密');
  }
  const header = 'Basic ' + btoa(unescape(encodeURIComponent(webdavConfig.username + ':' + webdavConfig.password)));
  return header;
}

export function clearWebDAVPlaintextCredentials(): void {
  if (webdavConfig) {
    delete webdavConfig.username;
    delete webdavConfig.password;
  }
}

async function ensureCredentialsForSync(providedMasterKey?: string): Promise<void> {
  if (webdavConfig && webdavConfig.username && webdavConfig.password) return;
  if (!webdavConfig || !webdavConfig.encryptedAuth) return;
  const masterKey = providedMasterKey || (
    typeof document !== 'undefined'
      ? (document.getElementById('webdav-master-key') as HTMLInputElement | null)?.value || ''
      : ''
  );
  if (masterKey) {
    try {
      await decryptWebDAVCredentials(masterKey);
    } catch (e: any) {
      logger.warn('[ensureCredentialsForSync] 重新解密凭证失败:', e?.message);
    }
  }
}

export function loadWebDAVConfig(): any {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.WEBDAV_CONFIG);
  if (saved) {
    try {
      webdavConfig = JSON.parse(saved);
      return webdavConfig;
    } catch (e) {
      logger.error('加载 WebDAV 配置失败:', e);
    }
  }
  return null;
}

export async function decryptWebDAVCredentials(masterKey: string): Promise<boolean> {
  if (!webdavConfig || !webdavConfig.encryptedAuth) return false;

  const decrypted = await Security.decrypt(webdavConfig.encryptedAuth, masterKey);
  if (decrypted) {
    const colonIndex = decrypted.indexOf(':');
    if (colonIndex === -1) return false;
    webdavConfig.username = decrypted.substring(0, colonIndex);
    webdavConfig.password = decrypted.substring(colonIndex + 1);
    return true;
  }
  return false;
}

export async function saveWebDAVConfig(
  url: string,
  username?: string,
  password?: string,
  masterKey?: string,
  autoSync?: boolean
): Promise<any> {
  if (!url) throw new Error('请输入 WebDAV 服务器地址');
  if (!masterKey) throw new Error('请设置主密码用于加密凭证');
  if (masterKey.length < 12) throw new Error('主密码至少需要 12 个字符');
  const hasLetter = /[a-zA-Z]/.test(masterKey);
  const hasDigit = /[0-9]/.test(masterKey);
  if (!hasLetter || !hasDigit) {
    throw new Error('主密码必须同时包含字母和数字');
  }
  if (url.startsWith('http://')) {
    throw new Error('为保证凭证安全，请使用 HTTPS 地址');
  }

  const normalizedUrl = url.replace(/\/+$/, '');

  const encryptedAuth = await Security.encrypt((username || '') + ':' + (password || ''), masterKey);

  webdavConfig = {
    url: normalizedUrl,
    encryptedAuth: encryptedAuth,
    autoSync: autoSync || false,
  };

  localStorage.setItem(CONFIG.STORAGE_KEYS.WEBDAV_CONFIG, JSON.stringify(webdavConfig));
  clearWebDAVPlaintextCredentials();

  return webdavConfig;
}

export async function testWebDAVConnection(config: any): Promise<boolean> {
  if (!config || !config.url || !config.username || !config.password) {
    throw new Error('WebDAV 配置不完整');
  }

  if (config.url.startsWith('http://')) {
    throw new Error('为保证凭证安全，请使用 HTTPS 地址');
  }

  const response = await Network.fetchWithRetry(config.url, {
    method: 'PROPFIND',
    headers: {
      Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(config.username + ':' + config.password))),
      Depth: '0',
    },
  });

  if (response.ok || response.status === 207) {
    return true;
  }
  throw new Error(`连接失败: ${response.status}`);
}

async function saveSnapshotToSession(db: any, memoryCache: any): Promise<void> {
  const snapshot = {
    timestamp: Date.now(),
    data: buildLocalSyncData(memoryCache),
  };
  await db.save('session', { key: 'last_snapshot', data: snapshot });
}

async function ensureBackupExists(memoryCache: any, db: any): Promise<void> {
  let backupExists = false;
  try {
    const backupCheck = await Network.fetchWithRetry(webdavConfig.url + '/cet46_backup.json', {
      method: 'HEAD',
      headers: { Authorization: buildAuthHeader() },
    });
    backupExists = backupCheck.ok;
  } catch (_e) {
    backupExists = false;
  }

  if (!backupExists) {
    updateWebDAVStatus('首次同步，创建完整备份...');
    const backupData = await generateBackupData(memoryCache, db);
    const backupBlob = JSON.stringify(backupData);
    const backupResponse = await Network.fetchWithRetry(
      webdavConfig.url + '/cet46_backup.json',
      {
        method: 'PUT',
        headers: {
          Authorization: buildAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: backupBlob,
      }
    );
    if (!backupResponse.ok && backupResponse.status !== 201) {
      throw new Error(`创建备份失败: ${backupResponse.status}`);
    }
    saveSyncBase({
      wrongWords: buildLocalSyncData(memoryCache).wrongWords,
      heatmap: buildLocalSyncData(memoryCache).heatmap,
      timestamp: Date.now(),
    });
  }
}

function buildPatchFromDirty(memoryCache: any, deviceId: string): any {
  const dirtyEntries = getCacheEntries(memoryCache.progress).filter(([_id, wd]: [string, any]) => wd.isDirty);
  const deletedEntries = Array.from(memoryCache.deletedIds || []).map(id => ({
    id: id,
    action: 'delete',
    mtime: Date.now(),
  }));

  const hasWrongWordsChanges = memoryCache.wrongWordsDirty === true;
  const hasHeatmapChanges = memoryCache.heatmapDirty === true;

  if (
    dirtyEntries.length === 0 &&
    deletedEntries.length === 0 &&
    !hasWrongWordsChanges &&
    !hasHeatmapChanges
  ) {
    return { status: 'no_changes', message: '数据已是最新，无需同步' };
  }

  const vectorClock = generateVectorClock(deviceId);

  const patchData: any = {
    version: '1.0',
    timestamp: Date.now(),
    deviceId: deviceId,
    vectorClock: vectorClock,
    changes: [
      ...dirtyEntries.map(([id, wd]: [string, any]) => ({
        id: parseInt(id, 10),
        action: 'update',
        data: { ...wd },
        mtime: wd.mtime || Date.now(),
        vectorClock: wd.vectorClock || vectorClock,
      })),
      ...deletedEntries,
    ],
    meta: {},
  };

  if (hasWrongWordsChanges) {
    patchData.meta.wrongWords = getCacheData(memoryCache.wrongWords);
    patchData.meta.wrongWordsMtime = Date.now();
  }

  if (hasHeatmapChanges) {
    patchData.meta.heatmap = getCacheData(memoryCache.heatmap);
    patchData.meta.heatmapMtime = Date.now();
  }

  return { patchData, dirtyEntries, deletedEntries, hasWrongWordsChanges, hasHeatmapChanges };
}

async function mergeWithCloudPatch(patchData: any, dirtyEntries: any[], deletedEntries: any[]): Promise<string | null> {
  let cloudETag: string | null = null;
  let existingPatch: any = null;

  try {
    const cloudResponse = await Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
      method: 'GET',
      headers: { Authorization: buildAuthHeader() },
    });
    if (cloudResponse.ok) {
      cloudETag = cloudResponse.headers.get('ETag');
      existingPatch = await cloudResponse.json();
    }
  } catch (_e) {
    logger.info('云端无增量日志，将创建新文件');
  }

  if (existingPatch && existingPatch.changes) {
    const localMtime = new Map(dirtyEntries.map(([id, wd]) => [parseInt(id, 10), wd.mtime || 0]));
    const localDeleted = new Set(deletedEntries.map(d => d.id));

    for (const change of existingPatch.changes) {
      if (localDeleted.has(change.id)) continue;
      if (change.action === 'delete') continue;

      if (
        !localMtime.has(change.id) ||
        (change.mtime || 0) > (localMtime.get(change.id) || 0)
      ) {
        patchData.changes.push(change);
      }
    }

    patchData.changes.sort((a: any, b: any) => (a.mtime || 0) - (b.mtime || 0));
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

  return cloudETag;
}

async function uploadPatch(patchData: any, cloudETag: string | null): Promise<Response> {
  const patchBlob = new Blob([JSON.stringify(patchData)], { type: 'application/json' });

  const patchHeaders: Record<string, string> = {
    Authorization: buildAuthHeader(),
    'Content-Type': 'application/json',
  };

  if (cloudETag) {
    patchHeaders['If-Match'] = cloudETag;
  }

  return Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
    method: 'PUT',
    headers: patchHeaders,
    body: patchBlob,
  });
}

function clearProgressDirtyFlags(memoryCache: any, dirtyEntries: any[]): void {
  dirtyEntries.forEach(([id, wd]) => {
    delete wd.isDirty;
    setCacheValue(memoryCache.progress, id, wd);
  });
}

function clearMetaDirtyFlags(memoryCache: any, hasWrongWordsChanges: boolean, hasHeatmapChanges: boolean): void {
  if (hasWrongWordsChanges) {
    memoryCache.wrongWordsDirty = false;
  }
  if (hasHeatmapChanges) {
    memoryCache.heatmapDirty = false;
  }
}

function persistSyncMarkers(patchResponse: Response): void {
  const newETag = patchResponse.headers.get('ETag');
  if (newETag) localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ETAG, newETag);
  localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
}

function persistSyncBaseFromCache(memoryCache: any): void {
  const localData = buildLocalSyncData(memoryCache);
  saveSyncBase({
    wrongWords: localData.wrongWords,
    heatmap: localData.heatmap,
    timestamp: Date.now(),
  });
}

async function commitPatchToDB(
  db: any,
  memoryCache: any,
  patchData: any,
  dirtyEntries: any[],
  hasWrongWordsChanges: boolean,
  hasHeatmapChanges: boolean,
  patchResponse: Response
): Promise<any> {
  if (!(patchResponse.ok || patchResponse.status === 201)) {
    if (patchResponse.status === 412) {
      throw new Error('云端数据已被其他设备修改，请重试');
    }
    throw new Error(`同步失败: ${patchResponse.status}`);
  }

  const tx = db.instance.transaction('progress', 'readwrite');
  const store = tx.objectStore('progress');
  dirtyEntries.forEach(([id, wd]) => {
    store.put({ ...wd, id: parseInt(id, 10) });
  });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      clearProgressDirtyFlags(memoryCache, dirtyEntries);
      resolve();
    };
    tx.onerror = () => reject(new Error('IndexedDB 事务失败'));
    tx.onabort = () => reject(new Error('IndexedDB 事务中止: ' + (tx.error?.message || 'unknown')));
  });

  clearMetaDirtyFlags(memoryCache, hasWrongWordsChanges, hasHeatmapChanges);
  persistSyncMarkers(patchResponse);
  persistSyncBaseFromCache(memoryCache);

  return { status: 'success', changes: patchData.changes.length };
}

export function syncToWebDAV(db: any, memoryCache: any, deviceId: string, masterKey?: string): Promise<any> {
  if (!webdavConfig) throw new Error('请先配置 WebDAV');

  if (syncToPromise) {
    logger.warn('🔄 上传同步已在进行中...');
    updateWebDAVStatus('同步中，请稍候...');
    return syncToPromise;
  }

  const runSync = syncMutexQueue.then(() =>
    doSyncToWebDAV(db, memoryCache, deviceId, masterKey)
  );

  syncMutexQueue = runSync.catch(() => {});
  syncToPromise = runSync;
  return syncToPromise;
}

async function doSyncToWebDAV(db: any, memoryCache: any, deviceId: string, masterKey?: string): Promise<any> {
  await ensureCredentialsForSync(masterKey);
  try {
    updateWebDAVStatus('开始同步...');

    await saveSnapshotToSession(db, memoryCache);
    await ensureBackupExists(memoryCache, db);

    const patch = buildPatchFromDirty(memoryCache, deviceId);
    if (patch.status === 'no_changes') {
      return patch;
    }

    const cloudETag = await mergeWithCloudPatch(patch.patchData, patch.dirtyEntries, patch.deletedEntries);
    const patchResponse = await uploadPatch(patch.patchData, cloudETag);
    const result = await commitPatchToDB(
      db, memoryCache, patch.patchData, patch.dirtyEntries,
      patch.hasWrongWordsChanges, patch.hasHeatmapChanges, patchResponse
    );

    updateWebDAVStatus('同步成功');
    return result;
  } catch (error) {
    logger.error('同步失败:', error);
    updateWebDAVStatus('同步失败');
    throw error;
  } finally {
    clearWebDAVPlaintextCredentials();
    syncToPromise = null;
  }
}

async function saveLocalSnapshotForDownload(db: any, memoryCache: any): Promise<void> {
  try {
    const snapshot = {
      timestamp: Date.now(),
      data: buildLocalSyncData(memoryCache),
    };
    await db.save('session', { key: 'last_snapshot', data: snapshot });
  } catch (e) {
    logger.warn('保存快照失败:', e);
  }
}

async function fetchCloudPatchForDownload(): Promise<any> {
  try {
    const patchResponse = await Network.fetchWithRetry(webdavConfig.url + '/cet46_patch.json', {
      method: 'GET',
      headers: { Authorization: buildAuthHeader() },
    });
    if (patchResponse.ok) {
      return await patchResponse.json();
    }
  } catch (e: any) {
    logger.info('云端无增量日志或获取失败:', e.message);
  }
  return null;
}

async function persistPatchWrongWords(patchData: any, memoryCache: any, db: any): Promise<void> {
  if (!patchData.meta.wrongWords) return;

  const cloudWrongWords = patchData.meta.wrongWords;
  const wrongWordsToPersist: any[] = [];

  for (const [id, data] of Object.entries(cloudWrongWords)) {
    const localData = getCacheValue(memoryCache.wrongWords, id);
    if (!localData || (patchData.meta.wrongWordsMtime || 0) > (localData.mtime || 0)) {
      if (db.instance) wrongWordsToPersist.push({ id: parseInt(id, 10), data });
      setCacheValue(memoryCache.wrongWords, id, data);
    }
  }

  if (db.instance && wrongWordsToPersist.length > 0) {
    await db.bulkSave('wrongWords', wrongWordsToPersist);
  }
}

async function persistPatchHeatmap(patchData: any, memoryCache: any, db: any): Promise<void> {
  if (!patchData.meta.heatmap) return;

  const cloudHeatmap = patchData.meta.heatmap;
  const heatmapToPersist: any[] = [];

  for (const [date, count] of Object.entries(cloudHeatmap) as [string, number][]) {
    const localCount = getCacheValue(memoryCache.heatmap, date);
    if (!localCount || count > localCount) {
      if (db.instance) heatmapToPersist.push({ date, count });
      setCacheValue(memoryCache.heatmap, date, count);
    }
  }

  if (db.instance && heatmapToPersist.length > 0) {
    await db.bulkSave('heatmap', heatmapToPersist);
  }
}

async function applyPatchMetaToCache(patchData: any, memoryCache: any, db: any): Promise<void> {
  try {
    await persistPatchWrongWords(patchData, memoryCache, db);
    await persistPatchHeatmap(patchData, memoryCache, db);
  } catch (e) {
    logger.warn('应用增量补丁失败:', e);
  }
}

async function fetchCloudBackup(): Promise<Response> {
  try {
    return await Network.fetchWithRetry(webdavConfig.url + '/cet46_backup.json', {
      method: 'GET',
      headers: { Authorization: buildAuthHeader() },
    });
  } catch (e: any) {
    throw new Error(`网络请求失败: ${e.message}`);
  }
}

async function mergeCloudBackup(cloudData: any, memoryCache: any, deviceId: string): Promise<any> {
  try {
    return await mergeLocalAndCloud(
      buildLocalSyncData(memoryCache),
      {
        progress: cloudData.progress || {},
        wrongWords: cloudData.wrongWords || {},
        heatmap: cloudData.heatmap || {},
        deletedIds: cloudData.deletedIds || [],
      },
      deviceId
    );
  } catch (e: any) {
    throw new Error('合并数据失败: ' + e.message);
  }
}

async function persistMergedData(db: any, merged: any): Promise<void> {
  if (!db.instance) return;
  try {
    const progressData = Object.entries(merged.progress).map(([id, wd]: [string, any]) =>
      mergeWithId(wd, parseInt(id, 10))
    );
    await db.bulkSave('progress', progressData);

    const wrongWordsData = Object.entries(merged.wrongWords).map(([id, wrongData]) => ({
      id: parseInt(id, 10),
      data: wrongData,
    }));
    await db.bulkSave('wrongWords', wrongWordsData);

    const heatmapData = Object.entries(merged.heatmap).map(([date, count]) => ({
      date,
      count,
    }));
    await db.bulkSave('heatmap', heatmapData);
  } catch (e: any) {
    logger.error('保存到数据库失败:', e);
    throw new Error('保存同步数据失败: ' + e.message);
  }
}

function updateMemoryCacheFromMerged(memoryCache: any, merged: any): void {
  try {
    if (memoryCache.progress && typeof memoryCache.progress.clear === 'function') {
      memoryCache.progress.clear();
      for (const [id, wd] of Object.entries(merged.progress)) {
        memoryCache.progress.set(id, wd);
      }
    } else {
      memoryCache.progress = merged.progress;
    }

    if (memoryCache.wrongWords && typeof memoryCache.wrongWords.clear === 'function') {
      memoryCache.wrongWords.clear();
      for (const [id, wrongData] of Object.entries(merged.wrongWords)) {
        memoryCache.wrongWords.set(id, wrongData);
      }
    } else {
      memoryCache.wrongWords = merged.wrongWords;
    }

    if (memoryCache.heatmap && typeof memoryCache.heatmap.clear === 'function') {
      memoryCache.heatmap.clear();
      for (const [date, count] of Object.entries(merged.heatmap)) {
        memoryCache.heatmap.set(date, count);
      }
    } else {
      memoryCache.heatmap = merged.heatmap;
    }

    memoryCache.deletedIds = new Set(merged.deletedIds || []);
  } catch (e: any) {
    logger.error('更新内存缓存失败:', e);
    throw new Error('更新本地缓存失败: ' + e.message);
  }
}

export function syncFromWebDAV(db: any, memoryCache: any, deviceId: string, masterKey?: string): Promise<any> {
  if (!webdavConfig) throw new Error('请先配置 WebDAV');

  if (syncFromPromise) {
    logger.warn('下载同步已在进行中...');
    updateWebDAVStatus('同步中，请稍候...');
    return syncFromPromise;
  }

  const runSync = syncMutexQueue.then(() =>
    doSyncFromWebDAV(db, memoryCache, deviceId, masterKey)
  );
  syncMutexQueue = runSync.catch(() => {});
  syncFromPromise = runSync;
  return syncFromPromise;
}

async function doSyncFromWebDAV(db: any, memoryCache: any, deviceId: string, masterKey?: string): Promise<any> {
  await ensureCredentialsForSync(masterKey);
  try {
    await saveLocalSnapshotForDownload(db, memoryCache);

    const patchData = await fetchCloudPatchForDownload();
    if (patchData && patchData.meta) {
      await applyPatchMetaToCache(patchData, memoryCache, db);
    }

    const response = await fetchCloudBackup();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('云端没有找到备份文件');
      }
      throw new Error(`同步失败: ${response.status}`);
    }

    let cloudData: any;
    try {
      cloudData = await response.json();
    } catch (e: any) {
      throw new Error('云端数据解析失败: ' + e.message);
    }

    const merged = await mergeCloudBackup(cloudData, memoryCache, deviceId);

    const cloudProgressCount = Object.keys(cloudData.progress || {}).length;
    const localCount = getCacheSize(memoryCache.progress);
    if (cloudProgressCount > localCount) {
      return {
        status: 'needs_full_sync',
        cloudData,
        merged,
        message: '云端词库更大，建议全量同步',
      };
    }

    await persistMergedData(db, merged);
    updateMemoryCacheFromMerged(memoryCache, merged);

    try {
      saveSyncBase({
        wrongWords: merged.wrongWords,
        heatmap: merged.heatmap,
        timestamp: Date.now(),
      });
    } catch (e) {
      logger.warn('保存同步基准失败:', e);
    }

    return { status: 'success', merged };
  } finally {
    syncFromPromise = null;
    clearWebDAVPlaintextCredentials();
  }
}

export function exportEncryptionKey(): any {
  if (!webdavConfig || !webdavConfig.encryptedAuth) {
    return null;
  }
  return {
    url: webdavConfig.url,
    auth: webdavConfig.encryptedAuth,
    autoSync: webdavConfig.autoSync,
  };
}
