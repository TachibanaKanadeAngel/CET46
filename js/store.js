import { db } from './db.js';
import { CONFIG } from './config.js';

let logger = {
  info: (...args) => console.log('[Store]', ...args),
  error: (...args) => console.error('[Store]', ...args),
  warn: (...args) => console.warn('[Store]', ...args)
};

try {
  import('./utils/logger.js').then((loggerModule) => {
    if (loggerModule && loggerModule.logger) {
      logger = loggerModule.logger;
    }
  });
} catch (e) {
  // 使用默认 logger
}

/**
 * LRU 缓存实现 - 严格限制内存上限，防止 OOM
 * 使用 Map 保持插入顺序，最旧的键在开头
 */
class LRUCache {
  constructor(limit = 1000, name = 'default') {
    this.limit = limit;
    this.cache = new Map();
    this.name = name;
    this.accessCount = 0;
    this.hitCount = 0;
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    
    const value = this.cache.get(key);
    // 刷新活跃度：删掉重插，使其置于末尾（最新）
    this.cache.delete(key);
    this.cache.set(key, value);
    
    this.accessCount++;
    this.hitCount++;
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.limit) {
      // 达到上限，淘汰 Map 中的第一个元素（最旧）
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`[LRU:${this.name}] 淘汰最旧键: ${oldestKey}`);
    }
    
    this.cache.set(key, value);
    this.accessCount++;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  entries() {
    return Array.from(this.cache.entries());
  }

  // 转换为普通对象（用于批量保存）
  toObject() {
    const obj = {};
    for (const [key, value] of this.cache) {
      obj[key] = value;
    }
    return obj;
  }

  // 从普通对象加载
  fromObject(obj) {
    this.clear();
    for (const [key, value] of Object.entries(obj)) {
      this.set(key, value);
    }
  }

  getStats() {
    return {
      name: this.name,
      size: this.cache.size,
      limit: this.limit,
      accessCount: this.accessCount,
      hitRate: this.accessCount > 0 ? (this.hitCount / this.accessCount).toFixed(2) : 0
    };
  }
}

// 使用 LRU 缓存替代普通对象
function createDebouncer(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const memoryCache = {
  progress: new LRUCache(CONFIG.LRU_LIMIT_PROGRESS, 'progress'),
  wrongWords: new LRUCache(CONFIG.LRU_LIMIT_WRONGWORDS, 'wrongWords'),
  heatmap: new LRUCache(CONFIG.LRU_LIMIT_HEATMAP, 'heatmap'),
  session: null,
  studySession: null,
  initialized: false,
  stateSnapshots: [],
  deletedIds: new Set(),
  wrongWordsDirty: false,
  heatmapDirty: false,
  progressSnapshot: null
};

const FLUSH_DEBOUNCE_MS = CONFIG.SYNC_DEBOUNCE_MS;

const storeListeners = new Map();

const proxyCache = new WeakMap();

function createReactiveCache(cache) {
  return new Proxy(cache, {
    set(target, prop, value) {
      target[prop] = value;
      
      if (prop === 'progress' || prop === 'wrongWords' || prop === 'heatmap') {
        notifyStoreChange(prop, value);
      }
      
      return true;
    },
    
    get(target, prop) {
      const value = target[prop];
      
      // 如果是方法，绑定正确的 this
      if (typeof value === 'function') {
        return value.bind(target);
      }
      
      // 如果是 Map/Set/LRUCache 等内置对象，不要包装 Proxy
      if (value instanceof Map || value instanceof Set || 
          value instanceof WeakMap || value instanceof WeakSet ||
          (value && typeof value.get === 'function' && typeof value.set === 'function')) {
        return value;
      }
      
      if (typeof value === 'object' && value !== null && 
          (prop === 'progress' || prop === 'wrongWords' || prop === 'heatmap')) {
        
        if (proxyCache.has(value)) {
          return proxyCache.get(value);
        }
        
        const nestedProxy = new Proxy(value, {
          set(nestedTarget, nestedProp, nestedValue) {
            nestedTarget[nestedProp] = nestedValue;
            notifyStoreChange(prop, nestedTarget);
            return true;
          },
          
          deleteProperty(nestedTarget, nestedProp) {
            delete nestedTarget[nestedProp];
            notifyStoreChange(prop, nestedTarget);
            return true;
          }
        });
        
        proxyCache.set(value, nestedProxy);
        return nestedProxy;
      }
      
      return value;
    }
  });
}

function notifyStoreChange(key, value) {
  if (storeListeners.has(key)) {
    storeListeners.get(key).forEach(callback => {
      callback(value, key);
    });
  }
  
  if (storeListeners.has('*')) {
    storeListeners.get('*').forEach(callback => {
      callback({ key, value });
    });
  }
}

const ReactiveCache = createReactiveCache(memoryCache);

function subscribeToStore(key, callback) {
  if (!storeListeners.has(key)) {
    storeListeners.set(key, new Set());
  }
  storeListeners.get(key).add(callback);
  
  return () => {
    storeListeners.get(key).delete(callback);
  };
}

async function loadFromIndexedDB() {
  if (!db.instance) return;

  try {
    const progressArr = await db.getAll('progress');
    const progressObj = {};
    progressArr.forEach(p => { progressObj[p.id] = p; });
    memoryCache.progress.fromObject(progressObj);

    const heatmapArr = await db.getAll('heatmap');
    const heatmapObj = {};
    heatmapArr.forEach(h => { heatmapObj[h.date] = h.count; });
    memoryCache.heatmap.fromObject(heatmapObj);

    const wrongWordsArr = await db.getAll('wrongWords');
    const wrongWordsObj = {};
    wrongWordsArr.forEach(w => { wrongWordsObj[w.id] = w.data; });
    memoryCache.wrongWords.fromObject(wrongWordsObj);

    const session = await db.get('session', 'current');
    if (session) memoryCache.session = session.data;

    const studySession = await db.get('session', 'study_session');
    if (studySession) memoryCache.studySession = studySession.data;

    const snapshot = await db.get('session', 'progressSnapshot');
    if (snapshot) memoryCache.progressSnapshot = snapshot.data;

    memoryCache.initialized = true;
    notifyStoreChange('initialized', true);

    if (typeof logger !== 'undefined' && logger.info) {
      logger.info('[LRU] 缓存加载完成:', {
        progress: memoryCache.progress.getStats(),
        wrongWords: memoryCache.wrongWords.getStats(),
        heatmap: memoryCache.heatmap.getStats()
      });
    }
  } catch (error) {
    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('从 IndexedDB 加载缓存失败:', error);
    } else {
      console.error('从 IndexedDB 加载缓存失败:', error);
    }
  }
}

async function saveToIndexedDB(storeName, data) {
  if (!db.instance) return;
  await db.save(storeName, data);
}

async function bulkSaveToIndexedDB(storeName, dataArray, onProgress) {
  if (!db.instance) return;
  await db.bulkSave(storeName, dataArray, onProgress);
}

function getWordDataSync(id) {
  // 修复：兼容 LRUCache 的 .get() 方法和普通对象
  let data;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    data = memoryCache.progress.get(id);
  } else {
    data = memoryCache.progress[id];
  }
  
  return data || { 
    status: 'new', 
    level: 0, 
    ef: 2.5, 
    stability: 1.0,
    difficulty: 5.0,
    interval: 0, 
    lastStudy: 0,
    reviewCount: 0
  };
}

function setWordDataSync(id, data) {
  // 修复：兼容 LRUCache 的 .set() 方法
  if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
    memoryCache.progress.set(id, data);
  } else {
    memoryCache.progress[id] = data;
  }
}

function updateWordData(id, updateFn) {
  const currentData = getWordDataSync(id);
  
  if (!currentData || currentData.status === 'new') {
    setWordDataSync(id, { id });
  }
  
  const updated = updateFn(getWordDataSync(id));
  setWordDataSync(id, { ...getWordDataSync(id), ...updated });
  
  return getWordDataSync(id);
}

function deleteWordData(id) {
  const currentData = getWordDataSync(id);
  if (currentData && currentData.status !== 'new') {
    // 修复：兼容 LRUCache 的 .delete() 方法
    if (memoryCache.progress && typeof memoryCache.progress.delete === 'function') {
      memoryCache.progress.delete(id);
    } else {
      delete memoryCache.progress[id];
    }
    memoryCache.deletedIds.add(id);
  }
}

function getWrongWords() {
  return memoryCache.wrongWords;
}

const saveWrongWords = createDebouncer(() => {
  memoryCache.wrongWordsDirty = true;
  flushWrongWords();
}, FLUSH_DEBOUNCE_MS);

async function flushWrongWords() {
  if (!memoryCache.wrongWordsDirty || !db.instance) return;

  const entries = memoryCache.wrongWords.entries ? memoryCache.wrongWords.entries() : Object.entries(memoryCache.wrongWords);
  const dataArray = entries.map(([id, data]) => ({
    id,
    data
  }));

  try {
    await db.bulkSave('wrongWords', dataArray);
    memoryCache.wrongWordsDirty = false;
  } catch (error) {
    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('保存错题数据失败:', error);
    } else {
      console.error('保存错题数据失败:', error);
    }
  }
}

function getWrongWordData(id) {
  // 修复：兼容 LRUCache 的 .get() 方法
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.get === 'function') {
    return memoryCache.wrongWords.get(id);
  }
  return memoryCache.wrongWords[id];
}

function setWrongWordData(id, data) {
  // 修复：兼容 LRUCache 的 .set() 方法
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.set === 'function') {
    memoryCache.wrongWords.set(id, data);
  } else {
    memoryCache.wrongWords[id] = data;
  }
}

function deleteWrongWordData(id) {
  // 修复：兼容 LRUCache 的 .delete() 方法
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.delete === 'function') {
    memoryCache.wrongWords.delete(id);
  } else {
    delete memoryCache.wrongWords[id];
  }
}

function resolveWordById(id) {
  const words = (typeof window !== 'undefined' && Array.isArray(window.WORDS)) ? window.WORDS : [];
  if (words.length === 0) return null;
  return words.find(w => String(w.id) === String(id)) || null;
}

function addWrongWord(idOrWord, maybeWord) {
  let id = null;
  let word = null;

  if (idOrWord && typeof idOrWord === 'object') {
    word = idOrWord;
    id = word.id;
  } else {
    id = idOrWord;
    word = maybeWord || resolveWordById(id);
  }

  if (id === undefined || id === null) {
    console.warn('[Store] addWrongWord: invalid id', idOrWord);
    return false;
  }

  if (!word || typeof word !== 'object') {
    console.warn('[Store] addWrongWord: word not found', idOrWord);
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
      lastWrong: 0
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

function removeWrongWord(id) {
  if (getWrongWordData(id)) {
    deleteWrongWordData(id);
    memoryCache.wrongWordsDirty = true;
    saveWrongWords();
  }
}

function getHeatmapValue(date) {
  // 修复：兼容 LRUCache 的 .get() 方法
  if (memoryCache.heatmap && typeof memoryCache.heatmap.get === 'function') {
    return memoryCache.heatmap.get(date) || 0;
  }
  return memoryCache.heatmap[date] || 0;
}

function setHeatmapValue(date, count) {
  // 修复：兼容 LRUCache 的 .set() 方法
  if (memoryCache.heatmap && typeof memoryCache.heatmap.set === 'function') {
    memoryCache.heatmap.set(date, count);
  } else {
    memoryCache.heatmap[date] = count;
  }
}

function getHeatmap() {
  if (memoryCache.heatmap && typeof memoryCache.heatmap.toObject === 'function') {
    return memoryCache.heatmap.toObject();
  }
  return memoryCache.heatmap;
}

const saveHeatmap = createDebouncer(() => {
  memoryCache.heatmapDirty = true;
  flushHeatmap();
}, FLUSH_DEBOUNCE_MS);

async function flushHeatmap() {
  if (!memoryCache.heatmapDirty || !db.instance) return;

  const dataArray = memoryCache.heatmap.entries().map(([date, count]) => ({
    date,
    count
  }));

  try {
    await db.bulkSave('heatmap', dataArray);
    memoryCache.heatmapDirty = false;
  } catch (error) {
    if (typeof logger !== 'undefined' && logger.error) {
      logger.error('保存热力图数据失败:', error);
    } else {
      console.error('保存热力图数据失败:', error);
    }
  }
}

function recordHeatmap(date, count) {
  const actualDate = date || new Date().toISOString().split('T')[0];
  const actualCount = count || 1;
  const currentCount = getHeatmapValue(actualDate);
  setHeatmapValue(actualDate, currentCount + actualCount);
  memoryCache.heatmapDirty = true;
  saveHeatmap();
}

function getMemoryCache() {
  return memoryCache;
}

function getReactiveCache() {
  return ReactiveCache;
}

function clearProxyCache() {
  // WeakMap 不能手动清空，它会自动进行垃圾回收
  // 如果需要强制清空，只能重新创建实例，但这会破坏现有引用
  // 因此这个函数实际上是一个空操作，保留它是为了 API 兼容性
  console.log('[Store] WeakMap 无法手动清空，依赖自动垃圾回收');
}

export {
  memoryCache,
  ReactiveCache,
  subscribeToStore,
  loadFromIndexedDB,
  saveToIndexedDB,
  bulkSaveToIndexedDB,
  getWordDataSync,
  updateWordData,
  deleteWordData,
  getWrongWords,
  saveWrongWords,
  addWrongWord,
  removeWrongWord,
  getHeatmap,
  saveHeatmap,
  recordHeatmap,
  getMemoryCache,
  getReactiveCache,
  clearProxyCache
};
