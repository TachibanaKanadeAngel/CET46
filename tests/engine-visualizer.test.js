import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../js/config.js', () => ({
  CONFIG: { STORAGE_KEYS: { ENGINE_STATE: 'cet46_engine_state' } }
}));
vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

function makeEl() {
  return {
    textContent: '',
    style: {},
    className: '',
    classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: vi.fn(() => false) },
    dataset: {},
    appendChild: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    setAttribute: vi.fn(),
    remove: vi.fn(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  const store = {};
  globalThis.localStorage = {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = String(v); }),
    removeItem: vi.fn(k => { delete store[k]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    _store: store,
  };
  const elements = {};
  globalThis.document = {
    getElementById: vi.fn(id => elements[id] ?? (elements[id] = makeEl())),
    querySelector: vi.fn(() => makeEl()),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => makeEl()),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hidden: false,
  };
  globalThis.window = {};
  globalThis.alert = vi.fn();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.resetModules();
});

describe('engine-visualizer module', () => {
  it('exports EngineState constants with all four states', async () => {
    const { EngineState } = await import('../js/features/engine-visualizer.js');
    expect(EngineState.SLEEPING).toBe('sleeping');
    expect(EngineState.SMELTING).toBe('smelting');
    expect(EngineState.OVERHEATED).toBe('overheated');
    expect(EngineState.JAMMED).toBe('jammed');
    expect(Object.keys(EngineState)).toHaveLength(4);
  });

  it('exports a singleton engineVisualizer instance', async () => {
    const { engineVisualizer, MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    expect(engineVisualizer).toBeInstanceOf(MemoryEngineFSM);
  });

  it('constructor initializes default state', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    expect(fsm.state).toBe('sleeping');
    expect(fsm.coal).toBe(20);
    expect(fsm.heat).toBe(0);
    expect(fsm.reviewCount).toBe(0);
    expect(fsm.errorCount).toBe(0);
    expect(fsm.lastActionTime).toBeGreaterThan(0);
    expect(fsm.particleInterval).toBeNull();
  });

  it('handleAction(quality>=3) increases coal, decreases heat, increments reviewCount', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.heat = 10;
    fsm.handleAction(4);
    expect(fsm.coal).toBe(25);
    expect(fsm.heat).toBe(8);
    expect(fsm.reviewCount).toBe(1);
    expect(fsm.errorCount).toBe(0);
  });

  it('handleAction(quality<3) increases heat, decreases coal, increments errorCount', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.handleAction(1);
    expect(fsm.heat).toBe(8);
    expect(fsm.coal).toBe(18);
    expect(fsm.errorCount).toBe(1);
    expect(fsm.reviewCount).toBe(0);
  });

  it('handleAction caps coal at 100 and clamps to 0', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 98;
    fsm.handleAction(4);
    expect(fsm.coal).toBe(100);
    fsm.coal = 1;
    fsm.handleAction(1);
    expect(fsm.coal).toBe(0);
  });

  it('handleAction caps heat at 100', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.heat = 95;
    fsm.handleAction(1);
    expect(fsm.heat).toBe(100);
  });

  it('evaluateState transitions to OVERHEATED when heat>=85', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.heat = 85;
    fsm.lastActionTime = Date.now();
    fsm.evaluateState();
    expect(fsm.state).toBe(EngineState.OVERHEATED);
  });

  it('evaluateState transitions to JAMMED when coal<=0', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 0;
    fsm.heat = 10;
    fsm.lastActionTime = Date.now();
    fsm.evaluateState();
    expect(fsm.state).toBe(EngineState.JAMMED);
  });

  it('evaluateState transitions to SMELTING when coal>0 and heat<85', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 50;
    fsm.heat = 30;
    fsm.lastActionTime = Date.now();
    fsm.evaluateState();
    expect(fsm.state).toBe(EngineState.SMELTING);
  });

  it('evaluateState transitions to SLEEPING after 5min idle', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.state = EngineState.SMELTING;
    fsm.lastActionTime = Date.now() - 300001;
    fsm.evaluateState();
    expect(fsm.state).toBe(EngineState.SLEEPING);
  });

  it('passiveHeatDecay cools SMELTING state by 1', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.state = EngineState.SMELTING;
    fsm.heat = 50;
    fsm.lastActionTime = Date.now();
    fsm.passiveHeatDecay();
    expect(fsm.heat).toBe(49);
  });

  it('passiveHeatDecay enters SLEEPING after 5min idle', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.state = EngineState.SMELTING;
    fsm.lastActionTime = Date.now() - 300001;
    fsm.passiveHeatDecay();
    expect(fsm.state).toBe(EngineState.SLEEPING);
  });

  it('getStatus returns snapshot of all state fields', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 50;
    fsm.heat = 30;
    fsm.reviewCount = 5;
    fsm.errorCount = 2;
    fsm.state = 'smelting';
    const status = fsm.getStatus();
    expect(status).toEqual({
      state: 'smelting', coal: 50, heat: 30, reviewCount: 5, errorCount: 2,
    });
  });

  it('reset restores defaults and saves state', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 99;
    fsm.heat = 99;
    fsm.reviewCount = 10;
    fsm.errorCount = 5;
    fsm.state = EngineState.OVERHEATED;
    fsm.reset();
    expect(fsm.coal).toBe(20);
    expect(fsm.heat).toBe(0);
    expect(fsm.reviewCount).toBe(0);
    expect(fsm.errorCount).toBe(0);
    expect(fsm.state).toBe(EngineState.SLEEPING);
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();
  });

  it('saveState persists state to localStorage', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.coal = 42;
    fsm.heat = 17;
    fsm.saveState();
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      'cet46_engine_state',
      expect.stringContaining('"coal":42')
    );
  });

  it('loadState restores valid state from localStorage', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    globalThis.localStorage._store['cet46_engine_state'] = JSON.stringify({
      coal: 75, heat: 25, reviewCount: 8, errorCount: 3,
      state: EngineState.SMELTING, lastActionTime: 12345
    });
    const fsm = new MemoryEngineFSM();
    fsm.loadState();
    expect(fsm.coal).toBe(75);
    expect(fsm.heat).toBe(25);
    expect(fsm.reviewCount).toBe(8);
    expect(fsm.errorCount).toBe(3);
    expect(fsm.state).toBe(EngineState.SMELTING);
    expect(fsm.lastActionTime).toBe(12345);
  });

  it('loadState rejects out-of-range coal/heat values', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    globalThis.localStorage._store['cet46_engine_state'] = JSON.stringify({
      coal: 999, heat: -50, reviewCount: 5, errorCount: 1,
      state: 'smelting', lastActionTime: 1
    });
    const fsm = new MemoryEngineFSM();
    fsm.loadState();
    expect(fsm.coal).toBe(20);
    expect(fsm.heat).toBe(0);
  });

  it('loadState rejects invalid state string', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    globalThis.localStorage._store['cet46_engine_state'] = JSON.stringify({
      coal: 50, heat: 25, state: 'invalid_state', lastActionTime: 1
    });
    const fsm = new MemoryEngineFSM();
    fsm.loadState();
    expect(fsm.state).toBe(EngineState.SLEEPING);
  });

  it('loadState handles corrupted JSON gracefully', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    globalThis.localStorage._store['cet46_engine_state'] = 'not-valid-json{';
    const fsm = new MemoryEngineFSM();
    expect(() => fsm.loadState()).not.toThrow();
    expect(fsm.coal).toBe(20);
  });

  it('init bails when engine-container is missing', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    globalThis.document.getElementById = vi.fn(() => null);
    fsm.init();
    expect(fsm.el.container).toBeNull();
  });

  it('init loads DOM elements when container exists', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.init();
    expect(fsm.el.container).not.toBeNull();
    expect(fsm.el.fuelBar).not.toBeNull();
    expect(fsm.el.heatBar).not.toBeNull();
  });

  it('destroy clears intervals and removes listeners', async () => {
    const { MemoryEngineFSM } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    const clickHandler = vi.fn();
    const visHandler = vi.fn();
    fsm.heatDecayInterval = 123;
    fsm.clickHandler = clickHandler;
    fsm.visibilityHandler = visHandler;
    fsm.destroy();
    expect(fsm.heatDecayInterval).toBeNull();
    expect(fsm.clickHandler).toBeNull();
    expect(fsm.visibilityHandler).toBeNull();
    expect(globalThis.document.removeEventListener).toHaveBeenCalledWith('click', clickHandler);
    expect(globalThis.document.removeEventListener).toHaveBeenCalledWith('visibilitychange', visHandler);
  });

  it('triggerStateTransitionEffect to OVERHEATED calls UI.toast warning', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const toast = vi.fn();
    globalThis.window.UI = { toast };
    const fsm = new MemoryEngineFSM();
    fsm.triggerStateTransitionEffect(EngineState.SMELTING, EngineState.OVERHEATED);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('过热'), 'warning');
  });

  it('triggerStateTransitionEffect to JAMMED calls UI.toast warning', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const toast = vi.fn();
    globalThis.window.UI = { toast };
    const fsm = new MemoryEngineFSM();
    fsm.triggerStateTransitionEffect(EngineState.SMELTING, EngineState.JAMMED);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('燃料'), 'warning');
  });

  it('triggerStateTransitionEffect to SMELTING calls UI.toast success', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const toast = vi.fn();
    globalThis.window.UI = { toast };
    const fsm = new MemoryEngineFSM();
    fsm.triggerStateTransitionEffect(EngineState.SLEEPING, EngineState.SMELTING);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('正常运行'), 'success');
  });

  it('manages startParticleEffect and stopParticleEffect lifecycle', async () => {
    const { MemoryEngineFSM, EngineState } = await import('../js/features/engine-visualizer.js');
    const fsm = new MemoryEngineFSM();
    fsm.init();
    fsm.state = EngineState.SMELTING;

    fsm.startParticleEffect();
    expect(fsm.particleInterval).not.toBeNull();

    // Advance 2.5s to trigger interval particle creation
    vi.advanceTimersByTime(2500);

    fsm.createSmokeParticle();
    fsm.createSparkParticle();
    fsm.createFireflyParticle();

    fsm.stopParticleEffect();
    expect(fsm.particleInterval).toBeNull();
  });
});

