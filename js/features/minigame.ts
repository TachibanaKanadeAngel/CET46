import { getMemoryCache, getWrongWords } from '../store.js';
import { createFocusTrap } from '../utils/dom.js';
import logger from '../utils/logger.js';
import { CONFIG } from '../config.js';
import { UI } from '../ui.js';

const BASE_GRID_SIZE = 9;
const MIN_CONSECUTIVE = 50;

const REWARDS = {
  BRONZE: { id: 'bronze', threshold: 100, icon: '🥉', name: '青铜成就' },
  SILVER: { id: 'silver', threshold: 300, icon: '🥈', name: '白银成就' },
  GOLD: { id: 'gold', threshold: 500, icon: '🥇', name: '黄金成就' },
  DIAMOND: { id: 'diamond', threshold: 800, icon: '💎', name: '钻石成就' },
  MASTER: { id: 'master', threshold: 1000, icon: '👑', name: '宗师成就' },
};

const ACHIEVEMENTS = [
  { id: 'first_game', name: '初次尝试', desc: '完成第一局游戏', icon: '🎮' },
  { id: 'streak_5', name: '小试牛刀', desc: '连击达到 5', icon: '🔥' },
  { id: 'streak_10', name: '势如破竹', desc: '连击达到 10', icon: '⚡' },
  { id: 'score_500', name: '词汇大师', desc: '单次得分超过 500', icon: '🏆' },
  { id: 'perfect', name: '完美无瑕', desc: '无错误完成游戏', icon: '✅' },
];

const setElText = (id: string, text: any): void => {
  const el = document.getElementById(id);
  if (el) el.textContent = String(text ?? '');
};

const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void => {
  if (typeof window !== 'undefined' && (window as any).UI?.toast) {
    (window as any).UI.toast(msg, type);
  } else if (typeof document !== 'undefined' && document.body) {
    UI.toast(msg, type);
  }
};

class MiniGame {
  public grid: any[];
  public words: any[];
  public currentWord: any;
  public score: number;
  public streak: number;
  public maxStreak: number;
  public gameActive: boolean;
  public timer: any;
  public timeLeft: number;
  public selectedCell: any;
  public errors: number;
  public gridSize: number;
  public _choiceLock: boolean;
  public _nextWordTimer: any;
  public achievements: any[];
  public unlockedRewards: any[];
  public _cleanupFocusTrap: (() => void) | null;
  public _boundVisibilityHandler: any;
  public _eventsBound: boolean;
  [key: string]: any;

  constructor() {
    this.grid = [];
    this.words = [];
    this.currentWord = null;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.gameActive = false;
    this.timer = null;
    this.timeLeft = 60;
    this.selectedCell = null;
    this.errors = 0;
    this.gridSize = BASE_GRID_SIZE;
    this._choiceLock = false;
    this._nextWordTimer = null;
    this._eventsBound = false;
    try {
      this.achievements = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_ACHIEVEMENTS) || '[]');
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_achievements:', e);
      this.achievements = [];
    }
    try {
      this.unlockedRewards = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_REWARDS) || '[]');
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_rewards:', e);
      this.unlockedRewards = [];
    }
    this._cleanupFocusTrap = null;
    this._boundVisibilityHandler = () => {
      if (this.gameActive && document.hidden) {
        this.endGame(false);
      }
    };
    document.addEventListener('visibilitychange', this._boundVisibilityHandler);
  }

  destroy(): void {
    this.endGame(false);
    if (this._boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this._boundVisibilityHandler);
      this._boundVisibilityHandler = null;
    }
    this._cleanupFocusTrap?.();
    this._cleanupFocusTrap = null;
  }

  _activateModal(modal: HTMLElement | null): void {
    if (!modal) return;
    modal.classList.add('active');
    this._cleanupFocusTrap?.();
    this._cleanupFocusTrap = createFocusTrap(modal);
  }

  _deactivateModal(modal: HTMLElement | null): void {
    if (!modal) return;
    modal.classList.remove('active');
    this._cleanupFocusTrap?.();
    this._cleanupFocusTrap = null;
  }

  init(): void {
    if (this._eventsBound) return;
    this._eventsBound = true;
    this.bindEvents();
    this.checkAndShowPrompt();
    this.loadAchievements();
  }

  calculateDifficulty(): number {
    const memoryCache = getMemoryCache() as any;
    const progress = memoryCache.progress?.toObject ? memoryCache.progress.toObject() : (memoryCache.progress || {});

    const wordsWithStability = Object.values(progress).filter((wd: any) => wd && wd.stability) as any[];
    if (wordsWithStability.length === 0) return 1.0;

    const avgStability =
      wordsWithStability.reduce((sum: number, wd: any) => sum + wd.stability, 0) / wordsWithStability.length;

    if (avgStability > 50) return 1.5;
    if (avgStability > 20) return 1.2;
    if (avgStability > 10) return 1.0;
    return 0.8;
  }

  getGridSize(): number {
    const difficulty = this.calculateDifficulty();
    let highScore: number;
    try {
      highScore = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_HIGHSCORE) || '0', 10);
      if (isNaN(highScore)) highScore = 0;
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_highscore:', e);
      highScore = 0;
    }

    if (highScore >= 800 || difficulty >= 1.5) return 5;
    if (highScore >= 500 || difficulty >= 1.2) return 4;
    return 3;
  }

  getTimeLimit(): number {
    const difficulty = this.calculateDifficulty();
    let highScore: number;
    try {
      highScore = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_HIGHSCORE) || '0', 10);
      if (isNaN(highScore)) highScore = 0;
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_highscore:', e);
      highScore = 0;
    }

    if (difficulty >= 1.5) return 45;
    if (difficulty >= 1.2) return 60;
    if (highScore >= 500) return 75;
    return 60;
  }

  checkAndShowPrompt(): void {
    let studyCount: number;
    try {
      studyCount = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TODAY_STUDY_COUNT) || '0', 10);
      if (isNaN(studyCount)) studyCount = 0;
    } catch (e) {
      logger.warn('Failed to parse cet46_today_study_count:', e);
      studyCount = 0;
    }

    if (studyCount >= MIN_CONSECUTIVE && !this.gameActive) {
      setTimeout(() => {
        this.showRestPrompt(studyCount);
      }, 2000);
    }
  }

  showRestPrompt(count: number): void {
    const modal = document.getElementById('minigame-modal');
    if (!modal) return;

    const reward = this.getCurrentReward();
    setElText('minigame-prompt-count', count);
    setElText('minigame-prompt-reward', reward.icon);

    this._activateModal(modal);

    const playBtn = document.getElementById('minigame-play-btn');
    const closeBtn = document.getElementById('minigame-close-prompt');

    const cleanup = () => {
      if (playBtn) playBtn.onclick = null;
      if (closeBtn) closeBtn.onclick = null;
    };

    if (playBtn) {
      playBtn.onclick = () => {
        cleanup();
        this._deactivateModal(modal);
        this.startGame();
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        cleanup();
        this._deactivateModal(modal);
      };
    }
  }

  getCurrentReward(): any {
    const highScore = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_HIGHSCORE) || '0', 10);

    for (const tier of Object.values(REWARDS).reverse()) {
      if (highScore >= tier.threshold) {
        return tier;
      }
    }
    return REWARDS.BRONZE;
  }

  startGame(): void {
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.errors = 0;
    this.gameActive = true;
    this.gridSize = this.getGridSize();
    this.timeLeft = this.getTimeLimit();
    this.selectedCell = null;
    this._choiceLock = false;
    if (this._nextWordTimer) {
      clearTimeout(this._nextWordTimer);
      this._nextWordTimer = null;
    }

    this.grid = this.generateGrid();
    this.renderGrid();
    this.nextWord();
    this.startTimer();
    this.updateUI();

    const gameModal = document.getElementById('minigame-game-modal');
    if (gameModal) {
      this._activateModal(gameModal);
    }

    logger.info('单词匹配游戏开始 - 难度等级:', this.gridSize, 'x', this.gridSize);
  }

  generateGrid(): any[][] {
    const gridSize = this.gridSize;
    const grid: any[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));
    const wrongWords = getWrongWords() as any;
    const wrongWordsObj = wrongWords?.toObject ? wrongWords.toObject() : (wrongWords || {});
    const wordList: any[] = Object.entries(wrongWordsObj)
      .filter(([, data]: [string, any]) => data && data.count >= 1)
      .map(([id, data]: [string, any]) => ({
        id,
        word: data.word,
        meaning: data.meaning || data.translation || '',
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    if (wordList.length < 5) {
      const defaultWords = [
        { id: 'default_1', word: 'abandon', meaning: '放弃', count: 1 },
        { id: 'default_2', word: 'ability', meaning: '能力', count: 1 },
        { id: 'default_3', word: 'abnormal', meaning: '不正常的', count: 1 },
        { id: 'default_4', word: 'aboard', meaning: '在船上', count: 1 },
        { id: 'default_5', word: 'abroad', meaning: '在国外', count: 1 },
      ];
      wordList.push(...defaultWords);
    }

    this.words = wordList;

    const positions: { row: number; col: number }[] = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        positions.push({ row: i, col: j });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const usedWords = new Set<string>();
    let idx = 0;

    for (const pos of positions) {
      if (idx >= wordList.length) break;

      const wordData = wordList[idx];
      if (usedWords.has(wordData.id)) {
        idx++;
        continue;
      }

      grid[pos.row][pos.col] = {
        id: wordData.id,
        word: wordData.word,
        meaning: wordData.meaning || wordData.translation || '',
      };
      usedWords.add(wordData.id);
      idx++;
    }

    const usedWordTexts = new Set(
      wordList.filter(w => usedWords.has(w.id)).map(w => w.word)
    );
    const fillerPool = wordList.filter(w => !usedWordTexts.has(w.word));
    const pool = fillerPool.length > 0 ? fillerPool : wordList;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          const randomWord = pool[Math.floor(Math.random() * pool.length)];
          grid[i][j] = {
            id: `filler_${i}_${j}`,
            word: randomWord.word,
            meaning: randomWord.meaning || randomWord.translation || '',
          };
        }
      }
    }

    return grid;
  }

  renderGrid(): void {
    const gridContainer = document.getElementById('minigame-grid');
    if (!gridContainer) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement('div');
        cell.className = 'minigame-cell';
        cell.dataset.row = String(i);
        cell.dataset.col = String(j);
        cell.dataset.state = 'normal';

        const wordData = this.grid[i][j];
        cell.textContent = wordData.word;

        const sizeStr = this.gridSize > 4 ? '55px' : '65px';
        cell.style.cssText = `
          width: ${sizeStr};
          height: ${sizeStr};
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: ${this.gridSize > 4 ? '11px' : '13px'};
          transition: all 0.2s;
          user-select: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        cell.onclick = () => this.handleCellClick(i, j, cell);

        cell.onmouseenter = () => {
          if (cell.dataset.state === 'normal') {
            cell.style.borderColor = 'var(--primary)';
            cell.style.transform = 'scale(1.05)';
          }
        };

        cell.onmouseleave = () => {
          if (cell.dataset.state === 'normal') {
            cell.style.borderColor = 'var(--border-color)';
            cell.style.transform = 'scale(1)';
          }
        };

        fragment.appendChild(cell);
      }
    }

    gridContainer.replaceChildren(fragment);
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.gridSize}, 1fr);
      gap: 6px;
      max-width: ${this.gridSize * 70}px;
      margin: 0 auto;
      padding: 15px;
    `;
  }

  handleCellClick(row: number, col: number, cellElement: HTMLElement): void {
    if (!this.gameActive || !this.currentWord || this._choiceLock) return;
    this._choiceLock = true;

    const clickedWord = this.grid[row][col];

    if (clickedWord.id === this.currentWord.id) {
      this.handleCorrectMatch(row, col, cellElement);
    } else {
      this.handleWrongMatch(row, col, cellElement);
    }
  }

  handleCorrectMatch(_row: number, _col: number, cellElement: HTMLElement): void {
    const pointsGained = 10 + this.streak * 2;
    this.score += pointsGained;
    this.streak++;
    this.maxStreak = Math.max(this.maxStreak, this.streak);

    cellElement.style.background = 'var(--success)';
    cellElement.style.color = '#fff';
    cellElement.style.borderColor = 'var(--success)';
    cellElement.style.boxShadow = '0 0 15px var(--success)';

    const reward = this.getScoreReward(this.score);
    if (reward && !this.unlockedRewards.includes(reward.id)) {
      this.unlockReward(reward);
    }

    this.checkAchievements();

    showToast(
      `+${pointsGained} 分！连击：${this.streak} ${reward ? '🔓' : ''}`,
      'success'
    );

    this.updateUI();

    if (this.score >= 500) {
      this.endGame(true);
      return;
    }

    this._nextWordTimer = setTimeout(() => {
      this._nextWordTimer = null;
      this.nextWord();
    }, 300);
  }

  handleWrongMatch(_row: number, _col: number, cellElement: HTMLElement): void {
    this.errors++;
    this.streak = 0;

    cellElement.style.background = 'var(--danger)';
    cellElement.style.color = '#fff';
    cellElement.style.borderColor = 'var(--danger)';
    cellElement.style.boxShadow = '0 0 15px var(--danger)';

    showToast('匹配错误，连击已中断', 'error');

    this.updateUI();

    setTimeout(() => {
      cellElement.style.background = 'var(--card-bg)';
      cellElement.style.color = 'var(--text-color)';
      cellElement.style.borderColor = 'var(--border-color)';
      cellElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      this._choiceLock = false;
    }, 500);
  }

  getScoreReward(score: number): any {
    for (const tier of Object.values(REWARDS).reverse()) {
      if (score >= tier.threshold && !this.unlockedRewards.includes(tier.id)) {
        return { ...tier };
      }
    }
    return null;
  }

  unlockReward(reward: any): void {
    this.unlockedRewards.push(reward.id);
    localStorage.setItem(CONFIG.STORAGE_KEYS.MINIGAME_REWARDS, JSON.stringify(this.unlockedRewards));

    showToast(`🔓 解锁成就：${reward.name} ${reward.icon}`, 'success');

    setTimeout(() => {
      const rewardModal = document.getElementById('minigame-reward-modal');
      if (rewardModal) {
        setElText('reward-icon', reward.icon);
        setElText('reward-name', reward.name);
        rewardModal.classList.add('active');
        setTimeout(() => rewardModal.classList.remove('active'), 2000);
      }
    }, 500);
  }

  checkAchievements(): void {
    const newAchievements: string[] = [];

    if (!this.hasAchievement('first_game')) {
      newAchievements.push('first_game');
    }

    if (this.streak >= 5 && !this.hasAchievement('streak_5')) {
      newAchievements.push('streak_5');
    }

    if (this.streak >= 10 && !this.hasAchievement('streak_10')) {
      newAchievements.push('streak_10');
    }

    if (this.score >= 500 && !this.hasAchievement('score_500')) {
      newAchievements.push('score_500');
    }

    for (const achievementId of newAchievements) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        this.achievements.push(achievementId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.MINIGAME_ACHIEVEMENTS, JSON.stringify(this.achievements));

        showToast(`🏅 达成成就：${achievement.name} ${achievement.icon}`, 'success');
      }
    }
  }

  hasAchievement(id: string): boolean {
    return this.achievements.includes(id);
  }

  loadAchievements(): void {
    try {
      this.achievements = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_ACHIEVEMENTS) || '[]');
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_achievements:', e);
      this.achievements = [];
    }
    try {
      this.unlockedRewards = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_REWARDS) || '[]');
    } catch (e) {
      logger.warn('Failed to parse cet46_minigame_rewards:', e);
      this.unlockedRewards = [];
    }
  }

  nextWord(): void {
    const availableWords: any[] = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = this.grid[i][j];
        if (cell && !cell.id.startsWith('filler_')) {
          availableWords.push(cell);
        }
      }
    }

    if (availableWords.length === 0) {
      this.endGame(true);
      return;
    }

    this.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    this._choiceLock = false;

    setElText('minigame-target-word', this.currentWord.meaning);

    const cells = document.querySelectorAll('.minigame-cell');
    cells.forEach(cell => {
      (cell as HTMLElement).dataset.state = 'normal';
      (cell as HTMLElement).style.background = 'var(--card-bg)';
      (cell as HTMLElement).style.color = 'var(--text-color)';
      (cell as HTMLElement).style.borderColor = 'var(--border-color)';
      (cell as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
  }

  startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateUI();

      if (this.timeLeft <= 0) {
        this.endGame(false);
      }
    }, 1000);
  }

  updateUI(): void {
    setElText('minigame-score', this.score);
    setElText('minigame-timer', this.timeLeft);
    setElText('minigame-streak', this.streak);
    setElText('minigame-max-streak', this.maxStreak);

    const timerElement = document.getElementById('minigame-timer');
    if (timerElement) {
      if (this.timeLeft <= 5) {
        timerElement.style.color = '#f44336';
        timerElement.style.animation = 'pulse 1s infinite';
      } else if (this.timeLeft <= 10) {
        timerElement.style.color = '#ff9800';
        timerElement.style.animation = 'none';
      } else {
        timerElement.style.color = 'var(--primary)';
        timerElement.style.animation = 'none';
      }
    }
  }

  endGame(victory: boolean = false): void {
    this.gameActive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this._nextWordTimer) {
      clearTimeout(this._nextWordTimer);
      this._nextWordTimer = null;
    }
    this._choiceLock = false;

    const gameModal = document.getElementById('minigame-game-modal');
    if (gameModal) {
      this._deactivateModal(gameModal);
    }

    const isPerfect = this.errors === 0;
    if (isPerfect && !this.hasAchievement('perfect')) {
      this.achievements.push('perfect');
      localStorage.setItem(CONFIG.STORAGE_KEYS.MINIGAME_ACHIEVEMENTS, JSON.stringify(this.achievements));
      showToast('🏅 达成成就：完美无瑕 ✅', 'success');
    }

    const resultModal = document.getElementById('minigame-result-modal');
    if (resultModal) {
      setElText('minigame-final-score', this.score);
      setElText('minigame-final-streak', this.maxStreak);
      setElText('minigame-final-errors', this.errors);
      setElText(
        'minigame-result-title',
        victory ? (isPerfect ? '完美通关' : '挑战成功') : '时间到'
      );

      const reward = this.getCurrentReward();
      setElText('minigame-current-reward', reward.icon);

      this._activateModal(resultModal);

      const closeBtn = document.getElementById('minigame-result-close');
      if (closeBtn) {
        closeBtn.onclick = () => {
          this._deactivateModal(resultModal);
        };
      }
    }

    const highScore = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.MINIGAME_HIGHSCORE) || '0', 10);
    if (this.score > highScore) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.MINIGAME_HIGHSCORE, this.score.toString());
      logger.info('新纪录！', this.score);
    }

    logger.info(`游戏结束 - 得分：${this.score}, 连击：${this.maxStreak}, 错误：${this.errors}`);
  }

  bindEvents(): void {
    const promptModal = document.getElementById('minigame-modal');
    const gameModal = document.getElementById('minigame-game-modal');
    const resultModal = document.getElementById('minigame-result-modal');

    if (promptModal) {
      promptModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        this._deactivateModal(promptModal);
      });
      promptModal.addEventListener('keydown', e => {
        if (e.key === 'Escape') this._deactivateModal(promptModal);
      });
    }

    if (gameModal) {
      gameModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        this.endGame(false);
      });
      gameModal.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.endGame(false);
      });
    }

    if (resultModal) {
      resultModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        this._deactivateModal(resultModal);
      });
      resultModal.addEventListener('keydown', e => {
        if (e.key === 'Escape') this._deactivateModal(resultModal);
      });
    }
  }
}

const miniGame = new MiniGame();

export { MiniGame, miniGame, MIN_CONSECUTIVE, REWARDS, ACHIEVEMENTS };
export default miniGame;
