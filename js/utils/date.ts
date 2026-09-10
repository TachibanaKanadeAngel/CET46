/**
 * 本地日期字符串（YYYY-MM-DD），修正 UTC 时区 Bug
 * toISOString().split('T')[0] 返回 UTC 日期，非 UTC 用户跨天临界点会错乱
 * @param d 日期对象，默认当前时间
 * @returns 本地时区的 YYYY-MM-DD
 */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}