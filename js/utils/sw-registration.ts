import logger from './logger.js';

function showUpdateNotification(): void {
  const existing = document.getElementById('update-notification');
  if (existing) return;

  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--sv-panel-base) 0%, var(--sv-panel-shadow) 100%);
    color: var(--sv-text-main);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.95rem;
    animation: slideUp 0.3s ease;
  `;

  const span = document.createElement('span');
  span.textContent = '发现新版本';

  const btn = document.createElement('button');
  btn.style.cssText = `
    background: white;
    color: var(--primary);
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
  `;
  btn.textContent = '立即更新';
  btn.addEventListener('click', updateApp);

  notification.appendChild(span);
  notification.appendChild(btn);
  document.body.appendChild(notification);
}

function updateApp(): void {
  const notification = document.getElementById('update-notification');
  if (notification) notification.remove();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        reg.waiting.postMessage('skipWaiting');
      }
    }).catch(() => {});
  }
}

function registerServiceWorker(): void {
  if (location.protocol === 'file:') return;
  if (!('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    logger.info('[PWA] 本地开发与自动化测试环境跳过 Service Worker 注册');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .then(reg => {
        logger.info('PWA Service Worker 注册成功');

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          }
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateNotification();
        }
      })
      .catch(err => {
        logger.info('Service Worker 注册失败:', err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      logger.info('Service Worker 已更新，页面即将刷新');
      window.location.reload();
    });
  });
}

export { registerServiceWorker };