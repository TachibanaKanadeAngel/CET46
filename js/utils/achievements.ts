// 成就勋章（Achievements）
// 根据学习统计数据评估用户已获得的成就徽章，构成轻量“激励闭环”。
// 纯函数、逻辑可测；UI 据此渲染徽章行。

export interface AchievementGoal {
  newLearned?: number;
  reviewCount?: number;
  mastered?: number;
  currentStreak?: number;
  sessions?: number;
  days?: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  goal: AchievementGoal;
}

export interface EvaluationData {
  newLearned?: number;
  reviewCount?: number;
  mastered?: number;
  currentStreak?: number;
  sessions?: number;
  days?: number;
}

export interface AchievementResult {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  progress: { current: number; goal: number };
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-word', name: '初出茅庐', description: '完成第一个生词学习', goal: { newLearned: 1 } },
  { id: 'first-review', name: '温故知新', description: '完成第一次复习', goal: { reviewCount: 1 } },
  { id: 'words-100', name: '百词斩', description: '累计学习 100 个生词', goal: { newLearned: 100 } },
  { id: 'words-500', name: '学海无涯', description: '累计学习 500 个生词', goal: { newLearned: 500 } },
  { id: 'master-50', name: '融会贯通', description: '掌握 50 个单词', goal: { mastered: 50 } },
  { id: 'master-200', name: '炉火纯青', description: '掌握 200 个单词', goal: { mastered: 200 } },
  { id: 'streak-3', name: '三日之雅', description: '连续打卡 3 天', goal: { currentStreak: 3 } },
  { id: 'streak-7', name: '一周之约', description: '连续打卡 7 天', goal: { currentStreak: 7 } },
  { id: 'streak-30', name: '坚持一个月的你', description: '连续打卡 30 天', goal: { currentStreak: 30 } },
  { id: 'sessions-50', name: '每日坚持', description: '累计完成 50 次学习', goal: { sessions: 50 } },
  { id: 'day-30', name: '老朋友的陪伴', description: '累计学习 30 天', goal: { days: 30 } },
];

/** 评估成就。 */
export function evaluateAchievements(data: EvaluationData = {}): AchievementResult[] {
  return ACHIEVEMENTS.map(a => {
    const entry = Object.entries(a.goal)[0];
    const [key, goal] = entry;
    const current = (data as Record<string, number | undefined>)[key] ?? 0;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      earned: current >= (goal as number),
      progress: { current: Math.min(current, goal as number), goal: goal as number },
    };
  });
}

/** 仅返回已获得的成就。 */
export function getEarnedAchievements(data: EvaluationData): AchievementResult[] {
  return evaluateAchievements(data).filter(a => a.earned);
}

export default { evaluateAchievements, getEarnedAchievements };