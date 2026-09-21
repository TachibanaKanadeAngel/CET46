import { WORDS, setWordsArray } from '../data/vocab-store.js';
import { StudyFeature } from '../features/study.js';
import { ReviewFeature } from '../features/review.js';
import { SpellingFeature } from '../features/spelling.js';
import { miniGame } from '../features/minigame.js';
import { engineVisualizer } from '../features/engine-visualizer.js';
import { pwaWidgets } from '../widgets/pwa-widgets.js';
import { memoryCache, addWrongWord, removeWrongWord } from '../store.js';
import { db } from '../db.js';
import { getWordData, setWordData } from '../core.js';
import {
  updateStats,
  registerStudyFeature as registerStatsStudy,
} from '../utils/stats.js';
import { registerStudyFeature as registerWrongWordsStudy } from '../features/wrong-words.ts';
import { buildWordMaps } from '../utils/semantic-graph-ui.js';
import { renderList } from '../utils/vocab-list.js';
import logger from '../utils/logger.js';

// 共享懒加载模块（settings/webdav），避免各入口重复创建一套 loader
import { loadSettingsFeature, loadWebDAVFeature } from './module-loaders.js';

/**
 * 统一初始化各功能模块（唯一入口）。
 * @param {object} [options]
 * @param {() => Promise<Array>} [options.getDefaultWords] 词库兜底加载函数（由 app-init 注入，避免循环依赖）
 */
async function initializeFeatures(options = {}) {
  const { getDefaultWords } = options || {};
  logger.info(`[initializeFeatures] 开始初始化，WORDS 数量: ${WORDS?.length || 0}`);

  try {
    if (!WORDS || WORDS.length === 0) {
      if (typeof getDefaultWords === 'function') {
        logger.error('[initializeFeatures] WORDS 为空，使用 DEFAULT_WORDS 兜底');
        setWordsArray([...await getDefaultWords()]);
        buildWordMaps();
      } else {
        logger.error('[initializeFeatures] WORDS 为空');
      }
    }

    logger.info('[initializeFeatures] 注册 StudyFeature 至 stats 与 wrong-words...');
    registerStatsStudy(StudyFeature);
    registerWrongWordsStudy(StudyFeature);

    logger.info('[initializeFeatures] 设置 StudyFeature 词库...');
    StudyFeature.setWords(WORDS);
    logger.info('[initializeFeatures] 设置 ReviewFeature 词库...');
    ReviewFeature.setWords(WORDS);

    logger.info('[initializeFeatures] 加载设置...');
    const settings = await loadSettingsFeature();
    if (settings) {
      settings.setWords(WORDS);
    }

    logger.info('[initializeFeatures] 初始化 SpellingFeature...');
    SpellingFeature.init({
      get studyQueue() {
        return StudyFeature.studyQueue;
      },
      get studyIndex() {
        return StudyFeature.studyIndex;
      },
      getWordData,
      setWordData,
      addWrongWord,
      removeWrongWord,
      saveStudySession: () => StudyFeature.saveStudySession(memoryCache, db),
      updateStats,
      updateProgress: () => StudyFeature.updateProgress(),
      showStudyWord: () => StudyFeature.showStudyWord(),
    });

    logger.info('[initializeFeatures] 初始化 miniGame...');
    miniGame.init();

    logger.info('[initializeFeatures] 初始化 engineVisualizer...');
    engineVisualizer.init();
    logger.info('[initializeFeatures] 初始化 pwaWidgets...');
    pwaWidgets.init();

    logger.info('[initializeFeatures] 加载 WebDAV...');
    const webdav = await loadWebDAVFeature();
    if (webdav) {
      webdav.init({
        updateStats,
        renderList,
      });
    }

    if (settings) {
      settings.init({
        WORDS,
        updateStats,
        renderList,
      });
    }

    logger.info('[initializeFeatures] 初始化完成');
  } catch (error) {
    logger.error('[initializeFeatures] 初始化失败', error);
    throw error;
  }
}

export { initializeFeatures };
