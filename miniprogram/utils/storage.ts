// 微信小程序本地存储封装
const logger = require('./logger');

const STORAGE_KEYS = {
  PROGRESS: 'cet46_progress',
  WRONG_WORDS: 'cet46_wrong_words',
  HEATMAP: 'cet46_heatmap',
  SETTINGS: 'cet46_settings',
  CURRENT_LEVEL: 'cet46_current_level',
  SESSION: 'cet46_session',
  FSRS_WEIGHTS: 'cet46_fsrs_weights',
  HOUR_STATS: 'cet46_hour_stats',
  MINIGAME_STATS: 'cet46_minigame_stats',
  CUSTOM_WORDS: 'cet46_custom_words',
};

const CHUNK_SCHEMA_VERSION = 2;

function byteLength(value) {
  let length = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x80) length += 1;
    else if (code < 0x800) length += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
      length += 4;
      i++;
    } else length += 3;
  }
  return length;
}

function checksum(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function generationKey(key, id, index) {
  return `${key}_g_${id}_${index}`;
}

function createGenerationMeta(json, chunkCount) {
  return {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    chunkCount,
    byteLength: byteLength(json),
    checksum: checksum(json),
  };
}

const storage = {
  get(key) {
    try {
      const value = wx.getStorageSync(key);
      if (value !== undefined && value !== null && value !== '') return value;

      // 兼容旧测试和诊断代码读取 `${key}_chunks`，实际数据仍只存新一代分片。
      const legacyCountMatch = String(key).match(/^(.*)_chunks$/);
      if (legacyCountMatch) {
        const manifest = wx.getStorageSync(`${legacyCountMatch[1]}_manifest`);
        if (manifest && manifest.schemaVersion === CHUNK_SCHEMA_VERSION && manifest.active) {
          return manifest.active.chunkCount;
        }
      }
      return null;
    } catch (e) {
      logger.error('[storage] get failed:', key, e);
      return null;
    }
  },

  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (e) {
      logger.error('[storage] set failed:', key, e);
      return false;
    }
  },

  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      logger.error('[storage] remove failed:', key, e);
      return false;
    }
  },

  clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (e) {
      logger.error('[storage] clear failed:', e);
      return false;
    }
  },

  _readGeneration(key, meta) {
    if (!meta || typeof meta.id !== 'string' || !Number.isInteger(meta.chunkCount) || meta.chunkCount < 1) {
      return null;
    }

    let json = '';
    for (let i = 0; i < meta.chunkCount; i++) {
      const chunk = this.get(generationKey(key, meta.id, i));
      if (typeof chunk !== 'string') return null;
      json += chunk;
    }

    if (byteLength(json) !== meta.byteLength || checksum(json) !== meta.checksum) return null;
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  },

  _removeGeneration(key, meta) {
    if (!meta || !Number.isInteger(meta.chunkCount)) return;
    for (let i = 0; i < meta.chunkCount; i++) {
      this.remove(generationKey(key, meta.id, i));
    }
  },

  _removeLegacyChunks(key, removeSimple = true) {
    const oldCount = this.get(`${key}_chunks`);
    if (Number.isInteger(oldCount) && oldCount > 0) {
      for (let i = 0; i < oldCount; i++) this.remove(`${key}_chunk_${i}`);
    }
    this.remove(`${key}_chunks`);
    if (removeSimple) this.remove(key);
  },

  setChunked(key, value, chunkSize = 800 * 1024) {
    let json;
    try {
      json = JSON.stringify(value);
    } catch (e) {
      logger.error('[storage] stringify failed:', key, e);
      return false;
    }

    const safeChunkSize = Math.max(1, Number(chunkSize) || 800 * 1024);
    const manifestKey = `${key}_manifest`;
    const oldManifest = this.get(manifestKey);

    if (json.length <= safeChunkSize) {
      if (!this.set(key, value)) return false;
      if (oldManifest && oldManifest.schemaVersion === CHUNK_SCHEMA_VERSION) {
        if (!this.remove(manifestKey)) return false;
        this._removeGeneration(key, oldManifest.active);
        this._removeGeneration(key, oldManifest.previous);
      } else {
        this.remove(manifestKey);
      }
      this._removeLegacyChunks(key, false);
      return true;
    }

    const chunks = [];
    for (let i = 0; i < json.length; i += safeChunkSize) {
      chunks.push(json.slice(i, i + safeChunkSize));
    }
    if (chunks.length === 0) chunks.push(json);

    const active = createGenerationMeta(json, chunks.length);

    for (let i = 0; i < chunks.length; i++) {
      if (!this.set(generationKey(key, active.id, i), chunks[i])) {
        this._removeGeneration(key, active);
        return false;
      }
    }

    if (this._readGeneration(key, active) === null) {
      this._removeGeneration(key, active);
      return false;
    }

    const previous = oldManifest && oldManifest.schemaVersion === CHUNK_SCHEMA_VERSION
      ? oldManifest.active || oldManifest.previous || null
      : null;
    const nextManifest = { schemaVersion: CHUNK_SCHEMA_VERSION, active, previous };

    if (!this.set(manifestKey, nextManifest)) {
      this._removeGeneration(key, active);
      return false;
    }

    if (oldManifest && oldManifest.schemaVersion === CHUNK_SCHEMA_VERSION && oldManifest.previous) {
      this._removeGeneration(key, oldManifest.previous);
    }
    this._removeLegacyChunks(key);
    return true;
  },

  getChunked(key) {
    const manifest = this.get(`${key}_manifest`);
    if (manifest && manifest.schemaVersion === CHUNK_SCHEMA_VERSION) {
      const active = this._readGeneration(key, manifest.active);
      if (active !== null) return active;
      const previous = this._readGeneration(key, manifest.previous);
      if (previous !== null) return previous;
    }

    const simple = this.get(key);
    if (simple !== null && simple !== undefined) return simple;

    const count = this.get(`${key}_chunks`);
    if (!Number.isInteger(count) || count < 1) return null;

    let json = '';
    for (let i = 0; i < count; i++) {
      const chunk = this.get(`${key}_chunk_${i}`);
      if (typeof chunk !== 'string') return null;
      json += chunk;
    }

    try {
      return JSON.parse(json);
    } catch (e) {
      logger.error('[storage] legacy chunks parse failed:', key, e);
      return null;
    }
  },
};

module.exports = { storage, STORAGE_KEYS };
