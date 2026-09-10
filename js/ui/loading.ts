let lastFocusedElement: HTMLElement | null = null;
let trapKeydownHandler: ((event: KeyboardEvent) => void) | null = null;

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')))
    .filter(el => el.offsetParent !== null || el.getClientRects().length > 0);
}

function enableFocusTrap(overlay: HTMLElement): void {
  lastFocusedElement = document.activeElement as HTMLElement | null;
  overlay.setAttribute('tabindex', '-1');

  const focusable = getFocusableElements(overlay);
  const initialTarget = focusable[0] || overlay;
  requestAnimationFrame(() => {
    initialTarget.focus({ preventScroll: true });
  });

  trapKeydownHandler = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const currentFocusable = getFocusableElements(overlay);
    if (currentFocusable.length === 0) {
      event.preventDefault();
      overlay.focus({ preventScroll: true });
      return;
    }
    const first = currentFocusable[0];
    const last = currentFocusable[currentFocusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || active === overlay || !overlay.contains(active)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else {
      if (active === last || !overlay.contains(active)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  };
  overlay.addEventListener('keydown', trapKeydownHandler);
}

function disableFocusTrap(overlay: HTMLElement): void {
  if (trapKeydownHandler) {
    overlay.removeEventListener('keydown', trapKeydownHandler);
    trapKeydownHandler = null;
  }
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    if (document.body.contains(lastFocusedElement)) {
      requestAnimationFrame(() => {
        lastFocusedElement?.focus({ preventScroll: true });
      });
    }
  }
  lastFocusedElement = null;
}

export function showLoadingOverlay(show: boolean = true, text: string = '处理中...', percent: number = 0): void {
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress') as HTMLElement | null;
  const loadingPercent = document.getElementById('loading-percent');

  if (overlay) {
    const wasVisible = overlay.style.display === 'flex';
    overlay.style.display = show ? 'flex' : 'none';

    if (show) {
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.setAttribute('aria-busy', 'true');
      if (!wasVisible) {
        enableFocusTrap(overlay);
      }
    } else {
      overlay.setAttribute('aria-busy', 'false');
      if (wasVisible) {
        disableFocusTrap(overlay);
      }
    }
  }
  if (loadingText) loadingText.textContent = text;
  if (loadingProgress) loadingProgress.style.width = `${percent}%`;
  if (loadingPercent) loadingPercent.textContent = `${Math.round(percent)}%`;
}

export function updateLoadingProgress(percent: number, text?: string): void {
  const loadingProgress = document.getElementById('loading-progress') as HTMLElement | null;
  const loadingPercent = document.getElementById('loading-percent');
  const loadingText = document.getElementById('loading-text');

  if (loadingProgress) loadingProgress.style.width = `${percent}%`;
  if (loadingPercent) loadingPercent.textContent = `${Math.round(percent)}%`;
  if (text && loadingText) loadingText.textContent = text;
}
