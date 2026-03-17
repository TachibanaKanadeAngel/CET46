import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const AUDIO_CACHE_NAME = 'cet46-audio-cache';
const MAX_AUDIO_CACHE_ITEMS = 500;
const FETCH_TIMEOUT = 15000;
const FETCH_RETRIES = 3;
const FETCH_BACKOFF = 1000;

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

const ALLOWED_CONNECT_DOMAINS = [
  'api.allorigins.win',
  'corsproxy.io',
  'api.codetabs.com',
  'dict.youdao.com',
  'cdn.jsdelivr.net',
  'raw.githubusercontent.com'
];

let currentProxyIndex = 0;

async function limitAudioCacheLRU(maxItems = MAX_AUDIO_CACHE_ITEMS) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = Math.min(50, keys.length - maxItems + 50);
    console.log(`🗑️ LRU: 删除 ${deleteCount} 个最旧音频缓存 (当前: ${keys.length})`);
    
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    
    const quota = await getCacheQuotaUsage();
    if (quota) {
      console.log(`📊 缓存配额: ${quota.percent}% (${(quota.usage / 1024 / 1024).toFixed(2)}MB)`);
    }
  }
}

async function getCacheQuotaUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percent: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
}

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchWithRetry(url, options = {}, retries = FETCH_RETRIES, backoff = FETCH_BACKOFF) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status >= 500 && retries > 0) {
      throw new Error(`Server Error: ${response.status}`);
    }
    
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (retries > 0) {
      const delay = backoff * (FETCH_RETRIES - retries + 1);
      console.warn(`请求失败 (${err.message})，${delay}ms 后进行第 ${FETCH_RETRIES - retries + 1} 次重试...`);
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, backoff);
    }
    
    throw err;
  }
}

async function fetchWithProxyFallback(originalUrl, options = {}) {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    const proxiedUrl = proxy + encodeURIComponent(originalUrl);
    
    try {
      const response = await fetchWithTimeout(proxiedUrl, FETCH_TIMEOUT);
      if (response.ok) {
        console.log(`✅ 代理 ${proxy} 成功`);
        return response;
      }
    } catch (err) {
      console.warn(`代理 ${proxy} 失效:`, err.message);
    }
  }
  
  throw new Error('所有 CORS 代理均不可用，请检查网络环境');
}

function isAllowedDomain(url) {
  try {
    const urlObj = new URL(url);
    return ALLOWED_CONNECT_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

self.addEventListener('fetch', e => {
  if (e.request.url.includes('chrome-extension')) return;
  
  const isAudioRequest = e.request.url.includes('dictvoice') || 
                         e.request.url.includes('audio') ||
                         e.request.url.includes('.mp3');
  
  if (isAudioRequest) {
    e.respondWith(
      caches.match(e.request).then(async cachedRes => {
        if (cachedRes) return cachedRes;
        
        try {
          const fetchRes = await fetchWithTimeout(e.request.url, FETCH_TIMEOUT);
          if (fetchRes && fetchRes.ok && fetchRes.type !== 'opaque') {
            const cache = await caches.open(AUDIO_CACHE_NAME);
            cache.put(e.request, fetchRes.clone());
            await limitAudioCacheLRU();
          }
          return fetchRes;
        } catch (err) {
          return new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }
  
  if (!isAllowedDomain(e.request.url) && e.request.url.startsWith('https://')) {
    console.warn('Blocked request to non-whitelisted domain:', new URL(e.request.url).hostname);
    e.respondWith(new Response('Blocked by CSP', { status: 403 }));
    return;
  }
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  
  if (e.data.type === 'CACHE_AUDIO') {
    const originalUrl = e.data.url;
    
    (async () => {
      try {
        let res = await fetchWithTimeout(originalUrl, FETCH_TIMEOUT).catch(() => null);
        
        if (!res || !res.ok) {
          res = await fetchWithProxyFallback(originalUrl).catch(() => null);
        }
        
        if (!res || res.type === 'opaque') {
          console.warn('Opaque Response detected, rejecting cache to prevent quota explosion');
          return;
        }
        if (!res.ok) {
          console.warn('Audio request failed:', res.status);
          return;
        }
        
        const cache = await caches.open(AUDIO_CACHE_NAME);
        await cache.put(originalUrl, res);
        console.log('✅ Audio cached:', originalUrl);
        
        await limitAudioCacheLRU();
        
        const quota = await getCacheQuotaUsage();
        if (quota) {
          console.log(`📊 Cache quota: ${quota.percent}% (${(quota.usage / 1024 / 1024).toFixed(2)}MB / ${(quota.quota / 1024 / 1024).toFixed(0)}MB)`);
        }
      } catch (err) {
        console.warn('External audio CORS not supported or timeout:', err.message);
      }
    })();
  }
  
  if (e.data.type === 'CACHE_VOCAB') {
    const vocabUrl = e.data.url;
    caches.open(AUDIO_CACHE_NAME).then(cache => {
      cache.add(vocabUrl).then(() => {
        console.log('Vocabulary cached:', vocabUrl);
      }).catch(err => {
        console.warn('Vocabulary cache failed:', err);
      });
    });
  }
  
  if (e.data.type === 'GET_QUOTA') {
    (async () => {
      const quota = await getCacheQuotaUsage();
      e.ports[0].postMessage(quota);
    })();
  }
  
  if (e.data.type === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE_NAME).then(() => {
      console.log('Audio cache cleared');
      e.ports[0].postMessage({ success: true });
    });
  }
  
  if (e.data.type === 'CLEAR_ALL_CACHE') {
    caches.keys().then(keys => {
      Promise.all(keys.map(k => caches.delete(k))).then(() => {
        console.log('All caches cleared');
        e.ports[0].postMessage({ success: true });
      });
    });
  }
  
  if (e.data.type === 'GET_CACHE_STATS') {
    (async () => {
      const audioCache = await caches.open(AUDIO_CACHE_NAME);
      const audioKeys = await audioCache.keys();
      const quota = await getCacheQuotaUsage();
      
      e.ports[0].postMessage({
        audioCacheCount: audioKeys.length,
        quota
      });
    })();
  }
  
  if (e.data.type === 'NETWORK_FETCH') {
    const { url, options } = e.data;
    fetchWithRetry(url, options).then(response => {
      e.ports[0].postMessage({ type: 'NETWORK_SUCCESS', response });
    }).catch(err => {
      e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: err.message });
    });
  }
  
  if (e.data.type === 'NETWORK_FETCH_PROXY') {
    const { originalUrl, options } = e.data;
    fetchWithProxyFallback(originalUrl, options).then(response => {
      e.ports[0].postMessage({ type: 'NETWORK_SUCCESS', response });
    }).catch(err => {
      e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: err.message });
    });
  }
  
  if (e.data.type === 'GET_PROXY_STATS') {
    e.ports[0].postMessage({
      proxies: CORS_PROXIES,
      currentIndex: 0,
      stats: {
        total: 0,
        success: 0,
        failed: 0,
        proxyStats: {}
      }
    });
  }
  
  if (e.data.type === 'SET_CURRENT_PROXY') {
    const { index } = e.data;
    currentProxyIndex = index;
    console.log(`设置当前代理索引: ${index}`);
  }
  
  if (e.data.type === 'GET_CURRENT_PROXY') {
    e.ports[0].postMessage({
      index: currentProxyIndex,
      proxy: CORS_PROXIES[currentProxyIndex]
    });
  }
});
