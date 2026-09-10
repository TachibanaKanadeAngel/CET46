// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initSemanticGraphUI,
  buildWordMaps,
  findConfusingWords,
  adjustForSemanticInterference,
  buildSemanticGraphAsync,
  cleanupSemanticGraph,
  initSemanticGraphInBackground,
} from '../js/utils/semantic-graph-ui.js';
import { AppState } from '../js/state.js';

describe('semantic-graph-ui.js test suite', () => {
  const mockWords = [
    { id: 1, word: 'adapt', level: 'CET4' },
    { id: 2, word: 'adopt', level: 'CET4' },
    { id: 3, word: 'adept', level: 'CET6' },
    { id: 4, word: 'apple', level: 'CET4' },
  ];

  let mockData = {};

  beforeEach(() => {
    AppState.set('semanticInterfered', false);
    mockData = {
      1: { status: 'review', nextReview: Date.now() + 86400000 },
      2: { status: 'review', nextReview: Date.now() + 86400000 },
      3: { status: 'new' },
    };

    initSemanticGraphUI({
      getWORDS: () => mockWords,
      getData: () => mockData,
      CONSTANTS: { SEMANTIC_GRAPH_DEFER_MS: 50 },
    });
  });

  afterEach(() => {
    cleanupSemanticGraph();
  });

  it('buildWordMaps maps words by ID and by word string', () => {
    buildWordMaps();
    const confusing = findConfusingWords('adapt');
    expect(confusing).toContain('adopt');
  });

  it('adjustForSemanticInterference scales interval when confusing word review schedules collide', () => {
    const baseInterval = 86400000; // 1 day
    const adjusted = adjustForSemanticInterference(1, baseInterval);

    // adapt has confusing word adopt which has nextReview around the same time
    expect(adjusted).toBeGreaterThan(baseInterval);
    expect(AppState.get('semanticInterfered')).toBe(true);

    // Word with no confusing pairs returns baseInterval
    AppState.set('semanticInterfered', false);
    const noInterference = adjustForSemanticInterference(4, baseInterval);
    expect(noInterference).toBe(baseInterval);
  });

  it('buildSemanticGraphAsync handles Worker SAVE_TREE, progress, complete messages', async () => {
    class MockWorker {
      constructor() {
        this.onmessage = null;
        this.onerror = null;
      }
      postMessage(msg) {
        setTimeout(() => {
          if (this.onmessage) {
            // Send SAVE_TREE
            this.onmessage({ data: { type: 'SAVE_TREE', data: 'tree_data', wordCount: 10 } });
            // Send progress
            this.onmessage({ data: { type: 'progress', progress: 0.5 } });
            // Send complete
            this.onmessage({
              data: {
                type: 'complete',
                results: { adapt: [{ word: 'adept', distance: 1 }] },
              },
            });
          }
        }, 10);
      }
      terminate() {}
    }

    const origWorker = globalThis.Worker;
    globalThis.Worker = MockWorker;
    if (typeof window !== 'undefined') window.Worker = MockWorker;

    // Mock URL constructor if needed
    const origURL = globalThis.URL;
    globalThis.URL = class MockURL {
      constructor(path, base) {
        this.href = 'http://localhost/worker.js';
      }
    };
    if (typeof window !== 'undefined') window.URL = globalThis.URL;

    try {
      const graph = await buildSemanticGraphAsync(mockWords, 2);
      expect(graph).toBeDefined();
      expect(graph?.adapt).toBeDefined();

      // Subsequent call uses cache
      const cached = await buildSemanticGraphAsync(mockWords, 2);
      expect(cached).toBe(graph);
    } finally {
      globalThis.Worker = origWorker;
      if (typeof window !== 'undefined') window.Worker = origWorker;
      globalThis.URL = origURL;
      if (typeof window !== 'undefined') window.URL = origURL;
    }
  });

  it('cleanupSemanticGraph terminates worker and clears pending operations', () => {
    cleanupSemanticGraph();
    expect(AppState.get('semanticInterfered')).toBe(false);
  });
});

