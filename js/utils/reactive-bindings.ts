import { watch } from '../state.js';
import { updateStats } from './stats.js';
import logger from './logger.js';

// 响应式状态值（部分字段可选），与 state 模块中的 store 结构对应。
type ReactiveValues = Record<string, unknown>;
interface ChangeInfo {
  key?: string | null;
  newValue?: unknown;
  oldValue?: unknown;
}

function setupReactiveBindings(): void {
  watch(['syncInProgress', 'isOnline'], (_values: ReactiveValues, { key, newValue }: ChangeInfo) => {
    if (key === 'syncInProgress') {
      const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement | null;
      if (syncBtn) {
        syncBtn.disabled = Boolean(newValue);
        syncBtn.textContent = newValue ? '同步中...' : '同步';
      }
    }

    if (key === 'isOnline') {
      const statusDot = document.getElementById('network-status-dot');
      if (statusDot) {
        statusDot.className = newValue ? 'status-dot online' : 'status-dot offline';
      }
    }
  });

  watch(['ui.isLoading'], (values: ReactiveValues) => {
    const app = document.getElementById('app');
    if (app) {
      const loading = (values as { ui?: { isLoading?: boolean } }).ui?.isLoading;
      if (loading) {
        app.classList.add('loading');
      } else {
        app.classList.remove('loading');
      }
    }
  });

  watch(['stats'], () => {
    updateStats();
  });

  logger.info('响应式绑定已设置');
}

export { setupReactiveBindings };