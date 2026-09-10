import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../js/utils/performance-monitor.js';

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.enabled = true;
  });

  it('initializes metric buckets', () => {
    expect(monitor.metrics.semanticGraphBuild).toEqual([]);
    expect(monitor.metrics.fsrsTraining).toEqual([]);
    expect(monitor.enabled).toBe(true);
  });

  it('startTimer returns an id and stores a timer', () => {
    const id = monitor.startTimer('renderOperations');
    expect(id).toBeTruthy();
    expect(monitor.timers[id]).toBeTruthy();
    expect(monitor.timers[id].name).toBe('renderOperations');
  });

  it('endTimer returns null for unknown/disabled state', () => {
    expect(monitor.endTimer('nonexistent')).toBeNull();
    monitor.enabled = false;
    expect(monitor.endTimer('nope')).toBeNull();
  });

  it('endTimer records a metric and cleans the timer', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const id = monitor.startTimer('fsrsTraining');
    const metric = monitor.endTimer(id);
    expect(metric).toBeTruthy();
    expect(metric.name).toBe('fsrsTraining');
    expect(metric.duration).toBeGreaterThanOrEqual(0);
    expect(monitor.timers[id]).toBeUndefined();
    expect(monitor.metrics.fsrsTraining).toHaveLength(1);
    console.info.mockRestore();
  });

  it('record adds a metric and caps length at 100', () => {
    for (let i = 0; i < 105; i++) monitor.record('syncOperations', 5);
    expect(monitor.metrics.syncOperations).toHaveLength(100);
  });

  it('record warns on slow operations over 100ms', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    monitor.record('syncOperations', 250);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('record returns early when disabled', () => {
    monitor.enabled = false;
    const ret = monitor.record('syncOperations', 10);
    expect(ret).toBeUndefined();
    expect(monitor.metrics.syncOperations).toHaveLength(0);
  });

  it('getStats aggregates durations', () => {
    monitor.record('semanticGraphBuild', 10);
    monitor.record('semanticGraphBuild', 20);
    monitor.record('semanticGraphBuild', 30);
    const stats = monitor.getStats('semanticGraphBuild');
    expect(stats.count).toBe(3);
    expect(stats.avg).toBe('20.00');
    expect(stats.min).toBe('10.00');
    expect(stats.max).toBe('30.00');
    expect(stats.total).toBe('60.00');
    expect(stats.p95).toBe('30.00');
  });

  it('getStats returns null for empty/unregistered bucket', () => {
    expect(monitor.getStats('emptyBucket')).toBeNull();
    expect(monitor.getStats('semanticGraphBuild')).toBeNull();
  });

  it('getAllStats only includes buckets with data', () => {
    monitor.record('renderOperations', 5);
    const stats = monitor.getAllStats();
    expect(Object.keys(stats)).toEqual(['renderOperations']);
  });

  it('clearMetrics resets all buckets', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    monitor.record('renderOperations', 5);
    monitor.clearMetrics();
    expect(monitor.metrics.renderOperations).toEqual([]);
    console.info.mockRestore();
  });
});