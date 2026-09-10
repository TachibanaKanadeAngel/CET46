/**
 * 多标签页状态同步与通信工具 (Cross-Tab State Sync)
 * 解决多 Tab 并发学习/修改设置时的状态漂移与脏写覆盖问题
 */

export interface TabSyncMessage<T = unknown> {
  type: 'PROGRESS_UPDATED' | 'SETTINGS_UPDATED' | 'CLOUD_RESTORED' | 'PING';
  payload?: T;
  timestamp: number;
  senderId: string;
}

type TabSyncHandler<T = unknown> = (msg: TabSyncMessage<T>) => void;

const CHANNEL_NAME = 'cet46_tab_sync_channel';
const STORAGE_SYNC_KEY = '__cet46_tab_sync_event__';

// 生成当前标签页唯一 ID
const SENDER_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

let broadcastChannel: BroadcastChannel | null = null;
const listeners = new Set<TabSyncHandler>();

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel && typeof window.BroadcastChannel === 'function') {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
        if (event.data && event.data.senderId !== SENDER_ID) {
          notifyListeners(event.data);
        }
      };
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

function notifyListeners(msg: TabSyncMessage) {
  listeners.forEach(handler => {
    try {
      handler(msg);
    } catch {
      // 避免单个监听器异常影响其他监听器
    }
  });
}

// 降级支持：通过 localStorage 的 storage 事件（跨窗口触发，同窗口不触发）
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const msg = JSON.parse(event.newValue) as TabSyncMessage;
        if (msg && msg.senderId !== SENDER_ID) {
          notifyListeners(msg);
        }
      } catch {
        // 忽略畸变数据
      }
    }
  });
}

/**
 * 向其他标签页广播状态同步消息
 */
export function broadcastTabMessage<T = unknown>(
  type: TabSyncMessage['type'],
  payload?: T
): void {
  if (typeof window === 'undefined') return;

  const msg: TabSyncMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: SENDER_ID,
  };

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch {
      // Channel 异常时降级到 localStorage
      fallbackBroadcast(msg);
    }
  } else {
    fallbackBroadcast(msg);
  }
}

function fallbackBroadcast<T>(msg: TabSyncMessage<T>): void {
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
  } catch {
    // 忽略存储超限异常
  }
}

/**
 * 监听来自其他标签页的同步消息
 * @returns 取消监听的清理函数
 */
export function listenTabMessages<T = unknown>(
  handler: TabSyncHandler<T>
): () => void {
  getBroadcastChannel();
  listeners.add(handler as TabSyncHandler);
  return () => {
    listeners.delete(handler as TabSyncHandler);
  };
}

/**
 * 获取当前 Tab 的唯一客户端 ID
 */
export function getTabSenderId(): string {
  return SENDER_ID;
}
