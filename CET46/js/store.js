import { db } from './db.js';

const memoryCache = {
  progress: {},
  wrongWords: {},
  heatmap: {},
  session: null,
  initialized: false,
  writeQueue: [],
  isWriting: false,
  stateSnapshots: [],
  deletedIds: new Set(),
  wrongWordsDirty: false,
  heatmapDirty: false,
  progressSnapshot: null
};

const storeListeners = new Map();

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
      
      if (typeof value === 'object' && value !== null && 
          (prop === 'progress' || prop === 'wrongWords' || prop === 'heatmap')) {
        return new Proxy(value, {
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
  
  const progressArr = await db.getAll('progress');
  progressArr.forEach(p => { memoryCache.progress[p.id] = p; });
  
  const heatmapArr = await db.getAll('heatmap');
  heatmapArr.forEach(h => { memoryCache.heatmap[h.date] = h.count; });
  
  const wrongWordsArr = await db.getAll('wrongWords');
  wrongWordsArr.forEach(w => { memoryCache.wrongWords[w.id] = w.data; });
  
  const session = await db.get('session', 'current');
  if (session) memoryCache.session = session.data;

  const snapshot = await db.get('session', 'progressSnapshot');
  if (snapshot) memoryCache.progressSnapshot = snapshot.data;
  
  const actionStackData = await db.getAll('actionStack');
  if (actionStackData && actionStackData.length > 0) {
    const actionStack = actionStackData
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => item.action);
    window.actionStack = actionStack;
  }
  
  memoryCache.initialized = true;
  notifyStoreChange('initialized', true);
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
  return memoryCache.progress[id] || { 
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

function updateWordData(id, updateFn) {
  if (!memoryCache.progress[id]) {
    memoryCache.progress[id] = { id };
  }
  
  const updated = updateFn(memoryCache.progress[id]);
  memoryCache.progress[id] = { ...memoryCache.progress[id], ...updated };
  
  return memoryCache.progress[id];
}

function deleteWordData(id) {
  if (memoryCache.progress[id]) {
    delete memoryCache.progress[id];
    memoryCache.deletedIds.add(id);
  }
}

function getWrongWords() {
  return memoryCache.wrongWords;
}

function saveWrongWords() {
  memoryCache.wrongWordsDirty = true;
  flushWrongWords();
}

async function flushWrongWords() {
  if (!memoryCache.wrongWordsDirty || !db.instance) return;
  
  const dataArray = Object.entries(memoryCache.wrongWords).map(([id, data]) => ({
    id,
    data
  }));
  
  await db.bulkSave('wrongWords', dataArray);
  memoryCache.wrongWordsDirty = false;
}

function addWrongWord(id, word) {
  if (!memoryCache.wrongWords[id]) {
    memoryCache.wrongWords[id] = {
      word: word.word,
      translation: word.translation,
      count: 0,
      firstWrong: Date.now(),
      lastWrong: 0
    };
  }
  
  memoryCache.wrongWords[id].count++;
  memoryCache.wrongWords[id].lastWrong = Date.now();
  memoryCache.wrongWordsDirty = true;
}

function removeWrongWord(id) {
  if (memoryCache.wrongWords[id]) {
    delete memoryCache.wrongWords[id];
    memoryCache.wrongWordsDirty = true;
  }
}

function getHeatmap() {
  return memoryCache.heatmap;
}

function saveHeatmap() {
  memoryCache.heatmapDirty = true;
  flushHeatmap();
}

async function flushHeatmap() {
  if (!memoryCache.heatmapDirty || !db.instance) return;
  
  const dataArray = Object.entries(memoryCache.heatmap).map(([date, count]) => ({
    date,
    count
  }));
  
  await db.bulkSave('heatmap', dataArray);
  memoryCache.heatmapDirty = false;
}

function recordHeatmap(date, count) {
  memoryCache.heatmap[date] = (memoryCache.heatmap[date] || 0) + count;
  memoryCache.heatmapDirty = true;
}

function getMemoryCache() {
  return memoryCache;
}

function getReactiveCache() {
  return ReactiveCache;
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
  getReactiveCache
};
