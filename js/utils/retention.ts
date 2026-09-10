// 遗忘曲线（记忆保持率预测）
// 基于指数遗忘模型估算记忆保持率随时间衰减，以及按当前未来复习计划
// 生成“未来 N 天预计保持率”曲线数据，供统计页图表绘制。纯函数、无 DOM。

export interface RetentionPoint {
  day: number;
  retention: number;
}

export interface CurveInput {
  initialRetention: number;
  halfLife: number;
}

export interface CurveOptions {
  days?: number;
  step?: number;
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 1000) / 1000));
}

/**
 * 指数遗忘曲线：R(t) = R0 * exp(- ln2 * t / halfLife)
 */
export function forgettingCurve(
  initialRetention = 1,
  halfLifeDays = 10,
  opts: CurveOptions = {}
): RetentionPoint[] {
  const days = opts.days ?? 7;
  const step = opts.step ?? 1;
  const half = halfLifeDays > 0 ? halfLifeDays : 1;
  const points: RetentionPoint[] = [];
  for (let day = 0; day <= days; day += step) {
    const t = day === 0 ? 1e-6 : day;
    const retention = initialRetention * Math.exp((-Math.LN2 * t) / half);
    points.push({ day, retention: clamp(retention) });
  }
  return points;
}

/**
 * 由“间隔天数 + 复习时请求保留率”估算平均遗忘曲线。
 * FSRS 语义：到达复习日时实际保持率应接近 R，据此可反推半衰期。
 */
export function fsrsForgettingCurve(
  intervalDays: number,
  requestedRetention = 0.9,
  opts: CurveOptions = {}
): RetentionPoint[] {
  const ivl = intervalDays > 0 ? intervalDays : 1;
  const halfLife = (Math.LN2 * ivl) / Math.max(-Math.log(requestedRetention || 0.9), 1e-6);
  return forgettingCurve(1, halfLife, opts);
}

/** 聚合多条（单词）遗忘曲线为平均保持率曲线。 */
export function averageRetentionCurve(
  curves: CurveInput[] | null | undefined,
  opts: CurveOptions = {}
): RetentionPoint[] {
  const days = opts.days ?? 7;
  const list = (curves || []).length ? (curves as CurveInput[]) : [{ initialRetention: 1, halfLife: 10 }];
  const points: RetentionPoint[] = [];
  for (let day = 0; day <= days; day++) {
    const t = day || 1e-6;
    let sum = 0;
    for (const c of list) {
      const half = c.halfLife > 0 ? c.halfLife : 10;
      sum += c.initialRetention * Math.exp((-Math.LN2 * t) / half);
    }
    points.push({ day, retention: clamp(sum / list.length) });
  }
  return points;
}

/** 保留率的“瓶颈”衡量：曲线下面积（越大记忆越持久）。 */
export function curveArea(points: RetentionPoint[] | null | undefined): number {
  if (!points || points.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < points.length; i++) {
    area += ((points[i - 1].retention + points[i].retention) / 2) * (points[i].day - points[i - 1].day);
  }
  return area;
}

export default { forgettingCurve, fsrsForgettingCurve, averageRetentionCurve, curveArea };