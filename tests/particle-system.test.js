// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ParticleSystem, particleSystem } from '../js/utils/particle-system.js';

describe('particle-system.js test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    window.innerWidth = 1024;
    window.innerHeight = 768;

    // Reset particleSystem instance
    particleSystem.destroy();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes ParticleSystem and sets performance factor', async () => {
    const system = new ParticleSystem();
    await system.initPerformanceDetection();

    expect(system.performanceFactor).toBeGreaterThan(0);
    expect(system.maxParticles).toBeGreaterThan(0);
    expect(system.fpsLimit).toBeGreaterThanOrEqual(15);
    expect(system.frameInterval).toBeGreaterThan(0);
  });

  it('detectTheme sets theme based on current hour and month', () => {
    const system = new ParticleSystem();

    // Night theme (>= 20 or < 6)
    vi.setSystemTime(new Date(2026, 7, 15, 22, 0, 0));
    system.detectTheme();
    expect(system.currentTheme).toBe('night');

    // Autumn theme (month 8, 9, 10 during daytime)
    vi.setSystemTime(new Date(2026, 8, 15, 14, 0, 0));
    system.detectTheme();
    expect(system.currentTheme).toBe('autumn');

    // Winter theme (month 11, 0, 1 during daytime)
    vi.setSystemTime(new Date(2026, 11, 15, 14, 0, 0));
    system.detectTheme();
    expect(system.currentTheme).toBe('winter');

    // Summer theme (month 5, 6, 7 during daytime)
    vi.setSystemTime(new Date(2026, 6, 15, 14, 0, 0));
    system.detectTheme();
    expect(system.currentTheme).toBe('summer');

    // Default theme (month 2, 3, 4 during daytime)
    vi.setSystemTime(new Date(2026, 3, 15, 14, 0, 0));
    system.detectTheme();
    expect(system.currentTheme).toBe('default');
  });

  it('init creates container and starts particle system', () => {
    const system = new ParticleSystem();
    system.init();

    expect(system.container).not.toBeNull();
    expect(system.container.className).toBe('particle-layer');
    expect(system.isRunning).toBe(true);

    // Calling init again does not duplicate container
    system.init();
    expect(document.querySelectorAll('.particle-layer').length).toBe(1);

    system.destroy();
    expect(system.container).toBeNull();
    expect(system.isRunning).toBe(false);
  });

  it('respects prefers-reduced-motion', () => {
    const system = new ParticleSystem();
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

    system.start();
    expect(system.isRunning).toBe(false);
  });

  it('createParticle generates elements with styles and schedules removal', () => {
    const system = new ParticleSystem();
    system.container = document.createElement('div');
    document.body.appendChild(system.container);
    system.isRunning = true;

    system.createParticle('firefly');
    system.createParticle('smoke');
    system.createParticle('spark');
    system.createParticle('snow');
    system.createParticle('leaf');

    expect(system.particles.length).toBe(5);
    const particleDivs = system.container.querySelectorAll('div');
    expect(particleDivs.length).toBe(5);

    // Advance time to trigger particle removal
    vi.advanceTimersByTime(30000);
    expect(system.particles.length).toBe(0);
    system.destroy();
  });

  it('setTheme switches current theme and regenerates particles', () => {
    const system = new ParticleSystem();
    system.container = document.createElement('div');
    document.body.appendChild(system.container);
    system.isRunning = true;

    system.setTheme('night');
    expect(system.currentTheme).toBe('night');

    system.setTheme('winter');
    expect(system.currentTheme).toBe('winter');
    system.destroy();
  });

  it('addEngineParticles and addCelebrationParticles create custom particles', () => {
    const system = new ParticleSystem();
    system.container = document.createElement('div');
    document.body.appendChild(system.container);
    system.isRunning = true;

    system.addEngineParticles(3);
    expect(system.particles.length).toBe(3);

    system.addCelebrationParticles();
    vi.advanceTimersByTime(1500);
    expect(system.particles.length).toBe(13);

    const stats = system.getStats();
    expect(stats.total).toBe(13);
    expect(stats.isRunning).toBe(true);

    system.destroy();
  });

  it('animate throttles frames and adjusts particles on low/high fps', () => {
    const system = new ParticleSystem();
    system.container = document.createElement('div');
    document.body.appendChild(system.container);
    system.isRunning = true;
    system.frameInterval = 33; // ~30fps
    system.lastFrameTime = 0;

    // Simulate animation frame
    system.lastFpsCheck = Date.now();
    system.animate(50);
    expect(system.frameCount).toBe(1);

    // Simulate low fps check (< 30) after 2 seconds
    system.lastFpsCheck = 0;
    vi.setSystemTime(Date.now() + 2500);
    system.frameCount = 20; // 20 frames / 2s = 10 fps
    system.maxParticles = 50;
    system.animate(100);

    expect(system.maxParticles).toBeLessThan(50);
    system.destroy();
  });
});
