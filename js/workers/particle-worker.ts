/**
 * 粒子系统 Worker - OffscreenCanvas 版本
 * 彻底解放主线程，实现极致性能
 */

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animationId: number | null = null;
let isRunning = false;

// 粒子类
class Particle {
  public x: number;
  public y: number;
  public color: string;
  public size: number;
  public speedX: number;
  public speedY: number;
  public gravity: number;
  public rotation: number;
  public rotationSpeed: number;
  public opacity: number;
  public decay: number;

  constructor(x: number, y: number, color: string) {
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

  update(): void {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.decay;
  }

  draw(context: OffscreenCanvasRenderingContext2D): void {
    context.save();
    context.translate(this.x, this.y);
    context.rotate((this.rotation * Math.PI) / 180);
    context.globalAlpha = Math.max(0, this.opacity);
    context.fillStyle = this.color;
    context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    context.restore();
  }
}

// 初始化粒子
function initParticles(width: number, height: number): void {
  particles = [];
  const colors = [
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#f9ca24',
    '#f0932b',
    '#eb4d4b',
    '#6c5ce7',
    '#00b894',
  ];
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
function animate(): void {
  if (!isRunning || !ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => p.opacity > 0);

  if (particles.length === 0) {
    self.postMessage({ type: 'completed' });
    return;
  }

  particles.forEach(p => {
    p.update();
    p.draw(ctx!);
  });

  animationId = requestAnimationFrame(animate);
}

// 处理消息
self.onmessage = (e: MessageEvent) => {
  const { type } = e.data || {};

  switch (type) {
    case 'init':
      try {
        canvas = e.data.canvas;
        if (canvas) {
          ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
        }
        self.postMessage({ type: 'initialized' });
      } catch (err: any) {
        self.postMessage({ type: 'error', message: err?.message || '初始化失败' });
      }
      break;

    case 'start':
      if (canvas && ctx) {
        initParticles(canvas.width, canvas.height);
        isRunning = true;
        animate();
      }
      break;

    case 'stop':
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      break;

    case 'resize':
      if (canvas && e.data.width && e.data.height) {
        canvas.width = e.data.width;
        canvas.height = e.data.height;
      }
      break;

    default:
      break;
  }
};
