const { CONFIG } = require('./config');
const { normalizeCustomStore } = require('./custom-vocab');
const { isValidSeries, DEFAULT_SERIES } = require('./series');

const BACKUP_SCHEMA_VERSION = 2;
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_PROGRESS_ITEMS = 10000;
const MAX_HEATMAP_ITEMS = 5000;

function cloneSafe(value, depth = 0) {
  if (depth > 20) throw new Error('备份数据嵌套过深');
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => cloneSafe(item, depth + 1));
  const result = {};
  Object.keys(value).forEach(key => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
    result[key] = cloneSafe(value[key], depth + 1);
  });
  return result;
}

function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const entries = Object.entries(raw);
  if (entries.length > MAX_PROGRESS_ITEMS) throw new Error('学习进度条目超过限制');
  const progress = {};
  entries.forEach(([id, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const item = cloneSafe(value);
    if (item.status && !['new', 'review', 'mastered'].includes(item.status)) item.status = 'new';
    progress[String(id)] = item;
  });
  return progress;
}

function normalizeWrongWords(raw) {
  const source = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.keys(raw)
      : [];
  return Array.from(new Set(source.map(id => String(id)))).slice(0, MAX_PROGRESS_ITEMS);
}

function normalizeHeatmap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const entries = Object.entries(raw);
  if (entries.length > MAX_HEATMAP_ITEMS) throw new Error('统计日期条目超过限制');
  const heatmap = {};
  entries.forEach(([date, value]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (typeof value === 'number') {
      heatmap[date] = { total: Math.max(0, Math.floor(value)), correct: 0, new: 0 };
      return;
    }
    if (!value || typeof value !== 'object') return;
    const valObj: any = value;
    heatmap[date] = {
      total: Math.max(0, Math.floor(Number(valObj.total ?? valObj.count) || 0)),
      correct: Math.max(0, Math.floor(Number(valObj.correct) || 0)),
      new: Math.max(0, Math.floor(Number(valObj.new) || 0)),
    };
  });
  return heatmap;
}

function normalizeSettings(raw) {
  const settings = raw && typeof raw === 'object' && !Array.isArray(raw) ? cloneSafe(raw) : {};
  const retention = Number(settings.targetRetention);
  settings.targetRetention = retention > 0.7 && retention < 1 ? retention : 0.9;
  const studyLimit = Number(settings.studyLimit);
  settings.studyLimit = (Number.isFinite(studyLimit) && studyLimit >= 5 && studyLimit <= 300) ? Math.floor(studyLimit) : 20;
  const spellingLimit = Number(settings.spellingLimit);
  settings.spellingLimit = (Number.isFinite(spellingLimit) && spellingLimit >= 5 && spellingLimit <= 300) ? Math.floor(spellingLimit) : 20;
  const dailyGoal = Number(settings.dailyGoal);
  settings.dailyGoal = (Number.isFinite(dailyGoal) && dailyGoal >= 5 && dailyGoal <= 500) ? Math.floor(dailyGoal) : 20;
  return settings;
}

function normalizeWeights(raw) {
  if (!Array.isArray(raw) || raw.length !== 17) return null;
  if (!raw.every(value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100)) {
    return null;
  }
  return raw.slice();
}

function createBackup(globalData, fsrsWeights) {
  return {
    product: '46英语',
    platform: 'wechat-miniprogram',
    version: CONFIG.VERSION,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    currentLevel: isValidSeries(globalData.currentLevel) ? globalData.currentLevel : DEFAULT_SERIES,
    progress: cloneSafe(globalData.progress || {}),
    wrongWords: (globalData.wrongWords || []).map(id => String(id)),
    heatmap: cloneSafe(globalData.heatmap || {}),
    settings: normalizeSettings(globalData.settings || {}),
    customWords: normalizeCustomStore(globalData.customWords),
    fsrsWeights: normalizeWeights(fsrsWeights),
  };
}

function parseBackup(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('备份文件为空');
  if (text.length > MAX_BACKUP_BYTES) throw new Error('备份文件超过 10MB 限制');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error('备份文件不是有效的 JSON');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('备份文件结构无效');

  const settingsSource = raw.settings || {};
  if (raw.targetRetention !== undefined && settingsSource.targetRetention === undefined) {
    settingsSource.targetRetention = raw.targetRetention;
  }
  const data = {
    currentLevel: isValidSeries(raw.currentLevel) ? raw.currentLevel : DEFAULT_SERIES,
    progress: normalizeProgress(raw.progress || raw.data),
    wrongWords: normalizeWrongWords(raw.wrongWords),
    heatmap: normalizeHeatmap(raw.heatmap),
    settings: normalizeSettings(settingsSource),
    fsrsWeights: normalizeWeights(raw.fsrsWeights),
    customWords: normalizeCustomStore(raw.customWords),
    sourceVersion: String(raw.version || 'unknown'),
    ignoredCustomWords: Array.isArray(raw.words) && raw.words.length > 0,
  };
  if (!Object.keys(data.progress).length && !data.wrongWords.length && !Object.keys(data.heatmap).length) {
    throw new Error('备份中没有可导入的学习数据');
  }
  return data;
}

module.exports = {
  BACKUP_SCHEMA_VERSION,
  MAX_BACKUP_BYTES,
  createBackup,
  parseBackup,
  normalizeProgress,
  normalizeWrongWords,
  normalizeHeatmap,
};
