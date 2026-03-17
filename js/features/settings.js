import { SCHEMA_VERSION, db, memoryCache, actionStack, FSRS_W, DEFAULT_FSRS_W, saveFSRSWeights, collectReviewLogs, shuffle, migrateData } from '../core.js';
import { evaluateLogLoss } from '../fsrs.js';
import { CONFIG } from '../config.js';
import { UI } from '../ui.js';

let WORDS = [];
let updateStats = null;
let renderList = null;

function init(config) {
  WORDS = config.WORDS;
  updateStats = config.updateStats;
  renderList = config.renderList;
  
  initRetentionSlider();
}

function initRetentionSlider() {
  const slider = document.getElementById('retention-slider');
  const valueDisplay = document.getElementById('retention-value');
  
  if (!slider || !valueDisplay) return;
  
  const savedRetention = localStorage.getItem('cet46_target_retention');
  if (savedRetention) {
    const retention = parseFloat(savedRetention);
    slider.value = Math.round(retention * 100);
    valueDisplay.textContent = `${Math.round(retention * 100)}%`;
  CONFIG.FSRS.TARGET_RETENTION = retention;
  }
  
  slider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    const retention = value / 100;
    valueDisplay.textContent = `${value}%`;
    CONFIG.FSRS.TARGET_RETENTION = retention;
    localStorage.setItem('cet46_target_retention', retention.toString());
    
    console.log(`🎯 目标留存率已更新为 ${retention * 100}%`);
  });
}

function setWords(words) {
  WORDS = words;
}

async function resetProgress() {
  const confirmed = await UI.confirm('⚠️ 重置确认', '确定要重置所有学习进度吗？此操作将清空所有记忆数据与错题，不可恢复！');
  if (confirmed) {
    if (db.instance) {
      await db.clear('progress');
      await db.clear('wrongWords');
      await db.clear('heatmap');
      await db.clear('session');
      await db.clear('actionStack');
    }

    memoryCache.progress = {};
    memoryCache.wrongWords = {};
    memoryCache.heatmap = {};
    memoryCache.session = null;
    memoryCache.deletedIds = new Set();
    actionStack.length = 0;

    UI.toast('✅ 学习进度已彻底重置！', 'success');
    location.reload();
  }
}

async function exportData() {
  const getWordData = (id) => memoryCache.progress[id] || { ef: 2.5, status: 'new', level: 0, reviewCount: 0 };
  const getWrongWords = () => memoryCache.wrongWords;
  const getHeatmap = () => memoryCache.heatmap;
  const getData = () => memoryCache.progress;

  const data = {
    version: SCHEMA_VERSION,
    schemaVersion: 2,
    exportDate: new Date().toISOString(),
    words: WORDS,
    progress: getData(),
    wrongWords: getWrongWords(),
    heatmap: getHeatmap(),
    fsrsWeights: FSRS_W,
    wordCount: WORDS.length,
    deviceInfo: navigator.userAgent,
    deletedIds: Array.from(memoryCache.deletedIds || [])
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cet46_backup_${new Date().toISOString().split('T')[0]}_v${SCHEMA_VERSION}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      let data = JSON.parse(e.target.result);

      const migratedData = migrateData(data);

      if (migratedData.words && Array.isArray(migratedData.words) && migratedData.words.length > 0) {
        WORDS.length = 0;
        WORDS.push(...migratedData.words);
        if (db.instance) {
          await db.clear('words');
          for (const w of migratedData.words) {
            await db.save('words', w);
          }
        }
      }

      if (migratedData.progress) {
        memoryCache.progress = migratedData.progress;
        if (db.instance) {
          await db.clear('progress');
          for (const [id, wd] of Object.entries(migratedData.progress)) {
            await db.save('progress', { id: parseInt(id), ...wd });
          }
        }
      }
      if (migratedData.wrongWords) {
        memoryCache.wrongWords = migratedData.wrongWords;
        if (db.instance) {
          await db.clear('wrongWords');
          for (const [id, wrongData] of Object.entries(migratedData.wrongWords)) {
            await db.save('wrongWords', { id: parseInt(id), data: wrongData });
          }
        }
      }
      if (migratedData.heatmap) {
        memoryCache.heatmap = migratedData.heatmap;
        if (db.instance) {
          await db.clear('heatmap');
          for (const [date, count] of Object.entries(migratedData.heatmap)) {
            await db.save('heatmap', { date, count });
          }
        }
      }

      if (migratedData.deletedIds) {
        memoryCache.deletedIds = new Set(migratedData.deletedIds);
      }

      if (migratedData.fsrsWeights) {
        FSRS_W.length = 0;
        FSRS_W.push(...migratedData.fsrsWeights);
        saveFSRSWeights();
      }

      updateStats();
      renderList();
      UI.toast(`✅ 数据导入成功！(版本: ${migratedData.version})`, 'success');
    } catch (err) {
      console.error('导入失败:', err);
      UI.toast('❌ 导入失败：文件格式不正确', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function trainFSRSWeights() {
  const reviewLogs = collectReviewLogs();
  if (reviewLogs.length < 50) {
    UI.toast('样本量不足：需要至少 50 条有效复习记录', 'warning');
    return;
  }

  document.getElementById('fsrs-fit-score').textContent = '启动 Worker 训练中...';

  shuffle(reviewLogs);
  const splitIdx = Math.floor(reviewLogs.length * 0.8);
  const trainSet = reviewLogs.slice(0, splitIdx);
  const testSet = reviewLogs.slice(splitIdx);

  const worker = new Worker('js/workers/fsrs-trainer-worker.js');
  
  const initialLogLoss = evaluateLogLoss(testSet, DEFAULT_FSRS_W);
  
  worker.onmessage = function(e) {
    const { type, message, iteration, maxIterations, loss, bestLoss, result, error } = e.data;
    
    if (type === 'progress') {
      document.getElementById('fsrs-fit-score').textContent = 
        `训练进度：${iteration}/${maxIterations} (Loss: ${loss.toFixed(4)})`;
    } else if (type === 'info') {
      console.log(message);
    } else if (type === 'complete') {
      const newLogLoss = evaluateLogLoss(testSet, result.weights);

      if (newLogLoss < initialLogLoss) {
        FSRS_W.length = 0;
        FSRS_W.push(...result.weights);
        saveFSRSWeights();
        document.getElementById('fsrs-fit-score').textContent = `Log-Loss: ${newLogLoss.toFixed(4)} (↓)`;
        UI.toast(`模型训练成功！Log-Loss: ${newLogLoss.toFixed(4)}`, 'success');
      } else {
        document.getElementById('fsrs-fit-score').textContent = `Log-Loss: ${initialLogLoss.toFixed(4)}`;
        UI.toast('模型过拟合预警，已回退至原权重', 'warning');
      }
      
      worker.terminate();
    } else if (type === 'error') {
      console.error('Worker 错误:', error);
      UI.toast('训练失败：' + error, 'error');
      document.getElementById('fsrs-fit-score').textContent = '训练失败';
      worker.terminate();
    }
  };
  
  worker.onerror = function(error) {
    console.error('Worker 错误:', error);
    UI.toast('训练失败：' + error.message, 'error');
    document.getElementById('fsrs-fit-score').textContent = '训练失败';
    worker.terminate();
  };
  
  worker.postMessage({
    logs: trainSet,
    initialWeights: FSRS_W
  });
}

function resetFSRSWeights() {
  FSRS_W.length = 0;
  FSRS_W.push(...DEFAULT_FSRS_W);
  localStorage.removeItem('cet46_fsrs_weights');
  document.getElementById('fsrs-fit-score').textContent = '已恢复默认';
  UI.toast('FSRS 权重已恢复为默认值', 'success');
}

export const SettingsFeature = {
  init,
  setWords,
  resetProgress,
  exportData,
  importData,
  trainFSRSWeights,
  resetFSRSWeights
};
