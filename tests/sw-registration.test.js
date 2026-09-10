// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock('../js/utils/logger.js', () => ({
  default: loggerMock,
}));

describe('registerServiceWorker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    loggerMock.info.mockClear();
    loggerMock.warn.mockClear();
    loggerMock.error.mockClear();
    loggerMock.debug.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('skips registration on file protocol', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { protocol: 'file:' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: { register: vi.fn() } },
      writable: true,
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const { registerServiceWorker } = await import('../js/utils/sw-registration.js');
    registerServiceWorker();

    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(globalThis.navigator.serviceWorker.register).not.toHaveBeenCalled();
  });

  it('registers on window load and logs success', async () => {
    const stateChangeHandlers = [];
    const updateFoundHandlers = [];
    const controllerChangeHandlers = [];
    const reload = vi.fn();

    const registration = {
      waiting: null,
      installing: {
        state: 'installing',
        addEventListener: vi.fn((event, handler) => {
          if (event === 'statechange') stateChangeHandlers.push(handler);
        }),
      },
      addEventListener: vi.fn((event, handler) => {
        if (event === 'updatefound') updateFoundHandlers.push(handler);
      }),
    };

    Object.defineProperty(globalThis, 'location', {
      value: { protocol: 'http:' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { reload },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          controller: {},
          register: vi.fn().mockResolvedValue(registration),
          addEventListener: vi.fn((event, handler) => {
            if (event === 'controllerchange') controllerChangeHandlers.push(handler);
          }),
        },
      },
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('../js/utils/sw-registration.js');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(globalThis.navigator.serviceWorker.register).toHaveBeenCalledWith('sw.js');
    expect(loggerMock.info).toHaveBeenCalledWith('PWA Service Worker 注册成功');

    updateFoundHandlers[0]();
    registration.installing.state = 'installed';
    stateChangeHandlers[0]();

    expect(document.getElementById('update-notification')).not.toBeNull();

    controllerChangeHandlers[0]();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows update notification immediately when waiting worker exists', async () => {
    const waiting = { postMessage: vi.fn() };
    const registration = {
      waiting,
      installing: null,
      addEventListener: vi.fn(),
    };

    Object.defineProperty(globalThis, 'location', {
      value: { protocol: 'http:' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          controller: {},
          ready: Promise.resolve(registration),
          register: vi.fn().mockResolvedValue(registration),
          addEventListener: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('../js/utils/sw-registration.js');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    const notification = document.getElementById('update-notification');
    expect(notification).not.toBeNull();

    notification.querySelector('button').click();
    await Promise.resolve();
    expect(waiting.postMessage).toHaveBeenCalledWith('skipWaiting');
    expect(document.getElementById('update-notification')).toBeNull();
  });

  it('logs registration failures without throwing', async () => {
    Object.defineProperty(globalThis, 'location', {
      value: { protocol: 'http:' },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          register: vi.fn().mockRejectedValue(new Error('boom')),
          addEventListener: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('../js/utils/sw-registration.js');
    registerServiceWorker();
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    await Promise.resolve();

    expect(loggerMock.info).toHaveBeenCalledWith('Service Worker 注册失败:', expect.any(Error));
  });
});
