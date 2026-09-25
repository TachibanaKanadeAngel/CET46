import { CONFIG } from '../config.js';
import { DeviceBridge } from '../bridge.js';
import logger from '../utils/logger.js';

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window !== 'undefined') {
    return window.AudioContext || (window as any).webkitAudioContext || null;
  }
  return null;
}

function unlockAudioContext(): void {
  if (audioUnlocked) return;
  const CtxClass = getAudioContextClass();
  if (!CtxClass) return;
  if (!audioCtx) audioCtx = new CtxClass();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);

  audioUnlocked = true;
  if (typeof document !== 'undefined') {
    document.removeEventListener('touchstart', unlockAudioContext);
    document.removeEventListener('click', unlockAudioContext);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', unlockAudioContext, { once: true });
  document.addEventListener('click', unlockAudioContext, { once: true });
}

function playTone(type: string): void {
  const CtxClass = getAudioContextClass();
  if (!audioCtx && CtxClass) audioCtx = new CtxClass();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const announcer = document.getElementById('audio-announcer');
  if (announcer) {
    announcer.textContent = type === 'success' ? '正确提示音' : '错误提示音';
  }

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

let currentAudioProxyIndex = 0;
let currentPlayingAudio: HTMLAudioElement | null = null;
const AUDIO_RACE_TIMEOUT = 800;

function cleanupAudio(audioEl: HTMLAudioElement | null): void {
  if (!audioEl) return;
  try {
    audioEl.pause();
    audioEl.removeAttribute('src');
    audioEl.load();
  } catch (e: any) {
    if (CONFIG.DEBUG) logger.debug('音频释放失败:', e.message);
  }
}

function playWithTimeout(audioUrl: string, timeout: number): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
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
      audio
        .play()
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

    audio.onended = () => {
      cleanupAudio(audio);
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
      }
    };

    audio.load();
  });
}

async function tryProxyAudio(text: string): Promise<boolean> {
  const CORS_PROXIES = CONFIG.CORS_PROXIES;
  const originalUrl = `${CONFIG.AUDIO_BASE_URL}?audio=${encodeURIComponent(text)}&type=2`;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentAudioProxyIndex + i) % CORS_PROXIES.length;
    const proxy = CORS_PROXIES[proxyIndex];
    const audioUrl = proxy + encodeURIComponent(originalUrl);

    try {
      await playWithTimeout(audioUrl, AUDIO_RACE_TIMEOUT);
      currentAudioProxyIndex = proxyIndex;

      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_AUDIO',
          url: audioUrl,
        });
      }
      return true;
    } catch (err: any) {
      logger.warn(`音频代理 ${proxy} 失败:`, err.message);
    }
  }
  return false;
}

async function speak(text: string): Promise<void> {
  const proxyPromise = tryProxyAudio(text);
  const fallbackTimer = new Promise<{ type: string }>((resolve) => {
    setTimeout(() => resolve({ type: 'timeout' }), AUDIO_RACE_TIMEOUT);
  });

  const raceResult = await Promise.race([
    proxyPromise.then(success => ({ type: 'proxy', success })),
    fallbackTimer,
  ]);

  if (raceResult.type === 'timeout') {
    DeviceBridge.speakNative(text);
    proxyPromise.then(audio => {
      if (audio && currentPlayingAudio) {
        cleanupAudio(currentPlayingAudio);
        currentPlayingAudio = null;
      }
    }).catch(() => {});
  } else if (raceResult.type === 'proxy' && !(raceResult as any).success) {
    DeviceBridge.speakNative(text);
  }
}

export { playTone, speak };
