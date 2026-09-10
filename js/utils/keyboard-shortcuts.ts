import { performanceMonitor } from './performance-monitor.js';

interface StudyFeatureLike {
  markWord?: (known: boolean) => void;
  studyMode?: string;
  selectChoiceByIndex?: (index: number) => void;
}

interface ReviewFeatureLike {
  markReviewWord?: (known: boolean, callbacks: unknown) => void;
}

interface SpellingFeatureLike {
  handleSpellingKeydown?: (e: KeyboardEvent) => void;
}

interface KeyboardShortcutOptions {
  handleUndo?: () => void;
  getReviewCallbacks?: () => unknown;
  StudyFeature?: StudyFeatureLike | null;
  ReviewFeature?: ReviewFeatureLike | null;
  SpellingFeature?: SpellingFeatureLike | null;
}

function setupKeyboardShortcuts(options: KeyboardShortcutOptions): void {
  const {
    handleUndo,
    getReviewCallbacks,
    StudyFeature,
    ReviewFeature,
    SpellingFeature,
  } = options;

  document.addEventListener('keydown', e => {
    const spellingModalEl = document.getElementById('spelling-modal');
    const spellingModal =
      spellingModalEl && spellingModalEl.classList.contains('active');

    if (spellingModal && SpellingFeature && SpellingFeature.handleSpellingKeydown) {
      SpellingFeature.handleSpellingKeydown(e);
      return;
    }

    if (e.key === 'F12' && e.ctrlKey) {
      e.preventDefault();
      performanceMonitor.showPerformancePanel();
      return;
    }

    // 检查焦点是否在输入框内
    const activeElement = document.activeElement;
    const isInputFocused =
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable);

    // 如果焦点在输入框内，不处理箭头键和空格键
    if (isInputFocused && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ')) {
      return;
    }

    const studyViewEl = document.getElementById('view-study');
    const reviewViewEl = document.getElementById('view-review');
    const studyView = studyViewEl && studyViewEl.classList.contains('active');
    const reviewView = reviewViewEl && reviewViewEl.classList.contains('active');

    const studyButtons = document.getElementById('study-buttons');
    if (
      studyView &&
      studyButtons &&
      studyButtons.style.display !== 'none' &&
      StudyFeature &&
      StudyFeature.markWord
    ) {
      if (e.key === 'ArrowLeft') {
        StudyFeature.markWord(false);
      }
      if (e.key === 'ArrowRight') {
        StudyFeature.markWord(true);
      }
      if ((e.key === 'z' || e.key === 'Z') && e.ctrlKey) {
        e.preventDefault();
        if (handleUndo) handleUndo();
      }
    }

    // 选汉/听音模式：数字键 1-4 快速选择选项
    const studyChoices = document.getElementById('study-choices');
    const choiceModeActive =
      studyView &&
      studyChoices &&
      studyChoices.style.display !== 'none' &&
      (StudyFeature?.studyMode === 'choice' || StudyFeature?.studyMode === 'listen') &&
      typeof StudyFeature?.selectChoiceByIndex === 'function';
    if (choiceModeActive && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      StudyFeature?.selectChoiceByIndex?.(Number(e.key) - 1);
      return;
    }

    const reviewButtons = document.getElementById('review-buttons');
    if (
      reviewView &&
      reviewButtons &&
      reviewButtons.style.display !== 'none' &&
      ReviewFeature &&
      ReviewFeature.markReviewWord
    ) {
      const callbacks = getReviewCallbacks ? getReviewCallbacks() : undefined;
      if (e.key === 'ArrowLeft') {
        ReviewFeature.markReviewWord(false, callbacks);
      }
      if (e.key === 'ArrowRight') {
        ReviewFeature.markReviewWord(true, callbacks);
      }
    }

    // Escape键关闭模态框（P2-11: 扩展覆盖范围至所有 .modal.active）
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.spelling-modal.active, .modal-overlay.active, .modal.active');
      modals.forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

export { setupKeyboardShortcuts };