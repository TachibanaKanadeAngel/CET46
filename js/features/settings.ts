import { SCHEMA_VERSION, collectReviewLogs, migrateData, resetProgress } from '../core.js';
import { evaluateLogLoss, getFSRSWeights, DEFAULT_FSRS_W, setFSRSWeights } from '../fsrs.js';
import { memoryCache } from '../store.js';
import { db } from '../db.js';
import { CONFIG } from '../config.js';
import { shuffle } from '../utils.js';
import { UI } from '../ui.js';
import { setWordsArray } from '../data/vocab-store.js';
import { buildWordMaps } from '../utils/semantic-graph-ui.js';
import FSRSTrainerWorker from '../workers/fsrs-trainer-worker.js?worker&inline';
import logger from '../utils/logger.js';

async function bulkImportStore(db: any, storeName: string, entries: any[], keyMapper: (e: any) => any = e => e): Promise<number> {
  if (!entries || entries.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < entries.length; i += 500) {
    const chunk = entries.slice(i, i + 500);
    await new Promise<void>((resolve, reject) => {
      const tx = db.instance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(`批量导入${storeName}失败`));
      tx.onabort = () => reject(new Error(`批量导入${storeName}事务中止: ` + (tx.error?.message || 'unknown')));
      for (const entry of chunk) {
        store.put(keyMapper(entry));
      }
    });
    count += chunk.length;
    await new Promise(r => {
      setTimeout(r, 10);
    });
  }
  return count;
}

let getWordsFn: () => any[] = () => [];
let updateStats: any = null;
let renderList: any = null;

function init(config: any): void {
  if (typeof config.WORDS === 'function') {
    getWordsFn = config.WORDS;
  } else {
    getWordsFn = () => config.WORDS;
  }
  updateStats = config.updateStats;
  renderList = config.renderList;

  initRetentionSlider();

  // FSRS 在线自适应微调：数据充足时在空闲阶段自动训练一次（每会话一次、7 天冷却）
  scheduleAutoFSRSTuning();
}

function initRetentionSlider(): void {
  const slider = document.getElementById('retention-slider') as HTMLInputElement | null;
  const valueDisplay = document.getElementById('target-retention-value');

  if (!slider || !valueDisplay) return;

  const savedRetention = localStorage.getItem(CONFIG.STORAGE_KEYS.TARGET_RETENTION);
  if (savedRetention) {
    const retention = parseFloat(savedRetention);
    slider.value = Math.round(retention * 100) as any;
    valueDisplay.textContent = `${Math.round(retention * 100)}%`;
    CONFIG.FSRS.TARGET_RETENTION = retention;
  }

  let _retentionTimer: any = null;
  slider.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    const value = target ? parseInt(target.value, 10) : 90;
    const retention = value / 100;
    valueDisplay.textContent = `${value}%`;
    if (_retentionTimer) clearTimeout(_retentionTimer);
    _retentionTimer = setTimeout(() => {
      CONFIG.FSRS.TARGET_RETENTION = retention;
      localStorage.setItem(CONFIG.STORAGE_KEYS.TARGET_RETENTION, retention.toString());
      logger.info(`🎯 目标留存率已更新为 ${retention * 100}%`);
    }, 100);
  });
}

function setWords(words: any): void {
  if (typeof words === 'function') {
    getWordsFn = words;
  } else {
    getWordsFn = () => words;
  }
}

async function handleResetProgress(): Promise<void> {
  const confirmed = await UI.confirm(
    '⚠️ 重置确认',
    '确定要重置所有学习进度吗？此操作将清空所有记忆数据与错题，不可恢复！'
  );
  if (confirmed) {
    const failed = await resetProgress();
    // 仅删除 cet46_ 前缀的键，避免影响其他应用
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cet46_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (failed.length > 0) {
      UI.toast(`⚠️ 重置部分失败：${failed.join(', ')} 未清空`, 'warning');
    } else {
      UI.toast('✅ 学习进度已彻底重置！', 'success');
    }
    location.reload();
  }
}

async function exportData(): Promise<void> {
  const getWrongWords = () =>
    memoryCache.wrongWords.toObject ? memoryCache.wrongWords.toObject() : memoryCache.wrongWords;
  const getHeatmap = () =>
    memoryCache.heatmap.toObject ? memoryCache.heatmap.toObject() : memoryCache.heatmap;
  const getData = () =>
    memoryCache.progress.toObject ? memoryCache.progress.toObject() : memoryCache.progress;
  let WORDS = getWordsFn();

  // 如果 getWordsFn 返回空，尝试从全局获取
  if (!WORDS || WORDS.length === 0) {
    logger.warn('[Settings] exportData 检测到词库为空，正在尝试从全局重新抓取...');
    WORDS = (typeof window !== 'undefined' ? (window as any).WORDS : []) || [];
  }

  const data = {
    version: SCHEMA_VERSION,
    schemaVersion: 2,
    exportDate: new Date().toISOString(),
    words: WORDS,
    progress: getData(),
    wrongWords: getWrongWords(),
    heatmap: getHeatmap(),
    fsrsWeights: getFSRSWeights(),
    wordCount: WORDS.length,
    deviceInfo: navigator.userAgent,
    deletedIds: Array.from(memoryCache.deletedIds || []),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cet46_backup_${new Date().toISOString().split('T')[0]}_v${SCHEMA_VERSION}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importData(event: any): Promise<void> {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.json')) {
    UI.toast('请选择 .json 格式的备份文件', 'error');
    return;
  }

  const MAX_IMPORT_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_IMPORT_SIZE) {
    UI.toast('文件大小超过 50MB 限制，请选择更小的备份文件', 'error');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e: ProgressEvent<FileReader>) {
    try {
      const rawText = String(e.target?.result || '');
      const raw = JSON.parse(rawText);
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error('无效的备份文件结构');
      }

      // 防止原型污染 - 递归过滤（包括数组元素）
      function sanitizeObject(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        // 数组也要递归，防止 [{__proto__:...}] 绕过过滤
        if (Array.isArray(obj)) return obj.map(sanitizeObject);
        const result: Record<string, any> = Object.create(null);
        for (const key of Object.keys(obj)) {
          if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
            result[key] = sanitizeObject(obj[key]);
          }
        }
        return result;
      }

      const data = sanitizeObject(raw);

      const migratedData = migrateData(data);

      if (
        migratedData.words &&
        Array.isArray(migratedData.words) &&
        migratedData.words.length > 0
      ) {
        const originalWords = getWordsFn();
        let backupWords = null;
        try {
          if (db.instance) {
            // 先备份旧数据，导入失败时恢复
            backupWords = await db.getAll('words').catch(() => null);
            await db.clear('words');
            await bulkImportStore(db, 'words', migratedData.words);
          }
          // 数据库写入成功后再修改内存
          setWordsArray(migratedData.words);
          buildWordMaps();
        } catch (dbErr) {
          // 数据库写入失败，恢复 DB 备份并回滚内存
          if (db.instance && backupWords && backupWords.length > 0) {
            await db.clear('words').catch(() => {});
            await bulkImportStore(db, 'words', backupWords).catch(() => {});
          }
          setWordsArray(originalWords);
          buildWordMaps();
          throw dbErr;
        }
      }

      if (migratedData.progress) {
        let backupProgress = null;
        try {
          if (db.instance) {
            backupProgress = await db.getAll('progress').catch(() => null);
            await db.clear('progress');
            await bulkImportStore(
              db,
              'progress',
              Object.entries(migratedData.progress),
              // 修复：{ ...wd, id } 确保 id 不被 wd.id 覆盖；验证 NaN
              ([id, wd]) => {
                const numId = parseInt(id, 10);
                return { ...wd, id: Number.isNaN(numId) ? id : numId };
              }
            );
          }
          if (memoryCache.progress && typeof memoryCache.progress.fromObject === 'function') {
            memoryCache.progress.fromObject(migratedData.progress);
          }
        } catch (dbErr) {
          if (db.instance && backupProgress && backupProgress.length > 0) {
            await db.clear('progress').catch(() => {});
            await bulkImportStore(db, 'progress', backupProgress).catch(() => {});
          }
          throw dbErr;
        }
      }
      if (migratedData.wrongWords) {
        let backupWrongWords = null;
        try {
          if (db.instance) {
            backupWrongWords = await db.getAll('wrongWords').catch(() => null);
            await db.clear('wrongWords');
            await bulkImportStore(
              db,
              'wrongWords',
              Object.entries(migratedData.wrongWords),
              ([id, wrongData]) => {
                const numId = parseInt(id, 10);
                return { id: Number.isNaN(numId) ? id : numId, data: wrongData };
              }
            );
          }
          if (memoryCache.wrongWords && typeof memoryCache.wrongWords.fromObject === 'function') {
            memoryCache.wrongWords.fromObject(migratedData.wrongWords);
          }
        } catch (dbErr) {
          if (db.instance && backupWrongWords && backupWrongWords.length > 0) {
            await db.clear('wrongWords').catch(() => {});
            await bulkImportStore(db, 'wrongWords', backupWrongWords).catch(() => {});
          }
          throw dbErr;
        }
      }
      if (migratedData.heatmap) {
        let backupHeatmap = null;
        try {
          if (db.instance) {
            backupHeatmap = await db.getAll('heatmap').catch(() => null);
            await db.clear('heatmap');
            await bulkImportStore(
              db,
              'heatmap',
              Object.entries(migratedData.heatmap),
              ([date, count]) => ({ date, count })
            );
          }
          if (memoryCache.heatmap && typeof memoryCache.heatmap.fromObject === 'function') {
            memoryCache.heatmap.fromObject(migratedData.heatmap);
          }
        } catch (dbErr) {
          if (db.instance && backupHeatmap && backupHeatmap.length > 0) {
            await db.clear('heatmap').catch(() => {});
            await bulkImportStore(db, 'heatmap', backupHeatmap).catch(() => {});
          }
          throw dbErr;
        }
      }

      if (migratedData.deletedIds) {
        memoryCache.deletedIds = new Set(migratedData.deletedIds);
      }

      if (migratedData.fsrsWeights) {
        setFSRSWeights(migratedData.fsrsWeights);
      }

      if (updateStats) updateStats();
      if (renderList) renderList();
      UI.toast(`数据导入成功！(版本: ${migratedData.version})`, 'success');
    } catch (err: any) {
      logger.error('导入失败:', err);
      UI.toast('导入失败：' + (err.message || '文件格式不正确'), 'error');
    }
  };
  reader.onerror = () => {
    UI.toast('文件读取失败', 'error');
  };
  reader.readAsText(file);
  event.target.value = '';
}

// 全局变量存储当前训练控制器，用于取消训练
let currentTrainingController: {
  worker: any;
  timeoutId: any;
  cancelled: boolean;
  cancel: () => void;
} | null = null;

const setFitScoreText = (text: string) => {
  const el = document.getElementById('fsrs-fit-score');
  if (el) el.textContent = text;
};

// ---------- FSRS 在线自适应微调（Auto-Tune） ----------
// 在用户闲置时基于真实复习数据自动训练 17 维权重，实现"千人千面"
const AUTO_TUNE = {
  enabled: true,
  minReviewLogs: 100, // 至少 100 条有效复习记录才自动触发
  cooldownMs: 7 * 24 * 60 * 60 * 1000, // 每 7 天最多自动训练一次
  cooldownKey: 'cet46_fsrs_autoTuneLastRun',
  disableKey: 'cet46_fsrs_autoTuneDisabled',
};

let autoTunedThisSession = false;

/** 仅在补充最小样本/冷却/开关通过后，于页面空闲时跑一次自动微调；每会话最多一次 */
function scheduleAutoFSRSTuning() {
  if (!AUTO_TUNE.enabled || autoTunedThisSession) return;
  try {
    if (localStorage.getItem(AUTO_TUNE.disableKey) === '1') return;
  } catch (_) { /* localStorage 不可用时按启用处理 */ }

  // 冷却检查：避免每次打开都触发
  try {
    const lastRun = Number(localStorage.getItem(AUTO_TUNE.cooldownKey) || 0);
    if (Date.now() - lastRun < AUTO_TUNE.cooldownMs) return;
  } catch (_) { /* 忽略冷却检查异常 */ }

  // 数据门槛：样本不足则无需训练
  let reviewCount = 0;
  try {
    reviewCount = collectReviewLogs().length;
  } catch (_) {
    reviewCount = 0;
  }
  if (reviewCount < AUTO_TUNE.minReviewLogs) return;

  const run = () => {
    autoTunedThisSession = true;
    try {
      localStorage.setItem(AUTO_TUNE.cooldownKey, String(Date.now()));
    } catch (_) { /* ignore */ }
    trainFSRSWeights(true);
  };

  // 优先使用浏览器空闲调度，避免与用户交互抢线程
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 30000 });
  } else {
    setTimeout(run, 5000);
  }
}

// 供外部读取/测试的开关：返回当前是否启用自动微调
function isAutoFSRSTuningEnabled() {
  if (!AUTO_TUNE.enabled) return false;
  try {
    return localStorage.getItem(AUTO_TUNE.disableKey) !== '1';
  } catch (_) {
    return true;
  }
}

function trainFSRSWeights(auto = false) {
  const reviewLogs = collectReviewLogs();
  const minSamples = auto ? AUTO_TUNE.minReviewLogs : 50;
  if (reviewLogs.length < minSamples) {
    if (auto) {
      logger.info(`[Auto-Tune] 有效复习记录不足（${reviewLogs.length}/${minSamples}），跳过自动微调`);
      return;
    }
    UI.toast(`样本量不足：需要至少 ${minSamples} 条有效复习记录`, 'warning');
    return;
  }

  // 如果已有训练在进行，先取消
  if (currentTrainingController) {
    currentTrainingController.cancel();
  }

  setFitScoreText('启动 Worker 训练中...');

  shuffle(reviewLogs);
  const splitIdx = Math.floor(reviewLogs.length * 0.8);
  const trainSet = reviewLogs.slice(0, splitIdx);
  const testSet = reviewLogs.slice(splitIdx);

  const worker = new FSRSTrainerWorker();

  // 创建训练控制器
  const controller = {
    worker: worker as any,
    timeoutId: null as any,
    cancelled: false,
    cancel() {
      this.cancelled = true;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      currentTrainingController = null;
    },
  };
  currentTrainingController = controller;

  // 5分钟超时看门狗 - 防止训练死循环
  currentTrainingController.timeoutId = setTimeout(
    () => {
      if (currentTrainingController && !currentTrainingController.cancelled) {
        currentTrainingController.cancel();
        setFitScoreText('训练超时');
        UI.toast('训练超时，已强制终止。请检查数据量或稍后重试。', 'error');
      }
    },
    5 * 60 * 1000
  );

  const initialLogLoss = evaluateLogLoss(testSet, DEFAULT_FSRS_W);

  worker.onmessage = function (e) {
    // 如果已取消，忽略后续消息
    if (!currentTrainingController || currentTrainingController.cancelled) return;

    const { type, message, iteration, maxIterations, loss, result, error } = e.data;

    if (type === 'progress') {
      setFitScoreText(`训练进度：${iteration}/${maxIterations} (Loss: ${loss.toFixed(4)})`);
    } else if (type === 'info') {
      logger.info(message);
    } else if (type === 'complete') {
      // 清理超时定时器
      if (currentTrainingController.timeoutId) {
        clearTimeout(currentTrainingController.timeoutId);
      }

      const newLogLoss = evaluateLogLoss(testSet, result.weights);

      if (newLogLoss < initialLogLoss) {
        setFSRSWeights(result.weights);
        if (auto) {
          logger.info(`[Auto-Tune] 自动微调成功，已应用新权重。Log-Loss: ${newLogLoss.toFixed(4)} ↓`);
          setFitScoreText(`自动微调成功 (Log-Loss ↓ ${newLogLoss.toFixed(4)})`);
        } else {
          setFitScoreText(`Log-Loss: ${newLogLoss.toFixed(4)} (↓)`);
          UI.toast(`模型训练成功！Log-Loss: ${newLogLoss.toFixed(4)}`, 'success');
        }
      } else {
        setFitScoreText(`Log-Loss: ${initialLogLoss.toFixed(4)}`);
        if (!auto) UI.toast('模型过拟合预警，已回退至原权重', 'warning');
      }

      worker.terminate();
      currentTrainingController = null;
    } else if (type === 'error') {
      logger.error('Worker 错误:', error);
      if (!auto) {
        UI.toast('训练失败：' + error, 'error');
        setFitScoreText('训练失败');
      }

      // 清理超时定时器
      if (currentTrainingController && currentTrainingController.timeoutId) {
        clearTimeout(currentTrainingController.timeoutId);
      }

      worker.terminate();
      currentTrainingController = null;
    }
  };

  worker.onerror = function (error) {
    logger.error('Worker 错误:', error);
    if (!auto) {
      UI.toast('训练失败：' + error.message, 'error');
      setFitScoreText('训练失败');
    }

    // 清理超时定时器
    if (currentTrainingController && currentTrainingController.timeoutId) {
      clearTimeout(currentTrainingController.timeoutId);
    }

    worker.terminate();
    currentTrainingController = null;
  };

  worker.postMessage({
    logs: trainSet,
    initialWeights: getFSRSWeights(),
  });
}

// 取消训练函数 - 供外部调用
function cancelFSRSTraining() {
  if (currentTrainingController) {
    currentTrainingController.cancel();
    setFitScoreText('训练已取消');
    UI.toast('用户取消了训练', 'info');
    return true;
  }
  return false;
}

function resetFSRSWeights() {
  setFSRSWeights(DEFAULT_FSRS_W);
  setFitScoreText('已恢复默认');
  UI.toast('FSRS 权重已恢复为默认值', 'success');
}

export const SettingsFeature = {
  init,
  setWords,
  resetProgress: handleResetProgress,
  exportData,
  importData,
  trainFSRSWeights,
  cancelFSRSTraining,
  resetFSRSWeights,
  scheduleAutoFSRSTuning,
  isAutoFSRSTuningEnabled,
};
