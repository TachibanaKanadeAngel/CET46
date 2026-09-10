// 46英语小程序 - 单词发音音频管理器
// 支持有道权威词典发音（美音/英音）、单例管理、播放防抖与状态监听

const STORAGE_KEY_ACCENT = 'cet46_audio_accent'; // '2' for US (default), '1' for UK
const STORAGE_KEY_AUTOPLAY = 'cet46_audio_autoplay'; // '0' | '1'

let innerAudioContext: any = null;
let currentWord = '';
let activeListeners = new Set<(event: string, word?: string, error?: any) => void>();

// ===== 网络降级状态 =====
// 有道音源为在线服务：离线/域名不可达时发音会静默失败。
// 这里维护在线状态与连续失败计数，向用户提供可见提示并广播 'degraded' 事件。
let isOnline: boolean | null = null; // null 表示未知（无网络 API 时跳过检测，行为同旧版）
let consecutiveFailures = 0;
let lastToastAt = 0;
const TOAST_INTERVAL_MS = 60 * 1000;

function setupNetworkWatch() {
  if (typeof wx === 'undefined') return;
  try {
    if (typeof wx.getNetworkType === 'function') {
      wx.getNetworkType({
        success: (res: any) => { isOnline = res.networkType !== 'none'; },
        fail: () => { isOnline = null; },
      });
    }
    if (typeof wx.onNetworkStatusChange === 'function') {
      wx.onNetworkStatusChange((res: any) => { isOnline = !!res.isConnected; });
    }
  } catch (_) { /* 环境 API 缺失时保持未知状态 */ }
}

/**
 * 降级提示（60 秒节流，不重复打扰）
 */
function notifyDegraded(word: string, error: any) {
  consecutiveFailures += 1;
  const now = Date.now();
  const offline = isOnline === false;
  if ((offline || consecutiveFailures >= 3) && now - lastToastAt > TOAST_INTERVAL_MS) {
    lastToastAt = now;
    try {
      if (typeof wx !== 'undefined' && typeof wx.showToast === 'function') {
        wx.showToast({
          title: offline ? '当前离线，发音不可用' : '发音加载失败，请检查网络',
          icon: 'none',
          duration: 2000,
        });
      }
    } catch (_) {}
  }
  notifyListeners('degraded', word, error);
}

/**
 * 获取或初始化 InnerAudioContext 实例
 */
function getAudioContext() {
  if (!innerAudioContext && typeof wx !== 'undefined' && typeof wx.createInnerAudioContext === 'function') {
    try {
      if (typeof wx.setInnerAudioOption === 'function') {
        try {
          wx.setInnerAudioOption({ obeyMuteSwitch: false, mixWithOther: true });
        } catch (_) {}
      }
      innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.obeyMuteSwitch = false;
      setupNetworkWatch();

      innerAudioContext.onPlay(() => {
        consecutiveFailures = 0;
        if (isOnline === false) isOnline = true;
        notifyListeners('play', currentWord);
      });

      innerAudioContext.onEnded(() => {
        const word = currentWord;
        currentWord = '';
        notifyListeners('ended', word);
      });

      innerAudioContext.onStop(() => {
        const word = currentWord;
        currentWord = '';
        notifyListeners('stop', word);
      });

      innerAudioContext.onError((err: any) => {
        const word = currentWord;
        currentWord = '';
        notifyListeners('error', word, err);
        notifyDegraded(word, err);
      });
    } catch (e) {
      console.error('[Audio] 初始化音频上下文失败:', e);
    }
  }
  return innerAudioContext;
}

/**
 * 通知所有状态监听器
 */
function notifyListeners(event: string, word?: string, error?: any) {
  activeListeners.forEach(listener => {
    try {
      listener(event, word, error);
    } catch (e) {
      console.warn('[Audio] 监听器执行异常:', e);
    }
  });
}

/**
 * 注册音频事件监听器
 * @param {Function} listener (event: 'play'|'ended'|'stop'|'error'|'degraded', word: string, error?: any) => void
 *   'degraded'：连续播放失败或离线时触发，页面可据此展示自定义降级 UI（模块内已有 toast 兜底）
 * @returns {Function} 解绑函数
 */
function addAudioListener(listener) {
  activeListeners.add(listener);
  return () => {
    activeListeners.delete(listener);
  };
}

/**
 * 获取当前发音口音配置 (2: 美音, 1: 英音)
 */
function getAudioAccent() {
  try {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      const accent = wx.getStorageSync(STORAGE_KEY_ACCENT);
      return accent === '1' ? '1' : '2';
    }
  } catch (_) {}
  return '2';
}

/**
 * 设置发音口音配置 (2: 美音, 1: 英音)
 */
function setAudioAccent(accent) {
  const val = accent === '1' ? '1' : '2';
  try {
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
      wx.setStorageSync(STORAGE_KEY_ACCENT, val);
    }
  } catch (_) {}
  return val;
}

/**
 * 获取是否开启翻牌自动发音
 */
function getAutoPlay() {
  try {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      return wx.getStorageSync(STORAGE_KEY_AUTOPLAY) === '1';
    }
  } catch (_) {}
  return false;
}

/**
 * 设置是否开启翻牌自动发音
 */
function setAutoPlay(enable) {
  try {
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
      wx.setStorageSync(STORAGE_KEY_AUTOPLAY, enable ? '1' : '0');
    }
  } catch (_) {}
}

/**
 * 生成任意英文文本（单词或整句）的发音 URL
 * 有道词典公开发音源：type=1 为英音，type=2 为美音
 */
function getWordAudioUrl(text, accent) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();
  const selectedAccent = accent || getAudioAccent();
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=${selectedAccent}`;
}

/**
 * 生成例句原声音频 URL（同一有道源，传入整句英文）
 */
function getSentenceAudioUrl(sentence, accent) {
  if (!sentence || typeof sentence !== 'string') return '';
  return getWordAudioUrl(sentence.split(/[（(]/)[0].trim().replace(/[。．！？!?;；,，."“”…]+$/g, ''), accent);
}

/**
 * 播放指定单词的发音
 * @param {string} word 英文单词
 * @param {object} [options] 可选配置 { accent?: '1'|'2' }
 * @returns {boolean} 是否成功触发播放
 */
function playWordAudio(word: any, options: any = {}) {
  if (!word || typeof word !== 'string') return false;
  const cleanWord = word.trim().toLowerCase();
  const audioCtx = getAudioContext();
  if (!audioCtx) return false;

  // 离线快速失败：不发起无效请求，直接给出可见提示
  if (isOnline === false) {
    notifyDegraded(cleanWord, { errCode: -1, errMsg: 'offline' });
    return false;
  }

  const url = getWordAudioUrl(cleanWord, options.accent);
  if (!url) return false;

  try {
    audioCtx.stop();
    currentWord = cleanWord;
    audioCtx.src = url;
    audioCtx.play();
    return true;
  } catch (e) {
    console.error('[Audio] 播放音频失败:', e);
    currentWord = '';
    return false;
  }
}

/**
 * 播放例句原声音频（整句英文）
 * @param {string} sentence 双语例句（自动取英文部分）
 * @param {object} [options] 可选配置 { accent?: '1'|'2' }
 * @returns {boolean} 是否成功触发播放
 */
function playSentenceAudio(sentence: any, options: any = {}) {
  const url = getSentenceAudioUrl(sentence, options.accent);
  if (!url) return false;
  const audioCtx = getAudioContext();
  if (!audioCtx) return false;

  if (isOnline === false) {
    notifyDegraded('📄例句', { errCode: -1, errMsg: 'offline' });
    return false;
  }

  try {
    audioCtx.stop();
    currentWord = '📄例句';
    audioCtx.src = url;
    audioCtx.play();
    return true;
  } catch (e) {
    console.error('[Audio] 例句播放失败:', e);
    currentWord = '';
    return false;
  }
}

/**
 * 停止当前播放的音频
 */
function stopWordAudio() {
  const audioCtx = getAudioContext();
  if (audioCtx) {
    try {
      audioCtx.stop();
    } catch (_) {}
  }
  currentWord = '';
}

/**
 * 获取当前正在播放的单词
 */
function getCurrentPlayingWord() {
  return currentWord;
}

module.exports = {
  getAudioContext,
  getAudioAccent,
  setAudioAccent,
  getAutoPlay,
  setAutoPlay,
  getWordAudioUrl,
  getSentenceAudioUrl,
  playWordAudio,
  playSentenceAudio,
  stopWordAudio,
  getCurrentPlayingWord,
  addAudioListener,
  STORAGE_KEY_ACCENT,
  STORAGE_KEY_AUTOPLAY,
};
