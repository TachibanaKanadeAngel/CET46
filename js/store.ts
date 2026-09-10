import { db } from './db.js';
import { CONFIG } from './config.js';
import logger from './utils/logger.js';
import { localDateStr } from './utils/date.js';

/**
 * LRU 缓存实现 - 严格限制内存上限，防止 OOM
 * 使用 Map 保持插入顺序，最旧的键在开头
 */
export class LRUCache<V = any> {
  public limit: number;
  public cache: Map<string | number, V>;
  public name: string;
  public accessCount: number;
  public hitCount: number;

  constructor(limit: number = 1000, name: string = 'default') {
    this.limit = limit;
    this.cache = new Map();
    this.name = name;
    this.accessCount = 0;
    this.hitCount = 0;
  }

  public get(key: string | number): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    this.accessCount++;
    this.hitCount++;
    return value;
  }

  public set(key: string | number, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.limit) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        logger.info(`[LRU:${this.name}] 淘汰最旧键: ${oldestKey}`);
      }
    }

    this.cache.set(key, value);
    this.accessCount++;
  }

  public delete(key: string | number): boolean {
    return this.cache.delete(key);
  }

  public has(key: string | number): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }

  public keys(): Array<string | number> {
    return Array.from(this.cache.keys());
  }

  public entries(): Array<[string | number, V]> {
    return Array.from(this.cache.entries());
  }

  public toObject(): Record<string, V> {
    const obj: Record<string, V> = {};
    for (const [key, value] of this.cache) {
      obj[String(key)] = value;
    }
    return obj;
  }

  public bulkLoad(obj: Record<string, V>): void {
    const entries = Object.entries(obj);
    if (entries.length > this.limit) {
      const toKeep = entries.slice(entries.length - this.limit);
      this.cache = new Map(toKeep as any);
    } else {
      this.cache = new Map(entries as any);
    }
  }

  public fromObject(obj: Record<string, V>): void {
    this.clear();
    for (const [key, value] of Object.entries(obj)) {
      this.set(key, value);
    }
  }

  public getStats() {
    return {
      name: this.name,
      size: this.cache.size,
      limit: this.limit,
      accessCount: this.accessCount,
      hitRate: this.accessCount > 0 ? (this.hitCount / this.accessCount).toFixed(2) : 0,
    };
  }
}

function createDebouncer(fn: (...args: any[]) => any, delay: number): (...args: any[]) => void {
  let timer: any = null;
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export const memoryCache = {
  progress: new LRUCache(CONFIG.LRU_LIMIT_PROGRESS || 7000, 'progress') as any,
  wrongWords: new LRUCache(CONFIG.LRU_LIMIT_WRONGWORDS || 500, 'wrongWords') as any,
  heatmap: new LRUCache(CONFIG.LRU_LIMIT_HEATMAP || 365, 'heatmap') as any,
  session: null as any,
  studySession: null as any,
  initialized: false,
  stateSnapshots: [] as any[],
  deletedIds: new Set<string | number>(),
  wrongWordsDirty: false,
  heatmapDirty: false,
  progressSnapshot: null as any,
  progressDirtyIds: new Set<string | number>(),
  progressDirty: false,
};

const FLUSH_DEBOUNCE_MS = CONFIG.SYNC_DEBOUNCE_MS || 300;

/** 单词进度的单一默认来源：core.ts 与 store.ts 共用，避免两处默认值漂移 */
export function createDefaultWordProgress(): any {
  return {
    status: 'new',
    level: 0,
    nextReview: 0,
    lastStudy: 0,
    ef: CONFIG.FSRS.DEFAULT_EF,
    reviewCount: 0,
    stability: CONFIG.FSRS.DEFAULT_W[0],
    difficulty: CONFIG.FSRS.DEFAULT_W[4],
    interval: 0,
  };
}

const storeListeners = new Map<string, Set<(val: any, key?: string) => void>>();
const proxyCache = new WeakMap();

function createReactiveCache(cache: typeof memoryCache) {
  return new Proxy(cache, {
    set(target: any, prop: string | symbol, value: any) {
      target[prop] = value;

      if (prop === 'progress' || prop === 'wrongWords' || prop === 'heatmap') {
        notifyStoreChange(String(prop), value);
      }

      return true;
    },

    get(target: any, prop: string | symbol) {
      const value = target[prop];

      if (typeof value === 'function') {
        return value.bind(target);
      }

      if (
        value instanceof Map ||
        value instanceof Set ||
        value instanceof WeakMap ||
        value instanceof WeakSet ||
        (value && typeof value.get === 'function' && typeof value.set === 'function')
      ) {
        return value;
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        (prop === 'progress' || prop === 'wrongWords' || prop === 'heatmap')
      ) {
        if (proxyCache.has(value)) {
          return proxyCache.get(value);
        }

        const nestedProxy = new Proxy(value, {
          set(nestedTarget: any, nestedProp: string | symbol, nestedValue: any) {
            nestedTarget[nestedProp] = nestedValue;
            notifyStoreChange(String(prop), nestedTarget);
            return true;
          },
          deleteProperty(nestedTarget: any, nestedProp: string | symbol) {
            delete nestedTarget[nestedProp];
            notifyStoreChange(String(prop), nestedTarget);
            return true;
          },
        });

        proxyCache.set(value, nestedProxy);
        return nestedProxy;
      }

      return value;
    },
  });
}

export const ReactiveCache = createReactiveCache(memoryCache);

function notifyStoreChange(key: string, value: any): void {
  if (storeListeners.has(key)) {
    storeListeners.get(key)!.forEach(callback => {
      try {
        callback(value, key);
      } catch (e) {
        logger.error(`[Store] 监听器执行失败 (${key}):`, e);
      }
    });
  }

  if (storeListeners.has('*')) {
    storeListeners.get('*')!.forEach(callback => {
      try {
        callback({ key, value });
      } catch (e) {
        logger.error('[Store] 通配监听器执行失败:', e);
      }
    });
  }
}

export function subscribeToStore(key: string, callback: (val: any) => void): () => void {
  if (!storeListeners.has(key)) {
    storeListeners.set(key, new Set());
  }
  storeListeners.get(key)!.add(callback);

  return () => {
    const listeners = storeListeners.get(key);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

export async function loadFromIndexedDB(): Promise<void> {
  if (!db.instance) return;

  try {
    const progressData = await db.getAll('progress');
    const progressObj: Record<string, any> = {};
    progressData.forEach((item: any) => {
      const key = item.word || item.id;
      if (key) progressObj[key] = item;
    });
    memoryCache.progress.fromObject(progressObj);

    const wrongWordsData = await db.getAll('wrongWords');
    const wrongWordsObj: Record<string, any> = {};
    wrongWordsData.forEach((item: any) => {
      const key = item.id || item.word;
      if (key) wrongWordsObj[key] = item.data || item;
    });
    memoryCache.wrongWords.fromObject(wrongWordsObj);

    const heatmapData = await db.getAll('heatmap');
    const heatmapObj: Record<string, any> = {};
    heatmapData.forEach((item: any) => {
      if (item.date) heatmapObj[item.date] = item.count;
    });
    memoryCache.heatmap.fromObject(heatmapObj);

    const session = await db.get('session', 'current');
    if (session) memoryCache.session = (session as any).data || session;

    const studySession = await db.get('session', 'study_session');
    if (studySession) memoryCache.studySession = (studySession as any).data || studySession;

    const snapshot = await db.get('session', 'progressSnapshot');
    if (snapshot) memoryCache.progressSnapshot = (snapshot as any).data || snapshot;

    memoryCache.initialized = true;
    notifyStoreChange('initialized', true);

    if (typeof logger !== 'undefined' && logger.info) {
      logger.info('[LRU] 缓存加载完成:', {
        progress: memoryCache.progress.getStats(),
        wrongWords: memoryCache.wrongWords.getStats(),
        heatmap: memoryCache.heatmap.getStats(),
      });
    }
  } catch (error) {
    memoryCache.initialized = true;
    notifyStoreChange('initialized', { success: false, error });
    logger.error('从 IndexedDB 加载缓存失败:', error);
  }
}

export async function saveToIndexedDB(storeName: string, data: any): Promise<void> {
  if (!db.instance) return;
  await db.save(storeName, data);
}

export async function bulkSaveToIndexedDB(
  storeName: string,
  dataArray: any[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  if (!db.instance) return;
  await db.bulkSave(storeName, dataArray, onProgress as any);
}

export function getWordDataSync(id: any): any {
  let data: any;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    data = memoryCache.progress.get(id);
  } else {
    data = (memoryCache.progress as any)[id];
  }

  return data || createDefaultWordProgress();
}

export function setWordDataSync(id: any, data: any): void {
  if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
    memoryCache.progress.set(id, data);
  } else {
    (memoryCache.progress as any)[id] = data;
  }
  memoryCache.progressDirtyIds.add(id);
  memoryCache.progressDirty = true;
}

export function updateWordData(id: any, updateFn: (cur: any) => any): any {
  const currentData = getWordDataSync(id);

  if (!currentData || currentData.status === 'new') {
    setWordDataSync(id, { id });
  }

  const updated = updateFn(getWordDataSync(id));
  setWordDataSync(id, { ...getWordDataSync(id), ...updated });

  return getWordDataSync(id);
}

export function deleteWordData(id: any): void {
  const currentData = getWordDataSync(id);
  if (currentData && currentData.status !== 'new') {
    if (memoryCache.progress && typeof memoryCache.progress.delete === 'function') {
      memoryCache.progress.delete(id);
    } else {
      delete (memoryCache.progress as any)[id];
    }
    memoryCache.deletedIds.add(id);
  }
}

export function getWrongWords(): any {
  return memoryCache.wrongWords;
}

export async function flushWrongWords(): Promise<void> {
  if (!memoryCache.wrongWordsDirty || !db.instance) return;

  const entries = memoryCache.wrongWords.entries
    ? memoryCache.wrongWords.entries()
    : Object.entries(memoryCache.wrongWords);
  const dataArray = entries.map(([id, data]: [any, any]) => ({
    id,
    data,
  }));

  try {
    await db.bulkSave('wrongWords', dataArray as any);
    memoryCache.wrongWordsDirty = false;
  } catch (error) {
    logger.error('保存错题数据失败:', error);
  }
}

export const saveWrongWords = createDebouncer(() => {
  memoryCache.wrongWordsDirty = true;
  flushWrongWords();
}, FLUSH_DEBOUNCE_MS);

export function getWrongWordData(id: any): any {
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.get === 'function') {
    return memoryCache.wrongWords.get(id);
  }
  return (memoryCache.wrongWords as any)[id];
}

export function setWrongWordData(id: any, data: any): void {
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.set === 'function') {
    memoryCache.wrongWords.set(id, data);
  } else {
    (memoryCache.wrongWords as any)[id] = data;
  }
}

export function deleteWrongWordData(id: any): void {
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.delete === 'function') {
    memoryCache.wrongWords.delete(id);
  } else {
    delete (memoryCache.wrongWords as any)[id];
  }
}

function resolveWordById(id: any): any {
  const words = typeof window !== 'undefined' && Array.isArray((window as any).WORDS) ? (window as any).WORDS : [];
  if (words.length === 0) return null;
  return words.find((w: any) => String(w.id) === String(id)) || null;
}

export function addWrongWord(idOrWord: any, maybeWord?: any): boolean {
  let id: any = null;
  let word: any = null;

  if (idOrWord && typeof idOrWord === 'object') {
    word = idOrWord;
    id = word.id;
  } else {
    id = idOrWord;
    word = maybeWord || resolveWordById(id);
  }

  if (id === undefined || id === null) {
    logger.warn('[Store] addWrongWord: invalid id', idOrWord);
    return false;
  }

  if (!word || typeof word !== 'object') {
    logger.warn('[Store] addWrongWord: word not found', idOrWord);
    return false;
  }

  const meaning = word.meaning || word.translation || '';
  const translation = word.translation || word.meaning || '';

  let wrongData = getWrongWordData(id);

  if (!wrongData) {
    wrongData = {
      word: word.word || '',
      meaning,
      translation,
      count: 0,
      firstWrong: Date.now(),
      lastWrong: 0,
    };
  } else {
    if (!wrongData.word && word.word) wrongData.word = word.word;
    if (!wrongData.meaning && meaning) wrongData.meaning = meaning;
    if (!wrongData.translation && translation) wrongData.translation = translation;
  }

  wrongData.count++;
  wrongData.lastWrong = Date.now();

  setWrongWordData(id, wrongData);
  memoryCache.wrongWordsDirty = true;
  saveWrongWords();
  return true;
}

export function removeWrongWord(id: any): void {
  if (getWrongWordData(id)) {
    deleteWrongWordData(id);
    memoryCache.wrongWordsDirty = true;
    saveWrongWords();
  }
}

function getHeatmapValue(date: string): number {
  if (memoryCache.heatmap && typeof memoryCache.heatmap.get === 'function') {
    return memoryCache.heatmap.get(date) || 0;
  }
  return (memoryCache.heatmap as any)[date] || 0;
}

function setHeatmapValue(date: string, count: number): void {
  if (memoryCache.heatmap && typeof memoryCache.heatmap.set === 'function') {
    memoryCache.heatmap.set(date, count);
  } else {
    (memoryCache.heatmap as any)[date] = count;
  }
}

export function getHeatmap(): any {
  if (memoryCache.heatmap && typeof memoryCache.heatmap.toObject === 'function') {
    return memoryCache.heatmap.toObject();
  }
  return memoryCache.heatmap;
}

export async function flushHeatmap(): Promise<void> {
  if (!memoryCache.heatmapDirty || !db.instance) return;

  const dataArray = memoryCache.heatmap.entries().map(([date, count]: [any, any]) => ({
    date,
    count,
  }));

  try {
    await db.bulkSave('heatmap', dataArray as any);
    memoryCache.heatmapDirty = false;
  } catch (error) {
    logger.error('保存热力图数据失败:', error);
  }
}

export const saveHeatmap = createDebouncer(() => {
  memoryCache.heatmapDirty = true;
  flushHeatmap();
}, FLUSH_DEBOUNCE_MS);

export function recordHeatmap(date?: string, count: number = 1): void {
  const actualDate = date || localDateStr();
  const actualCount = count || 1;
  const currentCount = getHeatmapValue(actualDate);
  setHeatmapValue(actualDate, currentCount + actualCount);
  memoryCache.heatmapDirty = true;
  saveHeatmap();
}

export async function flushProgress(): Promise<void> {
  if (!memoryCache.progressDirty || !db.instance) return;

  const idsToFlush = [...memoryCache.progressDirtyIds];
  const idsToDelete = [...memoryCache.deletedIds];

  try {
    if (idsToFlush.length > 0) {
      const dataArray = idsToFlush
        .map(id => {
          const data = memoryCache.progress.get ? memoryCache.progress.get(id) : (memoryCache.progress as any)[id];
          return data ? { id: String(id), ...data } : null;
        })
        .filter(Boolean);

      if (dataArray.length > 0) {
        await db.bulkSave('progress', dataArray as any);
      }
    }

    if (idsToDelete.length > 0) {
      await Promise.all(
        idsToDelete.map(id => {
          const numericId = Number(id);
          if (!Number.isFinite(numericId)) {
            return Promise.resolve();
          }
          return db.delete('progress', numericId);
        })
      );
    }

    idsToFlush.forEach(id => memoryCache.progressDirtyIds.delete(id));
    const validDeletes = idsToDelete.filter(id => Number.isFinite(Number(id)));
    validDeletes.forEach(id => memoryCache.deletedIds.delete(id));

    if (memoryCache.progressDirtyIds.size === 0 && memoryCache.deletedIds.size === 0) {
      memoryCache.progressDirty = false;
    }
  } catch (error) {
    logger.error('保存进度数据失败:', error);
    memoryCache.progressDirty = true;
  }
}

export const saveProgress = createDebouncer(() => {
  memoryCache.progressDirty = true;
  flushProgress();
}, FLUSH_DEBOUNCE_MS);

export function getMemoryCache(): typeof memoryCache {
  return memoryCache;
}

export function getReactiveCache(): any {
  return ReactiveCache;
}

export function clearProxyCache(): void {
  logger.info('[Store] WeakMap 无法手动清空，依赖自动垃圾回收');
}

export class MemoryStorage implements Storage {
  private cache: Map<string, string> = new Map();

  get length(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }

  public getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  public key(index: number): string | null {
    const keys = Array.from(this.cache.keys());
    return keys[index] ?? null;
  }

  public removeItem(key: string): void {
    this.cache.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.cache.set(key, String(value));
  }
}

function getSafeStorage(): Storage {
  try {
    const testKey = '__cet46_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (_e) {
    return new MemoryStorage();
  }
}

export class SafeStore {
  private storage: Storage;

  constructor() {
    this.storage = typeof window !== 'undefined' ? getSafeStorage() : new MemoryStorage();
  }

  public get<T>(key: string, defaultValue: T): T {
    try {
      const raw = this.storage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (_e) {
      return defaultValue;
    }
  }

  public set<T>(key: string, value: T): boolean {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_e) {
      return false;
    }
  }

  public remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (_e) {
      // Ignore
    }
  }

  public clear(): void {
    try {
      this.storage.clear();
    } catch (_e) {
      // Ignore
    }
  }
}
