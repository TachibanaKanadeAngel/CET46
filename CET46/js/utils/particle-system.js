/* ====================================
   星露谷风格环境粒子生成器
   Stardew Valley Ambient Particle Generator
   ==================================== */

export class ParticleSystem {
  constructor() {
    this.container = null;
    this.particles = [];
    this.maxParticles = 50;
    this.isRunning = false;
    this.animationId = null;
    this.currentTheme = 'default';
    
    this.themes = {
      default: ['smoke', 'dust', 'spark'],
      night: ['firefly', 'star', 'dust'],
      autumn: ['leaf', 'smoke', 'dust'],
      winter: ['snow', 'dust'],
      summer: ['firefly', 'spark', 'dust']
    };
    
    this.particleConfigs = {
      smoke: {
        className: 'smoke-particle',
        duration: { min: 10, max: 20 },
        count: 8
      },
      firefly: {
        className: 'firefly-particle glow',
        duration: { min: 4, max: 8 },
        count: 5
      },
      spark: {
        className: 'spark-particle',
        duration: { min: 1, max: 3 },
        count: 10
      },
      dust: {
        className: 'dust-particle',
        duration: { min: 15, max: 25 },
        count: 6
      },
      star: {
        className: 'star-particle',
        duration: { min: 2, max: 5 },
        count: 15
      },
      leaf: {
        className: 'leaf-particle',
        duration: { min: 8, max: 15 },
        count: 6
      },
      snow: {
        className: 'snow-particle',
        duration: { min: 10, max: 20 },
        count: 20
      }
    };
  }
  
  init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'particle-layer';
    this.container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.container);
    
    this.detectTheme();
    this.start();
    
    console.log('✨ 环境粒子系统已启动');
  }
  
  detectTheme() {
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
    
    console.log(`🎨 当前粒子主题: ${this.currentTheme}`);
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.generateInitialParticles();
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  generateInitialParticles() {
    const themeParticles = this.themes[this.currentTheme];
    
    themeParticles.forEach(type => {
      const config = this.particleConfigs[type];
      if (!config) return;
      
      for (let i = 0; i < config.count; i++) {
        setTimeout(() => {
          this.createParticle(type);
        }, Math.random() * 5000);
      }
    });
  }
  
  createParticle(type) {
    if (!this.isRunning || this.particles.length >= this.maxParticles) return;
    
    const config = this.particleConfigs[type];
    if (!config) return;
    
    const particle = document.createElement('div');
    particle.className = config.className;
    
    const duration = config.duration.min + 
      Math.random() * (config.duration.max - config.duration.min);
    
    const startX = Math.random() * window.innerWidth;
    const startY = type === 'smoke' || type === 'spark' 
      ? window.innerHeight 
      : (type === 'snow' || type === 'leaf' ? -10 : Math.random() * window.innerHeight);
    
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
      duration: duration * 1000
    });
    
    setTimeout(() => {
      this.removeParticle(particle);
    }, duration * 1000 + 2000);
  }
  
  removeParticle(particleElement) {
    const index = this.particles.findIndex(p => p.element === particleElement);
    if (index !== -1) {
      this.particles.splice(index, 1);
    }
    
    if (particleElement.parentNode) {
      particleElement.parentNode.removeChild(particleElement);
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    
    this.particles.forEach((particle, index) => {
      if (now - particle.createdAt > particle.duration) {
        this.particles.splice(index, 1);
        if (particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      }
    });
    
    if (this.particles.length < this.maxParticles * 0.6) {
      const themeParticles = this.themes[this.currentTheme];
      const randomType = themeParticles[Math.floor(Math.random() * themeParticles.length)];
      this.createParticle(randomType);
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  setTheme(theme) {
    if (this.themes[theme]) {
      this.currentTheme = theme;
      this.clearAll();
      this.generateInitialParticles();
      console.log(`🎨 粒子主题已切换: ${theme}`);
    }
  }
  
  clearAll() {
    this.particles.forEach(p => {
      if (p.element.parentNode) {
        p.element.parentNode.removeChild(p.element);
      }
    });
    this.particles = [];
  }
  
  addEngineParticles(count = 5) {
    for (let i = 0; i < count; i++) {
      this.createParticle('spark');
    }
  }
  
  addCelebrationParticles() {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.createParticle('firefly');
      }, i * 100);
    }
  }
  
  getStats() {
    return {
      total: this.particles.length,
      byType: this.particles.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
      theme: this.currentTheme,
      isRunning: this.isRunning
    };
  }
  
  destroy() {
    this.stop();
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

export const particleSystem = new ParticleSystem();
