// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupKeyboardShortcuts } from '../js/utils/keyboard-shortcuts.js';

describe('setupKeyboardShortcuts', () => {
  let handleUndo;
  let getReviewCallbacks;
  let StudyFeature;
  let ReviewFeature;
  let SpellingFeature;
  let mockElement;

  beforeEach(() => {
    handleUndo = vi.fn();
    getReviewCallbacks = vi.fn().mockReturnValue({});
    StudyFeature = { markWord: vi.fn() };
    ReviewFeature = { markReviewWord: vi.fn() };
    SpellingFeature = { handleSpellingKeydown: vi.fn() };

    // Mock DOM elements
    mockElement = {
      classList: { contains: vi.fn().mockReturnValue(false) },
      style: { display: 'block' },
    };

    // Mock document methods
    document.getElementById = vi.fn().mockReturnValue(mockElement);
    document.querySelectorAll = vi.fn().mockReturnValue([]);
    document.addEventListener = vi.fn();
    Object.defineProperty(document, 'activeElement', {
      value: { tagName: 'BODY' },
      writable: true,
      configurable: true,
    });

    setupKeyboardShortcuts({
      handleUndo,
      getReviewCallbacks,
      StudyFeature,
      ReviewFeature,
      SpellingFeature,
    });
  });

  it('registers keydown event listener', () => {
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  describe('spelling modal active', () => {
    it('delegates to SpellingFeature when spelling modal is active', () => {
      const spellingModalEl = {
        classList: { contains: vi.fn().mockReturnValue(true) },
      };
      document.getElementById = vi.fn().mockReturnValue(spellingModalEl);

      const event = { key: 'a' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(SpellingFeature.handleSpellingKeydown).toHaveBeenCalledWith(event);
    });
  });

  describe('Ctrl+F12', () => {
    it('opens performance panel and prevents default', () => {
      const event = { key: 'F12', ctrlKey: true, preventDefault: vi.fn() };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('input focus detection', () => {
    it('ignores arrow keys when INPUT is focused', () => {
      document.activeElement = { tagName: 'INPUT' };

      const event = { key: 'ArrowLeft' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(StudyFeature.markWord).not.toHaveBeenCalled();
    });

    it('ignores arrow keys when TEXTAREA is focused', () => {
      document.activeElement = { tagName: 'TEXTAREA' };

      const event = { key: 'ArrowRight' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(StudyFeature.markWord).not.toHaveBeenCalled();
    });

    it('ignores space key when contentEditable is focused', () => {
      document.activeElement = { tagName: 'DIV', isContentEditable: true };

      const event = { key: ' ' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(StudyFeature.markWord).not.toHaveBeenCalled();
    });
  });

  describe('study view shortcuts', () => {
    beforeEach(() => {
      document.getElementById = vi.fn().mockImplementation(id => {
        if (id === 'view-study') {
          return { classList: { contains: vi.fn().mockReturnValue(true) } };
        }
        if (id === 'view-review') {
          return { classList: { contains: vi.fn().mockReturnValue(false) } };
        }
        if (id === 'study-buttons') {
          return { style: { display: 'block' } };
        }
        if (id === 'review-buttons') {
          return { style: { display: 'none' } };
        }
        if (id === 'spelling-modal') {
          return { classList: { contains: vi.fn().mockReturnValue(false) } };
        }
        return mockElement;
      });
    });

    it('marks word as unknown with ArrowLeft', () => {
      const event = { key: 'ArrowLeft' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(StudyFeature.markWord).toHaveBeenCalledWith(false);
    });

    it('marks word as known with ArrowRight', () => {
      const event = { key: 'ArrowRight' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(StudyFeature.markWord).toHaveBeenCalledWith(true);
    });

    it('calls handleUndo with Ctrl+Z', () => {
      const event = { key: 'z', ctrlKey: true, preventDefault: vi.fn() };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(handleUndo).toHaveBeenCalled();
    });
  });

  describe('review view shortcuts', () => {
    beforeEach(() => {
      document.getElementById = vi.fn().mockImplementation(id => {
        if (id === 'view-study') {
          return { classList: { contains: vi.fn().mockReturnValue(false) } };
        }
        if (id === 'view-review') {
          return { classList: { contains: vi.fn().mockReturnValue(true) } };
        }
        if (id === 'study-buttons') {
          return { style: { display: 'none' } };
        }
        if (id === 'review-buttons') {
          return { style: { display: 'block' } };
        }
        if (id === 'spelling-modal') {
          return { classList: { contains: vi.fn().mockReturnValue(false) } };
        }
        return mockElement;
      });
    });

    it('marks review word as unknown with ArrowLeft', () => {
      const event = { key: 'ArrowLeft' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(ReviewFeature.markReviewWord).toHaveBeenCalledWith(false, {});
    });

    it('marks review word as known with ArrowRight', () => {
      const event = { key: 'ArrowRight' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(ReviewFeature.markReviewWord).toHaveBeenCalledWith(true, {});
    });
  });

  describe('Escape key', () => {
    it('closes active modals by removing active class', () => {
      const mockModal = {
        classList: { remove: vi.fn() },
      };
      document.querySelectorAll = vi.fn().mockReturnValue([mockModal]);

      const event = { key: 'Escape' };
      const keydownHandler = document.addEventListener.mock.calls[0][1];
      keydownHandler(event);

      expect(mockModal.classList.remove).toHaveBeenCalledWith('active');
    });
  });
});
