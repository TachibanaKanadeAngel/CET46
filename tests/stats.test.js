// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  updateStats,
  checkMemoryOverload,
  enterQuickReviewMode,
  renderHeatmap,
  renderRetentionChart,
  updateProgressEstimation,
  renderAchievements,
  renderForgettingCurve,
  saveDailyProgressSnapshot,
  renderStorageInfo,
  registerStudyFeature,
} from '../js/utils/stats.js';
import { WORDS, setWordsArray } from '../js/data/vocab-store.js';
import { memoryCache } from '../js/store.js';
import { db } from '../js/db.js';

describe('stats.js test suite', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="view-study"></div>
      <div id="stat-total"></div>
      <div id="stat-new"></div>
      <div id="stat-review"></div>
      <div id="stat-mastered"></div>
      <div id="heatmap-grid"></div>
      <div id="heatmap-streak"></div>
      <div id="stats-total-words"></div>
      <div id="stats-avg-ef"></div>
      <div id="stats-days"></div>
      <div id="stats-est-date"></div>
      <div id="total-upcoming"></div>
      <canvas id="retention-chart" width="400" height="200"></canvas>
      <canvas id="retention-curve" width="400" height="200"></canvas>
      <div id="achievements-row"></div>
      <div id="webdav-status"></div>
    `;

    const mockCtx = {
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      textAlign: '',
      lineWidth: 1,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 400,
      height: 200,
      top: 0,
      left: 0,
      right: 400,
      bottom: 200,
    }));

    memoryCache.progress = {};
    memoryCache.wrongWords = {};
    memoryCache.heatmap = {};
    memoryCache.progressSnapshot = {};
    setWordsArray([
      { id: 1, word: 'abandon', meaning: '放弃', level: 'CET4' },
      { id: 2, word: 'ability', meaning: '能力', level: 'CET4' },
      { id: 3, word: 'abnormal', meaning: '反常的', level: 'CET6' },
      { id: 4, word: 'aboard', meaning: '在船上', level: 'CET4' },
      { id: 5, word: 'absolute', meaning: '绝对的', level: 'CET4' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updateStats calculates status counts and updates DOM', () => {
    memoryCache.progress = {
      1: { status: 'new' },
      2: { status: 'review', nextReviewDate: new Date().toISOString().slice(0, 10) },
      3: { status: 'mastered' },
    };

    updateStats();

    expect(document.getElementById('stat-total').textContent).toBe('5');
    expect(document.getElementById('stat-new').textContent).toBe('3');
    expect(document.getElementById('stat-review').textContent).toBe('1');
    expect(document.getElementById('stat-mastered').textContent).toBe('1');
  });

  it('checkMemoryOverload inserts and removes overload banner', () => {
    checkMemoryOverload(250);
    let banner = document.getElementById('overload-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('记忆负载过高');

    checkMemoryOverload(50);
    banner = document.getElementById('overload-banner');
    expect(banner).toBeNull();
  });

  it('enterQuickReviewMode triggers study feature with review words', () => {
    const today = new Date().toISOString().slice(0, 10);
    memoryCache.progress = {
      2: { status: 'review', nextReviewDate: today },
    };

    const mockStudyFeature = {
      setWords: vi.fn(),
      startStudy: vi.fn(),
    };
    registerStudyFeature(mockStudyFeature);

    enterQuickReviewMode();

    expect(mockStudyFeature.setWords).toHaveBeenCalled();
    expect(mockStudyFeature.startStudy).toHaveBeenCalled();
  });

  it('renderHeatmap renders cells and streak text', () => {
    const today = new Date().toISOString().slice(0, 10);
    memoryCache.heatmap = {
      [today]: 25,
    };
    memoryCache.progress = {
      1: { ef: 2.6, status: 'review', nextReview: Date.now() + 86400000 },
      3: { ef: 2.4, status: 'mastered' },
    };

    renderHeatmap();

    const cells = document.querySelectorAll('.heatmap-cell');
    expect(cells.length).toBe(50);
    expect(document.getElementById('heatmap-streak').textContent).toContain('连续');
    expect(document.getElementById('stats-total-words').textContent).toBe('2');
    expect(document.getElementById('stats-avg-ef').textContent).toBe('2.50');
  });

  it('renderRetentionChart draws bars on canvas', () => {
    const upcoming = [5, 12, 8, 3, 15, 6, 2];
    renderRetentionChart(upcoming);

    expect(document.getElementById('total-upcoming').textContent).toBe('总计: 51 词');
    const canvas = document.getElementById('retention-chart');
    const ctx = canvas.getContext('2d');
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('updateProgressEstimation calculates estimated date', () => {
    const estEl = document.getElementById('stats-est-date');

    memoryCache.heatmap = { '2026-08-01': 10 };
    updateProgressEstimation(2);
    expect(estEl.textContent).toBe('继续学习后生成预测');

    memoryCache.heatmap = {
      '2026-08-01': 20,
      '2026-08-02': 25,
      '2026-08-03': 30,
      '2026-08-04': 20,
    };
    memoryCache.progressSnapshot = {
      '2026-08-01': { mastered: 2 },
      '2026-08-02': { mastered: 4 },
      '2026-08-03': { mastered: 7 },
      '2026-08-04': { mastered: 10 },
    };
    updateProgressEstimation(10);
    expect(estEl.innerHTML).toContain('strong');
  });

  it('renderAchievements creates badge elements', () => {
    const allData = {
      1: { status: 'review' },
      2: { status: 'mastered' },
    };
    memoryCache.heatmap = { '2026-08-01': 10 };

    renderAchievements(2, allData, 1, 5);

    const chips = document.querySelectorAll('.achievement-chip');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('renderForgettingCurve draws retention curve on canvas', () => {
    const allData = {
      1: { status: 'review', intervalDays: 3 },
      2: { status: 'review', intervalDays: 5 },
    };

    renderForgettingCurve(allData);

    const canvas = document.getElementById('retention-curve');
    const ctx = canvas.getContext('2d');
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('saveDailyProgressSnapshot persists snapshot to memoryCache and db', async () => {
    memoryCache.progress = {
      1: { status: 'mastered' },
      2: { status: 'mastered' },
    };

    vi.spyOn(db, 'save').mockResolvedValue(true);
    db.instance = {};

    await saveDailyProgressSnapshot();

    const today = new Date().toISOString().slice(0, 10);
    expect(memoryCache.progressSnapshot[today].mastered).toBe(2);
    expect(db.save).toHaveBeenCalled();
  });

  it('renderStorageInfo renders storage estimation bar', async () => {
    globalThis.navigator.storage = {
      estimate: vi.fn().mockResolvedValue({ usage: 1024 * 1024 * 5, quota: 1024 * 1024 * 50 }),
    };

    await renderStorageInfo();

    const statusEl = document.getElementById('webdav-status');
    expect(statusEl.querySelector('.storage-info')).not.toBeNull();
    expect(statusEl.textContent).toContain('5.0MB / 50MB');
  });
});
