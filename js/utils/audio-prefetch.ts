import { CONFIG } from '../config.js';
import logger from './logger.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const requestedUrls = new Set<string>();

interface AudioWord {
  word?: string;
  [key: string]: unknown;
}

export async function prefetchAudioLibrary(words: AudioWord[] | null | undefined): Promise<void> {
  if (!Array.isArray(words) || words.length === 0) return;
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

  const max = CONFIG.CONSTANTS.AUDIO_PREFETCH_MAX;
  const concurrency = CONFIG.CONSTANTS.AUDIO_PREFETCH_CONCURRENCY;
  const delay = CONFIG.CONSTANTS.AUDIO_PREFETCH_BATCH_DELAY;
  const toPrefetch: string[] = [];
  for (const w of words.slice(0, max)) {
    const word = w && w.word;
    if (!word) continue;
    const url = `${CONFIG.AUDIO_BASE_URL}?audio=${encodeURIComponent(word)}&type=2`;
    if (requestedUrls.has(url)) continue;
    requestedUrls.add(url);
    toPrefetch.push(url);
  }

  if (toPrefetch.length === 0) return;
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  logger.info(`[AudioPrefetch] 开始预缓存 ${toPrefetch.length} 个音频`);

  for (let i = 0; i < toPrefetch.length; i += concurrency) {
    const batch = toPrefetch.slice(i, i + concurrency);
    batch.forEach(url => {
      controller.postMessage({ type: 'CACHE_AUDIO', url });
    });
    if (i + concurrency < toPrefetch.length) {
      await sleep(delay);
    }
  }

  logger.info(`[AudioPrefetch] 预缓存请求已发送`);
}