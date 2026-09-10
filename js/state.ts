import logger from './utils/logger.js';

export interface AppStats {
  totalWords: number;
  learnedWords: number;
  pendingReviews: number;
  todayReviews: number;
  wrongWords: number;
}

export interface AppUIState {
  currentView: string;
  isLoading: boolean;
  toastMessage: string | null;
  modalOpen: boolean;
}

export interface IAppState {
  semanticInterfered: boolean;
  studyFlipped: boolean;
  reviewFlipped: boolean;
  clozeModeEnabled: boolean;
  currentTheme: string;
  isOnline: boolean;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  stats: AppStats;
  ui: AppUIState;
  listeners: Map<string, Set<(newValue: any, oldValue: any, key: string) => void>>;
  set(key: string, value: any): void;
  get(key: string): any;
  subscribe(key: string, callback: (newValue: any, oldValue: any, key: string) => void): () => void;
  notify(key: string, newValue: any, oldValue: any): void;
  reset(): void;
  batchUpdate(updates: Record<string, any>): void;
  [key: string]: any;
}

const AppState: IAppState = {
  semanticInterfered: false,
  studyFlipped: false,
  reviewFlipped: false,
  clozeModeEnabled: false,
  currentTheme: 'light',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncTime: null,
  syncInProgress: false,
  stats: {
    totalWords: 0,
    learnedWords: 0,
    pendingReviews: 0,
    todayReviews: 0,
    wrongWords: 0,
  },
  ui: {
    currentView: 'study',
    isLoading: false,
    toastMessage: null,
    modalOpen: false,
  },

  listeners: new Map(),

  set(key: string, value: any) {
    const protectedKeys = ['listeners', 'set', 'get', 'subscribe', 'notify', 'reset', 'batchUpdate'];
    if (protectedKeys.includes(key)) {
      logger.warn(`[AppState] 不允许覆盖内部属性: ${key}`);
      return;
    }
    const oldValue = this[key];
    this[key] = value;
    this.notify(key, value, oldValue);
  },

  get(key: string) {
    return this[key];
  },

  subscribe(key: string, callback: (newValue: any, oldValue: any, key: string) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  },

  notify(key: string, newValue: any, oldValue: any) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!.forEach(callback => {
        callback(newValue, oldValue, key);
      });
    }
  },

  reset() {
    this.semanticInterfered = false;
    this.studyFlipped = false;
    this.reviewFlipped = false;
    this.clozeModeEnabled = false;
    this.currentTheme = 'light';
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.stats = {
      totalWords: 0,
      learnedWords: 0,
      pendingReviews: 0,
      todayReviews: 0,
      wrongWords: 0,
    };
    this.ui = {
      currentView: 'study',
      isLoading: false,
      toastMessage: null,
      modalOpen: false,
    };
  },

  batchUpdate(updates: Record<string, any>) {
    const changes: Array<{ key: string; newValue: any; oldValue: any }> = [];
    for (const [key, value] of Object.entries(updates)) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const oldValue = this[key];
        this[key] = value;
        changes.push({ key, newValue: value, oldValue });
      }
    }

    for (const { key, newValue, oldValue } of changes) {
      this.notify(key, newValue, oldValue);
    }
  },
};

function createReactiveState(state: IAppState): IAppState {
  function trigger(key: string, newValue: any, oldValue: any) {
    if (state.listeners.has(key)) {
      state.listeners.get(key)!.forEach(callback => {
        callback(newValue, oldValue, key);
      });
    }
  }

  const handler: ProxyHandler<IAppState> = {
    get(target: any, prop: string | symbol, receiver: any) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value === 'function') {
        return value.bind(target);
      }

      if (
        value instanceof Map ||
        value instanceof Set ||
        value instanceof WeakMap ||
        value instanceof WeakSet
      ) {
        return value;
      }

      if (typeof value === 'object' && value !== null && typeof prop === 'string' && !prop.startsWith('_')) {
        return new Proxy(value, {
          get(nestedTarget: any, nestedProp: string | symbol, nestedReceiver: any) {
            return Reflect.get(nestedTarget, nestedProp, nestedReceiver);
          },

          set(nestedTarget: any, nestedProp: string | symbol, nestedValue: any) {
            const oldValue = nestedTarget[nestedProp];
            const result = Reflect.set(nestedTarget, nestedProp, nestedValue);

            if (result) {
              trigger(String(prop), nestedTarget, oldValue);
            }

            return result;
          },
        });
      }

      return value;
    },

    set(target: any, prop: string | symbol, value: any, receiver: any) {
      if (
        prop === 'listeners' ||
        prop === 'batchUpdate' ||
        prop === 'subscribe' ||
        prop === 'notify' ||
        prop === 'reset'
      ) {
        return Reflect.set(target, prop, value, receiver);
      }

      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);

      if (result && oldValue !== value) {
        trigger(String(prop), value, oldValue);
      }

      return result;
    },

    deleteProperty(target: any, prop: string | symbol) {
      const oldValue = target[prop];
      const result = Reflect.deleteProperty(target, prop);

      if (result) {
        trigger(String(prop), undefined, oldValue);
      }

      return result;
    },
  };

  return new Proxy(state, handler);
}

const ReactiveAppState = createReactiveState(AppState);

function watch(
  keys: string | string[],
  callback: (values: Record<string, any>, meta: { key?: string | null; newValue?: any; oldValue?: any }) => void,
  options: { immediate?: boolean } = { immediate: false }
): () => void {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  const handler = (newValue: any, oldValue: any, key: string) => {
    if (keyArray.includes(key)) {
      const values: Record<string, any> = {};
      for (const k of keyArray) {
        values[k] = ReactiveAppState[k];
      }
      callback(values, { key, newValue, oldValue });
    }
  };

  for (const key of keyArray) {
    ReactiveAppState.subscribe(key, handler);
  }

  if (options.immediate) {
    const values: Record<string, any> = {};
    for (const key of keyArray) {
      values[key] = ReactiveAppState[key];
    }
    callback(values, { key: null, newValue: null, oldValue: null });
  }

  return () => {
    for (const key of keyArray) {
      const listeners = ReactiveAppState.listeners.get(key);
      if (listeners) {
        listeners.delete(handler);
      }
    }
  };
}

if (typeof window !== 'undefined' && !(window as any).__appStateListenersAdded) {
  window.addEventListener('online', () => {
    ReactiveAppState.set('isOnline', true);
  });

  window.addEventListener('offline', () => {
    ReactiveAppState.set('isOnline', false);
  });

  (window as any).__appStateListenersAdded = true;
}

export { AppState, ReactiveAppState, watch };
