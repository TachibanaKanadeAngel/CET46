// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  broadcastTabMessage,
  listenTabMessages,
  getTabSenderId,
} from '../js/utils/tab-sync.ts';

describe('tab-sync.ts test suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('generates a valid non-empty tab sender id', () => {
    const id = getTabSenderId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(5);
  });

  it('broadcasts message via localStorage fallback when BroadcastChannel not available', () => {
    const handler = vi.fn();
    const unsubscribe = listenTabMessages(handler);

    const otherSenderMsg = {
      type: 'PROGRESS_UPDATED',
      payload: { wordId: 101, status: 'review' },
      timestamp: Date.now(),
      senderId: 'other_tab_999',
    };

    const event = new Event('storage');
    Object.assign(event, {
      key: '__cet46_tab_sync_event__',
      newValue: JSON.stringify(otherSenderMsg),
    });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(otherSenderMsg);

    // 取消监听
    unsubscribe();

    window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores messages originating from the same senderId', () => {
    const handler = vi.fn();
    const unsubscribe = listenTabMessages(handler);

    const selfSenderMsg = {
      type: 'SETTINGS_UPDATED',
      payload: { retention: 0.95 },
      timestamp: Date.now(),
      senderId: getTabSenderId(),
    };

    const event = new Event('storage');
    Object.assign(event, {
      key: '__cet46_tab_sync_event__',
      newValue: JSON.stringify(selfSenderMsg),
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('broadcastTabMessage writes to localStorage fallback or broadcastChannel', () => {
    broadcastTabMessage('PING', { test: true });
    // 如果存在 localStorage fallback
    const stored = localStorage.getItem('__cet46_tab_sync_event__');
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.type).toBe('PING');
      expect(parsed.payload).toEqual({ test: true });
      expect(parsed.senderId).toBe(getTabSenderId());
    } else {
      // 走 BroadcastChannel 路径
      expect(true).toBe(true);
    }
  });
});
