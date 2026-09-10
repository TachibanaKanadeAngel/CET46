const CACHE_NAME = 'cet46-cache-v3';
// 旧版缓存不再硬编码列表：activate 时按前缀批量清理，未来版本号升级自动失效
const CACHE_PREFIX = 'cet46-';

// S7 安全修复：缓存消息需校验目标域名白名单，防止同源 XSS 利用 SW 缓存任意跨域资源
// 与 config.js 的 ALLOWED_CONNECT_DOMAINS 保持一致
const ALLOWED_CACHE_DOMAINS = new Set([
  'api.allorigins.win',
  'corsproxy.io',
  'api.codetabs.com',
  'dict.youdao.com',
  'cdn.jsdelivr.net',
  'raw.githubusercontent.com',
]);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 前缀式清理：删除本应用所有旧版本缓存（cet46-cache-v1/v2 及未来任何历史版本），
      // 避免旧缓存中的旧 JS/旧 index.html 被继续命中导致模块加载错误（如 export 不匹配）
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate';
  const isWorker = url.pathname.endsWith('.js') && url.pathname.includes('worker');

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  if (isWorker) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // JS/CSS 模块资源：网络优先 + 缓存兜底。
  // 升级演练的核心修复：不再"先命中旧缓存"，避免旧版 JS/CSS 被反复命中导致
  // 模块 export 不匹配等损坏缓存态；仅在离线时回退缓存。
  if (/\.(js|mjs|css)(\?|$)/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// 处理来自主线程的缓存请求消息
self.addEventListener('message', (event) => {
  const { type, url } = event.data || {};

  // 安全：验证消息来源客户端
  if (!event.source || !event.source.id) return;
  self.clients.get(event.source.id).then(client => {
    if (!client) return; // 来源不可信，忽略

    if (!url) return;

    if (type === 'CACHE_AUDIO' || type === 'CACHE_VOCAB') {
      const targetUrl = new URL(url, self.location.origin);

      // S7 安全修复：跨域资源必须命中白名单才允许缓存，防止缓存投毒与磁盘耗尽
      if (targetUrl.origin !== self.location.origin &&
          !ALLOWED_CACHE_DOMAINS.has(targetUrl.hostname)) {
        return;
      }

      caches.open(CACHE_NAME).then(cache => {
        // S7 修复：跨域资源使用 no-cors 模式获取 opaque response
        // opaque response status=0 但可缓存，解决跨域音频无法缓存问题
        const fetchOptions = targetUrl.origin !== self.location.origin
          ? { mode: 'no-cors' }
          : {};
        fetch(targetUrl.href, fetchOptions).then(response => {
          // opaque response (跨域) status=0 视为可缓存；同域要求 ok
          if (response.ok || response.type === 'opaque') {
            cache.put(targetUrl.href, response);
          }
        }).catch(() => { /* 缓存失败不影响主流程 */ });
      });
    }
  });
});
