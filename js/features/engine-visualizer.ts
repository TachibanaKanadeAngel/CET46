import logger from '../utils/logger.js';

export const EngineState = {
  SLEEPING: 'sleeping',
  SMELTING: 'smelting',
  OVERHEATED: 'overheated',
  JAMMED: 'jammed',
};

export class MemoryEngineFSM {
  public state: string;
  public coal: number;
  public heat: number;
  public reviewCount: number;
  public errorCount: number;
  public lastActionTime: number;
  public el: Record<string, HTMLElement | null>;
  public particleInterval: any;
  public clickHandler: any;
  public visibilityHandler: any;
  public heatDecayInterval: any;
  [key: string]: any;

  constructor() {
    this.state = EngineState.SLEEPING;
    this.coal = 20;
    this.heat = 0;
    this.reviewCount = 0;
    this.errorCount = 0;
    this.lastActionTime = Date.now();

    this.el = {
      container: null,
      fuelBar: null,
      heatBar: null,
      sprite: null,
      statusText: null,
      fuelLabel: null,
      heatLabel: null,
      particleLayer: null,
      engineCore: null,
    };

    this.particleInterval = null;
    this.clickHandler = null;
    this.visibilityHandler = null;
    this.heatDecayInterval = null;
  }

  init(): void {
    this.el.container = document.getElementById('engine-container');
    this.el.fuelBar = document.getElementById('engine-fuel-fill');
    this.el.heatBar = document.getElementById('engine-heat-fill');
    this.el.sprite = document.getElementById('engine-sprite');
    this.el.statusText = document.getElementById('engine-status-text');
    this.el.fuelLabel = document.getElementById('engine-fuel-label');
    this.el.heatLabel = document.getElementById('engine-heat-label');
    this.el.particleLayer = document.querySelector('.particle-layer');
    this.el.engineCore = document.querySelector('.engine-core-container');

    if (!this.el.container) {
      logger.warn('⚠️ 引擎容器未找到，跳过初始化');
      return;
    }

    this.loadState();
    this.initListeners();
    this.updateUI();
    this.startParticleEffect();

    logger.info('✅ 记忆引擎可视化系统已启动');
  }

  initListeners(): void {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('[data-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'mark-known') this.handleAction(3);
      if (action === 'mark-unknown') this.handleAction(1);
      if (action === 'review-known') this.handleAction(3);
      if (action === 'review-unknown') this.handleAction(1);
    };
    document.addEventListener('click', this.clickHandler);

    this.heatDecayInterval = setInterval(() => {
      this.passiveHeatDecay();
    }, 5000);

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stopParticleEffect();
      } else {
        this.startParticleEffect();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  destroy(): void {
    this.stopParticleEffect();
    if (this.heatDecayInterval) {
      clearInterval(this.heatDecayInterval);
      this.heatDecayInterval = null;
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  handleAction(quality: number): void {
    this.lastActionTime = Date.now();

    if (quality >= 3) {
      this.coal = Math.min(100, this.coal + 5);
      this.heat = Math.max(0, this.heat - 2);
      this.reviewCount++;
      this.createParticle();
    } else {
      this.heat = Math.min(100, this.heat + 8);
      this.coal = Math.max(0, this.coal - 2);
      this.errorCount++;
    }

    this.evaluateState();
    this.saveState();
  }

  passiveHeatDecay(): void {
    const prevState = this.state;
    const IDLE_TIMEOUT = 300000;
    if (Date.now() - this.lastActionTime > IDLE_TIMEOUT && this.state !== EngineState.SLEEPING) {
      this.state = EngineState.SLEEPING;
      this.updateUI();
      if (prevState !== this.state) {
        this.triggerStateTransitionEffect(prevState, this.state);
      }
      return;
    }

    if (this.state === EngineState.SMELTING) {
      this.heat = Math.max(0, this.heat - 1);
      this.updateUI();
    }
  }

  evaluateState(): void {
    const prevState = this.state;
    const IDLE_TIMEOUT = 300000;
    if (Date.now() - this.lastActionTime > IDLE_TIMEOUT) {
      this.state = EngineState.SLEEPING;
    } else if (this.heat >= 85) {
      this.state = EngineState.OVERHEATED;
    } else if (this.coal <= 0) {
      this.state = EngineState.JAMMED;
    } else if (this.coal > 0 && this.heat < 85) {
      this.state = EngineState.SMELTING;
    }

    this.updateUI();

    if (prevState !== this.state) {
      this.triggerStateTransitionEffect(prevState, this.state);
    }
  }

  updateUI(): void {
    if (!this.el.container) return;

    const statusColors: Record<string, string> = {
      [EngineState.SMELTING]: '#63c74d',
      [EngineState.OVERHEATED]: '#e43b44',
      [EngineState.SLEEPING]: '#ffd700',
      [EngineState.JAMMED]: '#2b1100',
    };

    const currentColor = statusColors[this.state] || statusColors[EngineState.SLEEPING];

    if (this.el.fuelBar) {
      this.el.fuelBar.style.width = `${this.coal}%`;
      this.el.fuelBar.style.backgroundColor = 'var(--sv-energy-green)';
    }

    if (this.el.heatBar) {
      this.el.heatBar.style.width = `${this.heat}%`;
      this.el.heatBar.style.backgroundColor = 'var(--sv-heat-red)';
    }

    if (this.el.fuelLabel) {
      this.el.fuelLabel.textContent = `燃料：${Math.round(this.coal)}%`;
    }

    if (this.el.heatLabel) {
      this.el.heatLabel.textContent = `温度：${Math.round(this.heat)}%`;
    }

    this.el.container.className = `sv-panel engine-core-container sv-${this.state}`;

    const statusMessages: Record<string, string> = {
      [EngineState.SLEEPING]: '* 引擎正在休眠 *',
      [EngineState.SMELTING]: '* 引擎正在平稳炼化记忆 *',
      [EngineState.OVERHEATED]: '! 警告：错题过多，即将熔毁 !',
      [EngineState.JAMMED]: '? 燃料耗尽，请补充复习 ?',
    };

    if (this.el.statusText) {
      this.el.statusText.textContent = statusMessages[this.state] || '';
    }

    if (this.el.sprite) {
      if (this.state === EngineState.OVERHEATED) {
        this.el.sprite.style.animation = 'sv-shake 0.2s infinite steps(2)';
        this.el.sprite.style.filter = 'drop-shadow(0 0 8px #e43b44)';
      } else {
        this.el.sprite.style.animation = 'sv-float 3s infinite steps(8)';
        this.el.sprite.style.filter = `drop-shadow(0 0 10px ${currentColor})`;
      }
    }

    if (this.state === EngineState.OVERHEATED) {
      this.el.container.classList.add('sv-overheated');
    } else if (this.state === EngineState.JAMMED) {
      this.el.container.classList.add('sv-jammed');
    } else if (this.state === EngineState.SLEEPING) {
      this.el.container.classList.add('sv-sleeping');
    } else {
      this.el.container.classList.remove('sv-overheated', 'sv-jammed', 'sv-sleeping');
    }
  }

  triggerStateTransitionEffect(from: string, to: string): void {
    logger.info(`🔄 引擎状态变更：${from} → ${to}`);

    if (typeof window !== 'undefined' && (window as any).UI?.toast) {
      if (to === EngineState.OVERHEATED) {
        (window as any).UI.toast('⚠️ 引擎过热！请复习错题降低温度', 'warning');
      } else if (to === EngineState.JAMMED) {
        (window as any).UI.toast('⛽ 燃料耗尽！开始新的学习', 'warning');
      } else if (to === EngineState.SMELTING) {
        (window as any).UI.toast('⚙️ 引擎正常运行中', 'success');
      }
    }
  }

  createParticle(): void {
    const particleContainer = this.el.particleLayer || document.querySelector('.particle-layer');
    if (!particleContainer) return;

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.bottom = '0';
    particle.style.animationDelay = Math.random() * 0.5 + 's';

    particleContainer.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 2000);
  }

  createSparkParticle(): void {
    const particleContainer = this.el.particleLayer || document.querySelector('.particle-layer');
    if (!particleContainer) return;

    const spark = document.createElement('div');
    spark.className = 'sv-spark';
    spark.style.left = `${40 + Math.random() * 20}%`;
    spark.style.bottom = '0';

    particleContainer.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 1500);
  }

  createSmokeParticle(): void {
    const container = this.el.engineCore || document.querySelector('.engine-core-container');
    if (!container) return;

    const smoke = document.createElement('div');
    smoke.className = 'sv-smoke';
    smoke.style.left = `${10 + Math.random() * 80}%`;
    smoke.style.bottom = '10%';
    smoke.style.animationDelay = `${Math.random() * 5}s`;

    container.appendChild(smoke);

    setTimeout(() => {
      smoke.remove();
    }, 12000);
  }

  createFireflyParticle(): void {
    const container = this.el.engineCore || document.querySelector('.engine-core-container');
    if (!container) return;

    if (!container.querySelector('.sv-fireflies')) {
      const fireflies = document.createElement('div');
      fireflies.className = 'sv-fireflies';
      container.appendChild(fireflies);
    }
  }

  startParticleEffect(): void {
    if (this.particleInterval) return;

    this.particleInterval = setInterval(() => {
      if (this.state === EngineState.SMELTING) {
        this.createParticle();

        if (Math.random() < 0.3) {
          this.createSmokeParticle();
        }

        if (Math.random() < 0.1) {
          this.createSparkParticle();
        }
      }
    }, 2000);

    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
      this.createFireflyParticle();
    }
  }

  stopParticleEffect(): void {
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
      this.particleInterval = null;
    }
  }

  saveState(): void {
    const state = {
      coal: this.coal,
      heat: this.heat,
      reviewCount: this.reviewCount,
      errorCount: this.errorCount,
      state: this.state,
      lastActionTime: this.lastActionTime,
    };
    try {
      localStorage.setItem('cet46_engine_state', JSON.stringify(state));
    } catch (_e) {
      // ignore
    }
  }

  loadState(): void {
    try {
      const saved = localStorage.getItem('cet46_engine_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (typeof state.coal === 'number' && state.coal >= 0 && state.coal <= 100) {
          this.coal = state.coal;
        } else {
          this.coal = 20;
        }

        if (typeof state.heat === 'number' && state.heat >= 0 && state.heat <= 100) {
          this.heat = state.heat;
        } else {
          this.heat = 0;
        }

        this.reviewCount = typeof state.reviewCount === 'number' ? state.reviewCount : 0;
        this.errorCount = typeof state.errorCount === 'number' ? state.errorCount : 0;

        const validStates = Object.values(EngineState);
        if (validStates.includes(state.state)) {
          this.state = state.state;
        } else {
          this.state = EngineState.SLEEPING;
        }

        if (typeof state.lastActionTime === 'number') {
          this.lastActionTime = state.lastActionTime;
        }
      }
    } catch (e) {
      logger.error('加载引擎状态失败:', e);
    }
  }

  reset(): void {
    this.coal = 20;
    this.heat = 0;
    this.reviewCount = 0;
    this.errorCount = 0;
    this.state = EngineState.SLEEPING;
    this.saveState();
    this.updateUI();
  }

  getStatus(): any {
    return {
      state: this.state,
      coal: this.coal,
      heat: this.heat,
      reviewCount: this.reviewCount,
      errorCount: this.errorCount,
    };
  }
}

const engineVisualizer = new MemoryEngineFSM();

export { engineVisualizer };
export default engineVisualizer;
