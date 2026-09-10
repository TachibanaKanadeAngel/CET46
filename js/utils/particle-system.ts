import logger from './logger.js';

function getDevicePerformanceLevel(): number {
  const cores = (navigator as any).hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  if (cores <= 2 || memory <= 2) return 0.3;
  if (cores <= 4 || memory <= 4) return 0.6;
  return 1.0;
}

async function getBatteryFactor(): Promise<number> {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      if (battery.level < 0.2 && !battery.charging) return 0.3;
      if (battery.level < 0.5 && !battery.charging) return 0.6;
    } catch (_e) {
      // ignore
    }
  }
  return 1.0;
}

export class ParticleSystem {
  public container: HTMLDivElement | null;
  public particles: Array<{ element: HTMLDivElement; type: string; createdAt: number; duration: number }>;
  public baseMaxParticles: number;
  public maxParticles: number;
  public performanceFactor: number;
  public isRunning: boolean;
  public animationId: number | null;
  public currentTheme: string;
  public frameCount: number;
  public lastFpsCheck: number;
  public currentFps: number;
  public _timers: Set<any>;
  public fpsLimit: number;
  public frameInterval: number;
  public lastFrameTime: number;

  public themes: Record<string, string[]>;
  public particleConfigs: Record<string, { className: string; duration: { min: number; max: number }; count: number }>;

  constructor() {
    this.container = null;
    this.particles = [];
    this.baseMaxParticles = 50;
    this.maxParticles = 50;
    this.performanceFactor = 1.0;
    this.isRunning = false;
    this.animationId = null;
    this.currentTheme = 'default';
    this.frameCount = 0;
    this.lastFpsCheck = 0;
    this.currentFps = 60;
    this._timers = new Set();
    this.fpsLimit = 30;
    this.frameInterval = 1000 / 30;
    this.lastFrameTime = 0;

    this.themes = {
      default: ['smoke', 'dust', 'spark'],
      night: ['firefly', 'star', 'dust'],
      autumn: ['leaf', 'smoke', 'dust'],
      winter: ['snow', 'dust'],
      summer: ['firefly', 'spark', 'dust'],
    };

    this.particleConfigs = {
      smoke: {
        className: 'smoke-particle',
        duration: { min: 10, max: 20 },
        count: 8,
      },
      firefly: {
        className: 'firefly-particle glow',
        duration: { min: 4, max: 8 },
        count: 5,
      },
      spark: {
        className: 'spark-particle',
        duration: { min: 1, max: 3 },
        count: 10,
      },
      dust: {
        className: 'dust-particle',
        duration: { min: 15, max: 25 },
        count: 6,
      },
      star: {
        className: 'star-particle',
        duration: { min: 2, max: 5 },
        count: 15,
      },
      leaf: {
        className: 'leaf-particle',
        duration: { min: 8, max: 15 },
        count: 6,
      },
      snow: {
        className: 'snow-particle',
        duration: { min: 10, max: 20 },
        count: 20,
      },
    };

    this.initPerformanceDetection();
  }

  _setTimeout(fn: () => void, delay: number): any {
    const id = setTimeout(() => {
      this._timers.delete(id);
      if (this.isRunning) fn();
    }, delay);
    this._timers.add(id);
    return id;
  }

  _clearAllTimers(): void {
    for (const id of this._timers) {
      clearTimeout(id);
    }
    this._timers.clear();
  }

  async initPerformanceDetection(): Promise<void> {
    const perfLevel = getDevicePerformanceLevel();
    const batteryFactor = await getBatteryFactor();
    this.performanceFactor = perfLevel * batteryFactor;
    this.maxParticles = Math.floor(this.baseMaxParticles * this.performanceFactor);

    this.fpsLimit = this.performanceFactor < 0.5 ? 15 : 30;
    this.frameInterval = 1000 / this.fpsLimit;
    this.lastFrameTime = 0;

    logger.info(
      `🎮 性能系数: ${this.performanceFactor.toFixed(2)}, 最大粒子数: ${this.maxParticles}, 帧率限制: ${this.fpsLimit}fps`
    );
  }

  init(): void {
    if (this.container) return;

    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      logger.info('⚠️ file:// 协议下禁用粒子系统');
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'particle-layer';
    this.container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.container);

    this.detectTheme();
    this.start();

    logger.info('✨ 环境粒子系统已启动');
  }

  detectTheme(): void {
    const hour = new Date().getHours();
    const month = new Date().getMonth();

    if (hour >= 20 || hour < 6) {
      this.currentTheme = 'night';
    } else if (month >= 8 && month <= 10) {
      this.currentTheme = 'autumn';
    } else if (month >= 11 || month <= 1) {
      this.currentTheme = 'winter';
    } else if (month >= 5 && month <= 7) {
      this.currentTheme = 'summer';
    } else {
      this.currentTheme = 'default';
    }

    logger.info(`🎨 当前粒子主题: ${this.currentTheme}`);
  }

  start(): void {
    if (this.isRunning) return;
    if (typeof window !== 'undefined' && window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      logger.info('粒子系统因 prefers-reduced-motion 未启动');
      return;
    }
    this.isRunning = true;
    this.generateInitialParticles();
    this.animate(performance.now());
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  generateInitialParticles(): void {
    const themeParticles = this.themes[this.currentTheme] || this.themes['default'];

    themeParticles.forEach(type => {
      const config = this.particleConfigs[type];
      if (!config) return;

      for (let i = 0; i < config.count; i++) {
        this._setTimeout(() => {
          this.createParticle(type);
        }, Math.random() * 5000);
      }
    });
  }

  createParticle(type: string): void {
    if (!this.isRunning || this.particles.length >= this.maxParticles || !this.container) return;

    const config = this.particleConfigs[type];
    if (!config) return;

    const particle = document.createElement('div');
    particle.className = config.className;

    const duration =
      config.duration.min + Math.random() * (config.duration.max - config.duration.min);

    const startX = Math.random() * window.innerWidth;
    const startY =
      type === 'smoke' || type === 'spark'
        ? window.innerHeight
        : type === 'snow' || type === 'leaf'
          ? -10
          : Math.random() * window.innerHeight;

    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${Math.random() * 2}s`;

    if (type === 'firefly') {
      const colors = ['#ffd700', '#ffed4a', '#fff9c4'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    }

    this.container.appendChild(particle);
    this.particles.push({
      element: particle,
      type,
      createdAt: Date.now(),
      duration: duration * 1000,
    });

    this._setTimeout(
      () => {
        this.removeParticle(particle);
      },
      duration * 1000 + 2000
    );
  }

  removeParticle(particleElement: HTMLDivElement): void {
    const index = this.particles.findIndex(p => p.element === particleElement);
    if (index !== -1) {
      this.particles.splice(index, 1);
    }

    if (particleElement.parentNode) {
      particleElement.parentNode.removeChild(particleElement);
    }
  }

  animate(currentTime: number): void {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(time => this.animate(time));

    const deltaTime = currentTime - this.lastFrameTime;
    if (deltaTime < this.frameInterval) return;

    this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

    const now = Date.now();
    this.frameCount++;

    if (now - this.lastFpsCheck > 2000) {
      this.currentFps = this.frameCount / 2;
      this.frameCount = 0;
      this.lastFpsCheck = now;

      if (this.currentFps < 30 && this.maxParticles > 10) {
        this.maxParticles = Math.max(10, Math.floor(this.maxParticles * 0.8));
        logger.info(`⚠️ FPS 过低 (${this.currentFps.toFixed(1)}), 减少粒子至 ${this.maxParticles}`);
      } else if (
        this.currentFps > 50 &&
        this.maxParticles < this.baseMaxParticles * this.performanceFactor
      ) {
        this.maxParticles = Math.min(
          Math.floor(this.baseMaxParticles * this.performanceFactor),
          this.maxParticles + 5
        );
      }
    }

    if (this.frameCount % 3 === 0) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        if (now - particle.createdAt > particle.duration) {
          this.particles.splice(i, 1);
          if (particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
          }
        }
      }
    }

    if (this.particles.length < this.maxParticles * 0.6) {
      const themeParticles = this.themes[this.currentTheme] || this.themes['default'];
      const randomType = themeParticles[Math.floor(Math.random() * themeParticles.length)];
      this.createParticle(randomType);
    }
  }

  setTheme(theme: string): void {
    if (this.themes[theme]) {
      this.currentTheme = theme;
      this.clearAll();
      this.generateInitialParticles();
      logger.info(`🎨 粒子主题已切换: ${theme}`);
    }
  }

  clearAll(): void {
    this.particles.forEach(p => {
      if (p.element.parentNode) {
        p.element.parentNode.removeChild(p.element);
      }
    });
    this.particles = [];
  }

  addEngineParticles(count: number = 5): void {
    for (let i = 0; i < count; i++) {
      this.createParticle('spark');
    }
  }

  addCelebrationParticles(): void {
    for (let i = 0; i < 10; i++) {
      this._setTimeout(() => {
        this.createParticle('firefly');
      }, i * 100);
    }
  }

  getStats(): any {
    return {
      total: this.particles.length,
      byType: this.particles.reduce((acc: any, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      theme: this.currentTheme,
      isRunning: this.isRunning,
    };
  }

  destroy(): void {
    this.stop();
    this._clearAllTimers();
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

export const particleSystem = new ParticleSystem();
