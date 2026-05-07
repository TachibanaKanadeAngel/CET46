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
            store.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
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
        
        if (!database.objectStoreNames.contains('meta_store')) {
          database.createObjectStore('meta_store', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = e => {
        this.instance = e.target.result;
        resolve(this);
      };
      
      request.onerror = () => reject(new Error('IndexedDB 初始化失败：' + (request.error?.message || '未知错误')));
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        return reject(new Error('DB未初始化'));
      }
      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      // 修复：完善事务生命周期监听
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`获取数据失败: ${req.error?.message || '未知错误'}`));
      tx.onerror = () => reject(new Error(`事务错误: ${tx.error?.message || '未知错误'}`));
    });
  }

  async save(storeName, data) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        return reject(new Error('DB未初始化'));
      }
      const tx = this.instance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      // 修复：完善事务生命周期监听
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(new Error(`保存数据失败: ${tx.error?.message || '未知错误'}`));
      tx.onabort = () => reject(new Error('事务被中止'));

      try {
        store.put(data);
      } catch (err) {
        reject(new Error(`DB put操作失败: ${err.message}`));
      }
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, _reject) => {
      if (!this.instance) {
        resolve([]);
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => {
          console.error(`getAll failed for ${storeName}:`, req.error);
          resolve([]);
        };
        tx.onerror = () => {
          console.error(`Transaction failed for ${storeName}:`, tx.error);
          resolve([]);
        };
      } catch (e) {
        console.error(`getAll exception for ${storeName}:`, e);
        resolve([]);
      }
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        resolve();
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        resolve();
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async bulkSave(storeName, dataArray, onProgress) {
    if (!this.instance) throw new Error('数据库未就绪');

    const CHUNK_SIZE = 500;
    const total = dataArray.length;
    let completedCount = 0;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = dataArray.slice(i, i + CHUNK_SIZE);

      await new Promise((resolve, reject) => {
        const tx = this.instance.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(`写入分块失败: ${tx.error?.message}`));
        tx.onabort = () => reject(new Error('事务中断'));

        for (const item of chunk) {
          store.put(item);
        }
      });

      completedCount += chunk.length;
      if (onProgress) {
        onProgress((completedCount / total) * 100);
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async count(storeName) {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve(0);
        return;
      }
      const tx = this.instance.transaction(storeName, 'readonly');
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

  async saveSerializedBKTree(serializedData) {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('数据库未初始化'));
        return;
      }
      
      const transaction = this.instance.transaction(['meta_store'], 'readwrite');
      const store = transaction.objectStore('meta_store');
      const request = store.put({ key: 'bktree_cache', data: serializedData, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
  
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
        if (result && result.data && (Date.now() - result.timestamp) < 24 * 60 * 60 * 1000) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async bulkGet(storeName, keys) {
    return new Promise((resolve, _reject) => {
      if (!this.instance) {
        resolve([]);
        return;
      }

      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const results = [];
      let completed = 0;

      tx.onerror = () => {
        console.error('事务错误:', tx.error);
        resolve([]);
      };

      tx.onabort = () => {
        console.error('事务中止:', tx.error);
        resolve([]);
      };

      keys.forEach((key, index) => {
        const req = store.get(key);
        req.onsuccess = () => {
          results[index] = req.result;
          completed++;
          if (completed === keys.length) {
            resolve(results);
          }
        };
        req.onerror = () => {
          results[index] = null;
          completed++;
          if (completed === keys.length) {
            resolve(results);
          }
        };
      });
    });
  }

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, _reject) => {
      if (!this.instance) {
        resolve([]);
        return;
      }
      
      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);
      
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  /**
   * 流式加载 JSONL 文件 - 终极内存优化方案
   * 边下载边解析边存库，内存占用几乎为 0
   * @param {string} url - JSONL 文件 URL
   * @param {string} storeName - 存储名称
   * @param {Function} onProgress - 进度回调 (percent, count)
   * @returns {Promise<number>} - 加载的总条目数
   */
  async streamLoadJSONL(url, storeName, onProgress) {
    if (!this.instance) throw new Error('数据库未就绪');

    let reader;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('ReadableStream 不支持');

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkArray = [];
      let totalCount = 0;
      const CHUNK_SIZE = 500;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const item = JSON.parse(line);
            const word = {
              id: item.id || totalCount + 1,
              word: (item.word || '').trim(),
              phonetic: item.phonetic || '',
              meaning: item.meaning || '',
              example: item.example || '',
              level: item.level || 'CET4'
            };
            if (word.word.length > 0) {
              chunkArray.push(word);
              totalCount++;
            }
          } catch (e) {
            console.warn('JSONL 解析失败:', line.substring(0, 50));
          }
        }

        if (chunkArray.length >= CHUNK_SIZE) {
          await this.bulkSave(storeName, chunkArray);
          if (onProgress) {
            onProgress(Math.round((totalCount / 6662) * 100), totalCount);
          }
          chunkArray = [];
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      if (chunkArray.length > 0) {
        await this.bulkSave(storeName, chunkArray);
        if (onProgress) {
          onProgress(100, totalCount);
        }
      }

      if (buffer.trim()) {
        try {
          const item = JSON.parse(buffer);
          await this.save(storeName, {
            id: item.id || totalCount + 1,
            word: (item.word || '').trim(),
            phonetic: item.phonetic || '',
            meaning: item.meaning || '',
            example: item.example || '',
            level: item.level || 'CET4'
          });
          totalCount++;
        } catch (e) {
          console.warn('最后缓冲区解析失败:', buffer.substring(0, 50));
        }
      }

      return totalCount;
    } catch (error) {
      console.error('流式读取失败:', error);
      throw error;
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch (cancelError) {
          console.warn('⚠️ Reader 释放资源失败:', cancelError);
        }
      }
    }
  }
}

const database = new IndexedDB();

export { database as db, IndexedDB };
