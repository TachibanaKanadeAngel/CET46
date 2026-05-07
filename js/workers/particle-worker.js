/**
 * 粒子系统 Worker - OffscreenCanvas 版本
 * 彻底解放主线程，实现极致性能
 */

let canvas = null;
let ctx = null;
let particles = [];
let animationId = null;
let isRunning = false;

// 粒子类
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 8 + 4;
    this.speedX = (Math.random() - 0.5) * 15;
    this.speedY = Math.random() * -15 - 5;
    this.gravity = 0.4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.opacity = 1;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// 初始化粒子
function initParticles(width, height) {
  particles = [];
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#00b894'];
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < 100; i++) {
    const angle = (Math.PI * 2 * i) / 100;
    const x = centerX + Math.cos(angle) * 50;
    const y = centerY + Math.sin(angle) * 50;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color));
  }
}

// 动画循环
function animate() {
  if (!isRunning || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => p.opacity > 0);

  if (particles.length === 0) {
    self.postMessage({ type: 'completed' });
    return;
  }

  particles.forEach(p => {
    p.update();
    p.draw(ctx);
  });

  animationId = requestAnimationFrame(animate);
}

// 处理消息
self.onmessage = (e) => {
  const { type } = e.data;

  switch (type) {
    case 'init':
      try {
        canvas = e.data.canvas;
        canvas.width = e.data.width;
        canvas.height = e.data.height;
        ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('无法获取 2D 上下文');
        }

        initParticles(canvas.width, canvas.height);
        isRunning = true;
        animate();
      } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
      }
      break;

    case 'resize':
      if (canvas) {
        canvas.width = e.data.width;
        canvas.height = e.data.height;
      }
      break;

    case 'stop':
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      particles = [];
      break;

    default:
      console.warn('未知消息类型:', type);
  }
};

// 错误处理
self.onerror = (err) => {
  console.error('Worker 错误:', err);
  self.postMessage({ type: 'error', message: err.message });
};
