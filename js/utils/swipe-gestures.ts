const SWIPE_THRESHOLD = 50;
const SWIPE_TIME_THRESHOLD = 500;

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

type SwipeCallback = (() => void) | undefined;

function handleTouchStart(e: TouchEvent): void {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }
}

function evalSwipe(e: TouchEvent, onSwipeLeft: SwipeCallback, onSwipeRight: SwipeCallback): void {
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const deltaTime = Date.now() - touchStartTime;

  if (
    Math.abs(deltaX) < SWIPE_THRESHOLD ||
    Math.abs(deltaY) > Math.abs(deltaX) ||
    deltaTime > SWIPE_TIME_THRESHOLD
  )
    return;

  if (deltaX < 0) {
    if (onSwipeLeft) onSwipeLeft();
    showSwipeFeedback('left');
  } else {
    if (onSwipeRight) onSwipeRight();
    showSwipeFeedback('right');
  }
}

function handleStudyTouchEnd(
  e: TouchEvent,
  onSwipeLeft: SwipeCallback,
  onSwipeRight: SwipeCallback
): void {
  evalSwipe(e, onSwipeLeft, onSwipeRight);
}

function handleReviewTouchEnd(
  e: TouchEvent,
  onSwipeLeft: SwipeCallback,
  onSwipeRight: SwipeCallback,
  isFlipped: boolean
): void {
  if (!isFlipped) return;
  evalSwipe(e, onSwipeLeft, onSwipeRight);
}

function showSwipeFeedback(direction: 'left' | 'right'): void {
  const indicator = document.createElement('div');
  indicator.style.cssText = `position:fixed;top:50%;${direction === 'left' ? 'left:20px' : 'right:20px'};transform:translateY(-50%);font-size:3rem;opacity:0;transition:opacity 0.2s ease;z-index:1000;pointer-events:none;`;
  indicator.textContent = direction === 'left' ? '×' : '√';
  document.body.appendChild(indicator);
  requestAnimationFrame(() => {
    indicator.style.opacity = '1';
  });
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 200);
  }, 300);
}

interface SwipeHandlers {
  onStudySwipeLeft?: () => void;
  onStudySwipeRight?: () => void;
  onReviewSwipeLeft?: () => void;
  onReviewSwipeRight?: () => void;
  isReviewFlipped?: () => boolean;
}

function initSwipeGestures(
  studyCard: HTMLElement | null,
  reviewCard: HTMLElement | null,
  handlers: SwipeHandlers
): void {
  const {
    onStudySwipeLeft,
    onStudySwipeRight,
    onReviewSwipeLeft,
    onReviewSwipeRight,
    isReviewFlipped,
  } = handlers;
  if (studyCard) {
    studyCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    studyCard.addEventListener(
      'touchend',
      (e: TouchEvent) => handleStudyTouchEnd(e, onStudySwipeLeft, onStudySwipeRight),
      { passive: true }
    );
  }
  if (reviewCard) {
    reviewCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    reviewCard.addEventListener(
      'touchend',
      (e: TouchEvent) =>
        handleReviewTouchEnd(
          e,
          onReviewSwipeLeft,
          onReviewSwipeRight,
          typeof isReviewFlipped === 'function' ? isReviewFlipped() : false
        ),
      { passive: true }
    );
  }
}

export {
  initSwipeGestures,
  handleTouchStart,
  handleStudyTouchEnd,
  handleReviewTouchEnd,
  showSwipeFeedback,
};