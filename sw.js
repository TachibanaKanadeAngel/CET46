import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// L2 修复：音频缓存版本化，升级后清理旧版缓存
const AUDIO_CACHE_NAME = 'cet46-audio-cache-v1';
const AUDIO_CACHE_LEGACY_NAMES = ['cet46-audio-cache'];
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

// L2 修复：维护访问时间 Map，实现真正的 LRU 淘汰（Cache API 仅保留插入顺序）
const audioAccessTimes = new Map();

function recordAudioAccess(url) {
  audioAccessTimes.set(url, Date.now());
}

async function cleanupStaleAccessTimes() {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const keys = await cache.keys();
  const liveUrls = new Set(keys.map(k => k.url));
  for (const url of audioAccessTimes.keys()) {
    if (!liveUrls.has(url)) {
      audioAccessTimes.delete(url);
    }
  }
}

async function limitAudioCacheLRU(maxItems = MAX_AUDIO_CACHE_ITEMS) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // L2: 按访问时间排序（最久未访问优先淘汰），无访问记录的视为最旧
    const now = Date.now();
    const sortedKeys = keys.sort((a, b) => {
      const timeA = audioAccessTimes.get(a.url) || 0;
      const timeB = audioAccessTimes.get(b.url) || 0;
      return timeA - timeB;
    });

    const deleteCount = Math.min(50, sortedKeys.length - maxItems + 50);
    console.log(`🗑️ LRU: 删除 ${deleteCount} 个最久未访问音频缓存 (当前: ${keys.length})`);

    await Promise.all(sortedKeys.slice(0, deleteCount).map(key => {
      audioAccessTimes.delete(key.url);
      return cache.delete(key);
    }));

    await cleanupStaleAccessTimes();

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

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // L2: 清理旧版（无版本号）音频缓存
    await Promise.all(
      AUDIO_CACHE_LEGACY_NAMES.map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('chrome-extension')) return;

  const isAudioRequest = e.request.url.includes('dictvoice') ||
                         e.request.url.includes('audio') ||
                         e.request.url.includes('.mp3');

  if (isAudioRequest) {
    // 安全：音频请求也必须通过域名白名单校验，防止 SW 被用作数据外泄通道
    if (!isAllowedDomain(e.request.url)) {
      console.warn('Blocked audio fetch for non-whitelisted domain:', new URL(e.request.url).hostname);
      e.respondWith(new Response('Blocked by CSP', { status: 403 }));
      return;
    }
    e.respondWith(
      caches.match(e.request).then(async cachedRes => {
        if (cachedRes) {
          // L2: 记录访问时间，供真正 LRU 淘汰使用
          recordAudioAccess(e.request.url);
          return cachedRes;
        }

        try {
          const fetchRes = await fetchWithTimeout(e.request.url, FETCH_TIMEOUT);
          if (fetchRes && fetchRes.ok && fetchRes.type !== 'opaque') {
            const cache = await caches.open(AUDIO_CACHE_NAME);
            cache.put(e.request, fetchRes.clone());
            recordAudioAccess(e.request.url);
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
  // 安全：skipWaiting 需要验证来源
  if (e.data === 'skipWaiting') {
    if (e.source && e.source.id) {
      self.skipWaiting();
    }
    return;
  }
  
  if (!e.data || typeof e.data !== 'object' || !e.data.type) return;
  
  // 安全：验证消息来源——实际调用 clients.get 验证客户端存在
  const verifyClient = async () => {
    if (!e.source || !e.source.id) return false;
    try {
      const client = await self.clients.get(e.source.id);
      return !!client;
    } catch {
      return false;
    }
  };
  
  if (e.data.type === 'CACHE_AUDIO') {
    const originalUrl = e.data.url;
    // 安全：校验音频请求域名，仅允许白名单域名
    if (!isAllowedDomain(originalUrl)) {
      console.warn('Blocked CACHE_AUDIO for non-whitelisted domain:', originalUrl);
      return;
    }

    (async () => {
      if (!(await verifyClient())) {
        console.warn('Blocked CACHE_AUDIO from unverified client');
        return;
      }
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
        recordAudioAccess(originalUrl);
        console.log('Audio cached:', originalUrl);

        await limitAudioCacheLRU();

        const quota = await getCacheQuotaUsage();
        if (quota) {
          console.log(`Cache quota: ${quota.percent}% (${(quota.usage / 1024 / 1024).toFixed(2)}MB / ${(quota.quota / 1024 / 1024).toFixed(0)}MB)`);
        }
      } catch (err) {
        console.warn('External audio CORS not supported or timeout:', err.message);
      }
    })();
  }

  if (e.data.type === 'CACHE_VOCAB') {
    const vocabUrl = e.data.url;
    // 安全：校验词库请求域名
    if (!isAllowedDomain(vocabUrl)) {
      console.warn('Blocked CACHE_VOCAB for non-whitelisted domain:', vocabUrl);
      return;
    }
    (async () => {
      if (!(await verifyClient())) {
        console.warn('Blocked CACHE_VOCAB from unverified client');
        return;
      }
      const cache = await caches.open(AUDIO_CACHE_NAME);
      try {
        await cache.add(vocabUrl);
        console.log('Vocabulary cached:', vocabUrl);
      } catch (err) {
        console.warn('Vocabulary cache failed:', err);
      }
    })();
  }
  
  if (e.data.type === 'GET_QUOTA') {
    (async () => {
      const quota = await getCacheQuotaUsage();
      e.ports[0].postMessage(quota);
    })();
  }
  
  if (e.data.type === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE_NAME).then(() => {
      audioAccessTimes.clear();
      console.log('Audio cache cleared');
      e.ports[0].postMessage({ success: true });
    });
  }
  
  if (e.data.type === 'CLEAR_ALL_CACHE') {
    caches.keys().then(keys => {
      // 安全：保护 Workbox 预缓存不被清除，避免破坏离线能力
      const safeKeys = keys.filter(k => !k.startsWith('workbox-precache'));
      Promise.all(safeKeys.map(k => caches.delete(k))).then(() => {
        console.log('All caches cleared (precache preserved)');
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
    // 安全：校验请求目标域名白名单，防止CSP绕过
    if (!isAllowedDomain(url)) {
      e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: '目标域名不在白名单中' });
      return;
    }
    // 安全：验证消息来源
    (async () => {
      if (!(await verifyClient())) {
        e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: '消息来源未验证' });
        return;
      }
      try {
        const response = await fetchWithRetry(url, options);
        const body = await response.text();
        e.ports[0].postMessage({ type: 'NETWORK_SUCCESS', status: response.status, headers: Object.fromEntries(response.headers.entries()), body });
      } catch (err) {
        e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: err.message });
      }
    })();
  }
  
  if (e.data.type === 'NETWORK_FETCH_PROXY') {
    const { originalUrl, options } = e.data;
    // 安全：校验请求目标域名白名单，防止CSP绕过
    if (!isAllowedDomain(originalUrl)) {
      e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: '目标域名不在白名单中' });
      return;
    }
    // 安全：验证消息来源
    (async () => {
      if (!(await verifyClient())) {
        e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: '消息来源未验证' });
        return;
      }
      try {
        const response = await fetchWithProxyFallback(originalUrl, options);
        const body = await response.text();
        e.ports[0].postMessage({ type: 'NETWORK_SUCCESS', status: response.status, headers: Object.fromEntries(response.headers.entries()), body });
      } catch (err) {
        e.ports[0].postMessage({ type: 'NETWORK_ERROR', error: err.message });
      }
    })();
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
    // 安全：校验索引范围
    if (typeof index === 'number' && index >= 0 && index < CORS_PROXIES.length) {
      currentProxyIndex = index;
      console.log(`设置当前代理索引: ${index}`);
    }
  }
  
  if (e.data.type === 'GET_CURRENT_PROXY') {
    e.ports[0].postMessage({
      index: currentProxyIndex,
      proxy: CORS_PROXIES[currentProxyIndex]
    });
  }
});
