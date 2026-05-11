/**
 * CET46 公共工具模块
 * 纯函数工具，不依赖任何业务状态
 */

/**
 * 防止 XSS 攻击的 HTML 字符转义工具
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeHTML(str) {
  return (str || '').replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * 转义正则表达式特殊字符，防止 ReDoS 攻击
 * @param {string} string - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 数组随机打乱工具 (Fisher-Yates 洗牌算法)
 * 会改变原数组
 * @param {Array} array - 需要打乱的数组
 * @returns {Array} 打乱后的数组（原数组引用）
 */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 深度克隆对象（简单版，不支持循环引用）
 * @param {any} obj - 需要克隆的对象
 * @returns {any} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 格式化日期为本地字符串
 * @param {Date|string|number} date - 日期对象或时间戳
 * @param {string} format - 格式模板（可选）
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 生成唯一 ID
 * @param {string} prefix - ID 前缀
 * @returns {string} 唯一 ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 安全地解析 JSON
 * @param {string} jsonString - JSON 字符串
 * @param {any} defaultValue - 解析失败时的默认值
 * @returns {any} 解析后的对象或默认值
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string|number} date1 - 第一个日期
 * @param {Date|string|number} date2 - 第二个日期
 * @returns {number} 天数差（绝对值）
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(Math.floor((d2 - d1) / msPerDay));
}

/**
 * 将字节数转换为可读格式
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 可读格式（如 1.5 MB）
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
