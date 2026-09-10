/**
 * @module types/declarations
 * @description JavaScript模块类型声明
 * 
 * 本文件为现有的JavaScript模块提供类型声明，
 * 以便TypeScript可以正确导入这些模块。
 */

// 声明JS模块 - 使用通配符模式
declare module '*core.js' {
  export function getWordData(id: number): any;
  export function setWordData(id: number, data: any): Promise<any>;
  export function getData(): any;
  export function getWordStatus(id: number): string;
  export function migrateData(data: any): any;
  export function resetProgress(): Promise<void>;
  export function collectReviewLogs(): any[];
  export const SCHEMA_VERSION: string;
}

declare module '*store.js' {
  export function getMemoryCache(): any;
  export function getWrongWords(): any;
  export function getHeatmap(): any;
  export function addWrongWord(id: number, word: any): void;
  export function removeWrongWord(id: number): void;
  export function loadFromIndexedDB(): Promise<void>;
  export function recordHeatmap(): void;
  export const memoryCache: any;
  export const WORDS: any[];
}

declare module '*db.js' {
  export const db: any;
}

declare module '*config.js' {
  export const CONFIG: any;
  export const SEMANTIC_CLUSTERS: any;
  export const CONFUSING_PAIRS: any;
}

declare module '*utils.js' {
  export function shuffle<T>(array: T[]): T[];
  export function escapeHTML(str: string): string;
  export function getDisplayMeaning(word: any): string;
  export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T;
  export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T;
}

declare module '*ui.js' {
  export const UI: {
    toast: (msg: string, type?: string) => void;
    confirm: (title: string, message: string) => Promise<boolean>;
    prompt: (title: string, message: string, placeholder?: string) => Promise<string | null>;
    safeExecute: (fn: () => Promise<any>, loadingMsg?: string) => Promise<void>;
    showShortcutGuide: () => void;
  };
  export function playTone(type: 'success' | 'fail'): void;
  export function fireConfetti(): void;
  export function speak(text: string): void;
  export function setSafeWordHeader(elementId: string, word: string, level?: string): void;
  export function toggleTheme(): void;
  export function initTheme(): void;
  export function createFocusTrap(element: HTMLElement): () => void;
  export function showLoadingOverlay(show: boolean, message?: string, progress?: number): void;
  export function updateLoadingProgress(progress: number, message?: string): void;
  export const Skeleton: {
    show: (id: string) => void;
    hide: (id: string) => void;
    showWordCardLoading: (id: string) => void;
    showListLoading: (id: string, count?: number) => void;
  };
}

declare module '*fsrs.js' {
  export const FSRS_W: number[];
  export const DEFAULT_FSRS_W: number[];
  export const MIN_EF: number;
  export const MAX_EF: number;
  export const TARGET_RETENTION: number;
  export function getFSRSWeights(): number[];
  export function setFSRSWeights(weights: number[]): boolean;
  export function loadFSRSWeights(): void;
  export function saveFSRSWeights(): void;
  export function calculateFSRSInterval(s: number, r?: number, circadianScore?: number): number;
  export function calculateForgettingDecay(wd: any, daysSinceReview: number): number;
  export function calculateShortTermMemory(wd: any, quality: number): any;
  export function calculateOptimalInterval(wd: any, quality: number): number;
  export function applyFuzz(interval: number): number;
  export function calculateLevenshtein(s1: string, s2: string): number;
  export function updateFSRS(wd: any, quality: number): { stability: number; difficulty: number };
  export function migrateSM2ToFSRS(wd: any): any;
  export function updateEF(currentEF: number, quality: number): number;
  export function calculateInterval(wd: any, quality: number): number;
  export function evaluateLogLoss(logs: any[], weights: number[]): number;
  export function calculateGradientsForLogLoss(logs: any[], weights: number[]): number[];
  export function getCircadianScore(): number;
  export function updateHourStats(hour: number, correct: boolean): void;
}

declare module '*sync.js' {
  export const webdavConfig: any;
  export function loadWebDAVConfig(): void;
  export function decryptWebDAVCredentials(masterKey: string): Promise<any>;
  export function saveWebDAVConfig(url: string, username: string, password: string, masterKey: string, autoSync: boolean): Promise<void>;
  export function testWebDAVConnection(config: { url: string; username: string; password: string }): Promise<any>;
  export function syncToWebDAV(db: any, memoryCache: any, deviceId: string): Promise<any>;
  export function syncFromWebDAV(db: any, memoryCache: any, deviceId: string): Promise<any>;
  export function exportEncryptionKey(): any;
  export function updateWebDAVStatus(message: string): void;
}

declare module '*state.js' {
  export const AppState: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
  };
  export function watch(keys: string[], callback: (values: any, meta: any) => void): void;
  export function computed(fn: () => any, deps: string[]): void;
}

declare module '*logger.js' {
  const logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    log: (...args: any[]) => void;
  };
  export default logger;
}

declare module '*dom.js' {
  export function createFocusTrap(element: HTMLElement): () => void;
  export function setHtml(element: HTMLElement, html: string): void;
  export function escapeHtml(str: string): string;
}

declare module '*cloze.js' {
  export function generateCloze(word: string, example: string): string;
}

declare module '*fsrs-trainer-worker.js?worker&inline' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}

declare module '*semantic-worker.js?worker&inline' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}

declare module '*particle-worker.js?worker&inline' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}

declare module '*bridge.js' {
  export const DeviceBridge: {
    scheduleNextReviewReminder: (words: any[], getWordData: (id: number) => any) => void;
  };
}

declare module '*vocab-store.js' {
  export const WORDS: any[];
  export function setWordsArray(words: any[]): void;
}

declare module '../data/vocab-store.js' {
  export const WORDS: any[];
  export function setWordsArray(words: any[]): void;
}

declare module '../../data/vocab-store.js' {
  export const WORDS: any[];
  export function setWordsArray(words: any[]): void;
}

declare module '*worker-pool.js' {
  export const vocabProcessor: {
    processJSON: (json: string, onProgress?: (progress: number) => void) => Promise<{ result: any[]; count: number }>;
  };
}

declare module '*audio-prefetch.js' {
  export function prefetchAudioLibrary(words: any[]): void;
}

declare module '*web-vitals.js' {
  export const WebVitals: {
    init: () => void;
    getMetrics: () => any;
    getScore: () => number;
  };
}

declare module '*performance-monitor.js' {
  export const performanceMonitor: {
    showPerformancePanel: () => void;
    exportReport: () => void;
    clearMetrics: () => void;
    startTimer: (name: string) => string | null;
    endTimer: (id: string) => any;
    record: (name: string, duration: number, metadata?: any) => void;
    getStats: (name: string) => any;
    getAllStats: () => any;
  };
}

declare module '*semantic-graph-ui.js' {
  export function buildWordMaps(): void;
  export function initSemanticGraphInBackground(): void;
  export function cleanupSemanticGraph(): void;
  export function adjustForSemanticInterference(wordId: number, interval: number): number;
  export function initSemanticGraphUI(config: any): void;
}

declare module '*reactive-bindings.js' {
  export function setupReactiveBindings(): void;
}

declare module '*keyboard-shortcuts.js' {
  export function setupKeyboardShortcuts(config: any): void;
}

declare module '*swipe-gestures.js' {
  export function initSwipeGestures(studyCard: HTMLElement | null, reviewCard: HTMLElement | null, config: any): void;
}

declare module '*milestones.js' {
  export function checkAndShowMilestones(fireConfetti: () => void): void;
}

declare module '*network-status.js' {
  export function setupNetworkStatusListener(): void;
  export function showResourceStatusPanel(): void;
  export function showNetworkStatusPanel(): void;
}

declare module '*sw-registration.js' {
  export function registerServiceWorker(): void;
}

declare module '*module-loader.js' {
  export function loadModule(name: string): Promise<any>;
}

declare module '*wrong-words.js' {
  export function renderWrongList(): void;
  export function startWrongWordsStudy(): void;
  export function registerStudyFeature(feature: any): void;
}

declare module '*action-bus.js' {
  export function setupGlobalEventDelegation(): void;
}

declare module '*logger.js' {
  const logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    log: (...args: any[]) => void;
  };
  export default logger;
}

// 扩展Window接口
declare global {
  interface Window {
    WORDS: any[];
    filteredWords: any[];
    resetVocabulary: () => Promise<void>;
    checkVocabulary: () => any;
    switchTab: (tab: string) => void;
    UI: any;
    SettingsFeature: any;
    WebDAVFeature: any;
    performanceMonitor: any;
    showPerformancePanel: () => void;
    particleSystem: any;
  }
}
