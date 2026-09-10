/**
 * 长期断学复习负载削峰调度器 (Review Load Balancer / Anti-Avalanche)
 * 防止用户长期中断学习后重返系统面临海量积压复习词汇造成的认知过载
 */

export interface ReviewWordItem {
  id: number;
  word?: string;
  stability?: number;
  difficulty?: number;
  lastStudy?: number;
  reviewCount?: number;
  errorCount?: number;
  [key: string]: unknown;
}

export interface ReviewBalancingOptions {
  /** 单日健康复习容量上限（默认 50） */
  dailyBatchLimit?: number;
  /** 触发复习风暴判定的倍率阈值（默认 2.0 倍） */
  avalancheRatio?: number;
}

export interface ReviewBalanceResult<T extends ReviewWordItem = ReviewWordItem> {
  /** 今日推荐复习的核心切片（削峰后） */
  todayBatch: T[];
  /** 延后平摊的溢出复习队列 */
  deferredQueue: T[];
  /** 统计指标 */
  metrics: {
    totalDue: number;
    todayCount: number;
    deferredCount: number;
    isAvalanche: boolean;
    estimatedDaysToClear: number;
  };
}

/**
 * 计算单个单词的复习紧迫度评分（Urgency Score）
 * 紧迫度越高（遗忘概率越大、难度越高、错题频次越高），越应优先进入今日复习
 */
export function calculateWordUrgency(word: ReviewWordItem, now = Date.now()): number {
  const stability = Math.max(0.1, Number(word.stability) || 1.0);
  const difficulty = Math.max(1, Math.min(10, Number(word.difficulty) || 5.0));
  const errorCount = Math.max(0, Number(word.errorCount) || 0);
  const lastStudy = Number(word.lastStudy) || now;

  const elapsedDays = Math.max(0, (now - lastStudy) / (24 * 60 * 60 * 1000));
  // 遗忘可提取性 R = (1 + elapsed / (9 * S)) ^ -1
  const retrievability = Math.pow(1 + elapsedDays / (9 * stability), -1);

  // 紧迫度 = (1 - R) * 10 + 难度权重 * 2 + 历史错题加权 * 3
  const urgency = (1 - retrievability) * 10 + (difficulty / 10) * 2 + Math.min(errorCount, 5) * 3;
  return Number.isFinite(urgency) ? urgency : 0;
}

/**
 * 对待复习队列执行智能削峰与优先级平摊
 */
export function balanceReviewQueue<T extends ReviewWordItem>(
  dueQueue: T[],
  options: ReviewBalancingOptions = {}
): ReviewBalanceResult<T> {
  const dailyBatchLimit = Math.max(5, options.dailyBatchLimit ?? 50);
  const avalancheRatio = Math.max(1.5, options.avalancheRatio ?? 2.0);

  if (!Array.isArray(dueQueue) || dueQueue.length === 0) {
    return {
      todayBatch: [],
      deferredQueue: [],
      metrics: {
        totalDue: 0,
        todayCount: 0,
        deferredCount: 0,
        isAvalanche: false,
        estimatedDaysToClear: 0,
      },
    };
  }

  const totalDue = dueQueue.length;
  const isAvalanche = totalDue >= dailyBatchLimit * avalancheRatio;

  // 按照紧急程度降序排序（最易遗忘、最重要的高优先）
  const sortedQueue = [...dueQueue].sort((a, b) => {
    return calculateWordUrgency(b) - calculateWordUrgency(a);
  });

  // 如果触发了复习风暴，则进行削峰截断，平摊到后续批次
  const todayBatch = isAvalanche ? sortedQueue.slice(0, dailyBatchLimit) : sortedQueue;
  const deferredQueue = isAvalanche ? sortedQueue.slice(dailyBatchLimit) : [];

  return {
    todayBatch,
    deferredQueue,
    metrics: {
      totalDue,
      todayCount: todayBatch.length,
      deferredCount: deferredQueue.length,
      isAvalanche,
      estimatedDaysToClear: Math.ceil(totalDue / dailyBatchLimit),
    },
  };
}
