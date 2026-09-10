import { CONFIG } from '../config.js';
import { performanceMonitor } from '../utils/performance-monitor.js';
import { particleSystem } from '../utils/particle-system.js';
import logger from '../utils/logger.js';
import { db } from '../db.js';
import { WORDS, setWordsArray } from '../data/vocab-store.js';
import { buildWordMaps } from '../utils/semantic-graph-ui.js';
import { getFilteredWordsCopy, renderList } from '../utils/vocab-list.js';
import { StudyFeature } from '../features/study.js';
import { ReviewFeature } from '../features/review.js';
import { UI } from '../ui.js';

// 注册调试 API 到 window（仅 CONFIG.DEBUG 时生效）
export function setupDebugApi({ getDefaultWords, getDefaultWordsCacheLength }) {
  if (!CONFIG.DEBUG) return;

  window.WORDS = WORDS;
  window.filteredWords = getFilteredWordsCopy();

  window.resetVocabulary = async () => {
    logger.info('[Debug] 正在强制重置词库...');
    try {
      await db.clear('words');
      logger.info('[Debug] 已清空 IndexedDB 词库');

      const dw = await getDefaultWords();
      await db.bulkSave('words', dw);
      setWordsArray([...dw]);
      buildWordMaps();

      StudyFeature.setWords(WORDS);
      ReviewFeature.setWords(WORDS);
      renderList();

      UI.toast(`词库已重置，当前共 ${WORDS.length} 个单词`, 'success');
    } catch (e) {
      logger.error('[Debug] 重置词库失败:', e);
      UI.toast('重置词库失败：' + e.message, 'error');
    }
  };

  window.perfMonitor = performanceMonitor;
  window.showPerfPanel = () => performanceMonitor.showPerformancePanel();
  window.particleSystem = particleSystem;

  window.checkVocabulary = () => {
    logger.info('[Debug] ========== 词库状态检查 ==========');
    logger.info('[Debug] WORDS 长度:', WORDS?.length || 0);
    logger.info('[Debug] DEFAULT_WORDS 长度:', getDefaultWordsCacheLength());
    logger.info('[Debug] filteredWords 长度:', getFilteredWordsCopy()?.length || 0);
    logger.info('[Debug] StudyFeature.WORDS 长度:', StudyFeature?.WORDS?.length || 0);
    logger.info('[Debug] ====================================');
    return {
      wordsLength: WORDS?.length || 0,
      defaultWordsLength: getDefaultWordsCacheLength(),
      filteredWordsLength: getFilteredWordsCopy()?.length || 0,
      studyFeatureWordsLength: StudyFeature?.WORDS?.length || 0,
    };
  };

  logger.info('[Debug] 调试功能已加载：');
  logger.info('  - resetVocabulary() : 强制重置词库');
  logger.info('  - checkVocabulary() : 检查词库状态');
}
