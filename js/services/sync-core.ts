import logger from '../utils/logger.js';
import { createFocusTrap } from '../utils/dom.js';
import { CONFIG } from '../config.js';

export function getCacheData(cache: any): Record<string, any> {
  if (!cache) return {};
  if (typeof cache.toObject === 'function') {
    return cache.toObject();
  }
  return { ...cache };
}

export function getCacheEntries(cache: any): [string, any][] {
  if (!cache) return [];
  if (typeof cache.entries === 'function') {
    return cache.entries();
  }
  return Object.entries(cache);
}

export function setCacheValue(cache: any, key: string | number, value: any): void {
  if (!cache) return;
  if (typeof cache.set === 'function' && typeof cache.get === 'function') {
    cache.set(key, value);
  } else {
    cache[key] = value;
  }
}

export function getCacheValue(cache: any, key: string | number): any {
  if (!cache) return undefined;
  if (typeof cache.get === 'function') {
    return cache.get(key);
  }
  return cache[key];
}

export function getCacheSize(cache: any): number {
  if (!cache) return 0;
  if (typeof cache.size === 'number') {
    return cache.size;
  }
  return Object.keys(cache).length;
}

export function generateVectorClock(deviceId: string): Record<string, number> {
  let clock: Record<string, number> = {};
  try {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.VECTOR_CLOCK);
    if (stored) {
      clock = JSON.parse(stored);
    }
  } catch (e) {
    logger.warn('解析 vector clock 失败，重置为空:', e);
    clock = {};
  }

  if (!clock[deviceId]) {
    clock[deviceId] = 0;
  }
  clock[deviceId]++;

  localStorage.setItem(CONFIG.STORAGE_KEYS.VECTOR_CLOCK, JSON.stringify(clock));
  return { ...clock };
}

export class ConflictError extends Error {
  public localWd: any;
  public cloudWd: any;
  public field: string;

  constructor(message: string, localWd: any, cloudWd: any, field: string) {
    super(message);
    this.name = 'ConflictError';
    this.localWd = localWd;
    this.cloudWd = cloudWd;
    this.field = field;
  }
}

export function mergePropertyAware(localWd: any, cloudWd: any): any {
  const localMnemonic = localWd.mnemonic || '';
  const cloudMnemonic = cloudWd.mnemonic || '';

  if (localMnemonic !== cloudMnemonic && localMnemonic && cloudMnemonic) {
    throw new ConflictError('助记词冲突', localWd, cloudWd, 'mnemonic');
  }

  let mergedMnemonic = localMnemonic;
  if (localMnemonic !== cloudMnemonic && cloudMnemonic) {
    mergedMnemonic = localMnemonic ? `${localMnemonic} | ${cloudMnemonic}` : cloudMnemonic;
  }

  const localLast = localWd.lastStudy ?? 0;
  const cloudLast = cloudWd.lastStudy ?? 0;
  let localIsNewer: boolean;
  if (localLast !== cloudLast) {
    localIsNewer = localLast > cloudLast;
  } else {
    const localMtime = localWd.mtime ?? 0;
    const cloudMtime = cloudWd.mtime ?? 0;
    if (localMtime !== cloudMtime) {
      localIsNewer = localMtime > cloudMtime;
    } else {
      const localReview = localWd.reviewCount ?? 0;
      const cloudReview = cloudWd.reviewCount ?? 0;
      localIsNewer = localReview >= cloudReview;
    }
  }

  const newerSide = localIsNewer ? localWd : cloudWd;

  const merged: any = {
    status: newerSide.status ?? localWd.status ?? cloudWd.status,
    level: newerSide.level ?? localWd.level ?? cloudWd.level ?? 0,
    stability: newerSide.stability ?? localWd.stability ?? cloudWd.stability,
    difficulty: newerSide.difficulty ?? localWd.difficulty ?? cloudWd.difficulty,
    ef: newerSide.ef ?? localWd.ef ?? cloudWd.ef,
    nextReview:
      newerSide.nextReview !== undefined
        ? newerSide.nextReview
        : Math.max(localWd.nextReview ?? 0, cloudWd.nextReview ?? 0),
    reviewCount: Math.max(localWd.reviewCount ?? 0, cloudWd.reviewCount ?? 0),
    wrongCount: Math.max(localWd.wrongCount ?? 0, cloudWd.wrongCount ?? 0),
    lastStudy: Math.max(localLast, cloudLast),
    mtime: Math.max(localWd.mtime ?? 0, cloudWd.mtime ?? 0),
    mnemonic: mergedMnemonic,
  };

  if (localWd.nextReviewDate && cloudWd.nextReviewDate) {
    merged.nextReviewDate =
      localWd.nextReviewDate > cloudWd.nextReviewDate
        ? localWd.nextReviewDate
        : cloudWd.nextReviewDate;
  } else if (localWd.nextReviewDate) {
    merged.nextReviewDate = localWd.nextReviewDate;
  } else if (cloudWd.nextReviewDate) {
    merged.nextReviewDate = cloudWd.nextReviewDate;
  }

  if (localWd.vectorClock || cloudWd.vectorClock) {
    const lc = localWd.vectorClock || {};
    const cc = cloudWd.vectorClock || {};
    const deviceIds = new Set([...Object.keys(lc), ...Object.keys(cc)]);
    const mergedVC: Record<string, number> = {};
    for (const did of deviceIds) {
      mergedVC[did] = Math.max(lc[did] ?? 0, cc[did] ?? 0);
    }
    merged.vectorClock = mergedVC;
  }

  if (localWd.isDirty || cloudWd.isDirty) {
    merged.isDirty = true;
  }

  return merged;
}

export function showConflictModal(local: any, cloud: any, field: string): Promise<'local' | 'cloud'> {
  return new Promise(resolve => {
    const modal = document.getElementById('conflict-modal');
    if (!modal) {
      logger.warn('冲突弹窗不存在，自动合并');
      resolve('cloud');
      return;
    }

    const elWord = document.getElementById('conflict-word');
    if (elWord) elWord.textContent = local.word || cloud.word || '未知单词';
    const elDiff = document.getElementById('conflict-diff');
    if (elDiff) {
      elDiff.textContent =
        `冲突字段：${field}\n\n本地：${local[field] || '空'}\n云端：${cloud[field] || '空'}`;
    }

    const counter = document.getElementById('conflict-counter');
    if (counter) {
      counter.textContent = '请选择保留哪个版本的数据';
    }

    modal.classList.add('active');
    const cleanupFocusTrap = createFocusTrap(modal);

    const keepLocalBtn = document.getElementById('keep-local');
    const useCloudBtn = document.getElementById('use-cloud');

    if (!keepLocalBtn || !useCloudBtn) {
      modal.classList.remove('active');
      cleanupFocusTrap();
      resolve('cloud');
      return;
    }

    const conflictTimeout = setTimeout(() => {
      cleanup();
      resolve('cloud');
    }, 60000);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve('cloud');
      }
    };
    modal.addEventListener('keydown', handleEscape);

    const cleanup = () => {
      clearTimeout(conflictTimeout);
      keepLocalBtn.onclick = null;
      useCloudBtn.onclick = null;
      modal.removeEventListener('keydown', handleEscape);
      modal.classList.remove('active');
      cleanupFocusTrap();
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

export async function mergePropertyAwareInteractive(localWd: any, cloudWd: any, _wordId?: any): Promise<any> {
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

export function getSyncBase(): any {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SYNC_BASE) || '{}');
  } catch {
    return {};
  }
}

export function saveSyncBase(data: any): void {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SYNC_BASE, JSON.stringify(data));
  } catch (_e) {
    // 忽略或在配额不足时保护，防止同步中断
  }
}

export function getBaseValue(type: string, id: string | number, field: string = 'count'): number {
  const base = getSyncBase();
  const typeData = base[type];
  if (!typeData) return 0;

  if (type === 'heatmap') {
    return typeData[id] ?? 0;
  }

  return typeData[id]?.[field] ?? 0;
}

export async function generateBackupData(memoryCache: any, db: any): Promise<any> {
  let progress: Record<string, any> = {};
  let wrongWords: Record<string, any> = {};
  let heatmap: Record<string, any> = {};

  if (db && db.instance) {
    try {
      const allProgress = await db.getAll('progress');
      if (allProgress && allProgress.length > 0) {
        for (const record of allProgress) {
          const { id, ...wd } = record;
          progress[id] = wd;
        }
      }

      const allWrongWords = await db.getAll('wrongWords');
      if (allWrongWords && allWrongWords.length > 0) {
        for (const record of allWrongWords) {
          wrongWords[record.id] = record.data;
        }
      }

      const allHeatmap = await db.getAll('heatmap');
      if (allHeatmap && allHeatmap.length > 0) {
        for (const record of allHeatmap) {
          heatmap[record.date] = record.count;
        }
      }
    } catch (e: any) {
      logger.warn('从 IndexedDB 读取全量备份失败，退化到内存缓存:', e?.message);
      progress = getCacheData(memoryCache.progress);
      wrongWords = getCacheData(memoryCache.wrongWords);
      heatmap = getCacheData(memoryCache.heatmap);
    }
  } else {
    progress = getCacheData(memoryCache.progress);
    wrongWords = getCacheData(memoryCache.wrongWords);
    heatmap = getCacheData(memoryCache.heatmap);
  }

  return {
    version: `backup_${Date.now()}`,
    timestamp: Date.now(),
    progress,
    wrongWords,
    heatmap,
    deletedIds: Array.from(memoryCache.deletedIds || []),
  };
}

export async function mergeLocalAndCloud(local: any, cloud: any, _deviceId?: string): Promise<any> {
  const mergedProgress: Record<string, any> = { ...(cloud.progress || {}) };
  const localDeletedSet = new Set<string>((local.deletedIds || []).map((id: any) => String(id)));
  const cloudDeletedSet = new Set<string>((cloud.deletedIds || []).map((id: any) => String(id)));
  const mergedDeletedIds = new Set<string>([...localDeletedSet, ...cloudDeletedSet]);

  const effectiveDeletedIds = new Set<string>();
  for (const id of Array.from(mergedDeletedIds)) {
    const localWd = local.progress ? local.progress[id] : null;
    const cloudWd = cloud.progress ? cloud.progress[id] : null;
    const localRestudied =
      !localDeletedSet.has(id) &&
      localWd &&
      localWd.status &&
      localWd.status !== 'deleted' &&
      typeof localWd.lastStudy === 'number' &&
      localWd.lastStudy > 0;
    const cloudRestudied =
      !cloudDeletedSet.has(id) &&
      cloudWd &&
      cloudWd.status &&
      cloudWd.status !== 'deleted' &&
      typeof cloudWd.lastStudy === 'number' &&
      cloudWd.lastStudy > 0;

    if (localRestudied || cloudRestudied) {
      continue;
    }
    effectiveDeletedIds.add(id);
  }

  for (const id of effectiveDeletedIds) {
    delete mergedProgress[id];
  }

  if (local.progress) {
    for (const [id, localWd] of Object.entries(local.progress)) {
      if (effectiveDeletedIds.has(id)) continue;

      const cloudWd = mergedProgress[id];

      if (!cloudWd) {
        mergedProgress[id] = localWd;
      } else {
        const merged = await mergePropertyAwareInteractive(localWd, cloudWd, id);
        mergedProgress[id] = merged;
      }
    }
  }

  const mergedWrongWords: Record<string, any> = { ...(cloud.wrongWords || {}) };
  if (local.wrongWords) {
    for (const [id, localWrong] of Object.entries(local.wrongWords) as [string, any][]) {
      const cloudWrong = mergedWrongWords[id];

      if (!cloudWrong) {
        mergedWrongWords[id] = localWrong;
      } else {
        const baseCount = getBaseValue('wrongWords', id, 'count');
        const localDelta = Math.max(0, (localWrong.count ?? 0) - baseCount);

        const localLast = localWrong.lastWrong ?? 0;
        const cloudLast = cloudWrong.lastWrong ?? 0;
        const base = cloudLast > localLast ? cloudWrong : localWrong;

        mergedWrongWords[id] = {
          ...base,
          count: (cloudWrong.count ?? 0) + localDelta,
          firstWrong: Math.min(localWrong.firstWrong || Infinity, cloudWrong.firstWrong || Infinity),
          lastWrong: Math.max(localLast, cloudLast),
        };
      }
    }
  }

  const mergedHeatmap: Record<string, any> = { ...(cloud.heatmap || {}) };
  if (local.heatmap) {
    for (const [date, localCount] of Object.entries(local.heatmap) as [string, number][]) {
      const cloudCount = cloud.heatmap ? (cloud.heatmap[date] ?? 0) : 0;
      const baseCount = getBaseValue('heatmap', date);
      const localDelta = Math.max(0, localCount - baseCount);

      mergedHeatmap[date] = cloudCount + localDelta;
    }
  }

  return {
    progress: mergedProgress,
    wrongWords: mergedWrongWords,
    heatmap: mergedHeatmap,
    deletedIds: Array.from(mergedDeletedIds),
  };
}
