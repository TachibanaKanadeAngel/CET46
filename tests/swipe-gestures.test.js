// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initSwipeGestures,
  handleTouchStart,
  handleStudyTouchEnd,
  handleReviewTouchEnd,
  showSwipeFeedback,
} from '../js/utils/swipe-gestures.ts';

describe('swipe-gestures.ts test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('handleTouchStart records single touch coordinates and ignores multi-touch', () => {
    const singleTouch = {
      touches: [{ clientX: 100, clientY: 200 }],
    };
    handleTouchStart(singleTouch);

    const multiTouch = {
      touches: [{ clientX: 100, clientY: 200 }, { clientX: 150, clientY: 250 }],
    };
    expect(() => handleTouchStart(multiTouch)).not.toThrow();
  });

  it('handleStudyTouchEnd triggers left swipe when dragged left past threshold', () => {
    handleTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });

    const onLeft = vi.fn();
    const onRight = vi.fn();

    const endEvent = {
      changedTouches: [{ clientX: 100, clientY: 105 }], // deltaX = -100, deltaY = 5
    };

    handleStudyTouchEnd(endEvent, onLeft, onRight);
    expect(onLeft).toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();

    // Verify indicator
    const indicator = document.querySelector('div');
    expect(indicator).not.toBeNull();
    expect(indicator.textContent).toBe('×');
  });

  it('handleStudyTouchEnd triggers right swipe when dragged right past threshold', () => {
    handleTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });

    const onLeft = vi.fn();
    const onRight = vi.fn();

    const endEvent = {
      changedTouches: [{ clientX: 220, clientY: 110 }], // deltaX = +120
    };

    handleStudyTouchEnd(endEvent, onLeft, onRight);
    expect(onRight).toHaveBeenCalled();
    expect(onLeft).not.toHaveBeenCalled();

    const indicator = document.querySelector('div');
    expect(indicator.textContent).toBe('√');
  });

  it('ignores swipes when vertical drag exceeds horizontal or distance < 50', () => {
    handleTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });

    const onLeft = vi.fn();
    const onRight = vi.fn();

    // Distance too small (30px)
    handleStudyTouchEnd({ changedTouches: [{ clientX: 130, clientY: 100 }] }, onLeft, onRight);
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();

    // Vertical drag dominant (deltaX = 60, deltaY = 90)
    handleStudyTouchEnd({ changedTouches: [{ clientX: 160, clientY: 190 }] }, onLeft, onRight);
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });

  it('ignores swipes when duration exceeds 500ms', () => {
    handleTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
    vi.advanceTimersByTime(600); // 600ms elapsed

    const onLeft = vi.fn();
    const onRight = vi.fn();

    handleStudyTouchEnd({ changedTouches: [{ clientX: 250, clientY: 100 }] }, onLeft, onRight);
    expect(onRight).not.toHaveBeenCalled();
  });

  it('handleReviewTouchEnd only triggers when isFlipped is true', () => {
    handleTouchStart({ touches: [{ clientX: 200, clientY: 100 }] });

    const onLeft = vi.fn();
    const onRight = vi.fn();
    const endEvent = { changedTouches: [{ clientX: 100, clientY: 100 }] };

    // When card is not flipped, no swipe is triggered
    handleReviewTouchEnd(endEvent, onLeft, onRight, false);
    expect(onLeft).not.toHaveBeenCalled();

    // When card is flipped, swipe is evaluated
    handleReviewTouchEnd(endEvent, onLeft, onRight, true);
    expect(onLeft).toHaveBeenCalled();
  });

  it('showSwipeFeedback fades out and removes indicator after timeout', () => {
    showSwipeFeedback('left');
    const indicator = document.querySelector('div');
    expect(indicator).not.toBeNull();

    vi.advanceTimersByTime(350);
    vi.advanceTimersByTime(250);
    expect(indicator.parentNode).toBeNull();
  });

  it('initSwipeGestures binds touch listeners to study and review cards', () => {
    const studyCard = document.createElement('div');
    const reviewCard = document.createElement('div');

    const studySpy = vi.spyOn(studyCard, 'addEventListener');
    const reviewSpy = vi.spyOn(reviewCard, 'addEventListener');

    const handlers = {
      onStudySwipeLeft: vi.fn(),
      onStudySwipeRight: vi.fn(),
      onReviewSwipeLeft: vi.fn(),
      onReviewSwipeRight: vi.fn(),
      isReviewFlipped: vi.fn(() => true),
    };

    initSwipeGestures(studyCard, reviewCard, handlers);

    expect(studySpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
    expect(studySpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
    expect(reviewSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
    expect(reviewSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
  });
});
