/**
 * @module types/word
 * @description 单词相关类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中与单词相关的所有类型接口。
 * 包括单词数据、学习进度、错词记录和热力图数据等。
 */

/**
 * 单词基础数据接口
 * 
 * 表示一个单词的基本信息，包括拼写、释义、音标等。
 * 这是词库中每个单词的核心数据结构。
 * 
 * @example
 * ```typescript
 * const word: WordData = {
 *   id: 1,
 *   word: 'abandon',
 *   meaning: '放弃；抛弃',
 *   phonetic: '/əˈbændən/',
 *   example: 'He abandoned his plan.',
 *   level: 'CET4',
 *   tags: ['动词', '高频'],
 *   mnemonic: 'a-band-on：一个乐队在上面→放弃'
 * };
 * ```
 */
export interface WordData {
  /** 单词唯一标识符 */
  id: number;
  
  /** 单词拼写 */
  word: string;
  
  /** 单词释义（中文） */
  meaning: string;

  /** 翻译（可选，与 meaning 同义，用于兼容旧数据） */
  translation?: string;

  /** 音标（可选） */
  phonetic?: string;
  
  /** 例句（可选） */
  example?: string;
  
  /** 
   * 单词级别
   * - 'CET4': 大学英语四级
   * - 'CET6': 大学英语六级
   * - 'all': 通用
   */
  level: 'CET4' | 'CET6' | 'all';
  
  /** 标签数组，用于分类和筛选（可选） */
  tags?: string[];
  
  /** 用户自定义助记（可选） */
  mnemonic?: string;
}

/**
 * 单词学习进度接口
 * 
 * 记录用户对某个单词的学习状态和进度信息。
 * 包括FSRS算法所需的稳定性、难度等参数。
 * 
 * @example
 * ```typescript
 * const progress: WordProgress = {
 *   status: 'learning',
 *   level: 3,
 *   nextReview: Date.now() + 24 * 60 * 60 * 1000,
 *   lastStudy: Date.now(),
 *   ef: 2.5,
 *   reviewCount: 5,
 *   difficulty: 5.0,
 *   stability: 10.0,
 *   isDirty: true,
 *   mtime: Date.now()
 * };
 * ```
 */
export interface WordProgress {
  /** 
   * 学习状态
   * - 'new': 未学习
   * - 'learning': 学习中
   * - 'review': 待复习
   * - 'mastered': 已掌握
   */
  status: 'new' | 'learning' | 'review' | 'mastered';
  
  /** 学习等级（0-10） */
  level: number;
  
  /** 下次复习时间戳（毫秒） */
  nextReview: number;
  
  /** 下次复习格式化日期字符串（YYYY-MM-DD） */
  nextReviewDate?: string;

  /** 上次学习时间戳（毫秒） */
  lastStudy: number;
  
  /** 
   * 难度因子（Easiness Factor）
   * 范围：1.3-3.0，默认2.5
   * 值越大表示单词越容易记住
   */
  ef: number;
  
  /** 复习次数 */
  reviewCount: number;
  
  /** 
   * FSRS难度参数
   * 范围：1-10，值越大表示单词越难
   */
  difficulty: number;
  
  /** 
   * FSRS稳定性参数
   * 表示记忆保持的时间长度（天）
   * 值越大表示记忆越持久
   */
  stability: number;
  
  /** 是否需要同步到云端 */
  isDirty?: boolean;
  
  /** 修改时间戳（毫秒） */
  mtime?: number;
  
  /** 用户自定义助记（可选） */
  mnemonic?: string;
  
  /** 短期记忆重复次数（可选） */
  shortTermReps?: number;
  
  /** 上次短期记忆复习时间戳（可选） */
  lastShortTermReview?: number;
  
  /** 距离上次复习的天数（可选，用于FSRS计算） */
  elapsedDays?: number;
  
  /** 上次复习结果（可选，1=失败，0=成功） */
  lastResult?: number;
  
  /** 复习质量评分（可选，1-4） */
  quality?: number;
}

/**
 * 错词记录接口
 * 
 * 记录用户答错的单词信息，包括错误次数和时间。
 * 用于错词本功能和错误分析。
 * 
 * @example
 * ```typescript
 * const wrongWord: WrongWord = {
 *   id: 1,
 *   word: 'abandon',
 *   count: 3,
 *   firstWrong: Date.now() - 7 * 24 * 60 * 60 * 1000,
 *   lastWrong: Date.now(),
 *   errors: [
 *     { timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, type: 'unknown' },
 *     { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, type: 'spelling' },
 *     { timestamp: Date.now(), type: 'unknown' }
 *   ]
 * };
 * ```
 */
export interface WrongWord {
  /** 单词ID */
  id: number;
  
  /** 单词拼写 */
  word: string;
  
  /** 错误总次数 */
  count: number;
  
  /** 首次错误时间戳（毫秒） */
  firstWrong: number;
  
  /** 最近错误时间戳（毫秒） */
  lastWrong: number;
  
  /** 
   * 错误记录数组
   * 每次错误都记录时间和类型
   */
  errors: Array<{
    /** 错误时间戳（毫秒） */
    timestamp: number;
    /** 
     * 错误类型
     * - 'unknown': 不认识
     * - 'spelling': 拼写错误
     */
    type: 'unknown' | 'spelling';
  }>;
}

/**
 * 热力图数据接口
 * 
 * 用于展示学习热力图，记录每天的学习情况。
 * 
 * @example
 * ```typescript
 * const heatmapData: HeatmapData = {
 *   date: '2026-06-24',
 *   count: 50,
 *   words: 100
 * };
 * ```
 */
export interface HeatmapData {
  /** 日期字符串（YYYY-MM-DD格式） */
  date: string;
  
  /** 当天学习的单词数量 */
  count: number;
  
  /** 当天复习的单词数量 */
  words: number;
}

/**
 * 词库配置接口
 * 
 * 定义词库的配置信息。
 * 
 * @example
 * ```typescript
 * const vocabConfig: VocabConfig = {
 *   name: 'CET4核心词汇',
 *   version: '1.0.0',
 *   totalWords: 4500,
 *   levels: ['CET4'],
 *   tags: ['高频', '核心']
 * };
 * ```
 */
export interface VocabConfig {
  /** 词库名称 */
  name: string;
  
  /** 词库版本 */
  version: string;
  
  /** 单词总数 */
  totalWords: number;
  
  /** 包含的级别 */
  levels: Array<'CET4' | 'CET6' | 'all'>;
  
  /** 包含的标签 */
  tags?: string[];
}

/**
 * 单词搜索结果接口
 * 
 * 用于词库搜索功能。
 * 
 * @example
 * ```typescript
 * const searchResult: WordSearchResult = {
 *   word: { id: 1, word: 'abandon', meaning: '放弃', level: 'CET4' },
 *   score: 0.95,
 *   matches: ['abandon', 'abandoned', 'abandoning']
 * };
 * ```
 */
export interface WordSearchResult {
  /** 匹配的单词数据 */
  word: WordData;
  
  /** 匹配分数（0-1） */
  score: number;
  
  /** 匹配的字段 */
  matches: string[];
}
