const AppState = {
  semanticInterfered: false,
  studyFlipped: false,
  reviewFlipped: false,
  clozeModeEnabled: false,
  currentTheme: 'light',
  isOnline: navigator.onLine,
  lastSyncTime: null,
  syncInProgress: false,
  stats: {
    totalWords: 0,
    learnedWords: 0,
    pendingReviews: 0,
    todayReviews: 0,
    wrongWords: 0
  },
  ui: {
    currentView: 'study',
    isLoading: false,
    toastMessage: null,
    modalOpen: false
  },
  
  listeners: new Map(),
  
  set(key, value) {
    const oldValue = this[key];
    this[key] = value;
    this.notify(key, value, oldValue);
  },
  
  get(key) {
    return this[key];
  },
  
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    return () => {
      this.listeners.get(key).delete(callback);
    };
  },
  
  notify(key, newValue, oldValue) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        callback(newValue, oldValue, key);
      });
    }
  },
  
  reset() {
    this.semanticInterfered = false;
    this.studyFlipped = false;
    this.reviewFlipped = false;
    this.clozeModeEnabled = false;
  },
  
  batchUpdate(updates) {
    const changes = [];
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
  }
};

function createReactiveState(state) {
  const dependencyMap = new Map();
  
  function track(key, callback) {
    if (!dependencyMap.has(key)) {
      dependencyMap.set(key, new Set());
    }
    dependencyMap.get(key).add(callback);
  }
  
  function trigger(key, newValue, oldValue) {
    if (dependencyMap.has(key)) {
      dependencyMap.get(key).forEach(callback => {
        callback(newValue, oldValue, key);
      });
    }
    
    if (state.listeners.has(key)) {
      state.listeners.get(key).forEach(callback => {
        callback(newValue, oldValue, key);
      });
    }
  }
  
  const handler = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      // 如果是方法，绑定正确的 this
      if (typeof value === 'function') {
        return value.bind(target);
      }
      
      // 如果是 Map/Set 等内置对象，不要包装 Proxy
      if (value instanceof Map || value instanceof Set || value instanceof WeakMap || value instanceof WeakSet) {
        return value;
      }
      
      if (typeof value === 'object' && value !== null && !prop.startsWith('_')) {
        return new Proxy(value, {
          get(nestedTarget, nestedProp, nestedReceiver) {
            const nestedValue = Reflect.get(nestedTarget, nestedProp, nestedReceiver);
            
            if (nestedProp !== 'toJSON' && nestedProp !== 'constructor' && 
                nestedProp !== 'hasOwnProperty' && nestedProp !== '__proto__') {
              track(prop, () => {});
            }
            
            return nestedValue;
          },
          
          set(nestedTarget, nestedProp, nestedValue) {
            const oldValue = nestedTarget[nestedProp];
            const result = Reflect.set(nestedTarget, nestedProp, nestedValue);
            
            if (result) {
              trigger(prop, nestedTarget, oldValue);
            }
            
            return result;
          }
        });
      }
      
      return value;
    },
    
    set(target, prop, value, receiver) {
      if (prop === 'listeners' || prop === 'batchUpdate' || 
          prop === 'subscribe' || prop === 'notify' || prop === 'reset') {
        return Reflect.set(target, prop, value, receiver);
      }
      
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      
      if (result && oldValue !== value) {
        trigger(prop, value, oldValue);
      }
      
      return result;
    },
    
    deleteProperty(target, prop) {
      const oldValue = target[prop];
      const result = Reflect.deleteProperty(target, prop);
      
      if (result) {
        trigger(prop, undefined, oldValue);
      }
      
      return result;
    }
  };
  
  return new Proxy(state, handler);
}

const ReactiveAppState = createReactiveState(AppState);

function watch(keys, callback, options = { immediate: false }) {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  
  const handler = (newValue, oldValue, key) => {
    if (keyArray.includes(key)) {
      const values = {};
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
    const values = {};
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

function computed(getter, deps) {
  let cachedValue = null;
  let dirty = true;
  
  const recompute = () => {
    dirty = true;
  };
  
  for (const dep of deps) {
    ReactiveAppState.subscribe(dep, recompute);
  }
  
  return {
    get value() {
      if (dirty) {
        cachedValue = getter();
        dirty = false;
      }
      return cachedValue;
    },
    
    invalidate() {
      dirty = true;
    }
  };
}

if (!window.__appStateListenersAdded) {
  window.addEventListener('online', () => {
    ReactiveAppState.set('isOnline', true);
  });

  window.addEventListener('offline', () => {
    ReactiveAppState.set('isOnline', false);
  });
  
  window.__appStateListenersAdded = true;
}

export { AppState, ReactiveAppState, watch, computed };
