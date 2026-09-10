/**
 * @module types/utils
 * @description 工具模块相关类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中与工具模块相关的所有类型接口。
 */

import type { WordData } from './word';

/**
 * 统计数据接口
 */
export interface StatsData {
  /** 总单词数 */
  totalWords: number;
  /** 新词数 */
  newCount: number;
  /** 复习词数 */
  reviewCount: number;
  /** 已掌握词数 */
  masteredCount: number;
  /** 今日复习数 */
  todayReviewCount: number;
}

/**
 * 热力图数据接口
 */
export interface HeatmapData {
  [date: string]: number;
}

/**
 * 进度快照接口
 */
export interface ProgressSnapshot {
  [date: string]: {
    mastered: number;
  };
}

/**
 * 虚拟列表项接口
 */
export interface VirtualListItem extends WordData {
  /** 显示状态 */
  displayStatus?: string;
  /** 显示释义 */
  displayMeaning?: string;
}

/**
 * 词汇列表配置接口
 */
export interface VocabListConfig {
  /** 项目高度 */
  itemHeight: number;
  /** 可见数量 */
  visibleCount: number;
  /** 池大小 */
  poolSize: number;
}

/**
 * 语义图节点接口
 */
export interface SemanticGraphNode {
  /** 单词ID */
  id: number;
  /** 单词 */
  word: string;
  /** 相似单词 */
  similarWords: number[];
}

/**
 * 语义图配置接口
 */
export interface SemanticGraphConfig {
  /** 最大编辑距离 */
  maxEditDistance: number;
  /** 最大邻居数 */
  maxNeighbors: number;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: string;
  /** 持续时间 */
  duration: number;
  /** 时间戳 */
  timestamp: number;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 性能统计接口
 */
export interface PerformanceStats {
  /** 调用次数 */
  count: number;
  /** 平均值 */
  avg: string;
  /** 最小值 */
  min: string;
  /** 最大值 */
  max: string;
  /** P95值 */
  p95: string;
  /** 总计 */
  total: string;
}

/**
 * Web Vitals指标接口
 */
export interface WebVitalsMetrics {
  /** LCP (Largest Contentful Paint) */
  LCP?: number;
  /** FID (First Input Delay) */
  FID?: number;
  /** CLS (Cumulative Layout Shift) */
  CLS?: number;
  /** TTFB (Time to First Byte) */
  TTFB?: number;
  /** FCP (First Contentful Paint) */
  FCP?: number;
}

/**
 * Web Vitals评分接口
 */
export interface WebVitalsScore {
  /** 总分 */
  score: number;
  /** 各指标评分 */
  metrics: {
    [key: string]: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    };
  };
}

/**
 * 网络状态接口
 */
export interface NetworkStatus {
  /** 是否在线 */
  isOnline: boolean;
  /** 网络类型 */
  connectionType?: string;
  /** 下行速度 */
  downlink?: number;
  /** 往返时间 */
  rtt?: number;
}

/**
 * Worker池配置接口
 */
export interface WorkerPoolConfig {
  /** 最大Worker数 */
  maxWorkers: number;
  /** 任务超时时间 */
  taskTimeout: number;
}

/**
 * Worker任务接口
 */
export interface WorkerTask {
  /** 任务ID */
  id: string;
  /** 任务类型 */
  type: string;
  /** 任务数据 */
  data: any;
  /** 优先级 */
  priority?: number;
}

/**
 * Worker结果接口
 */
export interface WorkerResult {
  /** 任务ID */
  taskId: string;
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  result?: any;
  /** 错误信息 */
  error?: string;
}

/**
 * 音频预取配置接口
 */
export interface AudioPrefetchConfig {
  /** 最大预取数 */
  maxPrefetch: number;
  /** 并发数 */
  concurrency: number;
  /** 批次延迟 */
  batchDelay: number;
}

/**
 * 里程碑接口
 */
export interface Milestone {
  /** 里程碑ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 图标 */
  icon: string;
  /** 条件 */
  condition: (data: any) => boolean;
}

/**
 * 事件总线事件接口
 */
export interface ActionBusEvent {
  /** 动作名称 */
  action: string;
  /** 事件对象 */
  event: Event;
  /** 目标元素 */
  target: HTMLElement;
}

/**
 * 键盘快捷键配置接口
 */
export interface KeyboardShortcutConfig {
  /** 快捷键 */
  key: string;
  /** 是否需要Ctrl */
  ctrlKey?: boolean;
  /** 是否需要Shift */
  shiftKey?: boolean;
  /** 是否需要Alt */
  altKey?: boolean;
  /** 动作 */
  action: () => void;
  /** 描述 */
  description?: string;
}

/**
 * 滑动手势配置接口
 */
export interface SwipeGestureConfig {
  /** 阈值 */
  threshold: number;
  /** 时间阈值 */
  timeThreshold: number;
  /** 左滑回调 */
  onSwipeLeft?: () => void;
  /** 右滑回调 */
  onSwipeRight?: () => void;
  /** 上滑回调 */
  onSwipeUp?: () => void;
  /** 下滑回调 */
  onSwipeDown?: () => void;
}

/**
 * 响应式绑定配置接口
 */
export interface ReactiveBindingConfig {
  /** 监听的键 */
  keys: string[];
  /** 回调函数 */
  callback: (values: any, meta: { key: string; newValue: any }) => void;
}

/**
 * 模块加载器配置接口
 */
export interface ModuleLoaderConfig {
  /** 模块名称 */
  name: string;
  /** 加载函数 */
  loader: () => Promise<any>;
  /** 是否懒加载 */
  lazy?: boolean;
}

/**
 * 服务工作者配置接口
 */
export interface ServiceWorkerConfig {
  /** 注册类型 */
  registerType: 'autoUpdate' | 'prompt';
  /** 包含的资源 */
  includeAssets?: string[];
  /** 清单配置 */
  manifest?: Record<string, any>;
}
