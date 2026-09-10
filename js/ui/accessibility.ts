export function announceForAccessibility(message: string): void {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

export function trapFocus(modal: HTMLElement | null): (() => void) | null {
  if (!modal) return null;
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button:not(:disabled):not([aria-hidden="true"]), ' +
    '[href]:not([aria-hidden="true"]), ' +
    'input:not(:disabled):not([aria-hidden="true"]), ' +
    'select:not(:disabled):not([aria-hidden="true"]), ' +
    'textarea:not(:disabled):not([aria-hidden="true"]), ' +
    '[contenteditable]:not([contenteditable="false"]):not([aria-hidden="true"]), ' +
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"]):not(:disabled)'
  );

  const visibleFocusable = Array.from(focusable).filter(el => {
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  if (visibleFocusable.length === 0) return null;
  const first = visibleFocusable[0];
  const last = visibleFocusable[visibleFocusable.length - 1];

  function handler(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  modal.addEventListener('keydown', handler);
  first.focus();
  return () => {
    modal.removeEventListener('keydown', handler);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
