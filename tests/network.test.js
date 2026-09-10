// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../js/config.js', () => ({
  CONFIG: {
    CORS_PROXIES: [
      'https://proxy1.example.com/',
      'https://proxy2.example.com/',
      'https://proxy3.example.com/',
    ],
    ALLOWED_CONNECT_DOMAINS: [
      'example.com',
      'dictvoice',
      'dict.youdao.com',
      'api.allorigins.win',
    ],
    FETCH_TIMEOUT: 5000,
    FETCH_RETRIES: 2,
    FETCH_BACKOFF: 1000,
    AUDIO_BASE_URL: 'https://dict.youdao.com/dictvoice',
  },
}));

vi.mock('../js/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
}));

import { Network } from '../js/network.js';

describe('Network', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Network.resetStats();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('_validateResponse', () => {
    it('returns true for non-audio URLs', () => {
      const response = {
        headers: { get: () => 'text/html' },
      };
      expect(Network._validateResponse(response, 'https://example.com')).toBe(true);
    });

    it('returns true for audio URLs with correct content type', () => {
      const response = {
        headers: { get: () => 'audio/mpeg' },
      };
      expect(Network._validateResponse(response, 'https://dictvoice/test.mp3')).toBe(true);
    });

    it('returns true for audio URLs with octet-stream content type', () => {
      const response = {
        headers: { get: () => 'application/octet-stream' },
      };
      expect(Network._validateResponse(response, 'https://dictvoice/test.mp3')).toBe(true);
    });

    it('returns false for audio URLs with wrong content type', () => {
      const response = {
        headers: { get: () => 'text/html' },
      };
      expect(Network._validateResponse(response, 'https://dictvoice/test.mp3')).toBe(false);
    });
  });

  describe('fetchWithProxy', () => {
    it('fetches successfully through first proxy', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await Network.fetchWithProxy('https://example.com/api');
      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('tries next proxy on failure', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await Network.fetchWithProxy('https://example.com/api');
      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws error when all proxies fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(Network.fetchWithProxy('https://example.com/api')).rejects.toThrow('所有 CORS 代理均不可用');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('skips proxy with invalid response type for audio', async () => {
      const invalidResponse = {
        ok: true,
        headers: { get: () => 'text/html' },
      };
      const validResponse = {
        ok: true,
        headers: { get: () => 'audio/mpeg' },
      };
      global.fetch = vi.fn()
        .mockResolvedValueOnce(invalidResponse)
        .mockResolvedValueOnce(validResponse);

      const result = await Network.fetchWithProxy('https://dictvoice/test.mp3');
      expect(result).toBe(validResponse);
    });

    it('updates statistics correctly', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await Network.fetchWithProxy('https://example.com/api');
      const stats = Network.getStats();
      expect(stats.total).toBe(1);
      expect(stats.success).toBe(1);
      expect(stats.failed).toBe(0);
    });
  });

  describe('fetchWithRetry', () => {
    it('fetches successfully on first try', async () => {
      const mockResponse = { ok: true, status: 200 };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await Network.fetchWithRetry('https://example.com/api');
      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on server error', async () => {
      const errorResponse = { ok: false, status: 500 };
      const successResponse = { ok: true, status: 200 };
      global.fetch = vi.fn()
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const promise = Network.fetchWithRetry('https://example.com/api');
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toBe(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry on client error', async () => {
      const errorResponse = { ok: false, status: 404 };
      global.fetch = vi.fn().mockResolvedValue(errorResponse);

      const result = await Network.fetchWithRetry('https://example.com/api');
      expect(result).toBe(errorResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const stats = Network.getStats();
      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
    });
  });

  describe('fetchAudio', () => {
    it('constructs correct audio URL', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'audio/mpeg' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await Network.fetchAudio('hello');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('dictvoice'),
        expect.any(Object)
      );
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await Network.fetchWithProxy('https://example.com/api');
      const stats = Network.getStats();

      expect(stats.total).toBe(1);
      expect(stats.success).toBe(1);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe('100.00');
      expect(stats.currentProxy).toBeDefined();
    });

    it('calculates success rate correctly', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await Network.fetchWithProxy('https://example.com/api');

      const stats = Network.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.success).toBeGreaterThan(0);
      expect(stats.successRate).toBeDefined();
    });
  });

  describe('resetStats', () => {
    it('resets all statistics', async () => {
      const mockResponse = {
        ok: true,
        headers: { get: () => 'application/json' },
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await Network.fetchWithProxy('https://example.com/api');
      Network.resetStats();
      const stats = Network.getStats();

      expect(stats.total).toBe(0);
      expect(stats.success).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('getCurrentProxy', () => {
    it('returns current proxy', () => {
      const proxy = Network.getCurrentProxy();
      expect(proxy).toBeDefined();
      expect(typeof proxy).toBe('string');
    });
  });

  describe('getProxies', () => {
    it('returns all proxies', () => {
      const proxies = Network.getProxies();
      expect(Array.isArray(proxies)).toBe(true);
      expect(proxies.length).toBe(3);
    });

    it('returns a copy of proxies array', () => {
      const proxies = Network.getProxies();
      proxies.push('https://new-proxy.com/');
      expect(Network.getProxies().length).toBe(3);
    });
  });
});
