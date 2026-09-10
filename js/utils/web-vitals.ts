import logger from './logger.js';

type MetricName = 'LCP' | 'FID' | 'INP' | 'CLS' | 'TTFB' | 'FCP';

interface MetricThreshold {
  good: number;
  poor: number;
}

const WebVitals = {
  metrics: {} as Record<string, number>,

  init(): void {
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
    this.measureFCP();
    this.measureINP();
    // P1-6 修复：页面隐藏时批量上报 RUM 指标（sendBeacon，不阻塞卸载）
    if ('visibilitychange' in document) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flushBeacon();
      });
    }
  },

  measureLCP(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const po = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      logger.debug('[WebVitals] LCP 观察器不可用:', (e as Error).message);
    }
  },

  measureFID(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const po = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.metrics.FID = (entry as unknown as { processingStart: number }).processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.FID);
        });
      });
      po.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      logger.debug('[WebVitals] FID 观察器不可用:', (e as Error).message);
    }
  },

  // P1-6 修复：新增 INP（Interaction to Next Paint）测量，FID 已被 INP 取代（2024-03）
  measureINP(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const po = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        // INP = 最慢的交互时长（剔除最高后取次慢，避免单次抖动）
        const durations = entries.map(e => e.duration).filter(d => d > 0).sort((a, b) => b - a);
        if (durations.length === 0) return;
        const inp = durations.length >= 2 ? durations[1] : durations[0];
        this.metrics.INP = inp;
        this.reportMetric('INP', inp);
      });
      po.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch (e) {
      logger.debug('[WebVitals] INP 观察器不可用:', (e as Error).message);
    }
  },

  measureCLS(): void {
    let clsValue = 0;
    if (!('PerformanceObserver' in window)) return;
    try {
      const po = new PerformanceObserver(entryList => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as { value?: number }).value || 0;
          }
        }
        this.metrics.CLS = clsValue;
        // P1-6 修复：CLS 之前只更新 metrics 不上报，现在补上 reportMetric 调用
        this.reportMetric('CLS', clsValue);
      });
      po.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      logger.debug('[WebVitals] CLS 观察器不可用:', (e as Error).message);
    }
  },

  measureTTFB(): void {
    // P2-9 修复：移除弃用的 performance.timing 回退，仅使用 PerformanceNavigationTiming
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        const ttfb = nav.responseStart - nav.requestStart;
        this.metrics.TTFB = ttfb;
        this.reportMetric('TTFB', ttfb);
      }
    } catch (e) {
      logger.debug('[WebVitals] PerformanceNavigationTiming 不可用:', (e as Error).message);
    }
  },

  measureFCP(): void {
    if (!('PerformanceObserver' in window)) return;
    try {
      const po = new PerformanceObserver(entryList => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });
      po.observe({ type: 'paint', buffered: true });
    } catch (e) {
      logger.debug('[WebVitals] FCP 观察器不可用:', (e as Error).message);
    }
  },

  reportMetric(name: MetricName, value: number): void {
    const thresholds: Record<MetricName, MetricThreshold> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 200, poor: 500 },
      FCP: { good: 1000, poor: 3000 },
    };
    const threshold = thresholds[name];
    if (!threshold) return;
    let rating: 'good' | 'poor' | 'needs-improvement' = 'good';
    if (value > threshold.poor) rating = 'poor';
    else if (value > threshold.good) rating = 'needs-improvement';
    if (value != null) {
      logger.info(`Web Vitals [${name}]: ${value.toFixed(2)}ms (${rating})`);
    }
    if (rating === 'poor') {
      logger.warn(`Web Vitals ${name} is poor, consider optimizing`);
    }
  },

  // P1-6 修复：批量上报 RUM 指标到 collector（如配置）
  flushBeacon(): void {
    if (!navigator.sendBeacon) return;
    const payload = JSON.stringify(this.metrics);
    try {
      // 上报到 /api/web-vitals（如部署端实现）；失败静默，不影响用户
      navigator.sendBeacon('/api/web-vitals', payload);
    } catch (_e) {
      // 静默失败
    }
  },

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  },

  getScore(): number {
    const m = this.metrics;
    let score = 100;
    if (m.LCP > 4000) score -= 25;
    else if (m.LCP > 2500) score -= 10;
    if (m.INP > 500) score -= 20;
    else if (m.INP > 200) score -= 8;
    if (m.FID > 300) score -= 15;
    else if (m.FID > 100) score -= 5;
    if (m.CLS > 0.25) score -= 25;
    else if (m.CLS > 0.1) score -= 10;
    if (m.TTFB > 500) score -= 15;
    else if (m.TTFB > 200) score -= 5;
    return Math.max(0, score);
  },
};

export { WebVitals };