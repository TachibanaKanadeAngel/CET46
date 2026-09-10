import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeviceBridge } from '../js/bridge.js';

const realWindow = globalThis.window;
const realNavigator = globalThis.navigator;

function setNavigator(ua) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: ua },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  setNavigator('Mozilla/5.0 (Windows NT 10.0)');
});

afterEach(() => {
  globalThis.window = realWindow;
  Object.defineProperty(globalThis, 'navigator', {
    value: realNavigator,
    configurable: true,
    writable: true,
  });
});

describe('getPlatform / isCapacitor / isElectron', () => {
  it('detects capacitor platform', () => {
    globalThis.window = { Capacitor: { platform: 'android' } };
    expect(DeviceBridge.getPlatform()).toBe('capacitor');
    expect(DeviceBridge.isCapacitor()).toBe(true);
    expect(DeviceBridge.isElectron()).toBe(false);
  });

  it('detects capacitor web platform as web', () => {
    globalThis.window = { Capacitor: { platform: 'web' } };
    expect(DeviceBridge.getPlatform()).toBe('web');
  });

  it('detects electron via user agent', () => {
    globalThis.window = {};
    setNavigator('Electron/42 Chrome/120');
    expect(DeviceBridge.getPlatform()).toBe('electron');
  });

  it('falls back to web', () => {
    globalThis.window = {};
    expect(DeviceBridge.getPlatform()).toBe('web');
  });
});

describe('sendLocalNotification', () => {
  it('sends via capacitor local notifications when granted', async () => {
    const schedule = vi.fn(async () => {});
    globalThis.window = {
      Capacitor: {
        platform: 'android',
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn(async () => ({ display: 'granted' })),
            schedule,
          },
        },
      },
    };
    const ok = await DeviceBridge.sendLocalNotification('title', 'body', 0);
    expect(ok).toBe(true);
    expect(schedule).toHaveBeenCalled();
  });

  it('falls back to HTML5 Notification when capacitor permission denied', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    globalThis.window = {
      Capacitor: {
        platform: 'android',
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn(async () => ({ display: 'denied' })),
          },
        },
      },
    };
    const ok = await DeviceBridge.sendLocalNotification('t', 'b', 0);
    expect(ok).toBe(false);
    info.mockRestore();
  });

  it('uses browser Notification API when granted', async () => {
    class FakeNotification {
      static permission = 'granted';
      constructor() {}
    }
    globalThis.Notification = FakeNotification;
    globalThis.window = { Notification: FakeNotification };
    const ok = await DeviceBridge.sendLocalNotification('t', 'b', 0);
    expect(ok).toBe(true);
    delete globalThis.Notification;
  });
});

describe('speakNative', () => {
  it('speaks via capacitor TextToSpeech', async () => {
    const speak = vi.fn(async () => {});
    globalThis.window = {
      Capacitor: {
        platform: 'ios',
        Plugins: { TextToSpeech: { speak } },
      },
      speechSynthesis: undefined,
    };
    const ok = await DeviceBridge.speakNative('hello');
    expect(ok).toBe(true);
    expect(speak).toHaveBeenCalled();
  });

  it('falls back to web speechSynthesis', async () => {
    class FakeSpeech {
      cancel() {}
      speak() {}
    }
    globalThis.window = { speechSynthesis: new FakeSpeech() };
    globalThis.SpeechSynthesisUtterance = class {}
    const ok = await DeviceBridge.speakNative('world');
    expect(ok).toBe(true);
  });

  it('returns false when no TTS engine available', async () => {
    globalThis.window = {};
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ok = await DeviceBridge.speakNative('none');
    expect(ok).toBe(false);
    warn.mockRestore();
  });
});

describe('scheduleNextReviewReminder', () => {
  it('does nothing when no due words', async () => {
    globalThis.window = {};
    await expect(DeviceBridge.scheduleNextReviewReminder([], () => null)).resolves.toBeUndefined();
  });

  it('schedules a reminder for the earliest review word', async () => {
    const schedule = vi.fn(async () => {});
    const cancel = vi.fn(async () => {});
    globalThis.window = {
      Capacitor: {
        platform: 'android',
        Plugins: {
          LocalNotifications: {
            requestPermissions: vi.fn(async () => ({ display: 'granted' })),
            schedule,
            cancel,
          },
        },
      },
    };
    const future = Date.now() + 60 * 1000;
    const getWordData = (id) =>
      id === 'review1' ? { status: 'review', nextReview: future } : { status: 'new' };
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await DeviceBridge.scheduleNextReviewReminder([{ id: 'new1' }, { id: 'review1' }], getWordData);
    expect(schedule).toHaveBeenCalled();
    info.mockRestore();
  });
});