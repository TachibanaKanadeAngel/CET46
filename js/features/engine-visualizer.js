/** @type {import('../store.js')} */

export const EngineState = {
  SLEEPING: 'sleeping',
  SMELTING: 'smelting',
  OVERHEATED: 'overheated',
  JAMMED: 'jammed'
};

export class MemoryEngineFSM {
  constructor() {
    this.state = EngineState.SLEEPING;
    this.coal = 20;
    this.heat = 0;
    this.reviewCount = 0;
    this.errorCount = 0;
    
    this.el = {
      container: null,
      fuelBar: null,
      heatBar: null,
      sprite: null,
      statusText: null,
      fuelLabel: null,
      heatLabel: null
    };
    
    this.particleInterval = null;
  }

  init() {
    this.el.container = document.getElementById('engine-container');
    this.el.fuelBar = document.getElementById('engine-fuel-fill');
    this.el.heatBar = document.getElementById('engine-heat-fill');
    this.el.sprite = document.getElementById('engine-sprite');
    this.el.statusText = document.getElementById('engine-status-text');
    this.el.fuelLabel = document.getElementById('engine-fuel-label');
    this.el.heatLabel = document.getElementById('engine-heat-label');
    
    if (!this.el.container) {
      console.warn('⚠️ 引擎容器未找到，跳过初始化');
      return;
    }
    
    this.loadState();
    this.initListeners();
    this.updateUI();
    this.startParticleEffect();
    
    console.log('✅ 记忆引擎可视化系统已启动');
  }

  initListeners() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'mark-known') this.handleAction(4);
      if (action === 'mark-unknown') this.handleAction(1);
      if (action === 'review-known') this.handleAction(4);
      if (action === 'review-unknown') this.handleAction(1);
    });
    
    setInterval(() => {
      this.passiveHeatDecay();
    }, 5000);
  }

  handleAction(quality) {
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

  passiveHeatDecay() {
    if (this.state === EngineState.SMELTING) {
      this.heat = Math.max(0, this.heat - 1);
      this.updateUI();
    }
  }

  evaluateState() {
    const prevState = this.state;
    
    if (this.heat >= 85) {
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

  updateUI() {
    if (!this.el.container) return;
    
    const statusColors = {
      running: '#63c74d',
      overheated: '#e43b44',
      idle: '#ffd700',
      jammed: '#2b1100'
    };
    
    const currentColor = statusColors[this.state] || statusColors.idle;
    
    this.el.fuelBar.style.width = `${this.coal}%`;
    this.el.fuelBar.style.backgroundColor = 'var(--sv-energy-green)';
    
    this.el.heatBar.style.width = `${this.heat}%`;
    this.el.heatBar.style.backgroundColor = 'var(--sv-heat-red)';
    
    if (this.el.fuelLabel) {
      this.el.fuelLabel.textContent = `燃料：${Math.round(this.coal)}%`;
    }
    
    if (this.el.heatLabel) {
      this.el.heatLabel.textContent = `温度：${Math.round(this.heat)}%`;
    }
    
    this.el.container.className = `sv-panel engine-core-container sv-${this.state}`;
    
    const statusMessages = {
      [EngineState.SLEEPING]: '* 引擎正在休眠 *',
      [EngineState.SMELTING]: '* 引擎正在平稳炼化记忆 *',
      [EngineState.OVERHEATED]: '! 警告：错题过多，即将熔毁 !',
      [EngineState.JAMMED]: '? 燃料耗尽，请补充复习 ?'
    };
    
    if (this.el.statusText) {
      this.el.statusText.textContent = statusMessages[this.state];
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

  triggerStateTransitionEffect(from, to) {
    console.log(`🔄 引擎状态变更：${from} → ${to}`);
    
    if (to === EngineState.OVERHEATED) {
      if (typeof window.UI !== 'undefined') {
        window.UI.toast('⚠️ 引擎过热！请复习错题降低温度', 'warning');
      }
    } else if (to === EngineState.JAMMED) {
      if (typeof window.UI !== 'undefined') {
        window.UI.toast('⛽ 燃料耗尽！开始新的学习', 'warning');
      }
    } else if (to === EngineState.SMELTING) {
      if (typeof window.UI !== 'undefined') {
        window.UI.toast('⚙️ 引擎正常运行中', 'success');
      }
    }
  }

  createParticle() {
    const particleContainer = document.querySelector('.particle-layer');
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

  createSparkParticle() {
    const particleContainer = document.querySelector('.particle-layer');
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

  createSmokeParticle() {
    const container = document.querySelector('.engine-core-container');
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

  createFireflyParticle() {
    const container = document.querySelector('.engine-core-container');
    if (!container) return;
    
    if (!container.querySelector('.sv-fireflies')) {
      const fireflies = document.createElement('div');
      fireflies.className = 'sv-fireflies';
      container.appendChild(fireflies);
    }
  }

  startParticleEffect() {
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

  stopParticleEffect() {
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
      this.particleInterval = null;
    }
  }

  saveState() {
    const state = {
      coal: this.coal,
      heat: this.heat,
      reviewCount: this.reviewCount,
      errorCount: this.errorCount,
      state: this.state
    };
    localStorage.setItem('cet46_engine_state', JSON.stringify(state));
  }

  loadState() {
    const saved = localStorage.getItem('cet46_engine_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.coal = state.coal || 20;
        this.heat = state.heat || 0;
        this.reviewCount = state.reviewCount || 0;
        this.errorCount = state.errorCount || 0;
        this.state = state.state || EngineState.SLEEPING;
      } catch (e) {
        console.error('加载引擎状态失败:', e);
      }
    }
  }

  reset() {
    this.coal = 20;
    this.heat = 0;
    this.reviewCount = 0;
    this.errorCount = 0;
    this.state = EngineState.SLEEPING;
    this.saveState();
    this.updateUI();
  }

  getStatus() {
    return {
      state: this.state,
      coal: this.coal,
      heat: this.heat,
      reviewCount: this.reviewCount,
      errorCount: this.errorCount
    };
  }
}

const engineVisualizer = new MemoryEngineFSM();

export { engineVisualizer };
