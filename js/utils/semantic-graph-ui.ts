import { SEMANTIC_CLUSTERS, CONFUSING_PAIRS, MS_PER_DAY } from '../config.js';
import logger from './logger.js';
import { db } from '../db.js';
import { isFileProtocol } from './worker-pool.js';
import { AppState } from '../state.js';

const _wordIdMap = new Map<number | string, any>();
const _wordMap = new Map<string, any>();

interface SemanticTaskState {
  worker: Worker | null;
  cache: any;
  building: boolean;
  cancelled: boolean;
  timerId: any;
  pendingResolve: ((val: any) => void) | null;
  pendingReject: ((err: any) => void) | null;
}

const semanticTask: SemanticTaskState = {
  worker: null,
  cache: null,
  building: false,
  cancelled: false,
  timerId: null,
  pendingResolve: null,
  pendingReject: null,
};

interface SemanticDeps {
  getWORDS: (() => any[]) | null;
  getData: (() => any) | null;
  CONSTANTS: any;
}

const semanticDeps: SemanticDeps = {
  getWORDS: null,
  getData: null,
  CONSTANTS: null,
};

function buildWordMaps(): void {
  const WORDS = semanticDeps.getWORDS ? semanticDeps.getWORDS() : [];
  _wordIdMap.clear();
  _wordMap.clear();
  WORDS.forEach(w => {
    _wordIdMap.set(w.id, w);
    _wordMap.set(w.word, w);
  });
}

function initSemanticGraphWorker(): void {
  if (semanticTask.worker) return;

  if (typeof Worker === 'undefined' || isFileProtocol()) {
    logger.info('[Semantic] Worker 不可用或在 file:// 协议下，跳过 Worker');
    return;
  }

  try {
    const workerUrl = new URL('../workers/semantic-worker.js', import.meta.url);
    semanticTask.worker = new Worker(workerUrl, {
      type: 'module',
    });
  } catch (e: any) {
    logger.info('[Semantic] 创建 Semantic Worker 失败，使用降级模式:', e?.message);
    semanticTask.worker = null;
  }
}

async function buildSemanticGraphAsync(words: any[], threshold: number = 2): Promise<any> {
  if (semanticTask.cache) return semanticTask.cache;
  if (semanticTask.building) return null;

  let cachedBKTree: any = null;
  if (db.instance) {
    try {
      cachedBKTree = await db.getSerializedBKTree();
    } catch (_e) {
      logger.info('BK-Tree 缓存读取失败，将重新构建');
    }
  }

  semanticTask.building = true;
  semanticTask.cancelled = false;
  initSemanticGraphWorker();

  if (semanticTask.cancelled) {
    semanticTask.building = false;
    return Promise.resolve(null);
  }

  if (!semanticTask.worker) {
    logger.info('[Semantic] Worker 不可用，跳过语义图谱构建');
    semanticTask.building = false;
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    semanticTask.pendingResolve = resolve;
    semanticTask.pendingReject = reject;

    const worker = semanticTask.worker;
    if (!worker) {
      semanticTask.building = false;
      semanticTask.pendingResolve = null;
      semanticTask.pendingReject = null;
      resolve(null);
      return;
    }

    if (semanticTask.cancelled) {
      worker.terminate();
      semanticTask.worker = null;
      semanticTask.building = false;
      semanticTask.pendingResolve = null;
      semanticTask.pendingReject = null;
      resolve(null);
      return;
    }

    if (cachedBKTree) {
      worker.postMessage({
        words,
        threshold,
        cachedBKTree,
      });
    } else {
      worker.postMessage({
        words,
        threshold,
        loadFromDB: true,
      });
    }

    worker.onmessage = async (e: MessageEvent) => {
      if (semanticTask.cancelled) {
        semanticTask.worker?.terminate();
        semanticTask.worker = null;
        semanticTask.building = false;
        semanticTask.pendingResolve = null;
        semanticTask.pendingReject = null;
        resolve(null);
        return;
      }
      if (e.data.type === 'SAVE_TREE') {
        if (db.instance) {
          try {
            await db.saveSerializedBKTree(e.data.data);
            logger.info(`BK-Tree 已保存到 IndexedDB，单词数：${e.data.wordCount}`);
          } catch (e) {
            logger.warn('BK-Tree 保存失败:', e);
          }
        }
        return;
      }

      if (e.data.type === 'complete' || e.data.type === 'ready') {
        semanticTask.cache = e.data.results || null;

        if (semanticTask.cache && db.instance) {
          try {
            await db.save('session', { key: 'semantic_graph_cache', data: semanticTask.cache });
            logger.info('语义图谱已持久化到 IndexedDB');
          } catch (e) {
            logger.warn('语义图谱缓存保存失败:', e);
          }
        }

        semanticTask.worker?.terminate();
        semanticTask.worker = null;
        semanticTask.building = false;
        semanticTask.pendingResolve = null;
        semanticTask.pendingReject = null;

        resolve(semanticTask.cache);
      } else if (e.data.type === 'progress') {
        logger.info(`语义图谱构建进度：${Math.round(e.data.progress * 100)}%`);
      }
    };

    worker.onerror = (err: ErrorEvent) => {
      if (semanticTask.worker) {
        semanticTask.worker.terminate();
        semanticTask.worker = null;
      }
      semanticTask.building = false;
      const rejectFn = semanticTask.pendingReject;
      semanticTask.pendingResolve = null;
      semanticTask.pendingReject = null;
      if (rejectFn) {
        rejectFn(new Error('语义图谱 Worker 错误: ' + (err.message || 'unknown')));
      }
    };
  });
}

function findConfusingWords(word: string): string[] {
  const confusing: string[] = [];

  for (const pair of CONFUSING_PAIRS) {
    if (pair.includes(word)) {
      confusing.push(...pair.filter(w => w !== word));
    }
  }

  const semanticCluster = (SEMANTIC_CLUSTERS as any)[word];
  if (semanticCluster) {
    confusing.push(...semanticCluster);
  }

  if (semanticTask.cache && semanticTask.cache[word]) {
    confusing.push(...semanticTask.cache[word].map((item: any) => item.word));
  }

  return [...new Set(confusing)];
}

async function initSemanticGraphInBackground(): Promise<void> {
  if (semanticTask.cache || semanticTask.building) return;
  const WORDS = semanticDeps.getWORDS ? semanticDeps.getWORDS() : [];
  semanticTask.timerId = setTimeout(() => {
    if (!semanticTask.cancelled) {
      buildSemanticGraphAsync(WORDS, 2);
    }
  }, semanticDeps.CONSTANTS?.SEMANTIC_GRAPH_DEFER_MS || 5000);
}

function cleanupSemanticGraph(): void {
  semanticTask.cancelled = true;
  if (semanticTask.timerId) {
    clearTimeout(semanticTask.timerId);
    semanticTask.timerId = null;
  }
  if (semanticTask.worker) {
    semanticTask.worker.terminate();
    semanticTask.worker = null;
  }
  semanticTask.building = false;
  if (semanticTask.pendingResolve) {
    semanticTask.pendingResolve(null);
    semanticTask.pendingResolve = null;
    semanticTask.pendingReject = null;
  }
  semanticTask.cache = null;
}

function adjustForSemanticInterference(wordId: any, baseInterval: number): number {
  const word = _wordIdMap.get(wordId) || (semanticDeps.getWORDS ? semanticDeps.getWORDS().find(w => w.id === wordId) : null);
  if (!word) return baseInterval;

  const confusingWords = findConfusingWords(word.word);
  if (confusingWords.length === 0) return baseInterval;

  let interferenceCount = 0;
  const data = semanticDeps.getData ? semanticDeps.getData() : {};

  for (const confusingWord of confusingWords) {
    const confusingEntry = _wordMap.get(confusingWord);
    if (confusingEntry) {
      const wd = data[confusingEntry.id];
      if (wd && wd.status === 'review' && wd.nextReview > Date.now()) {
        const timeDiff = Math.abs(wd.nextReview - (Date.now() + baseInterval));
        if (timeDiff < MS_PER_DAY) {
          interferenceCount++;
        }
      }
    }
  }

  if (interferenceCount > 0) {
    const adjustmentFactor = 1 + interferenceCount * 0.3;
    AppState.set('semanticInterfered', true);
    return Math.round(baseInterval * adjustmentFactor);
  }

  AppState.set('semanticInterfered', false);
  return baseInterval;
}

function initSemanticGraphUI({ getWORDS, getData, CONSTANTS }: { getWORDS: () => any[]; getData: () => any; CONSTANTS: any }): void {
  semanticDeps.getWORDS = getWORDS;
  semanticDeps.getData = getData;
  semanticDeps.CONSTANTS = CONSTANTS;
  buildWordMaps();
}

export {
  buildWordMaps,
  initSemanticGraphWorker,
  buildSemanticGraphAsync,
  findConfusingWords,
  initSemanticGraphInBackground,
  cleanupSemanticGraph,
  adjustForSemanticInterference,
  initSemanticGraphUI,
  _wordIdMap,
  _wordMap,
};
