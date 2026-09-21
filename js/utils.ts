/**
 * CET46 公共工具模块
 * 纯函数工具，不依赖任何业务状态
 */

import { CONFIG } from './config.js';

/**
 * 防止 XSS 攻击的 HTML 字符转义工具
 */
export function escapeHTML(str: string): string {
  return (str || '').replace(
    /[&<>'"]/g,
    tag =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag] || tag
  );
}

/**
 * 转义正则表达式特殊字符，防止 ReDoS 攻击
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getDisplayMeaning(word: any): string {
  return word?.meaning || word?.translation || '';
}

/**
 * 数组随机打乱工具 (Fisher-Yates 洗牌算法)
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as any)[key]);
    }
  }
  return cloned;
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: any = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 格式化日期为本地字符串
 */
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 安全地解析 JSON
 */
export function safeJSONParse<T = any>(jsonString: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * 计算两个日期之间的天数差
 */
export function daysBetween(date1: Date | string | number, date2: Date | string | number): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const msPerDay = (CONFIG.CONSTANTS?.MS_PER_DAY || 86400000);
  return Math.abs(Math.floor((d2 - d1) / msPerDay));
}

/**
 * 合并对象与显式 id
 */
export function mergeWithId(src: any, id: string | number): any {
  const { id: _ignored, ...rest } = src || {};
  return { ...rest, id };
}

/**
 * 将字节数转换为可读格式
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes)) return '0 Bytes';
  if (bytes < 0) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
