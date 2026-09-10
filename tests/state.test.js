// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppState, ReactiveAppState, watch } from '../js/state.js';

function resetAppState() {
  AppState.semanticInterfered = false;
  AppState.studyFlipped = false;
  AppState.reviewFlipped = false;
  AppState.clozeModeEnabled = false;
  AppState.currentTheme = 'light';
  AppState.isOnline = true;
  AppState.lastSyncTime = null;
  AppState.syncInProgress = false;
  AppState.stats = { totalWords: 0, learnedWords: 0, pendingReviews: 0, todayReviews: 0, wrongWords: 0 };
  AppState.ui = { currentView: 'study', isLoading: false, toastMessage: null, modalOpen: false };
}

describe('AppState', () => {
  beforeEach(() => {
    resetAppState();
  });

  it('has default values', () => {
    expect(AppState.get('semanticInterfered')).toBe(false);
    expect(AppState.get('studyFlipped')).toBe(false);
    expect(AppState.get('currentTheme')).toBe('light');
    expect(AppState.get('isOnline')).toBe(true);
  });

  it('set/get scalar values', () => {
    AppState.set('currentTheme', 'dark');
    expect(AppState.get('currentTheme')).toBe('dark');
  });

  it('notifies subscribers on set', () => {
    AppState.set('currentTheme', 'dark');
    const fn = vi.fn();
    AppState.subscribe('currentTheme', fn);
    AppState.set('currentTheme', 'light');
    expect(fn).toHaveBeenCalledWith('light', 'dark', 'currentTheme');
  });

  it('returns unsubscribe function', () => {
    const fn = vi.fn();
    const unsubscribe = AppState.subscribe('isOnline', fn);
    unsubscribe();
    AppState.set('isOnline', false);
    expect(fn).not.toHaveBeenCalled();
  });

  it('reset restores default values', () => {
    AppState.set('semanticInterfered', true);
    AppState.set('studyFlipped', true);
    AppState.reset();
    expect(AppState.get('semanticInterfered')).toBe(false);
    expect(AppState.get('studyFlipped')).toBe(false);
  });

  it('batchUpdate applies multiple changes', () => {
    const fn = vi.fn();
    AppState.subscribe('clozeModeEnabled', fn);
    AppState.batchUpdate({ clozeModeEnabled: true, currentTheme: 'dark' });
    expect(AppState.get('clozeModeEnabled')).toBe(true);
    expect(AppState.get('currentTheme')).toBe('dark');
    expect(fn).toHaveBeenCalledWith(true, false, 'clozeModeEnabled');
  });

  it('batchUpdate skips non-existent keys', () => {
    AppState.batchUpdate({ nonExistent: 'value' });
    expect(AppState.get('nonExistent')).toBeUndefined();
  });
});

describe('ReactiveAppState', () => {
  beforeEach(() => {
    resetAppState();
  });

  it('proxies set triggers notification', () => {
    const fn = vi.fn();
    AppState.subscribe('currentTheme', fn);
    ReactiveAppState.currentTheme = 'dark';
    expect(fn).toHaveBeenCalledWith('dark', 'light', 'currentTheme');
  });

  it('proxies get returns value', () => {
    expect(ReactiveAppState.isOnline).toBe(true);
  });

  it('handles nested object get', () => {
    expect(ReactiveAppState.ui.currentView).toBe('study');
  });

  it('handles nested object set triggers parent notification', () => {
    const fn = vi.fn();
    AppState.subscribe('ui', fn);
    ReactiveAppState.ui.isLoading = true;
    expect(fn).toHaveBeenCalled();
    expect(ReactiveAppState.ui.isLoading).toBe(true);
  });

  it('deleteProperty triggers notification', () => {
    const fn = vi.fn();
    AppState.subscribe('semanticInterfered', fn);
    delete ReactiveAppState.semanticInterfered;
    expect(fn).toHaveBeenCalledWith(undefined, false, 'semanticInterfered');
  });

  it('does not trigger notification when value unchanged', () => {
    const fn = vi.fn();
    AppState.subscribe('isOnline', fn);
    ReactiveAppState.isOnline = true;
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls AppState methods directly', () => {
    const fn = vi.fn();
    AppState.subscribe('currentTheme', fn);
    ReactiveAppState.set('currentTheme', 'dark');
    expect(fn).toHaveBeenCalledWith('dark', 'light', 'currentTheme');
  });
});

describe('watch', () => {
  beforeEach(() => {
    resetAppState();
  });

  it('calls callback when watched key changes', () => {
    const fn = vi.fn();
    watch('currentTheme', fn);
    ReactiveAppState.currentTheme = 'dark';
    expect(fn).toHaveBeenCalledWith(
      { currentTheme: 'dark' },
      { key: 'currentTheme', newValue: 'dark', oldValue: 'light' }
    );
  });

  it('calls callback with multiple watched keys', () => {
    const fn = vi.fn();
    watch(['isOnline', 'currentTheme'], fn);
    ReactiveAppState.isOnline = false;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(
      { isOnline: false, currentTheme: 'light' },
      { key: 'isOnline', newValue: false, oldValue: true }
    );
  });

  it('returns unsubscribe function', () => {
    const fn = vi.fn();
    const unwatch = watch('currentTheme', fn);
    unwatch();
    ReactiveAppState.currentTheme = 'dark';
    expect(fn).not.toHaveBeenCalled();
  });

  it('immediate option calls callback on setup', () => {
    const fn = vi.fn();
    watch('currentTheme', fn, { immediate: true });
    expect(fn).toHaveBeenCalledWith(
      { currentTheme: 'light' },
      { key: null, newValue: null, oldValue: null }
    );
  });
});
