import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UI Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('toast', () => {
    it('should create toast element with correct message', () => {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);

      toast('Test message', 'success');

      const toastEl = container.querySelector('.toast');
      expect(toastEl).toBeTruthy();
      expect(toastEl.textContent).toBe('Test message');
      expect(toastEl.classList.contains('success')).toBe(true);
    });

    it('should auto-remove after duration', async () => {
      vi.useFakeTimers();

      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);

      toast('Test', 'info');
      expect(container.children.length).toBe(1);

      vi.advanceTimersByTime(3000);
      expect(container.children.length).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('showLoadingOverlay', () => {
    it('should show overlay with custom text', () => {
      document.body.innerHTML = `
        <div id="loading-overlay" style="display: none;">
          <div id="loading-text"></div>
          <div id="loading-progress"></div>
          <div id="loading-percent"></div>
        </div>
      `;

      showLoadingOverlay(true, 'Loading...', 50);

      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('flex');
      expect(document.getElementById('loading-text').textContent).toBe('Loading...');
      expect(document.getElementById('loading-percent').textContent).toBe('50%');
    });
  });
});

function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);

  setTimeout(() => t.remove(), 3000);
}

function showLoadingOverlay(show, text, percent) {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;

  overlay.style.display = show ? 'flex' : 'none';
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-percent').textContent = `${percent}%`;
}
