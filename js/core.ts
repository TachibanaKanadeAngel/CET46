import { CONFIG } from './config.js';
import { db } from './db.js';
import { DEFAULT_FSRS_W, migrateSM2ToFSRS } from './fsrs.js';
import { memoryCache, updateWordData, deleteWordData, createDefaultWordProgress } from './store.js';
import { mergeWithId } from './utils.js';
import logger from './utils/logger.js';
import type { WordData, WordProgress } from '../ts/types/word';

const ACTION_STACK_MAX = CONFIG.MAX_ACTION_STACK;
const CIRCADIAN_MIN_SAMPLES = CONFIG.CIRCADIAN_MIN_SAMPLES;
export const SCHEMA_VERSION = CONFIG.SCHEMA_VERSION || '2.0.0';

export interface ActionItem {
  _id: number;
  wordId: string | number;
  state: any;
  timestamp: number;
  _dbId?: number;
  id?: number;
}

export const actionStack: ActionItem[] = [];
let actionIdCounter = 0;

export async function pushAction(wordId: string | number, prevState: any): Promise<void> {
  const action: ActionItem = {
    _id: ++actionIdCounter,
    wordId,
    state: structuredClone(prevState),
    timestamp: Date.now(),
  };
  actionStack.push(action);

  if (actionStack.length > ACTION_STACK_MAX) {
    const removed = actionStack.shift();
    if (db.instance && removed && removed._dbId) {
      await db.delete('actionStack', removed._dbId);
    }
  }

  if (db.instance) {
    try {
      await db.save('actionStack', action);
      action._dbId = action.id;
    } catch (err) {
      logger.error('[pushAction] 持久化失败:', err);
    }
  }

  if (CONFIG.DEBUG) logger.debug(`操作栈：${actionStack.length}/${ACTION_STACK_MAX}`);
}

export function restoreActionStack(actions: ActionItem[]): void {
  actionStack.length = 0;
  actionStack.push(...actions);
  if (actions.length > 0) {
    const maxId = Math.max(...actions.map(a => a._id || 0));
    actionIdCounter = Math.max(actionIdCounter, maxId);
  }
  logger.info(`ActionStack restored: ${actions.length} actions`);
}

export async function undoLastAction(): Promise<{ success: boolean; message: string }> {
  const last = actionStack.pop();
  if (!last) {
    return { success: false, message: '没有可撤销的操作' };
  }

  if (db.instance) {
    try {
      await db.save('progress', mergeWithId(last.state, parseInt(String(last.wordId), 10)));
      if (last._dbId) {
        await db.delete('actionStack', last._dbId);
      }
    } catch (err) {
      actionStack.push(last);
      logger.error('[undoLastAction] 持久化失败，已回滚操作栈:', err);
      return { success: false, message: '撤销失败，请重试' };
    }
  }

  updateWordData(last.wordId, () => last.state);

  if (CONFIG.DEBUG) logger.debug(`已回滚单词 ${last.wordId} 的状态`);
  return { success: true, message: '已撤销上一步操作' };
}

export function getData(): Record<string, any> {
  if (memoryCache.progress && typeof memoryCache.progress.toObject === 'function') {
    return memoryCache.progress.toObject();
  }
  return memoryCache.progress || {};
}

export function saveData(data: any): void {
  if (memoryCache.progress && typeof memoryCache.progress.fromObject === 'function') {
    memoryCache.progress.fromObject(data);
  } else {
    memoryCache.progress = data;
  }
}

export function getWordData(id: string | number): any {
  let raw: any;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    raw = memoryCache.progress.get(id);
  } else {
    raw = (memoryCache.progress as any)?.[id];
  }

  if (!raw) {
    const defaultData = createDefaultWordProgress();
    if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
      memoryCache.progress.set(id, defaultData);
    } else {
      (memoryCache.progress as any)[id] = defaultData;
    }
    return defaultData;
  }

  const migrated = migrateSM2ToFSRS(raw);
  if (migrated !== raw) {
    if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
      memoryCache.progress.set(id, migrated);
    } else {
      (memoryCache.progress as any)[id] = migrated;
    }
  }

  return migrated;
}

export async function setWordData(id: string | number, wd: any): Promise<any> {
  const numericId = Number(id);
  if (isNaN(numericId)) {
    logger.error(`无效的单词 ID: ${id}`);
    return wd;
  }

  let previousState: any;
  if (memoryCache.progress && typeof memoryCache.progress.get === 'function') {
    previousState = structuredClone(memoryCache.progress.get(id) || {});
  } else {
    previousState = structuredClone((memoryCache.progress as any)?.[id] || {});
  }

  wd.isDirty = true;
  wd.mtime = Date.now();
  invalidateReviewLogsCache();

  if (wd.status && wd.status !== 'deleted' && memoryCache.deletedIds) {
    memoryCache.deletedIds.delete(String(id));
  }

  if (memoryCache.progress && typeof memoryCache.progress.set === 'function') {
    memoryCache.progress.set(id, wd);
  } else {
    (memoryCache.progress as any)[id] = wd;
  }

  await pushAction(id, previousState);

  if (db.instance) {
    try {
      await db.save('progress', mergeWithId(wd, numericId));
    } catch (err) {
      logger.error(`单词 ${id} 持久化失败:`, err);
    }
  }

  return wd;
}

export function markWordAsDeleted(id: string | number): void {
  memoryCache.deletedIds.add(String(id));
  deleteWordData(id);
  if (db.instance) {
    db.delete('progress', Number(id)).catch((err: any) => {
      logger.error('[markWordAsDeleted] 删除持久化记录失败:', err);
    });
  }
}

export function getWordStatus(id: string | number): string {
  if (memoryCache.deletedIds.has(String(id))) return 'deleted';
  return getWordData(id).status;
}

export function getPersonalizedCircadianFactor(
  hourStatsMap?: Record<number, { correct: number; total: number }>,
  currentHour: number = new Date().getHours()
): number {
  if (!hourStatsMap) {
    const logs = collectReviewLogs();
    if (logs.length < CIRCADIAN_MIN_SAMPLES) return 1.0;

    const hourStats = Array(24)
      .fill(0)
      .map(() => ({ total: 0, fail: 0 }));

    logs.forEach(log => {
      if (log.timestamp) {
        const hour = new Date(log.timestamp).getHours();
        if (hour >= 0 && hour < 24) {
          hourStats[hour].total++;
          if (log.quality < 3) hourStats[hour].fail++;
        }
      }
    });

    const cHour = new Date().getHours();
    const stats = hourStats[cHour];

    if (stats.total > 30) {
      const errorRate = stats.fail / stats.total;
      const factor = Math.max(0.8, 1.2 - errorRate);
      logger.info(
        `个性化节律因子：${factor.toFixed(2)} (样本量：${stats.total}, 错误率：${(errorRate * 100).toFixed(1)}%)`
      );
      return factor;
    }

    return 1.0;
  }

  const current = hourStatsMap[currentHour];
  if (!current || current.total < 10) {
    return 1.0;
  }

  const currentAcc = current.correct / current.total;
  let overallTotal = 0;
  let overallCorrect = 0;

  for (const h in hourStatsMap) {
    overallTotal += hourStatsMap[h].total;
    overallCorrect += hourStatsMap[h].correct;
  }

  if (overallTotal < 30) return 1.0;
  const overallAcc = overallCorrect / overallTotal;

  const diff = currentAcc - overallAcc;
  const factor = 1.0 + Math.max(-0.2, Math.min(0.2, diff));
  return factor;
}

let _reviewLogsCache: any[] | null = null;
let _reviewLogsCacheTime = 0;
const REVIEW_LOGS_CACHE_TTL = 30000;

export function invalidateReviewLogsCache(): void {
  _reviewLogsCache = null;
  _reviewLogsCacheTime = 0;
}

export function collectReviewLogs(forceRefresh: boolean = false): any[] {
  const now = Date.now();
  if (!forceRefresh && _reviewLogsCache && now - _reviewLogsCacheTime < REVIEW_LOGS_CACHE_TTL) {
    return _reviewLogsCache;
  }

  const logs: any[] = [];
  const data = getData();

  for (const [id, wd] of Object.entries(data)) {
    if (wd.reviewCount > 0 && wd.stability && wd.difficulty) {
      logs.push({
        wordId: parseInt(id, 10),
        stability: wd.stability,
        difficulty: wd.difficulty,
        reviewCount: wd.reviewCount,
        level: wd.level ?? 0,
        lastResult: wd.level > 0 ? 1 : 0,
        elapsedDays: wd.lastStudy
          ? Math.max(1, Math.floor((Date.now() - wd.lastStudy) / CONFIG.CONSTANTS.MS_PER_DAY))
          : 1,
        quality: wd.level > 5 ? 4 : wd.level > 0 ? 3 : 1,
        timestamp: wd.lastStudy || Date.now(),
      });
    }
  }

  _reviewLogsCache = logs;
  _reviewLogsCacheTime = now;
  return logs;
}

export function migrateData(data: any): any {
  if (!data.version) {
    logger.info('检测到旧版本数据，进行迁移...');
    data.version = '1.0';
  }

  if (data.progress) {
    Object.keys(data.progress).forEach(id => {
      const wd = data.progress[id];
      if (wd && !wd.stability) {
        wd.stability = DEFAULT_FSRS_W[0];
      }
      if (wd && !wd.difficulty) {
        wd.difficulty = DEFAULT_FSRS_W[4];
      }
    });
  }

  if (data.wrongWords) {
    Object.keys(data.wrongWords).forEach(id => {
      const wrong = data.wrongWords[id];
      if (wrong && typeof wrong === 'object') {
        if (!wrong.firstWrong) wrong.firstWrong = Date.now();
        if (!wrong.lastWrong) wrong.lastWrong = Date.now();
      }
    });
  }

  data.version = SCHEMA_VERSION;
  return data;
}

export async function resetProgress(): Promise<string[]> {
  if (memoryCache.progress && typeof memoryCache.progress.clear === 'function') {
    memoryCache.progress.clear();
  }
  if (memoryCache.wrongWords && typeof memoryCache.wrongWords.clear === 'function') {
    memoryCache.wrongWords.clear();
  }
  if (memoryCache.heatmap && typeof memoryCache.heatmap.clear === 'function') {
    memoryCache.heatmap.clear();
  }
  (memoryCache as any).session = null;
  (memoryCache as any).studySession = null;
  memoryCache.deletedIds = new Set();
  actionStack.length = 0;

  const failed: string[] = [];
  if (db.instance) {
    const stores = ['progress', 'wrongWords', 'heatmap', 'session', 'actionStack'];
    for (const store of stores) {
      try {
        await db.clear(store);
      } catch (err) {
        failed.push(store);
        logger.error(`[resetProgress] 清空 ${store} 失败:`, err);
      }
    }
    if (failed.length > 0) {
      logger.error(`[resetProgress] 以下 store 未清空: ${failed.join(', ')}`);
    }
  }
  return failed;
}

export interface MasteryScoreResult {
  score: number;
  grade: 'New' | 'Learning' | 'Reviewing' | 'Mastered';
  retentionEstimate: number;
}

export function calculateMasteryScore(
  progress: WordProgress | any,
  nowMs: number = Date.now()
): MasteryScoreResult {
  if (!progress || progress.reviewCount === 0) {
    return { score: 0, grade: 'New', retentionEstimate: 0 };
  }

  const lastReview = progress.lastStudy || nowMs;
  const elapsedDays = Math.max(0, (nowMs - lastReview) / CONFIG.CONSTANTS.MS_PER_DAY);
  const stability = progress.stability || 1.0;

  const factor = 9 * (1 / CONFIG.FSRS.TARGET_RETENTION - 1);
  const retention = Math.pow(1 + (factor * elapsedDays) / stability, -1);
  const safeRetention = Math.max(0, Math.min(1, retention));

  const score = Math.round(safeRetention * 100);
  let grade: 'New' | 'Learning' | 'Reviewing' | 'Mastered' = 'Learning';

  if (progress.level >= 8 && score >= 85) {
    grade = 'Mastered';
  } else if (progress.reviewCount >= 2) {
    grade = 'Reviewing';
  }

  return {
    score,
    grade,
    retentionEstimate: safeRetention,
  };
}

export class CoreEngine {
  private wordsMap: Map<string, WordData> = new Map();
  private progressMap: Map<string, WordProgress> = new Map();

  constructor(words: WordData[] = []) {
    this.setWords(words);
  }

  public setWords(words: WordData[]): void {
    this.wordsMap.clear();
    words.forEach(w => this.wordsMap.set(w.word, w));
  }

  public updateProgress(wordStr: string, progress: WordProgress): void {
    this.progressMap.set(wordStr, progress);
  }

  public getProgress(wordStr: string): WordProgress | undefined {
    return this.progressMap.get(wordStr);
  }
}

export { migrateSM2ToFSRS };
export default CoreEngine;
