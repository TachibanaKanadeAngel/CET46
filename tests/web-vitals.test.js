import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebVitals } from '../js/utils/web-vitals.js';

const realWindow = globalThis.window;
const realDocument = globalThis.document;
const realPerformance = globalThis.performance;
const realNavigator = globalThis.navigator;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

beforeEach(() => {
  setGlobal('window', {});
  setGlobal('document', {
    addEventListener: vi.fn(),
    visibilityState: 'visible',
  });
  setGlobal('performance', { now: () => 0 });
  setGlobal('navigator', {});
  WebVitals.metrics = {};
});

afterEach(() => {
  setGlobal('window', realWindow);
  setGlobal('document', realDocument);
  setGlobal('performance', realPerformance);
  setGlobal('navigator', realNavigator);
});

describe('WebVitals', () => {
  it('getMetrics returns a shallow copy', () => {
    WebVitals.metrics.LCP = 100;
    const m = WebVitals.getMetrics();
    expect(m.LCP).toBe(100);
    expect(m).not.toBe(WebVitals.metrics);
  });

  it('reportMetric ignores unknown names', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    WebVitals.reportMetric('UNKNOWN', 123);
    expect(info).not.toHaveBeenCalled();
    info.mockRestore();
  });

  it('reportMetric rates good / needs-improvement', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    WebVitals.reportMetric('LCP', 3000); // good<2500, poor>4000 -> needs-improvement
    expect(info.mock.calls.some((args) => args.join(' ').includes('needs-improvement'))).toBe(true);
    WebVitals.reportMetric('LCP', 1000); // good
    expect(warn).not.toHaveBeenCalled();
    info.mockRestore();
    warn.mockRestore();
  });

  it('reportMetric warns on poor rating', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    WebVitals.reportMetric('CLS', 0.3);
    expect(warn.mock.calls.some((args) => args.join(' ').includes('poor'))).toBe(true);
    warn.mockRestore();
  });

  it('measureTTFB reads navigation timing', () => {
    const getEntriesByType = vi.fn((type) =>
      type === 'navigation' ? [{ requestStart: 10, responseStart: 60 }] : []
    );
    setGlobal('performance', { getEntriesByType });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    WebVitals.measureTTFB();
    expect(WebVitals.metrics.TTFB).toBe(50);
    info.mockRestore();
  });

  it('flushBeacon sends beacon when available', () => {
    const sendBeacon = vi.fn();
    setGlobal('navigator', { sendBeacon });
    WebVitals.metrics.LCP = 100;
    WebVitals.flushBeacon();
    expect(sendBeacon).toHaveBeenCalledWith('/api/web-vitals', expect.any(String));
  });

  it('flushBeacon is a no-op without sendBeacon', () => {
    setGlobal('navigator', {});
    expect(() => WebVitals.flushBeacon()).not.toThrow();
  });

  it('getScore returns 100 for healthy metrics', () => {
    WebVitals.metrics = { LCP: 500, INP: 50, FID: 20, CLS: 0.01, TTFB: 80 };
    expect(WebVitals.getScore()).toBe(100);
  });

  it('getScore penalizes poor LCP and INP', () => {
    WebVitals.metrics = { LCP: 5000, INP: 600, FID: 30, CLS: 0.01, TTFB: 80 };
    expect(WebVitals.getScore()).toBe(100 - 25 - 20);
  });

  it('getScore clamps to 0 at the floor', () => {
    WebVitals.metrics = {
      LCP: 5000,
      INP: 600,
      FID: 400,
      CLS: 0.5,
      TTFB: 800,
    };
    expect(WebVitals.getScore()).toBe(0);
  });

  it('measures LCP, FID, INP, CLS, and FCP via PerformanceObserver', () => {
    const registeredObservers = {};
    class MockPerformanceObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe(options) {
        registeredObservers[options.type] = this.callback;
      }
    }

    setGlobal('PerformanceObserver', MockPerformanceObserver);
    window.PerformanceObserver = MockPerformanceObserver;

    WebVitals.init();

    // Trigger LCP
    if (registeredObservers['largest-contentful-paint']) {
      registeredObservers['largest-contentful-paint']({
        getEntries: () => [{ startTime: 1200 }],
      });
      expect(WebVitals.metrics.LCP).toBe(1200);
    }

    // Trigger FID
    if (registeredObservers['first-input']) {
      registeredObservers['first-input']({
        getEntries: () => [{ startTime: 100, processingStart: 150 }],
      });
      expect(WebVitals.metrics.FID).toBe(50);
    }

    // Trigger INP
    if (registeredObservers['event']) {
      registeredObservers['event']({
        getEntries: () => [{ duration: 80 }, { duration: 120 }],
      });
      expect(WebVitals.metrics.INP).toBe(80);
    }

    // Trigger CLS
    if (registeredObservers['layout-shift']) {
      registeredObservers['layout-shift']({
        getEntries: () => [{ value: 0.05, hadRecentInput: false }],
      });
      expect(WebVitals.metrics.CLS).toBe(0.05);
    }

    // Trigger FCP
    if (registeredObservers['paint']) {
      registeredObservers['paint']({
        getEntries: () => [
          { name: 'first-paint', startTime: 200 },
          { name: 'first-contentful-paint', startTime: 400 },
        ],
      });
      expect(WebVitals.metrics.FCP).toBe(400);
    }
  });
});