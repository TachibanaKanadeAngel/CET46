import { ReactiveAppState } from '../state.js';
import { isFileProtocol } from './worker-pool.js';
import { UI } from '../ui.js';
import { WORDS } from '../data/vocab-store.js';
import logger from './logger.js';

interface StatusRow {
  label: string;
  value: string;
}

interface StatusPanelOptions {
  note?: string;
  closeText?: string;
}

/** showStatusPanel 由 toast-ext.js 运行时补丁注入到 UI 上，此处显式声明其类型。 */
function showStatusPanel(title: string, rows: StatusRow[], options?: StatusPanelOptions): void {
  (UI as unknown as {
    showStatusPanel: (t: string, r: StatusRow[], o?: StatusPanelOptions) => void;
  }).showStatusPanel(title, rows, options);
}

async function queryOfflineAudioCount(): Promise<number | null> {
  if (!navigator.serviceWorker?.controller) return null;
  try {
    const cacheNames = await caches.keys();
    const audioCache = cacheNames.find(name => name.includes('audio'));
    if (!audioCache) return null;

    const cache = await caches.open(audioCache);
    const keys = await cache.keys();
    return keys.length;
  } catch (e) {
    logger.debug('[Offline] 缓存键枚举失败:', (e as Error).message);
    return null;
  }
}

async function updateOfflineIndicator(indicator: HTMLElement, isOnline: boolean): Promise<void> {
  if (!isOnline) {
    indicator.textContent = '📴';
    indicator.title = '资源状态：当前为离线模式';
    indicator.setAttribute('aria-label', '资源状态');
    return;
  }

  indicator.textContent = '📦';
  indicator.title = '资源状态';
  indicator.setAttribute('aria-label', '资源状态');

  const count = await queryOfflineAudioCount();
  if (count !== null && count > 100) {
    indicator.title = `资源状态：已缓存 ${count} 项离线资源`;
  }
}

function setupNetworkStatusListener(): void {
  const banner = document.getElementById('offline-banner');
  const offlineIndicator = document.getElementById('offline-indicator');
  const statusDot = document.getElementById('network-status-dot');

  async function updateOnlineStatus(): Promise<void> {
    const isOnline = navigator.onLine;

    if (banner) {
      banner.style.display = isOnline ? 'none' : 'block';
    }

    if (offlineIndicator) {
      await updateOfflineIndicator(offlineIndicator, isOnline);
    }

    if (statusDot) {
      statusDot.className = isOnline ? 'status-dot online' : 'status-dot offline';
      statusDot.title = '网络状态';
      statusDot.setAttribute('aria-label', '网络状态');
    }

    ReactiveAppState.set('isOnline', isOnline);
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

function showResourceStatusPanel(): void {
  const isFileMode = isFileProtocol();
  const totalWords = Array.isArray(WORDS) ? WORDS.length : 0;
  showStatusPanel(
    '资源状态',
    [
      { label: '本地资源', value: isFileMode ? '已启用' : '按环境加载' },
      { label: '离线词库', value: totalWords > 0 ? `已加载 ${totalWords} 个词条` : '等待初始化' },
      { label: '当前模式', value: isFileMode ? 'file:// 本地版' : '在线版' },
    ],
    {
      note: isFileMode
        ? '当前为本地资源模式，常用词库已内置，可直接学习。'
        : '当前为在线模式，可按需使用缓存和同步功能。',
      closeText: '关闭说明',
    }
  );
}

function showNetworkStatusPanel(): void {
  const isFileMode = isFileProtocol();
  const isOnline = navigator.onLine;
  const syncState = isFileMode
    ? '本地版不使用在线同步'
    : isOnline
      ? '可联网，可检查更新或同步'
      : '当前离线，暂不可同步';

  showStatusPanel(
    '网络状态',
    [
      { label: '网络连接', value: isOnline ? '在线' : '离线' },
      { label: '运行模式', value: isFileMode ? '本地模式' : '在线模式' },
      { label: '同步/更新', value: syncState },
    ],
    {
      note: isFileMode
        ? '你正在使用 file:// 本地版，适合离线学习。'
        : '在线模式下可继续使用同步、更新和远程资源能力。',
      closeText: '关闭说明',
    }
  );
}

export { setupNetworkStatusListener, showResourceStatusPanel, showNetworkStatusPanel };