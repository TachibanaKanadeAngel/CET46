import { CONFIG } from './config.js';

let currentProxyIndex = 0;
let requestStats = {
  total: 0,
  success: 0,
  failed: 0,
  proxyStats: {}
};

CONFIG.CORS_PROXIES.forEach(proxy => {
  requestStats.proxyStats[proxy] = { success: 0, failed: 0 };
});

const Network = {
  async fetchWithProxy(originalUrl, options = {}) {
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
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          currentProxyIndex = activeIndex;
          requestStats.success++;
          requestStats.proxyStats[proxy].success++;
          return response;
        }
      } catch (err) {
        requestStats.failed++;
        requestStats.proxyStats[proxy].failed++;
        console.warn(`代理 ${proxy} 失效:`, err.message);
      }
    }
    
    throw new Error('所有 CORS 代理均不可用，请检查网络环境');
  },

  async fetchWithRetry(url, options = {}, retries = CONFIG.FETCH_RETRIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok && response.status >= 500 && retries > 0) {
        throw new Error(`Server Error: ${response.status}`);
      }
      
      requestStats.success++;
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      requestStats.failed++;
      
      if (retries > 0) {
        const delay = CONFIG.FETCH_BACKOFF * (CONFIG.FETCH_RETRIES - retries + 1);
        console.warn(`请求失败，${delay}ms 后重试...`);
        await new Promise(res => setTimeout(res, delay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      throw err;
    }
  },

  async fetchAudio(word) {
    const originalUrl = `${CONFIG.AUDIO_BASE_URL}?audio=${encodeURIComponent(word)}&type=2`;
    return this.fetchWithProxy(originalUrl, { timeout: 8000 });
  },

  getStats() {
    return {
      ...requestStats,
      currentProxy: CONFIG.CORS_PROXIES[currentProxyIndex],
      successRate: requestStats.total > 0 
        ? (requestStats.success / requestStats.total * 100).toFixed(2) 
        : 0
    };
  },

  resetStats() {
    requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      proxyStats: {}
    };
    CONFIG.CORS_PROXIES.forEach(proxy => {
      requestStats.proxyStats[proxy] = { success: 0, failed: 0 };
    });
  },

  getCurrentProxy() {
    return CONFIG.CORS_PROXIES[currentProxyIndex];
  },

  getProxies() {
    return [...CONFIG.CORS_PROXIES];
  }
};

export { Network, currentProxyIndex };
