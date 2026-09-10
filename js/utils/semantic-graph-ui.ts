import { CONFIG, SEMANTIC_CLUSTERS, CONFUSING_PAIRS } from '../config.js';
import logger from './logger.js';
import { db } from '../db.js';
import { isFileProtocol } from './worker-pool.js';
import { AppState } from '../state.js';

let _wordIdMap = new Map<number | string, any>();
let _wordMap = new Map<string, any>();

let semanticGraphWorker: Worker | null = null;
let semanticGraphCache: any = null;
let semanticGraphBuilding = false;
let semanticGraphCancelled = false;
let semanticGraphTimerId: any = null;
let pendingResolve: ((val: any) => void) | null = null;
let pendingReject: ((err: any) => void) | null = null;

// External dependencies injected via init
let _getWORDS: (() => any[]) | null = null;
let _getData: (() => any) | null = null;
let _CONSTANTS: any = null;

function buildWordMaps(): void {
  const WORDS = _getWORDS ? _getWORDS() : [];
  _wordIdMap = new Map(WORDS.map(w => [w.id, w]));
  _wordMap = new Map(WORDS.map(w => [w.word, w]));
}

function initSemanticGraphWorker(): void {
  if (semanticGraphWorker) return;

  if (typeof Worker === 'undefined' || isFileProtocol()) {
    logger.info('[Semantic] Worker 不可用或在 file:// 协议下，跳过 Worker');
    return;
  }

  try {
    const workerUrl = new URL('../workers/semantic-worker.js', import.meta.url);
    semanticGraphWorker = new Worker(workerUrl, {
      type: 'module',
    });
  } catch (e: any) {
    logger.info('[Semantic] 创建 Semantic Worker 失败，使用降级模式:', e?.message);
    semanticGraphWorker = null;
  }
}

async function buildSemanticGraphAsync(words: any[], threshold: number = 2): Promise<any> {
  if (semanticGraphCache) return semanticGraphCache;
  if (semanticGraphBuilding) return null;

  let cachedBKTree: any = null;
  if (db.instance) {
    try {
      cachedBKTree = await db.getSerializedBKTree();
    } catch (_e) {
      logger.info('BK-Tree 缓存读取失败，将重新构建');
    }
  }

  semanticGraphBuilding = true;
  semanticGraphCancelled = false;
  initSemanticGraphWorker();

  if (semanticGraphCancelled) {
    semanticGraphBuilding = false;
    return Promise.resolve(null);
  }

  if (!semanticGraphWorker) {
    logger.info('[Semantic] Worker 不可用，跳过语义图谱构建');
    semanticGraphBuilding = false;
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;

    const worker = semanticGraphWorker;
    if (!worker) {
      semanticGraphBuilding = false;
      pendingResolve = null;
      pendingReject = null;
      resolve(null);
      return;
    }

    if (semanticGraphCancelled) {
      worker.terminate();
      semanticGraphWorker = null;
      semanticGraphBuilding = false;
      pendingResolve = null;
      pendingReject = null;
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
      if (semanticGraphCancelled) {
        semanticGraphWorker?.terminate();
        semanticGraphWorker = null;
        semanticGraphBuilding = false;
        pendingResolve = null;
        pendingReject = null;
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
        semanticGraphCache = e.data.results || null;

        if (semanticGraphCache && db.instance) {
          try {
            await db.save('session', { key: 'semantic_graph_cache', data: semanticGraphCache });
            logger.info('语义图谱已持久化到 IndexedDB');
          } catch (e) {
            logger.warn('语义图谱缓存保存失败:', e);
          }
        }

        semanticGraphWorker?.terminate();
        semanticGraphWorker = null;
        semanticGraphBuilding = false;
        pendingResolve = null;
        pendingReject = null;

        resolve(semanticGraphCache);
      } else if (e.data.type === 'progress') {
        logger.info(`语义图谱构建进度：${Math.round(e.data.progress * 100)}%`);
      }
    };

    worker.onerror = (err: ErrorEvent) => {
      if (semanticGraphWorker) {
        semanticGraphWorker.terminate();
        semanticGraphWorker = null;
      }
      semanticGraphBuilding = false;
      const rejectFn = pendingReject;
      pendingResolve = null;
      pendingReject = null;
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

  if (semanticGraphCache && semanticGraphCache[word]) {
    confusing.push(...semanticGraphCache[word].map((item: any) => item.word));
  }

  return [...new Set(confusing)];
}

async function initSemanticGraphInBackground(): Promise<void> {
  if (semanticGraphCache || semanticGraphBuilding) return;
  const WORDS = _getWORDS ? _getWORDS() : [];
  semanticGraphTimerId = setTimeout(() => {
    if (!semanticGraphCancelled) {
      buildSemanticGraphAsync(WORDS, 2);
    }
  }, _CONSTANTS?.SEMANTIC_GRAPH_DEFER_MS || 5000);
}

function cleanupSemanticGraph(): void {
  semanticGraphCancelled = true;
  if (semanticGraphTimerId) {
    clearTimeout(semanticGraphTimerId);
    semanticGraphTimerId = null;
  }
  if (semanticGraphWorker) {
    semanticGraphWorker.terminate();
    semanticGraphWorker = null;
  }
  semanticGraphBuilding = false;
  if (pendingResolve) {
    pendingResolve(null);
    pendingResolve = null;
    pendingReject = null;
  }
  semanticGraphCache = null;
}

function adjustForSemanticInterference(wordId: any, baseInterval: number): number {
  const word = _wordIdMap.get(wordId) || (_getWORDS ? _getWORDS().find(w => w.id === wordId) : null);
  if (!word) return baseInterval;

  const confusingWords = findConfusingWords(word.word);
  if (confusingWords.length === 0) return baseInterval;

  let interferenceCount = 0;
  const data = _getData ? _getData() : {};

  for (const confusingWord of confusingWords) {
    const confusingEntry = _wordMap.get(confusingWord);
    if (confusingEntry) {
      const wd = data[confusingEntry.id];
      if (wd && wd.status === 'review' && wd.nextReview > Date.now()) {
        const timeDiff = Math.abs(wd.nextReview - (Date.now() + baseInterval));
        if (timeDiff < (CONFIG.CONSTANTS?.MS_PER_DAY || 86400000)) {
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
  _getWORDS = getWORDS;
  _getData = getData;
  _CONSTANTS = CONSTANTS;
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
