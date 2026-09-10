/**
 * @module types/fsrs
 * @description FSRS算法相关类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中与FSRS（Free Spaced Repetition Scheduler）
 * 算法相关的所有类型接口。
 * 
 * FSRS是一种基于机器学习的间隔重复算法，用于优化记忆复习时间。
 * 本项目使用FSRS 4.5版本。
 * 
 * @see https://github.com/open-spaced-repetition/fsrs4anki
 */

/**
 * FSRS权重类型
 * 
 * FSRS算法使用17个权重参数来计算复习间隔。
 * 这些参数可以通过机器学习训练来优化。
 * 
 * @example
 * ```typescript
 * const weights: FSRSWeights = [
 *   0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
 *   1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
 * ];
 * ```
 */
export type FSRSWeights = number[] & { length: 17 };

/**
 * FSRS计算结果接口
 * 
 * 表示FSRS算法计算后的新状态。
 * 
 * @example
 * ```typescript
 * const result: FSRSResult = {
 *   stability: 10.5,
 *   difficulty: 5.2
 * };
 * ```
 */
export interface FSRSResult {
  /** 新的稳定性值（天） */
  stability: number;
  
  /** 新的难度值（1-10） */
  difficulty: number;
}

/**
 * FSRS卡片状态类型
 * 
 * 表示卡片在FSRS算法中的状态。
 * 
 * - 'New': 新卡片，从未学习
 * - 'Learning': 学习中，正在学习新卡片
 * - 'Review': 复习中，已经学会的卡片
 * - 'Relearning': 重新学习，复习失败的卡片
 */
export type FSRSCardState = 'New' | 'Learning' | 'Review' | 'Relearning';

/**
 * FSRS卡片接口
 * 
 * 表示一个卡片在FSRS算法中的完整状态。
 * 
 * @example
 * ```typescript
 * const card: FSRSCard = {
 *   stability: 10.0,
 *   difficulty: 5.0,
 *   elapsedDays: 3,
 *   scheduledDays: 7,
 *   reps: 5,
 *   lapses: 1,
 *   state: 'Review',
 *   lastReview: Date.now() - 3 * 24 * 60 * 60 * 1000
 * };
 * ```
 */
export interface FSRSCard {
  /** 稳定性（天） */
  stability: number;
  
  /** 难度（1-10） */
  difficulty: number;
  
  /** 距离上次复习的天数 */
  elapsedDays: number;
  
  /** 计划复习的天数 */
  scheduledDays: number;
  
  /** 复习次数 */
  reps: number;
  
  /** 失败次数（复习失败后重新学习） */
  lapses: number;
  
  /** 卡片状态 */
  state: FSRSCardState;
  
  /** 上次复习时间戳（毫秒） */
  lastReview: number;
}

/**
 * FSRS复习评分类型
 * 
 * 表示用户对卡片的复习评分。
 * 
 * - 1: 重来（完全不记得）
 * - 2: 困难（勉强记得）
 * - 3: 良好（记得）
 * - 4: 容易（很容易）
 */
export type FSRSRating = 1 | 2 | 3 | 4;

/**
 * FSRS复习日志接口
 * 
 * 记录一次复习的详细信息。
 * 
 * @example
 * ```typescript
 * const reviewLog: FSRSReviewLog = {
 *   rating: 3,
 *   elapsedDays: 3,
 *   scheduledDays: 7,
 *   state: 'Review',
 *   review: Date.now()
 * };
 * ```
 */
export interface FSRSReviewLog {
  /** 复习评分 */
  rating: FSRSRating;
  
  /** 距离上次复习的天数 */
  elapsedDays: number;
  
  /** 计划复习的天数 */
  scheduledDays: number;
  
  /** 复习前的卡片状态 */
  state: FSRSCardState;
  
  /** 复习时间戳（毫秒） */
  review: number;
}

/**
 * 生物钟统计接口
 * 
 * 记录用户在不同时间段的学习表现。
 * 用于计算个性化生物钟因子。
 * 
 * @example
 * ```typescript
 * const circadianStats: CircadianStats = {
 *   8: { total: 50, correct: 40 },   // 上午8点
 *   9: { total: 60, correct: 55 },   // 上午9点
 *   20: { total: 40, correct: 35 }   // 晚上8点
 * };
 * ```
 */
export interface CircadianStats {
  /** 
   * 小时统计数据
   * 键为小时（0-23），值为该小时的学习统计
   */
  [hour: number]: HourStat;
}

/**
 * 小时统计接口
 * 
 * 记录某个小时的学习统计数据。
 * 
 * @example
 * ```typescript
 * const hourStat: HourStat = {
 *   total: 50,
 *   correct: 40
 * };
 * ```
 */
export interface HourStat {
  /** 总学习次数 */
  total: number;
  
  /** 正确次数 */
  correct: number;
}

/**
 * 遗忘曲线参数接口
 * 
 * 用于计算遗忘衰减的参数。
 * 
 * @example
 * ```typescript
 * const params: ForgettingCurveParams = {
 *   stability: 10.0,
 *   daysSinceReview: 3
 * };
 * ```
 */
export interface ForgettingCurveParams {
  /** 稳定性（天） */
  stability: number;
  
  /** 距离上次复习的天数 */
  daysSinceReview: number;
}

/**
 * 短期记忆结果接口
 * 
 * 表示短期记忆计算的结果。
 * 
 * @example
 * ```typescript
 * const result: ShortTermMemoryResult = {
 *   reps: 3,
 *   bonus: 1.3
 * };
 * ```
 */
export interface ShortTermMemoryResult {
  /** 短期记忆重复次数 */
  reps: number;
  
  /** 短期记忆加成系数 */
  bonus: number;
}

/**
 * FSRS配置接口
 * 
 * 定义FSRS算法的配置参数。
 * 
 * @example
 * ```typescript
 * const config: FSRSConfig = {
 *   DEFAULT_EF: 2.5,
 *   MIN_EF: 1.3,
 *   MAX_EF: 3.0,
 *   TARGET_RETENTION: 0.9,
 *   DEFAULT_W: [...]
 * };
 * ```
 */
export interface FSRSConfig {
  /** 默认难度因子 */
  DEFAULT_EF: number;
  
  /** 最小难度因子 */
  MIN_EF: number;
  
  /** 最大难度因子 */
  MAX_EF: number;
  
  /** 目标记忆保持率（0-1） */
  TARGET_RETENTION: number;
  
  /** 默认FSRS权重 */
  DEFAULT_W: FSRSWeights;
}

/**
 * FSRS训练结果接口
 * 
 * 表示FSRS权重训练的结果。
 * 
 * @example
 * ```typescript
 * const trainResult: FSRSTrainResult = {
 *   weights: [...],
 *   loss: 0.35,
 *   iterations: 100,
 *   converged: true
 * };
 * ```
 */
export interface FSRSTrainResult {
  /** 训练后的权重 */
  weights: FSRSWeights;
  
  /** 最终损失值 */
  loss: number;
  
  /** 迭代次数 */
  iterations: number;
  
  /** 是否收敛 */
  converged: boolean;
}

/**
 * FSRS预测结果接口
 * 
 * 表示FSRS算法预测的记忆保持率。
 * 
 * @example
 * ```typescript
 * const prediction: FSRSPrediction = {
 *   retention: 0.85,
 *   interval: 7,
 *   nextReview: Date.now() + 7 * 24 * 60 * 60 * 1000
 * };
 * ```
 */
export interface FSRSPrediction {
  /** 预测的记忆保持率（0-1） */
  retention: number;
  
  /** 建议的复习间隔（天） */
  interval: number;
  
  /** 建议的下次复习时间戳（毫秒） */
  nextReview: number;
}
