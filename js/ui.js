import { escapeHTML, escapeRegExp } from './utils.js';
import { CONFIG } from './config.js';

const UI = {
  toast(msg, type = 'info') {
    const container = document.getElementById('toast-container') || this._createToastContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  },
  _createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;
  },
  showShortcutGuide() {
    const shown = localStorage.getItem('cet46_shortcut_guide_shown');
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'shortcut-guide-overlay';
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = 'max-width: 420px; text-align: center;';
    
    const title = document.createElement('h3');
    title.style.cssText = 'margin-bottom: 20px; color: var(--primary); font-size: 1.3rem;';
    title.textContent = '⌨️ 快捷键指南';
    
    const shortcuts = [
      { key: 'Space', desc: '翻转卡片', icon: '🔄' },
      { key: '←', desc: '不认识', icon: '❌' },
      { key: '→', desc: '认识', icon: '✅' },
      { key: 'S', desc: '拼写模式', icon: '✍️' },
      { key: 'Ctrl+Z', desc: '撤销操作', icon: '↩️' }
    ];
    
    const shortcutsContainer = document.createElement('div');
    shortcutsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;';
    
    shortcuts.forEach(({ key, desc, icon }) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; background: rgba(102,126,234,0.1); border-radius: 8px;';
      
      const leftSide = document.createElement('div');
      leftSide.style.cssText = 'display: flex; align-items: center; gap: 10px;';
      
      const iconSpan = document.createElement('span');
      iconSpan.textContent = icon;
      iconSpan.style.cssText = 'font-size: 1.2rem;';
      
      const descSpan = document.createElement('span');
      descSpan.textContent = desc;
      descSpan.style.cssText = 'color: var(--text-color);';
      
      leftSide.appendChild(iconSpan);
      leftSide.appendChild(descSpan);
      
      const keyBadge = document.createElement('kbd');
      keyBadge.textContent = key;
      keyBadge.style.cssText = 'background: var(--primary); color: white; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
      
      row.appendChild(leftSide);
      row.appendChild(keyBadge);
      shortcutsContainer.appendChild(row);
    });
    
    const gestureHint = document.createElement('div');
    gestureHint.style.cssText = 'margin-top: 15px; padding: 12px; background: rgba(72,187,120,0.1); border-radius: 8px; font-size: 0.85rem; color: var(--text-color);';
    gestureHint.textContent = '📱 ';
    const strongNode = document.createElement('strong');
    strongNode.textContent = '移动端手势:';
    gestureHint.appendChild(strongNode);
    gestureHint.appendChild(document.createTextNode(' 左滑 = 不认识 | 右滑 = 认识'));
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';
    btnGroup.style.cssText = 'justify-content: center; margin-top: 15px;';
    
    const gotItBtn = document.createElement('button');
    gotItBtn.className = 'btn btn-primary';
    gotItBtn.textContent = '知道了';
    
    const dontShowBtn = document.createElement('button');
    dontShowBtn.className = 'btn';
    dontShowBtn.textContent = '不再提示';
    
    btnGroup.appendChild(gotItBtn);
    btnGroup.appendChild(dontShowBtn);
    
    content.appendChild(title);
    content.appendChild(shortcutsContainer);
    content.appendChild(gestureHint);
    content.appendChild(btnGroup);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    const closeGuide = (dontShow = false) => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      if (dontShow) {
        localStorage.setItem('cet46_shortcut_guide_shown', 'true');
      }
    };
    
    gotItBtn.addEventListener('click', () => closeGuide(false));
    dontShowBtn.addEventListener('click', () => closeGuide(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeGuide(false);
    });
    
    if (!shown) {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    }
  },
  async confirm(title, message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      
      const content = document.createElement('div');
      content.className = 'modal-content';
      content.style.cssText = 'max-width: 400px; text-align: center;';
      
      const h3 = document.createElement('h3');
      h3.style.cssText = 'margin-bottom: 15px; color: var(--dark);';
      h3.textContent = title;
      
      const p = document.createElement('p');
      p.style.cssText = 'margin-bottom: 20px; color: var(--gray);';
      p.textContent = message;
      
      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.cssText = 'justify-content: center;';
      
      const yesBtn = document.createElement('button');
      yesBtn.className = 'btn btn-primary';
      yesBtn.id = 'confirm-yes';
      yesBtn.textContent = '确定';
      
      const noBtn = document.createElement('button');
      noBtn.className = 'btn';
      noBtn.id = 'confirm-no';
      noBtn.textContent = '取消';
      
      btnGroup.appendChild(yesBtn);
      btnGroup.appendChild(noBtn);
      content.appendChild(h3);
      content.appendChild(p);
      content.appendChild(btnGroup);
      overlay.appendChild(content);
      document.body.appendChild(overlay);
      
      yesBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        resolve(true);
      });
      noBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        resolve(false);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 300);
          resolve(false);
        }
      });
    });
  },
  async prompt(title, message, placeholder = '') {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';

      const content = document.createElement('div');
      content.className = 'modal-content';
      content.style.cssText = 'max-width: 400px; text-align: center;';

      const h3 = document.createElement('h3');
      h3.style.cssText = 'margin-bottom: 15px; color: var(--dark);';
      h3.textContent = title;

      const p = document.createElement('p');
      p.style.cssText = 'margin-bottom: 20px; color: var(--gray);';
      p.textContent = message;

      const input = document.createElement('input');
      input.type = 'password';
      input.id = 'secure-prompt-input';
      input.placeholder = placeholder;
      input.autocomplete = 'current-password';
      input.style.cssText = `
        width: 100%;
        padding: 12px 15px;
        margin-bottom: 20px;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 16px;
        outline: none;
        box-sizing: border-box;
      `;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.style.cssText = 'justify-content: center;';

      const okBtn = document.createElement('button');
      okBtn.className = 'btn btn-primary';
      okBtn.textContent = '确定';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn';
      cancelBtn.textContent = '取消';

      btnGroup.appendChild(okBtn);
      btnGroup.appendChild(cancelBtn);
      content.appendChild(h3);
      content.appendChild(p);
      content.appendChild(input);
      content.appendChild(btnGroup);
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      input.focus();

      const cleanup = (value) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        resolve(value);
      };

      okBtn.addEventListener('click', () => {
        cleanup(input.value.trim() || null);
      });
      cancelBtn.addEventListener('click', () => {
        cleanup(null);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup(null);
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          cleanup(input.value.trim() || null);
        }
      });
    });
  },
  async safeExecute(promiseFn, loadingMessage = '处理中...') {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    
    if (overlay) {
      if (textEl) textEl.textContent = loadingMessage;
      overlay.style.display = 'flex';
    }

    try {
      await promiseFn();
    } catch (error) {
      console.error('SafeExecute Error:', error);
      this.toast(`操作失败: ${error.message}`, 'error');
    } finally {
      if (overlay) overlay.style.display = 'none';
    }
  }
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let audioUnlocked = false;

function unlockAudioContext() {
  if (audioUnlocked) return;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);

  audioUnlocked = true;
  document.removeEventListener('touchstart', unlockAudioContext);
  document.removeEventListener('click', unlockAudioContext);
}

document.addEventListener('touchstart', unlockAudioContext, { once: true });
document.addEventListener('click', unlockAudioContext, { once: true });

function playTone(type) {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
    
    if (navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  }
}

// 屏幕阅读器播报函数
function announceForAccessibility(message) {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = message; }, 50);
  }
}

// 粒子 Worker 实例（延迟初始化）
let particleWorker = null;

/**
 * 启动粒子特效 - 使用 OffscreenCanvas 在 Worker 中渲染
 * 彻底解放主线程，实现极致性能
 */
function fireConfetti() {
  // 检查浏览器是否支持 OffscreenCanvas
  if (typeof OffscreenCanvas === 'undefined' || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) {
    // 降级方案：使用主线程渲染
    fireConfettiMainThread();
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  // 设置 canvas 实际尺寸
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  try {
    // 检测是否在 file:// 协议下运行
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
      console.log('⚠️ file:// 协议下无法使用 Particle Worker，跳过粒子效果');
      return;
    }
    
    // 将 canvas 控制权转移到 Worker
    const offscreen = canvas.transferControlToOffscreen();

    if (particleWorker) {
      particleWorker.terminate();
      particleWorker = null;
    }
    particleWorker = new Worker(new URL('./workers/particle-worker.js', import.meta.url), { type: 'module' });

    const resizeHandler = () => {
      if (particleWorker && canvas.isConnected) {
        particleWorker.postMessage({
          type: 'resize',
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };

    window.addEventListener('resize', resizeHandler);

    const cleanup = () => {
      window.removeEventListener('resize', resizeHandler);
      if (particleWorker) {
        particleWorker.postMessage({ type: 'stop' });
        particleWorker.terminate();
        particleWorker = null;
      }
      if (canvas && canvas.isConnected) {
        canvas.remove();
      }
    };

    const onWorkerMessage = (e) => {
      if (e.data.type === 'completed') {
        cleanup();
      } else if (e.data.type === 'error') {
        console.error('🎆 粒子引擎崩溃，已自动回收释放内存:', e.data.message);
        cleanup();
      }
    };

    particleWorker.addEventListener('message', onWorkerMessage);
    particleWorker.onerror = (err) => {
      console.error('🎆 粒子 Worker 异常，已自动回收释放内存:', err);
      cleanup();
    };

    setTimeout(cleanup, 5000);

    particleWorker.postMessage({
      type: 'init',
      canvas: offscreen,
      width: canvas.width,
      height: canvas.height
    }, [offscreen]);

  } catch (err) {
    console.warn('OffscreenCanvas 初始化失败，使用降级方案:', err);
    canvas.remove();
    fireConfettiMainThread();
  }
}

/**
 * 降级方案：在主线程渲染粒子
 * 用于不支持 OffscreenCanvas 的浏览器
 */
function fireConfettiMainThread() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 80 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    vx: (Math.random() - 0.5) * 25,
    vy: (Math.random() - 1) * 20 - 10,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    size: Math.random() * 8 + 4,
    life: 1.0,
    decay: Math.random() * 0.01 + 0.005
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      if (p.life <= 0) return;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.6;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      active = true;
    });

    if (active) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

let currentAudioProxyIndex = 0;
let currentPlayingAudio = null;
const AUDIO_RACE_TIMEOUT = 800;

// 独立的音频资源销毁工具函数 - 防止内存泄漏
function cleanupAudio(audioEl) {
  if (!audioEl) return;
  try {
    audioEl.pause();
    audioEl.removeAttribute('src');
    audioEl.load(); // 强制浏览器卸载媒体资源，释放底层解码器
  } catch (e) {
    // 忽略清理过程中的错误
  }
}

async function speak(text, fetchWithProxyFallback) {
  const CORS_PROXIES = CONFIG.CORS_PROXIES;
  const originalUrl = `${CONFIG.AUDIO_BASE_URL}?audio=${encodeURIComponent(text)}&type=2`;

  const playWithTimeout = (audioUrl, timeout) => {
    return new Promise((resolve, reject) => {
      // 清理上一个未完成的音频，防止内存泄漏
      if (currentPlayingAudio) {
        cleanupAudio(currentPlayingAudio);
        currentPlayingAudio = null;
      }

      const audio = new Audio(audioUrl);
      currentPlayingAudio = audio;

      const timer = setTimeout(() => {
        cleanupAudio(audio);
        if (currentPlayingAudio === audio) {
          currentPlayingAudio = null;
        }
        reject(new Error('Audio timeout'));
      }, timeout);

      audio.oncanplaythrough = () => {
        clearTimeout(timer);
        audio.play()
          .then(() => resolve(audio))
          .catch(reject);
      };

      audio.onerror = () => {
        clearTimeout(timer);
        cleanupAudio(audio);
        if (currentPlayingAudio === audio) {
          currentPlayingAudio = null;
        }
        reject(new Error('Audio load error'));
      };

      // 核心：播放结束后的终极清理，释放内存
      audio.onended = () => {
        cleanupAudio(audio);
        if (currentPlayingAudio === audio) {
          currentPlayingAudio = null;
        }
      };

      audio.load();
    });
  };

  const playLocalTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const tryProxyAudio = async () => {
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyIndex = (currentAudioProxyIndex + i) % CORS_PROXIES.length;
      const proxy = CORS_PROXIES[proxyIndex];
      const audioUrl = proxy + encodeURIComponent(originalUrl);

      try {
        const audio = await playWithTimeout(audioUrl, AUDIO_RACE_TIMEOUT);
        currentAudioProxyIndex = proxyIndex;

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_AUDIO',
            url: audioUrl
          });
        }
        return true;
      } catch (err) {
        console.warn(`音频代理 ${proxy} 失败:`, err.message);
      }
    }
    return false;
  };

  const proxyPromise = tryProxyAudio();
  const fallbackTimer = new Promise(resolve => setTimeout(resolve, AUDIO_RACE_TIMEOUT));

  const raceResult = await Promise.race([
    proxyPromise.then(success => ({ type: 'proxy', success })),
    fallbackTimer.then(() => ({ type: 'timeout' }))
  ]);

  if (raceResult.type === 'timeout') {
    playLocalTTS();
    proxyPromise.catch(() => {});
  } else if (raceResult.type === 'proxy' && !raceResult.success) {
    playLocalTTS();
  }
}

function setSafeWordHeader(elementId, word, level) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn('[setSafeWordHeader] 元素不存在:', elementId);
    return;
  }
  
  // 清空元素
  el.textContent = word || '加载中...';
  
  // 只有当 level 有效时才添加
  if (level !== undefined && level !== null) {
    const small = document.createElement('small');
    small.textContent = level;
    el.appendChild(small);
  }
  
  console.log('[setSafeWordHeader] 设置单词:', word, '级别:', level, '元素:', elementId);
}

function generateCloze(word, example) {
  if (!example || !word) return example || '';
  if (example.length < 3) return '<div class="cloze-fallback" style="color: var(--gray); font-style: italic;">该单词暂无语境例句，请直接记忆释义。</div>';
  const escapedExample = escapeHTML(example);
  const escapedWord = escapeHTML(word);
  // 修复：先进行正则转义，防止 ReDoS 攻击和正则解析错误
  const safeRegexWord = escapeRegExp(escapedWord);
  const regex = new RegExp(`\\b${safeRegexWord}(s|es|ed|ing|er|est)?\\b`, 'gi');
  return escapedExample.replace(regex, '<span class="cloze-gap" data-answer="$&" style="background: rgba(102,126,234,0.3); padding: 2px 8px; border-radius: 4px; cursor: pointer; border-bottom: 2px dashed var(--primary);">____</span>');
}

function initClozeMode() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cloze-gap')) {
      const answer = e.target.dataset.answer;
      if (e.target.textContent === '____') {
        e.target.textContent = answer;
        e.target.style.background = 'rgba(72,187,120,0.3)';
        e.target.style.borderBottom = 'none';
      } else {
        e.target.textContent = '____';
        e.target.style.background = 'rgba(102,126,234,0.3)';
        e.target.style.borderBottom = '2px dashed var(--primary)';
      }
    }
  });
}

initClozeMode();

const THEME_KEY = 'cet46_theme';

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem(THEME_KEY, isDark ? 'light' : 'dark');
  document.querySelector('.theme-toggle').textContent = isDark ? '🌙' : '☀️';
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').textContent = '☀️';
  }
}

function showLoadingOverlay(show = true, text = '处理中...', percent = 0) {
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress');
  const loadingPercent = document.getElementById('loading-percent');
  
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
    if (loadingText) loadingText.textContent = text;
    if (loadingProgress) loadingProgress.style.width = `${percent}%`;
    if (loadingPercent) loadingPercent.textContent = `${Math.round(percent)}%`;
  }
}

function updateLoadingProgress(percent, text) {
  const loadingProgress = document.getElementById('loading-progress');
  const loadingText = document.getElementById('loading-text');
  const loadingPercent = document.getElementById('loading-percent');
  
  if (loadingProgress) loadingProgress.style.width = `${percent}%`;
  if (loadingPercent) loadingPercent.textContent = `${Math.round(percent)}%`;
  if (text && loadingText) loadingText.textContent = text;
}

function renderAlgorithmTransparency(wordId, getWordData, FSRS_W) {
  const wd = getWordData(wordId);
  if (!wd) return null;
  
  const stability = wd.stability || FSRS_W[0];
  const difficulty = wd.difficulty || FSRS_W[1];
  
  let retrievability = 1;
  if (wd.lastStudy && wd.status === 'review') {
    const daysSinceReview = (Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000);
    retrievability = Math.pow(0.9, daysSinceReview / stability);
  }
  
  const rPercent = Math.round(retrievability * 100);
  const sDays = Math.round(stability);
  const dScore = difficulty.toFixed(1);
  
  return {
    R: rPercent,
    S: sDays,
    D: dScore,
    explanation: `记忆留存率 ${rPercent}% | 稳定性 ${sDays}天 | 难度 ${dScore}`
  };
}

function createAlgorithmHeatmap(words, getWordData, FSRS_W) {
  const container = document.createElement('div');
  container.className = 'algorithm-heatmap';
  container.style.cssText = 'display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; margin-top: 1rem;';
  
  const sample = words.slice(0, 50);
  
  sample.forEach(w => {
    const wd = getWordData(w.id);
    const cell = document.createElement('div');
    cell.style.cssText = 'width: 24px; height: 24px; border-radius: 4px; cursor: pointer; position: relative;';
    
    if (!wd || wd.status === 'new') {
      cell.style.background = 'var(--border-color)';
      cell.title = `${w.word}: 新词`;
    } else {
      const stability = wd.stability || FSRS_W[0];
      const difficulty = wd.difficulty || FSRS_W[1];
      
      let retrievability = 1;
      if (wd.lastStudy) {
        const daysSinceReview = (Date.now() - wd.lastStudy) / (24 * 60 * 60 * 1000);
        retrievability = Math.pow(0.9, daysSinceReview / stability);
      }
      
      const rPercent = Math.round(retrievability * 100);
      
      if (rPercent >= 90) {
        cell.style.background = 'var(--success)';
      } else if (rPercent >= 70) {
        cell.style.background = '#9ae6b4';
      } else if (rPercent >= 50) {
        cell.style.background = 'var(--warning)';
      } else {
        cell.style.background = 'var(--danger)';
      }
      
      cell.title = `${w.word}: R=${rPercent}% S=${Math.round(stability)}天 D=${difficulty.toFixed(1)}`;
    }
    
    container.appendChild(cell);
  });
  
  return container;
}

function renderEFDisplay(prefix, wd, MIN_EF, MAX_EF, FSRS_W, MS_PER_DAY = 24 * 60 * 60 * 1000) {
  const idPrefix = prefix ? `${prefix}-` : '';
  const efDisplay = document.getElementById(`${idPrefix}ef-display`);
  const efValue = document.getElementById(`${idPrefix}ef-value`);
  const efFill = document.getElementById(`${idPrefix}ef-fill`);

  if (!efDisplay || !wd) return;

  efDisplay.style.display = 'block';
  efValue.textContent = wd.ef.toFixed(2);
  efFill.style.width = `${((wd.ef - MIN_EF) / (MAX_EF - MIN_EF)) * 100}%`;

  const stability = wd.stability || FSRS_W[0];
  const difficulty = wd.difficulty || FSRS_W[1];

  const stabilityEl = document.getElementById(`${idPrefix}stability-value`);
  const difficultyEl = document.getElementById(`${idPrefix}difficulty-value`);
  if (stabilityEl) stabilityEl.textContent = stability.toFixed(1);
  if (difficultyEl) difficultyEl.textContent = difficulty.toFixed(1);

  const retentionValue = document.getElementById(`${idPrefix}retention-value`);
  if (!retentionValue) return;

  if (wd.lastStudy && wd.status === 'review') {
    const days = (Date.now() - wd.lastStudy) / MS_PER_DAY;
    const retention = Math.pow(0.9, days / stability) * 100;

    retentionValue.textContent = retention.toFixed(0) + '%';

    if (retention < 50) {
      retentionValue.style.color = 'var(--danger)';
      retentionValue.style.fontWeight = 'bold';
      retentionValue.style.animation = 'pulse 1s infinite';
    } else if (retention < 80) {
      retentionValue.style.color = 'var(--warning)';
      retentionValue.style.fontWeight = 'normal';
      retentionValue.style.animation = 'none';
    } else {
      retentionValue.style.color = 'var(--success)';
      retentionValue.style.fontWeight = 'normal';
      retentionValue.style.animation = 'none';
    }
  } else {
    retentionValue.textContent = prefix === 'review' ? '--' : '新词';
    retentionValue.style.color = 'rgba(255,255,255,0.7)';
    retentionValue.style.fontWeight = 'normal';
    retentionValue.style.animation = 'none';
  }
}

const Skeleton = {
  createWordCard() {
    return `
      <div class="skeleton-word-card">
        <div class="skeleton skeleton-word"></div>
        <div class="skeleton skeleton-phonetic"></div>
        <div class="skeleton skeleton-meaning"></div>
        <div class="skeleton-actions">
          <div class="skeleton skeleton-action-btn"></div>
          <div class="skeleton skeleton-action-btn"></div>
        </div>
      </div>
    `;
  },

  createListItem() {
    return `
      <div class="skeleton-list-item">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text" style="width:60%"></div>
          <div class="skeleton skeleton-text" style="width:80%"></div>
        </div>
      </div>
    `;
  },

  createList(count = 5) {
    return `<div class="skeleton-list">${Array(count).fill(this.createListItem()).join('')}</div>`;
  },

  // 存储原始内容的缓存
  _originalContent: {},

  showInElement(elementId, skeletonHtml) {
    const el = document.getElementById(elementId);
    if (el) {
      // 保存原始内容（只在第一次显示骨架屏时保存）
      if (!el.hasAttribute('aria-busy') && !this._originalContent[elementId]) {
        this._originalContent[elementId] = el.innerHTML;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(skeletonHtml, 'text/html');
      el.replaceChildren(...doc.body.childNodes);
      el.setAttribute('aria-busy', 'true');
    }
  },

  hide(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.removeAttribute('aria-busy');
      // 恢复原始内容
      if (this._originalContent[elementId]) {
        el.innerHTML = this._originalContent[elementId];
        delete this._originalContent[elementId];
      }
    }
  },

  showWordCardLoading(elementId = 'study-card') {
    this.showInElement(elementId, this.createWordCard());
  },

  showListLoading(elementId, count = 6) {
    this.showInElement(elementId, this.createList(count));
  }
};

UI.showShortcutGuide = function showShortcutGuidePatched() {
  const shown = localStorage.getItem('cet46_shortcut_guide_shown');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'shortcut-guide-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content shortcut-guide-panel';
  content.style.cssText = 'max-width: 420px; text-align: center;';

  const title = document.createElement('h3');
  title.style.cssText = 'margin-bottom: 20px; color: var(--primary); font-size: 1.3rem;';
  title.textContent = '快捷键指南';

  const shortcuts = [
    { key: 'Space', desc: '翻转卡片' },
    { key: '←', desc: '不认识' },
    { key: '→', desc: '认识' },
    { key: 'S', desc: '拼写模式' },
    { key: 'Ctrl+Z', desc: '撤销操作' }
  ];

  const shortcutsContainer = document.createElement('div');
  shortcutsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;';

  shortcuts.forEach(({ key, desc }) => {
    const row = document.createElement('div');
    row.className = 'shortcut-guide-row';
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 15px;';

    const leftSide = document.createElement('div');
    leftSide.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'shortcut-guide-dot';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = '·';

    const descSpan = document.createElement('span');
    descSpan.textContent = desc;
    descSpan.style.cssText = 'color: var(--text-color);';

    leftSide.appendChild(iconSpan);
    leftSide.appendChild(descSpan);

    const keyBadge = document.createElement('kbd');
    keyBadge.className = 'shortcut-guide-kbd';
    keyBadge.textContent = key;
    keyBadge.style.cssText = 'font-family: monospace; font-size: 0.85rem;';

    row.appendChild(leftSide);
    row.appendChild(keyBadge);
    shortcutsContainer.appendChild(row);
  });

  const gestureHint = document.createElement('div');
  gestureHint.className = 'shortcut-guide-hint';
  gestureHint.style.cssText = 'margin-top: 15px; padding: 12px; font-size: 0.85rem; color: var(--text-color);';
  const strongNode = document.createElement('strong');
  strongNode.textContent = '移动端手势';
  gestureHint.appendChild(strongNode);
  gestureHint.appendChild(document.createTextNode('：左滑 = 不认识，右滑 = 认识'));

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group shortcut-guide-actions';
  btnGroup.style.cssText = 'justify-content: center; margin-top: 15px;';

  const gotItBtn = document.createElement('button');
  gotItBtn.className = 'btn shortcut-guide-close-btn';
  gotItBtn.textContent = '关闭说明';

  const dontShowBtn = document.createElement('button');
  dontShowBtn.className = 'btn shortcut-guide-dismiss-btn';
  dontShowBtn.textContent = '不再提示';

  btnGroup.appendChild(gotItBtn);
  btnGroup.appendChild(dontShowBtn);

  content.appendChild(title);
  content.appendChild(shortcutsContainer);
  content.appendChild(gestureHint);
  content.appendChild(btnGroup);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const closeGuide = (dontShow = false) => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
    if (dontShow) {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    }
  };

  gotItBtn.addEventListener('click', () => closeGuide(false));
  dontShowBtn.addEventListener('click', () => closeGuide(true));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeGuide(false);
  });

  if (!shown) {
    localStorage.setItem('cet46_shortcut_guide_shown', 'true');
  }
};

UI.showStatusPanel = function showStatusPanelPatched(title, rows = [], options = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';

  const content = document.createElement('div');
  content.className = 'modal-content toolbar-status-panel';
  content.style.cssText = 'max-width: 360px; text-align: left;';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const list = document.createElement('div');
  list.className = 'toolbar-status-list';

  rows.forEach(({ label, value }) => {
    const row = document.createElement('div');
    row.className = 'toolbar-status-row';

    const labelNode = document.createElement('span');
    labelNode.className = 'toolbar-status-label';
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.className = 'toolbar-status-value';
    valueNode.textContent = value;

    row.appendChild(labelNode);
    row.appendChild(valueNode);
    list.appendChild(row);
  });

  content.appendChild(heading);
  content.appendChild(list);

  if (options.note) {
    const note = document.createElement('p');
    note.className = 'toolbar-status-note';
    note.textContent = options.note;
    content.appendChild(note);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn toolbar-status-close-btn';
  closeBtn.textContent = options.closeText || '关闭说明';
  content.appendChild(closeBtn);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const closePanel = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePanel();
  });
};

export {
  UI, playTone, fireConfetti, speak, setSafeWordHeader,
  generateCloze, initClozeMode, toggleTheme, initTheme,
  showLoadingOverlay, updateLoadingProgress,
  renderAlgorithmTransparency, createAlgorithmHeatmap,
  renderEFDisplay, Skeleton,
  THEME_KEY
};

export { announceForAccessibility };
