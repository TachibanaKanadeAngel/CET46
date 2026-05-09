import { getMemoryCache, getWrongWords } from '../core.js';

const BASE_GRID_SIZE = 9;
const MIN_CONSECUTIVE = 50;

const REWARDS = {
  BRONZE: { threshold: 100, icon: '🥉', name: '青铜成就' },
  SILVER: { threshold: 300, icon: '🥈', name: '白银成就' },
  GOLD: { threshold: 500, icon: '🥇', name: '黄金成就' },
  DIAMOND: { threshold: 800, icon: '💎', name: '钻石成就' },
  MASTER: { threshold: 1000, icon: '👑', name: '宗师成就' }
};

const ACHIEVEMENTS = [
  { id: 'first_game', name: '初次尝试', desc: '完成第一局游戏', icon: '🎮' },
  { id: 'streak_5', name: '小试牛刀', desc: '连击达到 5', icon: '🔥' },
  { id: 'streak_10', name: '势如破竹', desc: '连击达到 10', icon: '⚡' },
  { id: 'score_500', name: '词汇大师', desc: '单次得分超过 500', icon: '🏆' },
  { id: 'perfect', name: '完美无瑕', desc: '无错误完成游戏', icon: '✅' }
];

class MiniGame {
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
    this.achievements = JSON.parse(localStorage.getItem('cet46_minigame_achievements') || '[]');
    this.unlockedRewards = JSON.parse(localStorage.getItem('cet46_minigame_rewards') || '[]');
  }

  init() {
    this.bindEvents();
    this.checkAndShowPrompt();
    this.loadAchievements();
  }

  calculateDifficulty() {
    const memoryCache = getMemoryCache();
    const progress = memoryCache.progress || {};
    
    const wordsWithStability = Object.values(progress).filter(wd => wd.stability);
    if (wordsWithStability.length === 0) return 1.0;
    
    const avgStability = wordsWithStability.reduce((sum, wd) => sum + wd.stability, 0) / wordsWithStability.length;
    
    if (avgStability > 50) return 1.5;
    if (avgStability > 20) return 1.2;
    if (avgStability > 10) return 1.0;
    return 0.8;
  }

  getGridSize() {
    const difficulty = this.calculateDifficulty();
    const highScore = parseInt(localStorage.getItem('cet46_minigame_highscore') || '0');
    
    if (highScore >= 800 || difficulty >= 1.5) return 5;
    if (highScore >= 500 || difficulty >= 1.2) return 4;
    return 3;
  }

  getTimeLimit() {
    const difficulty = this.calculateDifficulty();
    const highScore = parseInt(localStorage.getItem('cet46_minigame_highscore') || '0');
    
    if (difficulty >= 1.5) return 45;
    if (difficulty >= 1.2) return 60;
    if (highScore >= 500) return 75;
    return 60;
  }

  checkAndShowPrompt() {
    const studyCount = parseInt(localStorage.getItem('cet46_today_study_count') || '0');
    
    if (studyCount >= MIN_CONSECUTIVE && !this.gameActive) {
      setTimeout(() => {
        this.showRestPrompt(studyCount);
      }, 2000);
    }
  }

  showRestPrompt(count) {
    if (typeof window.UI === 'undefined') return;
    
    const modal = document.getElementById('minigame-modal');
    if (!modal) return;
    
    const reward = this.getCurrentReward();
    document.getElementById('minigame-prompt-count').textContent = count;
    document.getElementById('minigame-prompt-reward').textContent = reward.icon;
    
    modal.classList.add('active');
    
    const playBtn = document.getElementById('minigame-play-btn');
    const closeBtn = document.getElementById('minigame-close-prompt');
    
    const cleanup = () => {
      playBtn.onclick = null;
      closeBtn.onclick = null;
    };
    
    playBtn.onclick = () => {
      cleanup();
      modal.classList.remove('active');
      this.startGame();
    };
    
    closeBtn.onclick = () => {
      cleanup();
      modal.classList.remove('active');
    };
  }

  getCurrentReward() {
    const highScore = parseInt(localStorage.getItem('cet46_minigame_highscore') || '0');
    
    for (const tier of Object.values(REWARDS).reverse()) {
      if (highScore >= tier.threshold) {
        return tier;
      }
    }
    
    return REWARDS.BRONZE;
  }

  startGame() {
    this.gameActive = true;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.errors = 0;
    this.gridSize = this.getGridSize();
    this.timeLeft = this.getTimeLimit();
    this.grid = this.generateGrid();
    this.currentWord = null;
    
    this.renderGrid();
    this.updateUI();
    this.nextWord();
    this.startTimer();
    
    const gameModal = document.getElementById('minigame-game-modal');
    if (gameModal) {
      gameModal.classList.add('active');
    }
    
    console.log('单词匹配游戏开始 - 难度等级:', this.gridSize, 'x', this.gridSize);
  }

  generateGrid() {
    const gridSize = this.gridSize;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const wrongWords = getWrongWords();
    const wordList = Object.entries(wrongWords)
      .filter(([, data]) => data.count >= 1)
      .map(([id, data]) => ({
        id,
        word: data.word,
        meaning: data.meaning || data.translation || '',
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    if (wordList.length < 5) {
      const defaultWords = [
        { id: 'default_1', word: 'abandon', meaning: '放弃' },
        { id: 'default_2', word: 'ability', meaning: '能力' },
        { id: 'default_3', word: 'abnormal', meaning: '不正常的' },
        { id: 'default_4', word: 'aboard', meaning: '在船上' },
        { id: 'default_5', word: 'abroad', meaning: '在国外' }
      ];
      wordList.push(...defaultWords);
    }

    this.words = wordList;
    
    const positions = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        positions.push({ row: i, col: j });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const usedWords = new Set();
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
        meaning: wordData.meaning || wordData.translation || ''
      };
      usedWords.add(wordData.id);
      idx++;
    }

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
          grid[i][j] = {
            id: `filler_${i}_${j}`,
            word: randomWord.word,
            meaning: randomWord.meaning || randomWord.translation || ''
          };
        }
      }
    }

    return grid;
  }

  renderGrid() {
    const gridContainer = document.getElementById('minigame-grid');
    if (!gridContainer) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement('div');
        cell.className = 'minigame-cell';
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.dataset.state = 'normal';

        const wordData = this.grid[i][j];
        cell.textContent = wordData.word;

        const fontSize = this.gridSize > 4 ? '11px' : '13px';
        cell.style.cssText = `
          width: ${this.gridSize > 4 ? '55px' : '65px'};
          height: ${this.gridSize > 4 ? '55px' : '65px'};
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-size: ${fontSize};
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
          text-align: center;
          padding: 2px;
          word-break: break-word;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        cell.onclick = () => this.handleCellClick(i, j, cell);

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

  handleCellClick(row, col, cellElement) {
    if (!this.gameActive || !this.currentWord) return;
    
    const clickedWord = this.grid[row][col];
    
    if (clickedWord.meaning === this.currentWord.meaning) {
      this.handleCorrectMatch(row, col, cellElement);
    } else {
      this.handleWrongMatch(row, col, cellElement);
    }
  }

  handleCorrectMatch(row, col, cellElement) {
    this.score += 10 + this.streak * 2;
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
    
    if (typeof window.UI !== 'undefined') {
      window.UI.toast(`+${10 + this.streak * 2} 分！连击：${this.streak} ${reward ? '🔓' : ''}`, 'success');
    }
    
    this.updateUI();
    
    if (this.score >= 500) {
      this.endGame(true);
      return;
    }
    
    setTimeout(() => {
      this.nextWord();
    }, 300);
  }

  handleWrongMatch(row, col, cellElement) {
    this.errors++;
    this.streak = 0;
    
    cellElement.style.background = 'var(--danger)';
    cellElement.style.color = '#fff';
    cellElement.style.borderColor = 'var(--danger)';
    cellElement.style.boxShadow = '0 0 15px var(--danger)';
    
    if (typeof window.UI !== 'undefined') {
      window.UI.toast('匹配错误，连击已中断', 'error');
    }
    
    this.updateUI();
    
    setTimeout(() => {
      cellElement.style.background = 'var(--card-bg)';
      cellElement.style.color = 'var(--text-color)';
      cellElement.style.borderColor = 'var(--border-color)';
      cellElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }, 500);
  }

  getScoreReward(score) {
    for (const tier of Object.values(REWARDS).reverse()) {
      if (score >= tier.threshold && !this.unlockedRewards.includes(tier.id)) {
        return { ...tier, id: `reward_${tier.id}` };
      }
    }
    return null;
  }

  unlockReward(reward) {
    this.unlockedRewards.push(reward.id);
    localStorage.setItem('cet46_minigame_rewards', JSON.stringify(this.unlockedRewards));
    
    if (typeof window.UI !== 'undefined') {
      window.UI.toast(`🔓 解锁成就：${reward.name} ${reward.icon}`, 'success');
    }
    
    setTimeout(() => {
      const rewardModal = document.getElementById('minigame-reward-modal');
      if (rewardModal) {
        document.getElementById('reward-icon').textContent = reward.icon;
        document.getElementById('reward-name').textContent = reward.name;
        rewardModal.classList.add('active');
        setTimeout(() => rewardModal.classList.remove('active'), 2000);
      }
    }, 500);
  }

  checkAchievements() {
    const newAchievements = [];
    
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
        localStorage.setItem('cet46_minigame_achievements', JSON.stringify(this.achievements));
        
        if (typeof window.UI !== 'undefined') {
          window.UI.toast(`🏅 达成成就：${achievement.name} ${achievement.icon}`, 'success');
        }
      }
    }
  }

  hasAchievement(id) {
    return this.achievements.includes(id);
  }

  loadAchievements() {
    this.achievements = JSON.parse(localStorage.getItem('cet46_minigame_achievements') || '[]');
    this.unlockedRewards = JSON.parse(localStorage.getItem('cet46_minigame_rewards') || '[]');
  }

  nextWord() {
    const availableWords = this.words.filter(w => (w.meaning || w.translation || ''));
    if (availableWords.length === 0) {
      this.currentWord = null;
      return;
    }
    const pickedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    this.currentWord = {
      ...pickedWord,
      meaning: pickedWord.meaning || pickedWord.translation || ''
    };
    
    const targetDisplay = document.getElementById('minigame-target');
    if (targetDisplay) {
      targetDisplay.textContent = this.currentWord.meaning || this.currentWord.translation || '';
      targetDisplay.style.cssText = `
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary);
        text-align: center;
        padding: 20px;
        background: var(--card-bg);
        border-radius: 12px;
        margin: 20px auto;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      `;
    }
  }

  updateUI() {
    const scoreEl = document.getElementById('minigame-score');
    const streakEl = document.getElementById('minigame-streak');
    const timerEl = document.getElementById('minigame-timer');
    const errorsEl = document.getElementById('minigame-errors');
    
    if (scoreEl) scoreEl.textContent = this.score;
    if (streakEl) streakEl.textContent = this.streak;
    if (timerEl) timerEl.textContent = this.timeLeft;
    if (errorsEl) errorsEl.textContent = this.errors;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateUI();
      
      if (this.timeLeft <= 10) {
        const timerEl = document.getElementById('minigame-timer');
        if (timerEl) {
          timerEl.style.color = this.timeLeft <= 5 ? '#f44336' : '#ff9800';
        }
      }
      
      if (this.timeLeft <= 0) {
        this.endGame(false);
      }
    }, 1000);
  }

  endGame(victory) {
    this.gameActive = false;
    clearInterval(this.timer);
    
    const isPerfect = this.errors === 0 && victory;
    
    if (isPerfect) {
      this.unlockReward({ id: 'perfect', name: '完美无瑕', icon: '✅' });
    }
    
    const gameModal = document.getElementById('minigame-game-modal');
    const resultModal = document.getElementById('minigame-result-modal');
    
    if (gameModal) gameModal.classList.remove('active');
    
    if (resultModal) {
      document.getElementById('minigame-final-score').textContent = this.score;
      document.getElementById('minigame-final-streak').textContent = this.maxStreak;
      document.getElementById('minigame-final-errors').textContent = this.errors;
      document.getElementById('minigame-result-title').textContent = 
        victory ? (isPerfect ? '完美通关' : '挑战成功') : '时间到';
      
      const reward = this.getCurrentReward();
      document.getElementById('minigame-current-reward').textContent = reward.icon;
      
      resultModal.classList.add('active');
      
      const closeBtn = document.getElementById('minigame-result-close');
      if (closeBtn) {
        closeBtn.onclick = () => {
          resultModal.classList.remove('active');
        };
      }
    }
    
    const highScore = parseInt(localStorage.getItem('cet46_minigame_highscore') || '0');
    if (this.score > highScore) {
      localStorage.setItem('cet46_minigame_highscore', this.score.toString());
      console.log('🎉 新纪录！', this.score);
    }
    
    localStorage.setItem('cet46_today_study_count', '0');
    
    console.log(`游戏结束 - 得分：${this.score}, 连击：${this.maxStreak}, 错误：${this.errors}`);
  }

  bindEvents() {
    const promptModal = document.getElementById('minigame-modal');
    const gameModal = document.getElementById('minigame-game-modal');
    const resultModal = document.getElementById('minigame-result-modal');
    
    if (promptModal) {
      promptModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        promptModal.classList.remove('active');
      });
    }
    
    if (gameModal) {
      gameModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        this.endGame(false);
      });
    }
    
    if (resultModal) {
      resultModal.querySelector('.spelling-close')?.addEventListener('click', () => {
        resultModal.classList.remove('active');
      });
    }
  }
}

const miniGame = new MiniGame();

export { MiniGame, miniGame, MIN_CONSECUTIVE, REWARDS, ACHIEVEMENTS };

