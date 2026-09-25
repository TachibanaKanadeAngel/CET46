import { CONFIG, MS_PER_DAY } from './config.js';
import logger from './utils/logger.js';

const DB_NAME = CONFIG.DB_NAME || 'CET46_DB';
const DB_VERSION = CONFIG.DB_VERSION || 2;

/**
 * IndexedDB 数据库封装类
 * 提供完整的 CRUD 操作、批量写入、流式加载、索引查询等功能
 */
export class IndexedDB {
  public instance: IDBDatabase | null;
  public dbName: string;
  public dbVersion: number;

  constructor() {
    this.instance = null;
    this.dbName = DB_NAME;
    this.dbVersion = DB_VERSION;
  }

  /**
   * Open (or upgrade) the IndexedDB database and create object stores as needed
   */
  async init(): Promise<IndexedDB> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const database = (e.target as IDBOpenDBRequest).result;

        if (!database.objectStoreNames.contains('progress')) {
          const store = database.createObjectStore('progress', { keyPath: 'id' });
          store.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        } else {
          const tx = (e.target as IDBOpenDBRequest).transaction;
          if (tx) {
            const store = tx.objectStore('progress');
            if (!store.indexNames.contains('nextReviewDate')) {
              store.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
            }
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

      request.onsuccess = (e: Event) => {
        this.instance = (e.target as IDBOpenDBRequest).result;
        this.instance.onversionchange = () => {
          this.close();
        };
        resolve(this);
      };

      request.onerror = () =>
        reject(new Error('IndexedDB 初始化失败：' + (request.error?.message || '未知错误')));

      request.onblocked = () => {
        logger.warn('IndexedDB 升级被阻塞，请关闭其他标签页');
      };
    });
  }

  /**
   * Read a single record by its primary key
   */
  async get(storeName: string, id: string | number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`获取数据失败: ${req.error?.message || '未知错误'}`));
      tx.onerror = () => reject(new Error(`事务错误: ${tx.error?.message || '未知错误'}`));
      tx.onabort = () => reject(new Error(`获取数据事务中止: ${tx.error?.message || '未知'}`));
    });
  }

  /**
   * Upsert a single record into a store
   */
  async save(storeName: string, data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      const tx = this.instance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(new Error(`保存数据失败: ${tx.error?.message || '未知错误'}`));
      tx.onabort = () => reject(new Error('事务被中止'));

      try {
        store.put(data);
      } catch (err: any) {
        reject(new Error(`DB put操作失败: ${err?.message || '未知错误'}`));
      }
    });
  }

  /**
   * Read all records from a store
   */
  async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => {
          const err = new Error(`getAll失败(${storeName}): ${req.error?.message || '未知错误'}`);
          logger.error(err.message);
          reject(err);
        };
        tx.onerror = () => {
          const err = new Error(`getAll事务失败(${storeName}): ${tx.error?.message || '未知错误'}`);
          logger.error(err.message);
          reject(err);
        };
        tx.onabort = () => {
          const err = new Error(`getAll事务中止(${storeName}): ${tx.error?.message || '未知'}`);
          logger.error(err.message);
          reject(err);
        };
      } catch (e: any) {
        logger.error(`getAll异常(${storeName}):`, e);
        reject(e);
      }
    });
  }

  /**
   * Remove all records from a store
   */
  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(`清空存储失败: ${tx.error?.message || '未知错误'}`));
        tx.onabort = () => reject(new Error('清空存储事务被中止'));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Delete a single record by its primary key
   */
  async delete(storeName: string, id: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      try {
        const tx = this.instance.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(`删除数据失败: ${tx.error?.message || '未知错误'}`));
        tx.onabort = () => reject(new Error('删除数据事务被中止'));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Bulk upsert records in chunked readwrite transactions
   */
  async bulkSave(
    storeName: string,
    dataArray: any[],
    onProgress?: (percent: number, ...extra: any[]) => void
  ): Promise<void> {
    if (!this.instance) throw new Error('数据库未就绪');

    const CHUNK_SIZE = CONFIG.CHUNK_SIZE_DB;
    const total = dataArray.length;
    let completedCount = 0;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = dataArray.slice(i, i + CHUNK_SIZE);

      await new Promise<void>((resolve, reject) => {
        if (!this.instance) {
          reject(new Error('数据库已关闭'));
          return;
        }
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

      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
    }
  }

  /**
   * Count the records in a store
   */
  async count(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }
      const tx = this.instance.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        logger.error('[DB] count error:', req.error);
        reject(new Error(`计数查询失败: ${req.error?.message || 'unknown'}`));
      };
      tx.onabort = () => reject(new Error(`计数查询事务中止: ${tx.error?.message || '未知'}`));
    });
  }

  /**
   * Close the database connection and reset the instance reference
   */
  async close(): Promise<void> {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }

  /**
   * Persist a serialized BK-tree payload into the meta_store with a timestamp
   */
  async saveSerializedBKTree(serializedData: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('数据库未初始化'));
        return;
      }

      const transaction = this.instance.transaction(['meta_store'], 'readwrite');
      const store = transaction.objectStore('meta_store');
      store.put({
        key: 'bktree_cache',
        data: serializedData,
        timestamp: Date.now(),
      });

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(new Error(`保存BK树失败: ${transaction.error?.message || '未知错误'}`));
      transaction.onabort = () => reject(new Error('保存BK树事务被中止'));
    });
  }

  /**
   * Load the cached BK-tree payload if it is fresher than one day
   */
  async getSerializedBKTree(): Promise<any> {
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
        if (result && result.data && Date.now() - result.timestamp < MS_PER_DAY) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = e => reject((e.target as IDBRequest).error);
      transaction.onabort = () => reject(new Error(`BK树读取事务中止: ${transaction.error?.message || '未知'}`));
      transaction.onerror = () => reject(new Error(`BK树读取事务出错: ${transaction.error?.message || '未知'}`));
    });
  }

  /**
   * Read multiple records by primary keys in a single transaction
   */
  async bulkGet(storeName: string, keys: (string | number)[]): Promise<any[]> {
    if (!keys || keys.length === 0) return [];

    return new Promise((resolve, reject) => {
      if (!this.instance) {
        reject(new Error('DB未初始化'));
        return;
      }

      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const results: any[] = [];
      let completed = 0;

      tx.onerror = () => {
        logger.error('bulkGet事务错误:', tx.error);
        reject(new Error(`bulkGet事务失败(${storeName}): ${tx.error?.message || '未知错误'}`));
      };

      tx.onabort = () => {
        logger.error('bulkGet事务中止:', tx.error);
        reject(new Error(`bulkGet事务中止(${storeName})`));
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

  /**
   * Query records by an index value, resolving to an empty array on error
   */
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    return new Promise(resolve => {
      if (!this.instance) {
        resolve([]);
        return;
      }

      const tx = this.instance.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => {
        logger.error('[DB] getByIndex error:', req.error);
        resolve([]);
      };
      tx.onerror = () => {
        logger.error('[DB] getByIndex transaction error:', tx.error);
        resolve([]);
      };
      tx.onabort = () => {
        logger.error('[DB] getByIndex transaction aborted:', tx.error);
        resolve([]);
      };
    });
  }

  /**
   * 流式加载 JSONL 文件 - 终极内存优化方案
   */
  async streamLoadJSONL(
    url: string,
    storeName: string,
    onProgress?: (percent: number, count: number) => void
  ): Promise<number> {
    if (!this.instance) throw new Error('数据库未就绪');

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let abortController: AbortController | undefined;
    try {
      abortController = new AbortController();
      const fetchTimeout = setTimeout(() => abortController?.abort(), CONFIG.FETCH_TIMEOUT || 15000);
      const response = await fetch(url, { signal: abortController.signal });
      clearTimeout(fetchTimeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('ReadableStream 不支持');

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkArray: any[] = [];
      let totalCount = 0;
      const CHUNK_SIZE = CONFIG.CHUNK_SIZE_DB;

      let streamDone = false;
      while (!streamDone) {
        const readTimeout = setTimeout(
          () => abortController?.abort(),
          (CONFIG as any).STREAM_READ_TIMEOUT || 30000
        );
        let done: boolean | undefined, value: Uint8Array | undefined;
        try {
          const res = await reader.read();
          done = res.done;
          value = res.value;
        } finally {
          clearTimeout(readTimeout);
        }
        streamDone = !!done;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const item = JSON.parse(line);
            const word = {
              id: item.id !== undefined && item.id !== null ? item.id : totalCount + 1,
              word: (item.word || '').trim(),
              phonetic: item.phonetic || '',
              meaning: item.meaning || '',
              example: item.example || '',
              level: item.level || 'CET4',
            };
            if (word.word.length > 0) {
              chunkArray.push(word);
              totalCount++;
            }
          } catch (_e) {
            logger.warn('JSONL 解析失败:', line.substring(0, 50));
          }
        }

        if (chunkArray.length >= CHUNK_SIZE) {
          await this.bulkSave(storeName, chunkArray);
          if (onProgress) {
            onProgress(
              Math.round((totalCount / (CONFIG.TOTAL_VOCAB_COUNT || 6662)) * 100),
              totalCount
            );
          }
          chunkArray = [];
          await new Promise(resolve => {
            setTimeout(resolve, 0);
          });
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
            level: item.level || 'CET4',
          });
          totalCount++;
        } catch (_e) {
          logger.warn('最后缓冲区解析失败:', buffer.substring(0, 50));
        }
      }

      return totalCount;
    } catch (error) {
      logger.error('流式读取失败:', error);
      throw error;
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch (cancelError) {
          logger.warn('⚠️ Reader 释放资源失败:', cancelError);
        }
      }
    }
  }
}

const database = new IndexedDB();

export { database as db };
export default database;
