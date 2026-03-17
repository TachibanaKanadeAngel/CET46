import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

function generateVectorClock(deviceId) {
  const stored = localStorage.getItem('cet46_vector_clock');
  let clock = stored ? JSON.parse(stored) : {};
  
  if (!clock[deviceId]) {
    clock[deviceId] = 0;
  }
  clock[deviceId]++;
  
  localStorage.setItem('cet46_vector_clock', JSON.stringify(clock));
  return { ...clock };
}

function compareVectorClocks(clock1, clock2) {
  let dominated1 = false;
  let dominated2 = false;
  
  const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
  
  for (const key of allKeys) {
    const v1 = clock1[key] || 0;
    const v2 = clock2[key] || 0;
    
    if (v1 < v2) dominated1 = true;
    if (v1 > v2) dominated2 = true;
  }
  
  if (dominated1 && !dominated2) return -1;
  if (dominated2 && !dominated1) return 1;
  return 0;
}

function mergePropertyAware(localWd, cloudWd) {
  const localMnemonic = localWd.mnemonic || '';
  const cloudMnemonic = cloudWd.mnemonic || '';
  let mergedMnemonic = localMnemonic;
  if (localMnemonic !== cloudMnemonic && cloudMnemonic) {
    mergedMnemonic = localMnemonic ? `${localMnemonic} | ${cloudMnemonic}` : cloudMnemonic;
  }

  const localWeight = (localWd.reviewCount || 0) + (localWd.level || 0);
  const cloudWeight = (cloudWd.reviewCount || 0) + (cloudWd.level || 0);
  
  const base = localWeight >= cloudWeight ? { ...localWd } : { ...cloudWd };
  base.mnemonic = mergedMnemonic;
  
  base.wrongCount = Math.max(localWd.wrongCount || 0, cloudWd.wrongCount || 0);

  return base;
}

function mergeLocalAndCloud(local, cloud, deviceId) {
  const mergedProgress = { ...cloud.progress };
  const mergedDeletedIds = new Set([...(local.deletedIds || []), ...(cloud.deletedIds || [])]);

  for (const id of mergedDeletedIds) {
    delete mergedProgress[id];
  }

  for (const [id, localWd] of Object.entries(local.progress)) {
    if (mergedDeletedIds.has(parseInt(id))) continue;
    
    const cloudWd = mergedProgress[id];
    
    if (!cloudWd) {
      mergedProgress[id] = localWd;
    } else {
      const merged = mergePropertyAware(localWd, cloudWd);
      mergedProgress[id] = merged;
    }
  }

  const mergedWrongWords = { ...cloud.wrongWords };
  for (const [id, localWrong] of Object.entries(local.wrongWords)) {
    const cloudWrong = mergedWrongWords[id];
    
    if (!cloudWrong) {
      mergedWrongWords[id] = localWrong;
    } else {
      mergedWrongWords[id] = {
        count: Math.max(localWrong.count, cloudWrong.count),
        firstWrong: Math.min(localWrong.firstWrong || Infinity, cloudWrong.firstWrong || Infinity),
        lastWrong: Math.max(localWrong.lastWrong || 0, cloudWrong.lastWrong || 0)
      };
    }
  }

  const mergedHeatmap = { ...cloud.heatmap };
  for (const [date, count] of Object.entries(local.heatmap)) {
    mergedHeatmap[date] = Math.max(mergedHeatmap[date] || 0, count);
  }

  return { 
    progress: mergedProgress, 
    wrongWords: mergedWrongWords, 
    heatmap: mergedHeatmap,
    deletedIds: Array.from(mergedDeletedIds)
  };
}

describe('WebDAV Sync Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVectorClock', () => {
    it('should generate a vector clock with device ID', () => {
      const deviceId = 'test-device';
      const clock = generateVectorClock(deviceId);
      
      expect(clock).toHaveProperty(deviceId);
      expect(clock[deviceId]).toBe(1);
    });

    it('should increment clock value on subsequent calls', () => {
      const deviceId = 'test-device';
      
      const clock1 = generateVectorClock(deviceId);
      const clock2 = generateVectorClock(deviceId);
      
      expect(clock2[deviceId]).toBe(clock1[deviceId] + 1);
    });

    it('should maintain separate counters for different devices', () => {
      const device1 = 'device-A';
      const device2 = 'device-B';
      
      generateVectorClock(device1);
      const clock = generateVectorClock(device2);
      
      expect(clock).toHaveProperty(device1);
      expect(clock).toHaveProperty(device2);
    });
  });

  describe('compareVectorClocks', () => {
    it('should return 0 for equal clocks', () => {
      const clock1 = { 'device-A': 1, 'device-B': 2 };
      const clock2 = { 'device-A': 1, 'device-B': 2 };
      
      expect(compareVectorClocks(clock1, clock2)).toBe(0);
    });

    it('should return -1 when clock1 is dominated by clock2', () => {
      const clock1 = { 'device-A': 1 };
      const clock2 = { 'device-A': 2 };
      
      expect(compareVectorClocks(clock1, clock2)).toBe(-1);
    });

    it('should return 1 when clock2 is dominated by clock1', () => {
      const clock1 = { 'device-A': 3 };
      const clock2 = { 'device-A': 1 };
      
      expect(compareVectorClocks(clock1, clock2)).toBe(1);
    });

    it('should return 0 for concurrent clocks', () => {
      const clock1 = { 'device-A': 2, 'device-B': 1 };
      const clock2 = { 'device-A': 1, 'device-B': 2 };
      
      expect(compareVectorClocks(clock1, clock2)).toBe(0);
    });
  });

  describe('mergePropertyAware', () => {
    it('should prefer local data when weights are equal', () => {
      const localWd = { id: 1, level: 5, reviewCount: 3, ef: 2.5 };
      const cloudWd = { id: 1, level: 5, reviewCount: 3, ef: 2.0 };
      
      const result = mergePropertyAware(localWd, cloudWd);
      
      expect(result.ef).toBe(2.5);
    });

    it('should prefer cloud data when weight is higher', () => {
      const localWd = { id: 1, level: 3, reviewCount: 2, ef: 2.5 };
      const cloudWd = { id: 1, level: 8, reviewCount: 5, ef: 2.0 };
      
      const result = mergePropertyAware(localWd, cloudWd);
      
      expect(result.level).toBe(8);
      expect(result.reviewCount).toBe(5);
    });

    it('should merge mnemonics from both sources', () => {
      const localWd = { id: 1, mnemonic: 'local hint' };
      const cloudWd = { id: 1, mnemonic: 'cloud hint' };
      
      const result = mergePropertyAware(localWd, cloudWd);
      
      expect(result.mnemonic).toContain('local hint');
      expect(result.mnemonic).toContain('cloud hint');
    });

    it('should take maximum wrongCount', () => {
      const localWd = { id: 1, wrongCount: 5 };
      const cloudWd = { id: 1, wrongCount: 3 };
      
      const result = mergePropertyAware(localWd, cloudWd);
      
      expect(result.wrongCount).toBe(5);
    });
  });

  describe('mergeLocalAndCloud', () => {
    it('should merge progress data correctly', () => {
      const local = {
        progress: { 1: { id: 1, level: 5 } },
        wrongWords: {},
        heatmap: {},
        deletedIds: []
      };
      
      const cloud = {
        progress: { 2: { id: 2, level: 3 } },
        wrongWords: {},
        heatmap: {},
        deletedIds: []
      };
      
      const result = mergeLocalAndCloud(local, cloud, 'test-device');
      
      expect(result.progress).toHaveProperty('1');
      expect(result.progress).toHaveProperty('2');
    });

    it('should respect deleted IDs', () => {
      const local = {
        progress: { 1: { id: 1, level: 5 } },
        wrongWords: {},
        heatmap: {},
        deletedIds: [2]
      };
      
      const cloud = {
        progress: { 2: { id: 2, level: 3 } },
        wrongWords: {},
        heatmap: {},
        deletedIds: []
      };
      
      const result = mergeLocalAndCloud(local, cloud, 'test-device');
      
      expect(result.progress).not.toHaveProperty('2');
      expect(result.deletedIds).toContain(2);
    });

    it('should merge wrongWords with maximum counts', () => {
      const local = {
        progress: {},
        wrongWords: { 1: { count: 3, firstWrong: 1000, lastWrong: 2000 } },
        heatmap: {},
        deletedIds: []
      };
      
      const cloud = {
        progress: {},
        wrongWords: { 1: { count: 5, firstWrong: 500, lastWrong: 3000 } },
        heatmap: {},
        deletedIds: []
      };
      
      const result = mergeLocalAndCloud(local, cloud, 'test-device');
      
      expect(result.wrongWords[1].count).toBe(5);
      expect(result.wrongWords[1].firstWrong).toBe(500);
      expect(result.wrongWords[1].lastWrong).toBe(3000);
    });

    it('should merge heatmap with maximum counts', () => {
      const local = {
        progress: {},
        wrongWords: {},
        heatmap: { '2024-01-01': 10, '2024-01-02': 5 },
        deletedIds: []
      };
      
      const cloud = {
        progress: {},
        wrongWords: {},
        heatmap: { '2024-01-01': 8, '2024-01-03': 7 },
        deletedIds: []
      };
      
      const result = mergeLocalAndCloud(local, cloud, 'test-device');
      
      expect(result.heatmap['2024-01-01']).toBe(10);
      expect(result.heatmap['2024-01-02']).toBe(5);
      expect(result.heatmap['2024-01-03']).toBe(7);
    });

    it('should handle empty local data', () => {
      const local = {
        progress: {},
        wrongWords: {},
        heatmap: {},
        deletedIds: []
      };
      
      const cloud = {
        progress: { 1: { id: 1, level: 5 } },
        wrongWords: { 1: { count: 2 } },
        heatmap: { '2024-01-01': 10 },
        deletedIds: []
      };
      
      const result = mergeLocalAndCloud(local, cloud, 'test-device');
      
      expect(result.progress).toEqual(cloud.progress);
      expect(result.wrongWords).toEqual(cloud.wrongWords);
      expect(result.heatmap).toEqual(cloud.heatmap);
    });
  });
});
