const { isValidSeries, getPackageRoot, SERIES } = require('./series');
const VALID_LEVELS = new Set(SERIES.map(s => s.id));

function loadLevelModule(level) {
  const root = getPackageRoot(level);
  const modPath = `../${root}/words.js`;
  if (typeof require !== 'undefined' && typeof (require as any).async === 'function') {
    if (level === 'CET4') return (require as any).async('../packages/level4/words.js');
    if (level === 'CET6') return (require as any).async('../packages/level6/words.js');
    if (level === 'CET4_HIGH' || level === 'SPOKEN') return (require as any).async('../packages/level5/words.js');
    return (require as any).async(modPath);
  }
  try {
    if (level === 'CET4') return Promise.resolve(require('../packages/level4/words.js'));
    if (level === 'CET6') return Promise.resolve(require('../packages/level6/words.js'));
    if (level === 'CET4_HIGH' || level === 'SPOKEN') return Promise.resolve(require('../packages/level5/words.js'));
    return Promise.resolve(require(modPath));
  } catch (err) {
    return Promise.reject(err);
  }
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('词库加载超时，请重试'));
    }, timeoutMs);

    promise.then(
      value => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadVocab(level: any, options: any = {}) {
  if (!VALID_LEVELS.has(level)) {
    throw new Error(`不支持的词库等级: ${String(level)}`);
  }

  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 15000;
  const retries = Number.isInteger(options.retries) ? Math.max(0, options.retries) : 2;
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? Math.max(0, options.retryDelayMs) : 1000;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const module: any = await withTimeout(loadLevelModule(level), timeoutMs);
      const words = module && module.WORDS;
      if (!Array.isArray(words) || words.length === 0) {
        throw new Error('词库数据为空或格式无效');
      }
      return { level, words };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= retries) break;
      if (typeof options.onRetry === 'function') {
        options.onRetry({ attempt: attempt + 1, retries, error: lastError });
      }
      if (retryDelayMs > 0) await wait(retryDelayMs);
    }
  }

  throw lastError || new Error('词库加载失败');
}

module.exports = { loadVocab, VALID_LEVELS };
