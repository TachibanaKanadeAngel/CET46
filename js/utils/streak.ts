// 学习打卡 / 连击（Streak）工具
// 基于“学习热力图”日期计数，计算当前连击天数与历史最长连击。
// 纯函数、无 DOM 依赖，便于单元测试。日期一律使用 'YYYY-MM-DD'（本地时区）。

import { localDateStr } from './date.js';

function parseLocal(dateStr: string): Date {
  const clean = String(dateStr).split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 日期字符串偏移（本地时区理解）。 */
export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + deltaDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * 当前连续打卡天数。
 * 规则：若今天已学，从今天往回数；否则从昨天往回数（今天尚未开始不算断签）。
 * @param dateCountMap 'YYYY-MM-DD' -> 当天学习词数
 */
export function computeCurrentStreak(
  dateCountMap: Record<string, number> | null | undefined,
  todayStr?: string
): number {
  if (!dateCountMap || typeof dateCountMap !== 'object') return 0;
  const today = todayStr || localDateStr();
  let streak = 0;
  let cursor = (dateCountMap as Record<string, number>)[today] > 0 ? today : shiftDateStr(today, -1);
  while ((dateCountMap as Record<string, number>)[cursor]) {
    streak++;
    cursor = shiftDateStr(cursor, -1);
  }
  return streak;
}

/** 历史最长连续打卡天数。 */
export function computeLongestStreak(dateCountMap: Record<string, number> | null | undefined): number {
  if (!dateCountMap || typeof dateCountMap !== 'object') return 0;
  const dates = Object.keys(dateCountMap)
    .filter(d => dateCountMap[d] > 0)
    .sort((a, b) => parseLocal(a).getTime() - parseLocal(b).getTime());
  if (dates.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (shiftDateStr(dates[i - 1], 1) === dates[i]) run++;
    else run = 1;
    if (run > longest) longest = run;
  }
  return longest;
}

/** 今日是否已学习（便于打卡文案/成就判断）。 */
export function hasStudiedToday(dateCountMap: Record<string, number>, todayStr: string): boolean {
  return (dateCountMap[todayStr] ?? 0) > 0;
}

export default { computeCurrentStreak, computeLongestStreak, shiftDateStr, hasStudiedToday };