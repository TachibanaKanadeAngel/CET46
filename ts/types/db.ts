/**
 * @module types/db
 * @description 数据库相关类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中与数据库相关的所有类型接口。
 * 包括IndexedDB配置、数据库操作、同步配置等。
 * 
 * CET46使用IndexedDB作为本地存储，支持离线使用。
 * 同时支持通过WebDAV协议进行云端同步。
 */

/**
 * 数据库配置接口
 * 
 * 定义IndexedDB数据库的配置信息。
 * 
 * @example
 * ```typescript
 * const dbConfig: DBConfig = {
 *   name: 'CET46_DB',
 *   version: 1,
 *   stores: [
 *     {
 *       name: 'words',
 *       keyPath: 'id',
 *       indexes: [
 *         { name: 'word', keyPath: 'word', unique: true },
 *         { name: 'level', keyPath: 'level' }
 *       ]
 *     }
 *   ]
 * };
 * ```
 */
export interface DBConfig {
  /** 数据库名称 */
  name: string;
  
  /** 数据库版本号 */
  version: number;
  
  /** 对象存储配置数组 */
  stores: DBStoreConfig[];
}

/**
 * 数据库对象存储配置接口
 * 
 * 定义IndexedDB中一个对象存储（Object Store）的配置。
 * 
 * @example
 * ```typescript
 * const storeConfig: DBStoreConfig = {
 *   name: 'words',
 *   keyPath: 'id',
 *   indexes: [
 *     { name: 'word', keyPath: 'word', unique: true }
 *   ]
 * };
 * ```
 */
export interface DBStoreConfig {
  /** 存储名称 */
  name: string;
  
  /** 主键路径 */
  keyPath: string;
  
  /** 索引配置数组（可选） */
  indexes?: DBIndexConfig[];
}

/**
 * 数据库索引配置接口
 * 
 * 定义IndexedDB中一个索引的配置。
 * 
 * @example
 * ```typescript
 * const indexConfig: DBIndexConfig = {
 *   name: 'word',
 *   keyPath: 'word',
 *   unique: true
 * };
 * ```
 */
export interface DBIndexConfig {
  /** 索引名称 */
  name: string;
  
  /** 
   * 索引键路径
   * 可以是单个字段名或字段名数组（复合索引）
   */
  keyPath: string | string[];
  
  /** 是否唯一索引 */
  unique?: boolean;
}

/**
 * 数据库实例接口
 * 
 * 定义IndexedDB数据库实例的操作方法。
 * 这是CET46数据库层的核心接口。
 * 
 * @example
 * ```typescript
 * const db: DBInstance = {
 *   instance: null,
 *   async init() { ... },
 *   async get(storeName, key) { ... },
 *   async getAll(storeName) { ... },
 *   async save(storeName, data) { ... },
 *   async bulkSave(storeName, data) { ... },
 *   async delete(storeName, key) { ... },
 *   async clear(storeName) { ... },
 *   async count(storeName) { ... }
 * };
 * ```
 */
export interface DBInstance {
  /** 
   * IndexedDB数据库实例
   * 初始化前为null
   */
  instance: IDBDatabase | null;
  
  /**
   * 初始化数据库
   * 创建对象存储和索引
   * @returns 是否初始化成功
   */
  init(): Promise<boolean>;
  
  /**
   * 获取单条数据
   * @param storeName - 存储名称
   * @param key - 主键
   * @returns 查询到的数据，不存在则返回undefined
   */
  get(storeName: string, key: IDBValidKey): Promise<any>;
  
  /**
   * 获取所有数据
   * @param storeName - 存储名称
   * @returns 数据数组
   */
  getAll(storeName: string): Promise<any[]>;
  
  /**
   * 保存单条数据
   * @param storeName - 存储名称
   * @param data - 要保存的数据（必须包含主键）
   * @returns 保存的主键
   */
  save(storeName: string, data: any): Promise<IDBValidKey>;
  
  /**
   * 批量保存数据
   * @param storeName - 存储名称
   * @param data - 数据数组
   * @param onProgress - 进度回调（可选）
   */
  bulkSave(storeName: string, data: any[], onProgress?: (progress: number) => void): Promise<void>;
  
  /**
   * 删除单条数据
   * @param storeName - 存储名称
   * @param key - 主键
   */
  delete(storeName: string, key: IDBValidKey): Promise<void>;
  
  /**
   * 清空存储
   * @param storeName - 存储名称
   */
  clear(storeName: string): Promise<void>;
  
  /**
   * 获取数据数量
   * @param storeName - 存储名称
   * @returns 数据数量
   */
  count(storeName: string): Promise<number>;
}

/**
 * 同步配置接口
 * 
 * 定义WebDAV同步的配置信息。
 * 
 * @example
 * ```typescript
 * const syncConfig: SyncConfig = {
 *   url: 'https://dav.example.com/cet46/',
 *   encryptedAuth: 'encrypted_base64_string',
 *   autoSync: true
 * };
 * ```
 */
export interface SyncConfig {
  /** WebDAV服务器地址 */
  url: string;
  
  /** 
   * 加密后的认证信息
   * 使用AES-256-GCM加密，PBKDF2密钥派生
   */
  encryptedAuth: string;
  
  /** 是否启用自动同步 */
  autoSync: boolean;
}

/**
 * 同步结果接口
 * 
 * 表示一次同步操作的结果。
 * 
 * @example
 * ```typescript
 * const result: SyncResult = {
 *   success: true,
 *   message: '同步成功',
 *   timestamp: Date.now(),
 *   changes: 15
 * };
 * ```
 */
export interface SyncResult {
  /** 是否成功 */
  success: boolean;
  
  /** 结果消息 */
  message: string;
  
  /** 同步时间戳（毫秒） */
  timestamp: number;
  
  /** 同步的变更数量（可选） */
  changes?: number;
}

/**
 * 冲突解决接口
 * 
 * 定义同步冲突的解决方案。
 * 
 * @example
 * ```typescript
 * const resolution: ConflictResolution = {
 *   wordId: 1,
 *   local: { stability: 10, difficulty: 5 },
 *   remote: { stability: 12, difficulty: 4 },
 *   resolution: 'remote'
 * };
 * ```
 */
export interface ConflictResolution {
  /** 单词ID */
  wordId: number;
  
  /** 本地数据 */
  local: any;
  
  /** 远程数据 */
  remote: any;
  
  /** 
   * 解决策略
   * - 'local': 使用本地数据
   * - 'remote': 使用远程数据
   * - 'merge': 合并数据
   */
  resolution: 'local' | 'remote' | 'merge';
}

/**
 * 同步状态接口
 * 
 * 表示当前的同步状态。
 * 
 * @example
 * ```typescript
 * const status: SyncStatus = {
 *   lastSync: Date.now() - 60 * 60 * 1000,
 *   pendingChanges: 5,
 *   isSyncing: false,
 *   error: null
 * };
 * ```
 */
export interface SyncStatus {
  /** 上次同步时间戳（毫秒） */
  lastSync: number;
  
  /** 待同步的变更数量 */
  pendingChanges: number;
  
  /** 是否正在同步 */
  isSyncing: boolean;
  
  /** 最后的错误信息（可选） */
  error?: string;
}

/**
 * 数据导出接口
 * 
 * 定义导出数据的结构。
 * 
 * @example
 * ```typescript
 * const exportData: ExportData = {
 *   version: '1.0',
 *   timestamp: Date.now(),
 *   progress: { ... },
 *   wrongWords: { ... },
 *   heatmap: { ... },
 *   settings: { ... }
 * };
 * ```
 */
export interface ExportData {
  /** 导出格式版本 */
  version: string;
  
  /** 导出时间戳（毫秒） */
  timestamp: number;
  
  /** 学习进度数据 */
  progress: Record<string, any>;
  
  /** 错词数据 */
  wrongWords: Record<string, any>;
  
  /** 热力图数据 */
  heatmap: Record<string, any>;
  
  /** 设置数据（可选） */
  settings?: Record<string, any>;
}

/**
 * 数据导入结果接口
 * 
 * 表示一次导入操作的结果。
 * 
 * @example
 * ```typescript
 * const result: ImportResult = {
 *   success: true,
 *   message: '导入成功',
 *   imported: 100,
 *   skipped: 5,
 *   errors: []
 * };
 * ```
 */
export interface ImportResult {
  /** 是否成功 */
  success: boolean;
  
  /** 结果消息 */
  message: string;
  
  /** 导入的数据数量 */
  imported: number;
  
  /** 跳过的数据数量 */
  skipped: number;
  
  /** 错误信息数组 */
  errors: string[];
}
