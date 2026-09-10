import { CONFIG } from './config.js';
import logger from './utils/logger.js';

let currentProxyIndex = 0;
let requestStats: {
  total: number;
  success: number;
  failed: number;
  proxyStats: Record<string, { success: number; failed: number }>;
} = {
  total: 0,
  success: 0,
  failed: 0,
  proxyStats: {},
};

CONFIG.CORS_PROXIES.forEach(proxy => {
  requestStats.proxyStats[proxy] = { success: 0, failed: 0 };
});

const Network = {
  _validateResponse(response: Response, url: string): boolean {
    const contentType = response.headers.get('content-type') || '';
    if (
      url.includes('dictvoice') &&
      !contentType.startsWith('audio/') &&
      !contentType.startsWith('application/octet-stream')
    ) {
      logger.warn(`[Network] 代理响应类型异常: ${contentType}，可能被篡改`);
      return false;
    }
    return true;
  },

  async fetchWithProxy(originalUrl: string, options: any = {}): Promise<Response> {
    const allowedDomains = CONFIG.ALLOWED_CONNECT_DOMAINS;
    try {
      const urlObj = new URL(originalUrl);
      if (!allowedDomains.includes(urlObj.hostname)) {
        throw new Error(`目标域名 ${urlObj.hostname} 不在白名单中，请求被拒绝`);
      }
    } catch (e: any) {
      if (e.message.includes('不在白名单中')) {
        return Promise.reject(e);
      }
      return Promise.reject(new Error('无效的目标 URL'));
    }

    const proxies = CONFIG.CORS_PROXIES;
    const timeout = options.timeout || CONFIG.FETCH_TIMEOUT;

    for (let i = 0; i < proxies.length; i++) {
      const activeIndex = (currentProxyIndex + i) % proxies.length;
      const proxy = proxies[activeIndex];
      const proxyUrl = proxy + encodeURIComponent(originalUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(proxyUrl, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          if (!this._validateResponse(response, originalUrl)) {
            requestStats.total++;
            requestStats.proxyStats[proxy].failed++;
            continue;
          }
          currentProxyIndex = activeIndex;
          requestStats.total++;
          requestStats.success++;
          requestStats.proxyStats[proxy].success++;
          return response;
        }
      } catch (err: any) {
        requestStats.total++;
        requestStats.failed++;
        requestStats.proxyStats[proxy].failed++;
        logger.warn(`代理 ${proxy} 失效:`, err.message);
      }
    }

    throw new Error('所有 CORS 代理均不可用，请检查网络环境');
  },

  async fetchWithRetry(url: string, options: any = {}, retries: number = CONFIG.FETCH_RETRIES): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          throw new Error(`Server Error: ${response.status}`);
        }
        requestStats.total++;
        requestStats.failed++;
        return response;
      }

      requestStats.total++;
      requestStats.success++;
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      requestStats.total++;
      requestStats.failed++;

      if (retries > 0 && !controller.signal.aborted) {
        const delay = CONFIG.FETCH_BACKOFF * (CONFIG.FETCH_RETRIES - retries + 1);
        logger.warn(`请求失败，${delay}ms 后重试...`);
        await new Promise(res => {
          setTimeout(res, delay);
        });
        return this.fetchWithRetry(url, options, retries - 1);
      }

      throw err;
    }
  },

  async fetchAudio(word: string): Promise<Response> {
    const originalUrl = `${CONFIG.AUDIO_BASE_URL}?audio=${encodeURIComponent(word)}&type=2`;
    return this.fetchWithProxy(originalUrl, { timeout: 8000 });
  },

  getStats(): any {
    return {
      ...requestStats,
      currentProxy: CONFIG.CORS_PROXIES[currentProxyIndex],
      successRate:
        requestStats.total > 0 ? ((requestStats.success / requestStats.total) * 100).toFixed(2) : 0,
    };
  },

  resetStats(): void {
    requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      proxyStats: {},
    };
    CONFIG.CORS_PROXIES.forEach(proxy => {
      requestStats.proxyStats[proxy] = { success: 0, failed: 0 };
    });
  },

  getCurrentProxy(): string {
    return CONFIG.CORS_PROXIES[currentProxyIndex];
  },

  getProxies(): string[] {
    return [...CONFIG.CORS_PROXIES];
  },
};

export { Network };
export default Network;
