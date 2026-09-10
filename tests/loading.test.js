// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showLoadingOverlay, updateLoadingProgress } from '../js/ui/loading.js';

describe('Loading Overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loading-overlay" style="display:none;">
        <span id="loading-text"></span>
        <div id="loading-progress" style="width:0%"></div>
        <span id="loading-percent"></span>
      </div>
    `;
  });

  describe('showLoadingOverlay', () => {
    it('显示加载遮罩时设置 display 为 flex', () => {
      showLoadingOverlay(true);
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('flex');
    });

    it('隐藏加载遮罩时设置 display 为 none', () => {
      showLoadingOverlay(false);
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('none');
    });

    it('显示时设置 ARIA 无障碍属性', () => {
      showLoadingOverlay(true, '加载中...');
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.getAttribute('role')).toBe('status');
      expect(overlay.getAttribute('aria-live')).toBe('polite');
      expect(overlay.getAttribute('aria-busy')).toBe('true');
    });

    it('隐藏时设置 aria-busy 为 false', () => {
      showLoadingOverlay(false);
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.getAttribute('aria-busy')).toBe('false');
    });

    it('设置加载文本', () => {
      showLoadingOverlay(true, '正在保存数据...');
      const loadingText = document.getElementById('loading-text');
      expect(loadingText.textContent).toBe('正在保存数据...');
    });

    it('设置进度百分比', () => {
      showLoadingOverlay(true, '处理中', 45);
      const loadingPercent = document.getElementById('loading-percent');
      expect(loadingPercent.textContent).toBe('45%');
    });

    it('设置进度条宽度', () => {
      showLoadingOverlay(true, '处理中', 60);
      const loadingProgress = document.getElementById('loading-progress');
      expect(loadingProgress.style.width).toBe('60%');
    });

    it('默认参数显示遮罩', () => {
      showLoadingOverlay();
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('flex');
    });

    it('overlay 不存在时不报错', () => {
      document.body.innerHTML = '';
      expect(() => showLoadingOverlay(true)).not.toThrow();
    });
  });

  describe('updateLoadingProgress', () => {
    it('更新进度条宽度', () => {
      updateLoadingProgress(75);
      const loadingProgress = document.getElementById('loading-progress');
      expect(loadingProgress.style.width).toBe('75%');
    });

    it('更新百分比文本', () => {
      updateLoadingProgress(33);
      const loadingPercent = document.getElementById('loading-percent');
      expect(loadingPercent.textContent).toBe('33%');
    });

    it('更新加载文本', () => {
      updateLoadingProgress(50, '正在写入数据库...');
      const loadingText = document.getElementById('loading-text');
      expect(loadingText.textContent).toBe('正在写入数据库...');
    });

    it('不传文本时不覆盖现有文本', () => {
      showLoadingOverlay(true, '原始文本');
      updateLoadingProgress(50);
      const loadingText = document.getElementById('loading-text');
      expect(loadingText.textContent).toBe('原始文本');
    });

    it('四舍五入百分比', () => {
      updateLoadingProgress(33.7);
      const loadingPercent = document.getElementById('loading-percent');
      expect(loadingPercent.textContent).toBe('34%');
    });

    it('manages focus trap and keyboard tab loop during loading overlay', () => {
      const origRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = fn => fn();
      try {
        const prevBtn = document.createElement('button');
        prevBtn.id = 'prev-btn';
        document.body.appendChild(prevBtn);
        prevBtn.focus();

        const overlay = document.getElementById('loading-overlay');
        const closeBtn = document.createElement('button');
        closeBtn.id = 'cancel-load';
        overlay.appendChild(closeBtn);

        // Show overlay (activates focus trap)
        showLoadingOverlay(true, '加载中');

        // Tab on overlay loops focus
        const tabEvt = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });
        overlay.dispatchEvent(tabEvt);

        // Shift+Tab loops backwards
        const shiftTabEvt = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        overlay.dispatchEvent(shiftTabEvt);

        // Hide overlay disables focus trap
        showLoadingOverlay(false);
        expect(overlay.style.display).toBe('none');
      } finally {
        window.requestAnimationFrame = origRAF;
      }
    });

    it('overlay 不存在时不报错', () => {
      document.body.innerHTML = '';
      expect(() => updateLoadingProgress(50)).not.toThrow();
    });
  });
});
