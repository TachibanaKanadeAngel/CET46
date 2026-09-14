// 46英语小程序配置
// 从主项目 js/config.js 中提取的 FSRS 和小程序所需配置

const CONFIG = {
  VERSION: '2.0.2',
  SCHEMA_VERSION: '1.0',

  FSRS: {
    DEFAULT_EF: 2.5,
    MIN_EF: 1.3,
    MAX_EF: 3.0,
    TARGET_RETENTION: 0.9,
    DEFAULT_W: [
      0.4025, 1.4612, 3.3458, 15.6941, 5.3611, 0.9971, 0.8807, 0.0424, 1.4946, 0.144, 0.9995,
      2.2107, 0.0578, 0.3267, 1.2691, 0.2314, 2.0583,
    ],
  },

  CONSTANTS: {
    MS_PER_DAY: 24 * 60 * 60 * 1000,
    DEFAULT_STUDY_LIMIT: 20,
    QUICK_REVIEW_LIMIT: 50,
    LEVEL_CAP: 10,
    LEVEL_MASTERED: 10,
    MAX_REVIEW_INTERVAL_MS: 365 * 24 * 60 * 60 * 1000,
  },

  RETENTION_THRESHOLDS: {
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50,
  },

  GOAL: {
    // 每日学习目标（词）：学习+复习合计计入今日进度
    DEFAULT_DAILY: 20,
    MAX_DAILY: 200,
  },
};

const WORD_STATUS = Object.freeze({
  NEW: 'new',
  REVIEW: 'review',
  MASTERED: 'mastered',
});

const STUDY_MODE = Object.freeze({
  CARD: 'card',
  CHOICE: 'choice',
  LISTEN: 'listen',
});

const FSRS_RATING = Object.freeze({
  AGAIN: 'again',
  HARD: 'hard',
  GOOD: 'good',
  EASY: 'easy',
});

const VOCAB_LEVELS = Object.freeze({
  CET4: 'CET4',
  CET6: 'CET6',
  CET4_HIGH: 'CET4_HIGH',
  CET6_HIGH: 'CET6_HIGH',
  KAOYAN: 'KAOYAN',
});

module.exports = {
  CONFIG,
  WORD_STATUS,
  STUDY_MODE,
  FSRS_RATING,
  VOCAB_LEVELS,
};

