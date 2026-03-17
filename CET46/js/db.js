import { CONFIG } from './config.js';

const DB_NAME = CONFIG.DB_NAME;
const DB_VERSION = CONFIG.DB_VERSION;

class IndexedDB {
  constructor() {
    this.instance = null;
    this.dbName = DB_NAME;
    this.dbVersion = DB_VERSION;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = e => {
        const database = e.target.result;
        
        if (!database.objectStoreNames.contains('progress')) {
          const store = database.createObjectStore('progress', { keyPath: 'id' });
          store.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        } else {
          const store = e.target.transaction.objectStore('progress');
          if (!store.indexNames.contains('nextReviewDate')) {
            store.createIndex('nextReviewDate', { unique: false });
          }
        }
        
        if (!database.objectStoreNames.contains('words')) {
          database.createObjectStore('words', { keyPath: 'id' });
        }
        
        if (!database.objectStoreNames.contains('wrongWords')) {
          database.createObjectStore('wrongWords', { keyPath: 'id' });
        }
        
        if (!database.objectStoreNames.contains('heatmap')) {
          database.createObjectStore('heatmap', { keyPath: 'date' });
        }
        
        if (!database.objectStoreNames.contains('session')) {
          database.createObjectStore('session', { keyPath: 'key' });
        }
        
        if (!database.objectStoreNames.contains('actionStack')) {
          database.createObjectStore('actionStack', { keyPath: 'id', autoIncrement: true });
        }
        
        // 新增：元数据存储（用于缓存 BK-Tree 等序列化数据）
        if (!database.objectStoreNames.contains('meta_store')) {
          database.createObjectStore('meta_store', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = e => {
        this.instance = e.target.result;
        resolve(this);
      };
      
      request.onerror = () => reject(new Error("IndexedDB 初始化失败：" + (request.error?.message || '未知错误')));
    });
  }

  async get(storeName, id) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve(null);
        return;
      }
      const tx = this.instance.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async save(storeName, data) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve();
        return;
      }
      const tx = this.instance.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(data);
      tx.oncomplete = () => resolve();
    });
  }

  async getAll(storeName) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve([]);
        return;
      }
      const tx = this.instance.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async clear(storeName) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve();
        return;
      }
      const tx = this.instance.transaction(storeName, "readwrite");
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
    });
  }

  async delete(storeName, id) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve();
        return;
      }
      const tx = this.instance.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  async bulkSave(storeName, dataArray, onProgress) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error("数据库未就绪"));
        return;
      }
      
      const tx = this.instance.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      
      let completed = 0;
      const total = dataArray.length;

      dataArray.forEach(item => {
        const req = store.put(item);
        req.onsuccess = () => {
          completed++;
          if (onProgress && completed % 50 === 0) {
            onProgress((completed / total) * 100);
          }
        };
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error("批量写入事务失败：" + (tx.error?.message || '未知错误')));
      tx.onabort = () => reject(new Error("事务因异常而中断回滚"));
    });
  }

  async count(storeName) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve(0);
        return;
      }
      const tx = this.instance.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  async close() {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }

  // 保存序列化后的 BK 树
  async saveSerializedBKTree(serializedData) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error("数据库未初始化"));
        return;
      }
      
      const transaction = this.instance.transaction(['meta_store'], 'readwrite');
      const store = transaction.objectStore('meta_store');
      const request = store.put({ key: 'bktree_cache', data: serializedData, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
  
  // 获取缓存的 BK 树
  async getSerializedBKTree() {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        resolve(null);
        return;
      }
      
      const transaction = this.instance.transaction(['meta_store'], 'readonly');
      const store = transaction.objectStore('meta_store');
      const request = store.get('bktree_cache');
      
      request.onsuccess = () => {
        const result = request.result;
        // 如果有缓存且未过期（24 小时内），返回数据
        if (result && result.data && (Date.now() - result.timestamp) < 24 * 60 * 60 * 1000) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

const database = new IndexedDB();

export { database as db, IndexedDB };
