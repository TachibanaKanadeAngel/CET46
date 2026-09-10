// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const storeMock = {
  getMemoryCache: vi.fn(),
};

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const dateMock = {
  localDateStr: vi.fn((date) => {
    const d = date || new Date('2026-07-07T00:00:00Z');
    return d.toISOString().slice(0, 10);
  }),
};

vi.mock('../js/store.js', () => storeMock);
vi.mock('../js/utils/logger.js', () => ({ default: loggerMock }));
vi.mock('../js/utils/date.ts', () => dateMock);

describe('PWAWidgets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T10:00:00Z'));
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    loggerMock.info.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          controller: { postMessage: vi.fn() },
        },
        setAppBadge: vi.fn(),
        clearAppBadge: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    storeMock.getMemoryCache.mockReturnValue({
      progress: {
        toObject: () => ({
          1: { nextReview: Date.now() - 1000, level: 1 },
          2: { nextReview: Date.now() + 5000, level: 0 },
          3: { level: 2 },
        }),
      },
      heatmap: {
        toObject: () => ({
          '2026-07-07': 3,
          '2026-07-06': 1,
          '2026-07-05': 2,
        }),
      },
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.resetModules();
  });

  it('initializes and updates widget data when service worker is available', async () => {
    const { PWAWidgets } = await import('../js/widgets/pwa-widgets.js');
    const widgets = new PWAWidgets();

    await widgets.init();

    expect(loggerMock.info).toHaveBeenCalledWith('✅ PWA Widgets 初始化完成');
    expect(widgets.getWidgetData()).toEqual({
      pendingReviews: 1,
      todayLearned: 3,
      streak: 3,
      totalWords: 3,
      learnedWords: 2,
    });
    expect(globalThis.navigator.serviceWorker.controller.postMessage).toHaveBeenCalledWith({
      type: 'WIDGET_UPDATE',
      data: widgets.getWidgetData(),
    });
    expect(globalThis.navigator.setAppBadge).toHaveBeenCalledWith(1);
  });

  it('skips init when service worker is unsupported', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    const { PWAWidgets } = await import('../js/widgets/pwa-widgets.js');
    const widgets = new PWAWidgets();
    await widgets.init();

    expect(loggerMock.info).toHaveBeenCalledWith('⚠️ 不支持 Service Worker，跳过 Widget 初始化');
  });

  it('refreshes data on visibilitychange and stops auto update cleanly', async () => {
    const { PWAWidgets } = await import('../js/widgets/pwa-widgets.js');
    const widgets = new PWAWidgets();
    const spy = vi.spyOn(widgets, 'updateWidgetData');

    widgets.startAutoUpdate();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(spy).toHaveBeenCalledTimes(2);

    document.dispatchEvent(new Event('visibilitychange'));
    expect(spy).toHaveBeenCalledTimes(3);

    widgets.stopAutoUpdate();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('clears badge when there are no pending reviews', async () => {
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ 1: { nextReview: Date.now() + 99999, level: 1 } }) },
      heatmap: { toObject: () => ({}) },
    });

    const { PWAWidgets } = await import('../js/widgets/pwa-widgets.js');
    const widgets = new PWAWidgets();
    widgets.updateWidgetData();

    expect(globalThis.navigator.clearAppBadge).toHaveBeenCalled();
    expect(widgets.getWidgetData().pendingReviews).toBe(0);
  });

  it('renders preview and auto removes it after timeout', async () => {
    const { PWAWidgets } = await import('../js/widgets/pwa-widgets.js');
    const widgets = new PWAWidgets();
    widgets.updateWidgetData();

    await widgets.showWidgetPreview();
    expect(document.getElementById('widget-preview')).not.toBeNull();

    vi.advanceTimersByTime(10000);
    expect(document.getElementById('widget-preview')).toBeNull();
  });
});
