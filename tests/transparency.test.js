// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 模拟 CONFIG
vi.mock('../js/config.js', () => ({
  CONFIG: {
    CONSTANTS: {
      MS_PER_DAY: 86400000,
    },
  },
}));

import {
  renderAlgorithmTransparency,
  createAlgorithmHeatmap,
  renderEFDisplay,
} from '../js/ui/transparency.js';

const FSRS_W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

describe('Algorithm Transparency', () => {
  describe('renderAlgorithmTransparency', () => {
    it('返回 null 当 wd 不存在', () => {
      const getWordData = vi.fn(() => null);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result).toBeNull();
    });

    it('正确计算新词的留存率', () => {
      const wd = { status: 'new', stability: 0, difficulty: 0 };
      const getWordData = vi.fn(() => wd);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result).not.toBeNull();
      expect(result.R).toBe(100);
    });

    it('正确计算复习词的留存率', () => {
      const daysAgo = 3;
      const wd = {
        status: 'review',
        stability: 5,
        difficulty: 5,
        lastStudy: Date.now() - daysAgo * 86400000,
      };
      const getWordData = vi.fn(() => wd);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result).not.toBeNull();
      expect(result.R).toBeLessThan(100);
      expect(result.R).toBeGreaterThan(0);
    });

    it('使用默认 stability 当未定义时', () => {
      const wd = { status: 'new' };
      const getWordData = vi.fn(() => wd);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result).not.toBeNull();
      expect(result.S).toBe(Math.round(FSRS_W[0]));
    });

    it('使用默认 difficulty 当未定义时', () => {
      const wd = { status: 'new' };
      const getWordData = vi.fn(() => wd);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result).not.toBeNull();
      expect(result.D).toBe(FSRS_W[4].toFixed(1));
    });

    it('生成包含解释文本', () => {
      const wd = { status: 'new', stability: 1, difficulty: 5 };
      const getWordData = vi.fn(() => wd);
      const result = renderAlgorithmTransparency(1, getWordData, FSRS_W);
      expect(result.explanation).toContain('记忆留存率');
      expect(result.explanation).toContain('稳定性');
      expect(result.explanation).toContain('难度');
    });
  });

  describe('createAlgorithmHeatmap', () => {
    it('创建热力图容器', () => {
      const words = Array.from({ length: 10 }, (_, i) => ({ id: i, word: `word${i}` }));
      const getWordData = vi.fn(() => null);
      const container = createAlgorithmHeatmap(words, getWordData, FSRS_W);
      expect(container).toBeInstanceOf(HTMLElement);
      expect(container.className).toBe('algorithm-heatmap');
    });

    it('限制最多 50 个单词', () => {
      const words = Array.from({ length: 100 }, (_, i) => ({ id: i, word: `word${i}` }));
      const getWordData = vi.fn(() => null);
      const container = createAlgorithmHeatmap(words, getWordData, FSRS_W);
      expect(container.children.length).toBe(50);
    });

    it('新词单元格使用默认背景色', () => {
      const words = [{ id: 1, word: 'test' }];
      const getWordData = vi.fn(() => null);
      const container = createAlgorithmHeatmap(words, getWordData, FSRS_W);
      const cell = container.children[0];
      expect(cell.style.background).toBe('var(--border-color)');
    });

    it('已复习词根据留存率着色', () => {
      const words = [{ id: 1, word: 'test' }];
      const wd = {
        status: 'review',
        stability: 10,
        difficulty: 5,
        lastStudy: Date.now(),
      };
      const getWordData = vi.fn(() => wd);
      const container = createAlgorithmHeatmap(words, getWordData, FSRS_W);
      const cell = container.children[0];
      // 刚复习的词留存率接近 100%，应该是绿色
      expect(cell.style.background).toBe('var(--success)');
    });
  });

  describe('renderEFDisplay', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="ef-display" style="display:none;"></div>
        <span id="ef-value"></span>
        <div id="ef-fill"></div>
        <span id="stability-value"></span>
        <span id="difficulty-value"></span>
        <span id="retention-value"></span>
      `;
    });

    it('wd 不存在时直接返回', () => {
      expect(() => renderEFDisplay('', null, 1.3, 2.6, FSRS_W)).not.toThrow();
    });

    it('显示 EF 值', () => {
      const wd = { ef: 2.3, stability: 5, difficulty: 4 };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      const efValue = document.getElementById('ef-value');
      expect(efValue.textContent).toBe('2.30');
    });

    it('EF 未定义时使用默认值 2.5', () => {
      const wd = { stability: 5, difficulty: 4 };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      const efValue = document.getElementById('ef-value');
      expect(efValue.textContent).toBe('2.50');
    });

    it('设置 EF 填充宽度', () => {
      const wd = { ef: 2.0, stability: 5, difficulty: 4 };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      const efFill = document.getElementById('ef-fill');
      // (2.0 - 1.3) / (2.6 - 1.3) * 100 = 53.8...%
      expect(efFill.style.width).toContain('%');
    });

    it('设置稳定性和难度值', () => {
      const wd = { ef: 2.5, stability: 7.3, difficulty: 4.8 };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      expect(document.getElementById('stability-value').textContent).toBe('7.3');
      expect(document.getElementById('difficulty-value').textContent).toBe('4.8');
    });

    it('使用带前缀的元素 ID', () => {
      document.body.innerHTML += `
        <div id="review-ef-display" style="display:none;"></div>
        <span id="review-ef-value"></span>
        <div id="review-ef-fill"></div>
        <span id="review-stability-value"></span>
        <span id="review-difficulty-value"></span>
        <span id="review-retention-value"></span>
      `;
      const wd = { ef: 2.5, stability: 5, difficulty: 4 };
      renderEFDisplay('review', wd, 1.3, 2.6, FSRS_W);
      expect(document.getElementById('review-ef-display').style.display).toBe('block');
    });

    it('复习词计算留存率', () => {
      const wd = {
        ef: 2.5,
        stability: 10,
        difficulty: 4,
        status: 'review',
        lastStudy: Date.now() - 86400000, // 1天前
      };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      const retentionValue = document.getElementById('retention-value');
      expect(retentionValue.textContent).toContain('%');
    });

    it('新词显示新词文本', () => {
      const wd = { ef: 2.5, stability: 5, difficulty: 4, status: 'new' };
      renderEFDisplay('', wd, 1.3, 2.6, FSRS_W);
      const retentionValue = document.getElementById('retention-value');
      expect(retentionValue.textContent).toBe('新词');
    });
  });
});
