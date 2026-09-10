/**
 * @module types/common
 * @description 通用类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中使用的通用工具类型。
 * 包括泛型工具类型、事件系统类型、API响应类型等。
 */

/**
 * 可空类型
 * 
 * 表示一个值可以是T类型或null。
 * 
 * @template T - 基础类型
 * 
 * @example
 * ```typescript
 * let name: Nullable<string> = null;
 * name = 'Alice';
 * ```
 */
export type Nullable<T> = T | null;

/**
 * 可选类型
 * 
 * 表示一个值可以是T类型或undefined。
 * 
 * @template T - 基础类型
 * 
 * @example
 * ```typescript
 * let age: Optional<number> = undefined;
 * age = 25;
 * ```
 */
export type Optional<T> = T | undefined;

/**
 * API响应接口
 * 
 * 标准的API响应格式。
 * 
 * @template T - 响应数据类型
 * 
 * @example
 * ```typescript
 * const response: ApiResponse<User> = {
 *   success: true,
 *   data: { id: 1, name: 'Alice' },
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  
  /** 响应数据（可选） */
  data?: T;
  
  /** 错误信息（可选） */
  error?: string;
  
  /** 响应时间戳（毫秒） */
  timestamp: number;
}

/**
 * 分页响应接口
 * 
 * 用于分页查询的响应格式。
 * 
 * @template T - 数据项类型
 * 
 * @example
 * ```typescript
 * const response: PaginatedResponse<User> = {
 *   items: [{ id: 1, name: 'Alice' }],
 *   total: 100,
 *   page: 1,
 *   pageSize: 10,
 *   hasMore: true
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /** 数据项数组 */
  items: T[];
  
  /** 总数量 */
  total: number;
  
  /** 当前页码（从1开始） */
  page: number;
  
  /** 每页数量 */
  pageSize: number;
  
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 事件映射接口
 * 
 * 定义事件名称到事件数据类型的映射。
 * 用于类型安全的事件系统。
 * 
 * @example
 * ```typescript
 * interface AppEvents extends EventEmitter<{
 *   'user:login': { userId: number };
 *   'user:logout': void;
 *   'data:update': { key: string; value: any };
 * }> {}
 * ```
 */
export interface EventEmitter<T extends Record<string, any>> {
  /**
   * 监听事件
   * @param event - 事件名称
   * @param listener - 事件处理函数
   */
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  
  /**
   * 取消监听
   * @param event - 事件名称
   * @param listener - 事件处理函数
   */
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  
  /**
   * 触发事件
   * @param event - 事件名称
   * @param data - 事件数据
   */
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

/**
 * 可释放资源接口
 * 
 * 表示一个可以释放资源的对象。
 * 
 * @example
 * ```typescript
 * class DatabaseConnection implements Disposable {
 *   dispose() {
 *     // 关闭连接
 *   }
 * }
 * ```
 */
export interface Disposable {
  /**
   * 释放资源
   */
  dispose(): void;
}

/**
 * 可初始化接口
 * 
 * 表示一个需要异步初始化的对象。
 * 
 * @example
 * ```typescript
 * class AppService implements Initializable {
 *   async init() {
 *     // 初始化逻辑
 *   }
 * }
 * ```
 */
export interface Initializable {
  /**
   * 初始化
   */
  init(): Promise<void>;
}

/**
 * 可序列化接口
 * 
 * 表示一个可以序列化和反序列化的对象。
 * 
 * @template T - 反序列化后的类型
 * 
 * @example
 * ```typescript
 * class Config implements Serializable<Config> {
 *   serialize() {
 *     return JSON.stringify(this);
 *   }
 *   deserialize(data: string) {
 *     return Object.assign(new Config(), JSON.parse(data));
 *   }
 * }
 * ```
 */
export interface Serializable<T> {
  /**
   * 序列化为字符串
   * @returns 序列化后的字符串
   */
  serialize(): string;
  
  /**
   * 从字符串反序列化
   * @param data - 序列化的字符串
   * @returns 反序列化后的对象
   */
  deserialize(data: string): T;
}

/**
 * 深度部分类型
 * 
 * 将类型T的所有属性（包括嵌套属性）变为可选。
 * 
 * @template T - 基础类型
 * 
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   address: {
 *     city: string;
 *     zip: string;
 *   };
 * }
 * 
 * type PartialUser = DeepPartial<User>;
 * // 等价于：
 * // {
 * //   name?: string;
 * //   address?: {
 * //     city?: string;
 * //     zip?: string;
 * //   };
 * // }
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度只读类型
 * 
 * 将类型T的所有属性（包括嵌套属性）变为只读。
 * 
 * @template T - 基础类型
 * 
 * @example
 * ```typescript
 * interface Config {
 *   api: {
 *     url: string;
 *     key: string;
 *   };
 * }
 * 
 * type ReadonlyConfig = DeepReadonly<Config>;
 * // config.api.url = 'xxx'; // 错误：只读属性
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 必需属性类型
 * 
 * 将类型T的指定属性K变为必需，其余属性保持不变。
 * 
 * @template T - 基础类型
 * @template K - 必需的属性名
 * 
 * @example
 * ```typescript
 * interface User {
 *   id?: number;
 *   name?: string;
 *   email?: string;
 * }
 * 
 * type RequiredUser = PickRequired<User, 'id' | 'name'>;
 * // {
 * //   id: number;
 * //   name: string;
 * //   email?: string;
 * // }
 * ```
 */
export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * 排除方法类型
 * 
 * 从类型T中排除所有方法属性，只保留数据属性。
 * 
 * @template T - 基础类型
 * 
 * @example
 * ```typescript
 * class User {
 *   name: string;
 *   age: number;
 *   greet() { return 'Hello'; }
 * }
 * 
 * type UserData = ExcludeMethods<User>;
 * // {
 * //   name: string;
 * //   age: number;
 * // }
 * ```
 */
export type ExcludeMethods<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>;

/**
 * 回调函数类型
 * 
 * 标准的回调函数类型。
 * 
 * @template T - 回调数据类型
 * 
 * @example
 * ```typescript
 * const callback: Callback<string> = (data) => {
 *   console.log(data);
 * };
 * ```
 */
export type Callback<T = void> = (data: T) => void;

/**
 * 异步回调函数类型
 * 
 * 异步的回调函数类型。
 * 
 * @template T - 回调数据类型
 * 
 * @example
 * ```typescript
 * const asyncCallback: AsyncCallback<string> = async (data) => {
 *   await someAsyncOperation(data);
 * };
 * ```
 */
export type AsyncCallback<T = void> = (data: T) => Promise<void>;

/**
 * 错误处理函数类型
 * 
 * 错误处理的回调函数类型。
 * 
 * @example
 * ```typescript
 * const errorHandler: ErrorHandler = (error) => {
 *   console.error(error.message);
 * };
 * ```
 */
export type ErrorHandler = (error: Error) => void;

/**
 * 比较函数类型
 * 
 * 用于排序的比较函数类型。
 * 
 * @template T - 比较对象类型
 * 
 * @example
 * ```typescript
 * const compare: CompareFunction<User> = (a, b) => {
 *   return a.name.localeCompare(b.name);
 * };
 * ```
 */
export type CompareFunction<T> = (a: T, b: T) => number;

/**
 * 谓词函数类型
 * 
 * 用于筛选的谓词函数类型。
 * 
 * @template T - 筛选对象类型
 * 
 * @example
 * ```typescript
 * const isAdult: Predicate<User> = (user) => user.age >= 18;
 * ```
 */
export type Predicate<T> = (item: T) => boolean;

/**
 * 映射函数类型
 * 
 * 用于转换的映射函数类型。
 * 
 * @template T - 输入类型
 * @template U - 输出类型
 * 
 * @example
 * ```typescript
 * const toName: MapFunction<User, string> = (user) => user.name;
 * ```
 */
export type MapFunction<T, U> = (item: T) => U;

/**
 * 键值对类型
 * 
 * 表示一个键值对。
 * 
 * @template K - 键类型
 * @template V - 值类型
 * 
 * @example
 * ```typescript
 * const pair: KeyValuePair<string, number> = {
 *   key: 'age',
 *   value: 25
 * };
 * ```
 */
export interface KeyValuePair<K, V> {
  /** 键 */
  key: K;
  
  /** 值 */
  value: V;
}

/**
 * 时间范围类型
 * 
 * 表示一个时间范围。
 * 
 * @example
 * ```typescript
 * const range: TimeRange = {
 *   start: Date.now() - 7 * 24 * 60 * 60 * 1000,
 *   end: Date.now()
 * };
 * ```
 */
export interface TimeRange {
  /** 开始时间戳（毫秒） */
  start: number;
  
  /** 结束时间戳（毫秒） */
  end: number;
}

/**
 * 坐标类型
 * 
 * 表示一个二维坐标。
 * 
 * @example
 * ```typescript
 * const point: Coordinate = { x: 10, y: 20 };
 * ```
 */
export interface Coordinate {
  /** X坐标 */
  x: number;
  
  /** Y坐标 */
  y: number;
}

/**
 * 尺寸类型
 * 
 * 表示一个二维尺寸。
 * 
 * @example
 * ```typescript
 * const size: Size = { width: 100, height: 200 };
 * ```
 */
export interface Size {
  /** 宽度 */
  width: number;
  
  /** 高度 */
  height: number;
}

/**
 * 矩形类型
 * 
 * 表示一个矩形区域。
 * 
 * @example
 * ```typescript
 * const rect: Rect = {
 *   x: 10,
 *   y: 20,
 *   width: 100,
 *   height: 200
 * };
 * ```
 */
export interface Rect extends Coordinate, Size {}

/**
 * 颜色类型
 * 
 * 表示一个颜色值。
 * 
 * @example
 * ```typescript
 * const color: Color = {
 *   r: 255,
 *   g: 128,
 *   b: 0,
 *   a: 1
 * };
 * ```
 */
export interface Color {
  /** 红色分量（0-255） */
  r: number;
  
  /** 绿色分量（0-255） */
  g: number;
  
  /** 蓝色分量（0-255） */
  b: number;
  
  /** 透明度（0-1） */
  a: number;
}
