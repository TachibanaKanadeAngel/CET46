// 46英语 - 人机对战大脑（同级动态难度）
// 对齐 ReciteWord 对战思路：电脑根据你的答题对错动态调整其做对概率，制造"同级感"。
// 纯函数/可追踪状态，方便单测与调整参数；不与 wx/页面耦合。

const DEFAULT_OPTS = {
  baseAccuracy: 0.72, // 基础正确率（初阶，可让新玩家稳赢）
  maxDelta: 0.20, // 难度自适应最大偏移
  gapK: 0.06, // 分差影响斜率：领先越多→AI 越准（追近）
  streakK: 0.03, // 连击影响斜率：玩家连击越久→AI 略收紧
  maxAdapt: 0.18, // 一次观察可累积的自适应偏移上限
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 创建一个 AI 对手
 * @param {Object} [opts] 覆盖 DEFAULT_OPTS 的参数
 * @returns {Object} 对手脑：{ currentAccuracy, observe, answer, reset }
 */
function createOpponent(opts = {}) {
  const o = Object.assign({}, DEFAULT_OPTS, opts);
  let adapt = 0; // 当前难度偏移：正=更准/更难，负=更宽松
  let round = 0;

  function currentAccuracy() {
    return clamp(o.baseAccuracy + adapt, 0.2, 0.98);
  }

  /**
   * 每轮玩家作答后调用，观察分差与连击，动态调整 AI 难易。
   * @param {number} playerScore 玩家分数
   * @param {number} aiScore AI 分数
   * @param {number} [playerStreak] 玩家当前连击
   */
  function observe(playerScore, aiScore, playerStreak = 0) {
    round += 1;
    const gap = playerScore - aiScore;
    // 领先 → 正向偏移（AI 更准、追近）；落后 → 负向偏移（AI 放水、拉回同级感）
    const gapDelta = clamp(gap * o.gapK, -o.maxAdapt, o.maxAdapt);
    const streakDelta = clamp(playerStreak * o.streakK, 0, o.maxDelta);
    adapt = clamp(gapDelta + streakDelta, -o.maxDelta, o.maxDelta);
    return currentAccuracy();
  }

  /**
   * 判定本轮 AI 是否答对（概率 = 当前动态正确率）
   * @param {Function} [random] 注入随机源，便于测试
   * @returns {boolean}
   */
  function answer(random = Math.random) {
    return random() <= currentAccuracy();
  }

  function reset() {
    adapt = 0;
    round = 0;
  }

  return { currentAccuracy, observe, answer, reset };
}

const AI_CORRECT_POINT = 10; // AI 答对得分
const AI_WRONG_POINT = 0; // AI 答错不得分（保持异步，不惩罚 AI）

/** AI 单回合得分 */
function aiRoundPoint(correct) {
  return correct ? AI_CORRECT_POINT : AI_WRONG_POINT;
}

/** 结算对战结果 */
function settleBattle(playerScore, aiScore) {
  if (playerScore > aiScore) return 'win';
  if (playerScore < aiScore) return 'lose';
  return 'draw';
}

module.exports = {
  createOpponent,
  aiRoundPoint,
  settleBattle,
  DEFAULT_OPTS,
};