// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireConfetti } from '../js/ui/confetti.ts';

describe('confetti.ts test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    window.innerWidth = 1024;
    window.innerHeight = 768;

    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('bails out early when prefers-reduced-motion is enabled', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    fireConfetti();
    expect(document.querySelectorAll('canvas').length).toBe(0);
  });

  it('runs main-thread fallback when OffscreenCanvas is unavailable', () => {
    delete window.OffscreenCanvas;
    delete HTMLCanvasElement.prototype.transferControlToOffscreen;

    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

    let rafCallback = null;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallback = cb;
      return 1;
    });

    fireConfetti();

    const canvas = document.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas.style.position).toBe('fixed');
    expect(canvas.style.zIndex).toBe('9999');

    // Trigger animation steps
    if (rafCallback) rafCallback();
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('initializes OffscreenCanvas and worker when supported', () => {
    const mockOffscreen = {};
    HTMLCanvasElement.prototype.transferControlToOffscreen = vi.fn(() => mockOffscreen);
    window.OffscreenCanvas = class {};

    // Mock Worker
    const workerMessages = [];
    const eventListeners = {};
    class MockWorker {
      constructor() {
        this.postMessage = vi.fn((data, transfer) => {
          workerMessages.push({ data, transfer });
        });
        this.terminate = vi.fn();
        this.addEventListener = vi.fn((ev, cb) => {
          eventListeners[ev] = cb;
        });
      }
    }
    vi.stubGlobal('Worker', MockWorker);

    fireConfetti();

    const canvas = document.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(HTMLCanvasElement.prototype.transferControlToOffscreen).toHaveBeenCalled();

    // Trigger worker completion message
    if (eventListeners['message']) {
      eventListeners['message']({ data: { type: 'completed' } });
    }

    // Canvas should be cleaned up
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('handles worker error and cleans up canvas', () => {
    const mockOffscreen = {};
    HTMLCanvasElement.prototype.transferControlToOffscreen = vi.fn(() => mockOffscreen);
    window.OffscreenCanvas = class {};

    const eventListeners = {};
    class MockWorker {
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.addEventListener = vi.fn((ev, cb) => {
          eventListeners[ev] = cb;
        });
      }
    }
    vi.stubGlobal('Worker', MockWorker);

    fireConfetti();
    expect(document.querySelector('canvas')).not.toBeNull();

    // Trigger error message
    if (eventListeners['message']) {
      eventListeners['message']({ data: { type: 'error', message: 'Worker crashed' } });
    }

    expect(document.querySelector('canvas')).toBeNull();
  });

  it('cleans up previous canvas on multiple consecutive calls', () => {
    delete window.OffscreenCanvas;
    delete HTMLCanvasElement.prototype.transferControlToOffscreen;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    }));

    fireConfetti();
    fireConfetti();
    fireConfetti();

    // Only one active canvas should remain in DOM
    const canvases = document.querySelectorAll('canvas');
    expect(canvases.length).toBe(1);
  });

  it('handles OffscreenCanvas error and falls back to main thread animation', () => {
    HTMLCanvasElement.prototype.transferControlToOffscreen = vi.fn(() => {
      throw new Error('Transfer failure');
    });
    window.OffscreenCanvas = class {};

    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);

    let rafCallback = null;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallback = cb;
      return 1;
    });

    fireConfetti();
    expect(document.querySelectorAll('canvas').length).toBe(1);
  });
});

