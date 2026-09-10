// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prefetchAudioLibrary } from '../js/utils/audio-prefetch.ts';

describe('audio-prefetch.ts test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns early when words list is empty or serviceWorker controller is absent', async () => {
    await expect(prefetchAudioLibrary(null)).resolves.toBeUndefined();
    await expect(prefetchAudioLibrary([])).resolves.toBeUndefined();

    // No serviceWorker controller
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true,
    });
    await expect(prefetchAudioLibrary([{ word: 'test' }])).resolves.toBeUndefined();
  });

  it('batches prefetch audio requests to serviceWorker controller with delays', async () => {
    const postMessage = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        controller: { postMessage },
      },
      configurable: true,
    });

    const words = [
      { word: 'apple_unique_1' },
      { word: 'banana_unique_2' },
      { word: 'cherry_unique_3' },
      { word: 'date_unique_4' },
      { word: 'elderberry_unique_5' },
    ];

    const promise = prefetchAudioLibrary(words);
    await vi.runAllTimersAsync();
    await promise;

    expect(postMessage).toHaveBeenCalledTimes(5);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CACHE_AUDIO',
        url: expect.stringContaining('apple_unique_1'),
      })
    );

    // Repeated call deduplicates already requested URLs
    postMessage.mockClear();
    const repeatPromise = prefetchAudioLibrary(words);
    await vi.runAllTimersAsync();
    await repeatPromise;
    expect(postMessage).not.toHaveBeenCalled();
  });
});
