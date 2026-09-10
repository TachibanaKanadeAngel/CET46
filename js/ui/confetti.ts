import ParticleWorker from '../workers/particle-worker.js?worker&inline';
import logger from '../utils/logger.js';

let particleWorker: Worker | null = null;
let _activeCanvas: HTMLCanvasElement | null = null;
let _activeResizeHandler: ((() => void) | null) = null;
let _activeMainCanvas: HTMLCanvasElement | null = null;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  decay: number;
}

function fireConfetti(): void {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (
    typeof (window as unknown as Record<string, unknown>).OffscreenCanvas === 'undefined' ||
    !('transferControlToOffscreen' in HTMLCanvasElement.prototype)
  ) {
    fireConfettiMainThread();
    return;
  }

  // 清理旧的 canvas 和 resize 监听器，防止多次调用导致泄漏
  if (_activeCanvas && _activeCanvas.isConnected) {
    _activeCanvas.remove();
  }
  if (_activeResizeHandler) {
    window.removeEventListener('resize', _activeResizeHandler as EventListener);
    _activeResizeHandler = null;
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  try {
    const offscreen = canvas.transferControlToOffscreen();

    if (particleWorker) {
      particleWorker.terminate();
      particleWorker = null;
    }
    const worker = new ParticleWorker();
    particleWorker = worker;

    const resizeHandler = () => {
      if (worker && canvas.isConnected) {
        worker.postMessage({
          type: 'resize',
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    let _resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedResizeHandler = () => {
      if (_resizeTimer) clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(resizeHandler, 150);
    };

    window.addEventListener('resize', debouncedResizeHandler, { passive: true });

    // 跟踪当前活跃的 canvas 和 resize 监听器
    _activeCanvas = canvas;
    _activeResizeHandler = debouncedResizeHandler;

    const cleanup = () => {
      window.removeEventListener('resize', debouncedResizeHandler as EventListener);
      if (particleWorker) {
        particleWorker.postMessage({ type: 'stop' });
        particleWorker.terminate();
        particleWorker = null;
      }
      if (canvas && canvas.isConnected) {
        canvas.remove();
      }
      _activeCanvas = null;
      _activeResizeHandler = null;
    };

    const onWorkerMessage = (e: MessageEvent) => {
      if (e.data.type === 'completed') {
        cleanup();
      } else if (e.data.type === 'error') {
        logger.error('🎆 粒子引擎崩溃，已自动回收释放内存:', e.data.message);
        cleanup();
      }
    };

    if (particleWorker) {
      particleWorker.addEventListener('message', onWorkerMessage);
      particleWorker.onerror = (err: Event | string) => {
        logger.error('🎆 粒子 Worker 异常，已自动回收释放内存:', err);
        cleanup();
      };
    }

    setTimeout(cleanup, 5000);

    particleWorker && particleWorker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        width: canvas.width,
        height: canvas.height,
      },
      [offscreen]
    );
  } catch (err) {
    logger.warn('OffscreenCanvas 初始化失败，使用降级方案:', err);
    canvas.remove();
    fireConfettiMainThread();
  }
}

function fireConfettiMainThread(): void {
  // 清理旧的主线程 canvas，防止多次调用导致泄漏
  if (_activeMainCanvas && _activeMainCanvas.isConnected) {
    _activeMainCanvas.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  // 跟踪当前活跃的主线程 canvas
  _activeMainCanvas = canvas;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = Array.from({ length: 80 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2 + 100,
    vx: (Math.random() - 0.5) * 25,
    vy: (Math.random() - 1) * 20 - 10,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    size: Math.random() * 8 + 4,
    life: 1.0,
    decay: Math.random() * 0.01 + 0.005,
  }));

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      if (p.life <= 0) return;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.6;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      active = true;
    });

    if (active) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
      _activeMainCanvas = null;
    }
  }
  animate();
}

export { fireConfetti };