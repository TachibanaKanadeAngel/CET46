/**
 * @module types/features
 * @description 功能模块相关类型定义
 * 
 * 本模块定义了CET46科学记忆引擎中与功能模块相关的所有类型接口。
 * 包括学习、复习、拼写、设置等功能模块的类型。
 */

import type { WordData, WordProgress } from './word';
import type { DBInstance } from './db';

/**
 * 学习会话数据接口
 */
export interface StudySession {
  /** 学习级别 */
  level: string;
  /** 模式 */
  mode: 'study';
  /** 队列中的单词ID数组 */
  queueIds: number[];
  /** 当前索引 */
  currentIndex: number;
  /** 已学习数量 */
  learnedCount: number;
  /** 已作答数量 */
  answeredCount: number;
  /** 总数量 */
  totalCount: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 学习会话检查结果接口
 */
export interface StudySessionCheckResult {
  /** 是否有会话 */
  hasSession: boolean;
  /** 会话数据 */
  session: StudySession | null;
}

/**
 * 学习队列项接口
 */
export interface StudyQueueItem extends WordData {
  /** 学习进度数据 */
  wordData?: WordProgress;
}

/**
 * 学习开始选项接口
 */
export interface StartStudyOptions {
  /** 覆盖队列 */
  overrideQueue?: StudyQueueItem[];
  /** 覆盖索引 */
  overrideIndex?: number;
  /** 总数量 */
  totalCount?: number | null;
  /** 已作答数量 */
  answeredCount?: number;
}

/**
 * StudyFeature接口
 */
export interface IStudyFeature {
  /** 学习队列 */
  studyQueue: StudyQueueItem[];
  /** 当前索引 */
  studyIndex: number;
  /** 词库 */
  WORDS: WordData[];
  /** 当前级别 */
  currentLevel: string;
  /** 初始队列大小 */
  initialQueueSize: number;
  /** 已作答数量 */
  answeredCount: number;
  /** 待处理会话 */
  pendingSession: StudySession | null;
  /** 最后的memoryCache引用 */
  lastMemoryCache: any | null;
  /** 最后的db引用 */
  lastDb: DBInstance | null;
  /** 会话存储键 */
  SESSION_KEY: string;
  /** 提交中标记 */
  _submitting: boolean;

  /** 设置词库 */
  setWords(words: WordData[]): void;
  /** 检查学习会话 */
  checkStudySession(memoryCache: any, db: DBInstance): Promise<StudySessionCheckResult>;
  /** 保存学习会话 */
  saveStudySession(memoryCache?: any, db?: DBInstance): Promise<StudySession | null>;
  /** 更新进度 */
  updateProgress(): void;
  /** 重置学习卡片 */
  resetStudyCard(): void;
  /** 开始学习 */
  startStudy(
    level: string,
    limit: number | null,
    getData: () => any,
    memoryCache: any,
    db: DBInstance,
    options?: StartStudyOptions
  ): boolean;
  /** 显示学习单词 */
  showStudyWord(): void;
  /** 标记单词 */
  markWord(known: boolean): Promise<void>;
  /** 从会话恢复 */
  resumeFromSession(session: StudySession, memoryCache: any, db: DBInstance): boolean;
  /** 朗读当前单词 */
  speakCurrentWord(): void;
  /** 切换完形填空模式 */
  toggleClozeMode(): void;
  /** 处理保存助记 */
  handleSaveMnemonic(saveMnemonicFn: (wordId: number, mnemonic: string) => void): void;
}

/**
 * 复习状态接口
 */
export interface ReviewState {
  /** 复习队列 */
  queue: StudyQueueItem[];
  /** 当前索引 */
  index: number;
  /** 是否翻转 */
  flipped: boolean;
  /** 当前单词 */
  current: StudyQueueItem | null;
}

/**
 * 复习依赖接口
 */
export interface ReviewDependencies {
  /** 设置单词数据 */
  setWordData: (id: number, data: WordProgress) => Promise<void>;
  /** 更新FSRS */
  updateFSRS: (wd: WordProgress, quality: number) => { stability: number; difficulty: number };
  /** 计算FSRS间隔 */
  calculateFSRSInterval: (stability: number) => number;
  /** 调整语义干扰 */
  adjustForSemanticInterference: (wordId: number, interval: number) => number;
  /** 获取个性化节律因子 */
  getPersonalizedCircadianFactor: () => number;
  /** 添加错词 */
  addWrongWord: (id: number, word: any) => void;
  /** 移除错词 */
  removeWrongWord: (id: number) => void;
  /** 记录热力图 */
  recordHeatmap: () => void;
  /** 保存每日进度快照 */
  saveDailyProgressSnapshot: () => void;
  /** 更新统计 */
  updateStats: () => void;
  /** 显示复习单词 */
  showReviewWord: () => void;
  /** 播放音效 */
  playTone: (type: 'success' | 'fail') => void;
  /** 烟花特效 */
  fireConfetti: () => void;
}

/**
 * ReviewFeature接口
 */
export interface IReviewFeature {
  /** 设置词库 */
  setWords(words: WordData[] | (() => WordData[])): void;
  /** 获取词库 */
  getWords(): WordData[];
  /** 获取复习状态 */
  getReviewState(): ReviewState;
  /** 更新复习 */
  updateReview(getWordDataFn?: (id: number) => WordProgress | null): void;
  /** 显示复习单词 */
  showReviewWord(): { needsUpdate: boolean };
  /** 翻转复习卡片 */
  flipReviewCard(): void;
  /** 标记复习单词 */
  markReviewWord(known: boolean, deps: ReviewDependencies): Promise<void>;
  /** 朗读复习单词 */
  speakReviewWord(): void;
  /** 复习队列 */
  readonly reviewQueue: StudyQueueItem[];
  /** 复习索引 */
  readonly reviewIndex: number;
  /** 是否翻转 */
  readonly reviewFlipped: boolean;
  /** 当前复习单词 */
  readonly currentReviewWord: StudyQueueItem | null;
}

/**
 * 拼写模式类型
 */
export type SpellingMode = 'meaning' | 'phonetic' | 'audio';

/**
 * 拼写初始化配置接口
 */
export interface SpellingInitConfig {
  /** 获取学习队列 */
  getStudyQueue?: () => StudyQueueItem[];
  /** 学习队列（兼容） */
  studyQueue?: StudyQueueItem[];
  /** 获取学习索引 */
  getStudyIndex?: () => number;
  /** 学习索引（兼容） */
  studyIndex?: number;
  /** 获取单词数据 */
  getWordData: (id: number) => WordProgress | null;
  /** 设置单词数据 */
  setWordData: (id: number, data: WordProgress) => Promise<void>;
  /** 添加错词 */
  addWrongWord: (id: number, word: any) => void;
  /** 移除错词 */
  removeWrongWord: (id: number) => void;
  /** 保存学习会话 */
  saveStudySession: () => Promise<any>;
  /** 更新统计 */
  updateStats: () => void;
  /** 更新进度 */
  updateProgress: () => void;
  /** 显示学习单词 */
  showStudyWord: () => void;
  /** 移除学习单词 */
  removeStudyWord?: (id: number) => void;
}

/**
 * SpellingFeature接口
 */
export interface ISpellingFeature {
  /** 初始化 */
  init(config: SpellingInitConfig): void;
  /** 设置学习队列 */
  setStudyQueue(queue: StudyQueueItem[], index: number): void;
  /** 获取拼写模式 */
  getSpellingMode(): SpellingMode;
  /** 设置拼写模式 */
  setSpellingMode(mode: SpellingMode): void;
  /** 重放拼写音频 */
  replaySpellingAudio(): void;
  /** 给出拼写提示 */
  giveSpellingHint(): void;
  /** 打开拼写挑战 */
  openSpellingChallenge(): void;
  /** 关闭拼写模态框 */
  closeSpellingModal(): void;
  /** 检查拼写 */
  checkSpelling(): Promise<void>;
  /** 处理拼写键盘事件 */
  handleSpellingKeydown(e: KeyboardEvent): void;
}

/**
 * 设置模块接口
 */
export interface ISettingsFeature {
  /** 设置词库 */
  setWords(words: WordData[] | (() => WordData[])): void;
  /** 初始化 */
  init(config: { WORDS: WordData[] | (() => WordData[]); updateStats: () => void; renderList: () => void }): void;
  /** 重置进度 */
  resetProgress(): Promise<void>;
  /** 导出数据 */
  exportData(): Promise<void>;
  /** 导入数据 */
  importData: (event: Event) => Promise<void>;
  /** 训练FSRS权重 */
  trainFSRSWeights(): Promise<void>;
  /** 取消FSRS训练 */
  cancelFSRSTraining(): boolean;
  /** 重置FSRS权重 */
  resetFSRSWeights(): void;
}

/**
 * WebDAV模块接口
 */
export interface IWebDAVFeature {
  /** 初始化 */
  init(config: { updateStats: () => void; renderList: () => void }): void;
  /** 处理同步到WebDAV */
  handleSyncToWebDAV(): Promise<void>;
  /** 处理从WebDAV同步 */
  handleSyncFromWebDAV(): Promise<void>;
  /** 切换WebDAV配置 */
  toggleWebDAVConfig(): void;
  /** 处理保存WebDAV配置 */
  handleSaveWebDAVConfig(): void;
  /** 处理测试WebDAV连接 */
  handleTestWebDAVConnection(): Promise<void>;
  /** 处理导出加密密钥 */
  handleExportEncryptionKey(): void;
}

/**
 * 小游戏模块接口
 */
export interface IMiniGame {
  /** 初始化 */
  init(): void;
}

/**
 * 引擎可视化模块接口
 */
export interface IEngineVisualizer {
  /** 初始化 */
  init(): void;
}

/**
 * PWA组件模块接口
 */
export interface IPWAWidgets {
  /** 初始化 */
  init(): void;
}
