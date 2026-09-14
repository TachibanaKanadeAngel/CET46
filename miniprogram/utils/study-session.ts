// 46英语小程序 - 学习会话持久化（断点续学）
// 记录当前学习队列、进度，退出学习页后可接续上次未学完的单词
const { storage, STORAGE_KEYS } = require('./storage');
const logger = require('./logger');

const MAX_QUEUE = 200;

/**
 * 保存学习会话
 * @param {object} session { level, queueIds, currentIndex, todayCount, totalCount }
 */
function saveSession(session) {
  if (!session || !session.level) return false;
  const queueIds = (Array.isArray(session.queueIds) ? session.queueIds : [])
    .slice(0, MAX_QUEUE)
    .map(id => String(id));
  if (queueIds.length === 0) return false;
  const payload = {
    level: session.level,
    queueIds,
    currentIndex: Math.max(0, Number(session.currentIndex) || 0),
    todayCount: Math.max(0, Number(session.todayCount) || 0),
    totalCount: Math.max(1, Number(session.totalCount) || queueIds.length),
    updatedAt: Date.now(),
  };
  const levelKey = `${STORAGE_KEYS.SESSION}_${session.level}`;
  storage.set(levelKey, payload);
  const ok = storage.set(STORAGE_KEYS.SESSION, payload);
  if (!ok) logger.warn('[study-session] save failed');
  return ok;
}

/**
 * 读取指定词库等级的学习会话
 * @param {string} level 'CET4' | 'CET6' | 'CET4_HIGH'
 * @returns {object|null}
 */
function loadSession(level) {
  if (!level) return null;
  const levelKey = `${STORAGE_KEYS.SESSION}_${level}`;
  let raw = storage.get(levelKey);
  if (!raw || typeof raw !== 'object' || raw.level !== level) {
    raw = storage.get(STORAGE_KEYS.SESSION);
  }
  if (!raw || typeof raw !== 'object' || raw.level !== level) return null;
  if (!Array.isArray(raw.queueIds) || raw.queueIds.length === 0) return null;
  const queueIds = raw.queueIds.map(String);
  const currentIndex = Math.max(0, Number(raw.currentIndex) || 0);
  // 已全部学完则视为无有效会话
  if (currentIndex >= queueIds.length) return null;
  return {
    level,
    queueIds,
    currentIndex,
    todayCount: Math.max(0, Number(raw.todayCount) || 0),
    totalCount: Math.max(queueIds.length, Number(raw.totalCount) || queueIds.length),
  };
}

/**
 * 清除学习会话
 * @param {string} [level]
 */
function clearSession(level) {
  if (level) {
    storage.remove(`${STORAGE_KEYS.SESSION}_${level}`);
    const globalRaw = storage.get(STORAGE_KEYS.SESSION);
    if (globalRaw && globalRaw.level === level) {
      storage.remove(STORAGE_KEYS.SESSION);
    }
    return true;
  }
  const globalRaw = storage.get(STORAGE_KEYS.SESSION);
  if (globalRaw && globalRaw.level) {
    storage.remove(`${STORAGE_KEYS.SESSION}_${globalRaw.level}`);
  }
  const knownLevels = ['CET4', 'CET6', 'CET4_HIGH', 'CET6_HIGH', 'KAOYAN'];
  for (const lvl of knownLevels) {
    storage.remove(`${STORAGE_KEYS.SESSION}_${lvl}`);
  }
  return storage.remove(STORAGE_KEYS.SESSION);
}

module.exports = {
  saveSession,
  loadSession,
  clearSession,
};