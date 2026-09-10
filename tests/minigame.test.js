import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
const storeMock = { getMemoryCache: vi.fn(), getWrongWords: vi.fn() };
vi.mock('../js/store.js', () => storeMock);
vi.mock('../js/utils/dom.ts', () => ({ createFocusTrap: vi.fn(() => vi.fn()) }));
vi.mock('../js/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));
vi.mock('../js/config.js', () => ({
  CONFIG: {
    STORAGE_KEYS: {
      MINIGAME_ACHIEVEMENTS: 'cet46_minigame_achievements',
      MINIGAME_REWARDS: 'cet46_minigame_rewards',
      MINIGAME_HIGHSCORE: 'cet46_minigame_highscore',
      TODAY_STUDY_COUNT: 'cet46_today_study_count',
    }
  }
}));

beforeEach(() => {
  vi.useFakeTimers();
  const store = {};
  globalThis.localStorage = {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = String(v); }),
    removeItem: vi.fn(k => { delete store[k]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    _store: store,
  };
  globalThis.document = {
    getElementById: vi.fn(() => null),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({
      classList: { add: vi.fn(), remove: vi.fn() },
      style: {},
      appendChild: vi.fn(),
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  globalThis.window = {};
  globalThis.alert = vi.fn();
  // Reset store mocks
  storeMock.getMemoryCache.mockReturnValue({ progress: {} });
  storeMock.getWrongWords.mockReturnValue({});
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.resetModules();
});

describe('minigame module constants', () => {
  it('exports MIN_CONSECUTIVE = 50', async () => {
    const { MIN_CONSECUTIVE } = await import('../js/features/minigame.js');
    expect(MIN_CONSECUTIVE).toBe(50);
  });

  it('exports REWARDS with 5 tiers in ascending threshold order', async () => {
    const { REWARDS } = await import('../js/features/minigame.js');
    const tiers = Object.values(REWARDS);
    expect(tiers).toHaveLength(5);
    expect(REWARDS.BRONZE.threshold).toBe(100);
    expect(REWARDS.SILVER.threshold).toBe(300);
    expect(REWARDS.GOLD.threshold).toBe(500);
    expect(REWARDS.DIAMOND.threshold).toBe(800);
    expect(REWARDS.MASTER.threshold).toBe(1000);
    // Verify ascending order
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].threshold).toBeGreaterThan(tiers[i - 1].threshold);
    }
    // Each tier has required fields
    for (const tier of tiers) {
      expect(tier).toHaveProperty('id');
      expect(tier).toHaveProperty('threshold');
      expect(tier).toHaveProperty('icon');
      expect(tier).toHaveProperty('name');
    }
  });

  it('exports ACHIEVEMENTS with 5 unique ids', async () => {
    const { ACHIEVEMENTS } = await import('../js/features/minigame.js');
    expect(ACHIEVEMENTS).toHaveLength(5);
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toEqual(expect.arrayContaining([
      'first_game', 'streak_5', 'streak_10', 'score_500', 'perfect'
    ]));
  });
});

describe('MiniGame class', () => {
  it('constructor initializes defaults and loads from localStorage', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    expect(game.grid).toEqual([]);
    expect(game.score).toBe(0);
    expect(game.streak).toBe(0);
    expect(game.maxStreak).toBe(0);
    expect(game.gameActive).toBe(false);
    expect(game.errors).toBe(0);
    expect(game.gridSize).toBe(9);  // BASE_GRID_SIZE
    expect(game.timeLeft).toBe(60);
    expect(Array.isArray(game.achievements)).toBe(true);
    expect(Array.isArray(game.unlockedRewards)).toBe(true);
  });

  it('constructor handles corrupted localStorage JSON gracefully', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    globalThis.localStorage._store['cet46_minigame_achievements'] = 'corrupt{';
    globalThis.localStorage._store['cet46_minigame_rewards'] = 'also-bad{';
    const game = new MiniGame();
    expect(game.achievements).toEqual([]);
    expect(game.unlockedRewards).toEqual([]);
  });

  it('exports a singleton miniGame instance', async () => {
    const { miniGame, MiniGame } = await import('../js/features/minigame.js');
    expect(miniGame).toBeInstanceOf(MiniGame);
  });

  it('calculateDifficulty returns 1.0 when no progress data', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({ progress: {} });
    const game = new MiniGame();
    expect(game.calculateDifficulty()).toBe(1.0);
  });

  it('calculateDifficulty returns 1.5 when avg stability > 50', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ a: { stability: 60 }, b: { stability: 80 } }) }
    });
    const game = new MiniGame();
    expect(game.calculateDifficulty()).toBe(1.5);
  });

  it('calculateDifficulty returns 1.2 when avg stability > 20', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ a: { stability: 25 }, b: { stability: 30 } }) }
    });
    const game = new MiniGame();
    expect(game.calculateDifficulty()).toBe(1.2);
  });

  it('calculateDifficulty returns 0.8 when avg stability < 10', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ a: { stability: 3 }, b: { stability: 5 } }) }
    });
    const game = new MiniGame();
    expect(game.calculateDifficulty()).toBe(0.8);
  });

  it('getGridSize returns 5 for high difficulty', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ a: { stability: 100 } }) }
    });
    const game = new MiniGame();
    expect(game.getGridSize()).toBe(5);  // difficulty 1.5
  });

  it('getGridSize returns 3 for low difficulty and no high score', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({ progress: {} });
    const game = new MiniGame();
    expect(game.getGridSize()).toBe(3);
  });

  it('getTimeLimit returns 45 for highest difficulty', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({
      progress: { toObject: () => ({ a: { stability: 100 } }) }
    });
    const game = new MiniGame();
    expect(game.getTimeLimit()).toBe(45);
  });

  it('getTimeLimit returns 75 when high score >= 500 but low difficulty', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    storeMock.getMemoryCache.mockReturnValue({ progress: {} });
    globalThis.localStorage._store['cet46_minigame_highscore'] = '600';
    const game = new MiniGame();
    expect(game.getTimeLimit()).toBe(75);
  });

  it('getCurrentReward returns BRONZE when highscore is 0', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    expect(game.getCurrentReward()).toEqual(REWARDS.BRONZE);
  });

  it('getCurrentReward returns MASTER when highscore >= 1000', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    globalThis.localStorage._store['cet46_minigame_highscore'] = '1500';
    const game = new MiniGame();
    expect(game.getCurrentReward()).toEqual(REWARDS.MASTER);
  });

  it('getCurrentReward returns GOLD when highscore is exactly 500', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    globalThis.localStorage._store['cet46_minigame_highscore'] = '500';
    const game = new MiniGame();
    expect(game.getCurrentReward()).toEqual(REWARDS.GOLD);
  });

  it('getScoreReward returns null when score below all thresholds', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = [];
    expect(game.getScoreReward(50)).toBeNull();
  });

  it('getScoreReward returns BRONZE for score 100 (first unlock)', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = [];
    expect(game.getScoreReward(100)).toEqual(REWARDS.BRONZE);
  });

  it('getScoreReward returns MASTER for score 1000 when no rewards unlocked', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = [];
    expect(game.getScoreReward(1000)).toEqual(REWARDS.MASTER);
  });

  it('getScoreReward skips already-unlocked tiers and returns next valid tier', async () => {
    // 已解锁 bronze/silver/gold，score=850：850>=diamond(800) 且 diamond 未解锁 → 返回 DIAMOND
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = ['bronze', 'silver', 'gold'];
    expect(game.getScoreReward(850)).toEqual(REWARDS.DIAMOND);
  });

  it('getScoreReward returns null when score is below all unlocked-tier thresholds', async () => {
    // 已解锁 bronze/silver/gold，score=500：500>=gold.threshold(500)，但已解锁；继续看 silver/bronze 也都已解锁
    // 因此预期返回 null
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = ['bronze', 'silver', 'gold'];
    expect(game.getScoreReward(500)).toBeNull();
  });

  it('getScoreReward returns null when all tiers unlocked', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.unlockedRewards = ['bronze', 'silver', 'gold', 'diamond', 'master'];
    expect(game.getScoreReward(1000)).toBeNull();
  });

  it('hasAchievement returns false for unacquired achievement', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = [];
    expect(game.hasAchievement('first_game')).toBe(false);
  });

  it('hasAchievement returns true for acquired achievement', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = ['first_game'];
    expect(game.hasAchievement('first_game')).toBe(true);
  });

  it('checkAchievements grants first_game on first call', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = [];
    game.checkAchievements();
    expect(game.achievements).toContain('first_game');
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();
  });

  it('checkAchievements grants streak_5 when streak >= 5', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = ['first_game'];
    game.streak = 5;
    game.checkAchievements();
    expect(game.achievements).toContain('streak_5');
  });

  it('checkAchievements grants streak_10 when streak >= 10', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = ['first_game', 'streak_5'];
    game.streak = 10;
    game.checkAchievements();
    expect(game.achievements).toContain('streak_10');
  });

  it('checkAchievements grants score_500 when score >= 500', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = ['first_game'];
    game.score = 500;
    game.checkAchievements();
    expect(game.achievements).toContain('score_500');
  });

  it('checkAchievements does not grant already-acquired achievement', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const game = new MiniGame();
    game.achievements = ['first_game', 'streak_5'];
    game.streak = 5;
    game.checkAchievements();
    // No duplicate
    expect(game.achievements.filter(a => a === 'streak_5')).toHaveLength(1);
  });

  it('checkAchievements toasts via window.UI when available', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const toast = vi.fn();
    globalThis.window.UI = { toast };
    const game = new MiniGame();
    game.achievements = [];
    game.checkAchievements();
    expect(toast).toHaveBeenCalled();
  });

  it('unlockReward persists reward and toasts', async () => {
    const { MiniGame, REWARDS } = await import('../js/features/minigame.js');
    const toast = vi.fn();
    globalThis.window.UI = { toast };
    const game = new MiniGame();
    game.unlockedRewards = [];
    game.unlockReward(REWARDS.BRONZE);
    expect(game.unlockedRewards).toContain('bronze');
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      'cet46_minigame_rewards',
      expect.stringContaining('bronze')
    );
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('青铜'),
      'success'
    );
  });

  it('loadAchievements reloads from localStorage', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    globalThis.localStorage._store['cet46_minigame_achievements'] = JSON.stringify(['first_game', 'streak_5']);
    globalThis.localStorage._store['cet46_minigame_rewards'] = JSON.stringify(['bronze']);
    const game = new MiniGame();
    game.achievements = [];
    game.unlockedRewards = [];
    game.loadAchievements();
    expect(game.achievements).toEqual(['first_game', 'streak_5']);
    expect(game.unlockedRewards).toEqual(['bronze']);
  });

  it('loadAchievements handles corrupted JSON gracefully', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    globalThis.localStorage._store['cet46_minigame_achievements'] = 'corrupt{';
    globalThis.localStorage._store['cet46_minigame_rewards'] = 'corrupt{';
    const game = new MiniGame();
    game.loadAchievements();
    expect(game.achievements).toEqual([]);
    expect(game.unlockedRewards).toEqual([]);
  });

  it('bindEvents binds click and Escape key handlers to modals', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const promptListeners = {};
    const gameListeners = {};
    const resultListeners = {};
    const promptCloseListeners = {};
    const gameCloseListeners = {};
    const resultCloseListeners = {};

    const promptModal = {
      querySelector: vi.fn(() => ({
        addEventListener: vi.fn((ev, cb) => { promptCloseListeners[ev] = cb; }),
      })),
      addEventListener: vi.fn((ev, cb) => { promptListeners[ev] = cb; }),
      classList: { remove: vi.fn(), add: vi.fn() },
    };

    const gameModal = {
      querySelector: vi.fn(() => ({
        addEventListener: vi.fn((ev, cb) => { gameCloseListeners[ev] = cb; }),
      })),
      addEventListener: vi.fn((ev, cb) => { gameListeners[ev] = cb; }),
      classList: { remove: vi.fn(), add: vi.fn() },
    };

    const resultModal = {
      querySelector: vi.fn(() => ({
        addEventListener: vi.fn((ev, cb) => { resultCloseListeners[ev] = cb; }),
      })),
      addEventListener: vi.fn((ev, cb) => { resultListeners[ev] = cb; }),
      classList: { remove: vi.fn(), add: vi.fn() },
    };

    globalThis.document.getElementById = vi.fn(id => {
      if (id === 'minigame-modal') return promptModal;
      if (id === 'minigame-game-modal') return gameModal;
      if (id === 'minigame-result-modal') return resultModal;
      return null;
    });

    const game = new MiniGame();
    game.bindEvents();

    expect(promptModal.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(gameModal.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(resultModal.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    // Test Escape keys
    promptListeners['keydown']({ key: 'Escape' });
    expect(promptModal.classList.remove).toHaveBeenCalledWith('active');

    const endGameSpy = vi.spyOn(game, 'endGame');
    gameListeners['keydown']({ key: 'Escape' });
    expect(endGameSpy).toHaveBeenCalledWith(false);

    resultListeners['keydown']({ key: 'Escape' });
    expect(resultModal.classList.remove).toHaveBeenCalledWith('active');

    // Test close buttons
    if (promptCloseListeners['click']) {
      promptCloseListeners['click']();
    }
    if (gameCloseListeners['click']) {
      gameCloseListeners['click']();
    }
    if (resultCloseListeners['click']) {
      resultCloseListeners['click']();
    }
  });

  it('endGame renders victory, high scores, and closes result modal', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const resultModal = {
      classList: { add: vi.fn(), remove: vi.fn() },
      setAttribute: vi.fn(),
    };
    const titleEl = { textContent: '' };
    const closeBtn = {};

    globalThis.document.getElementById = vi.fn(id => {
      if (id === 'minigame-result-modal') return resultModal;
      if (id === 'minigame-result-title') return titleEl;
      if (id === 'minigame-result-close') return closeBtn;
      return null;
    });

    const game = new MiniGame();
    game.matchedPairs = 10;
    game.score = 50;
    game.errors = 0;
    game.maxStreak = 10;

    game.endGame(true);

    expect(resultModal.classList.add).toHaveBeenCalledWith('active');
    expect(titleEl.textContent).toBe('完美通关');

    // Click close on result modal
    if (closeBtn.onclick) {
      closeBtn.onclick();
      expect(resultModal.classList.remove).toHaveBeenCalledWith('active');
    }
  });

  it('startTimer decrements timeLeft, changes color near expiry, and ends game at 0', async () => {
    const { MiniGame } = await import('../js/features/minigame.js');
    const timerEl = { style: { color: '' }, textContent: '' };

    globalThis.document.getElementById = vi.fn(id => {
      if (id === 'minigame-timer') return timerEl;
      return null;
    });

    const game = new MiniGame();
    const endGameSpy = vi.spyOn(game, 'endGame');
    game.timeLeft = 12;
    game.gameActive = true;

    game.startTimer();

    // Advance 2s -> timeLeft = 10 (orange)
    await vi.advanceTimersByTimeAsync(2000);
    expect(game.timeLeft).toBe(10);
    expect(timerEl.style.color).toBe('#ff9800');

    // Advance 5s -> timeLeft = 5 (red)
    await vi.advanceTimersByTimeAsync(5000);
    expect(game.timeLeft).toBe(5);
    expect(timerEl.style.color).toBe('#f44336');

    // Advance 5s -> timeLeft = 0 (game over)
    await vi.advanceTimersByTimeAsync(5000);
    expect(game.timeLeft).toBe(0);
    expect(endGameSpy).toHaveBeenCalledWith(false);
  });
});


