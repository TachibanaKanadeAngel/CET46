import { getData } from '../core.js';
import { getHeatmap } from '../store.js';
import { WORDS } from '../data/vocab-store.js';
import { setHtml, escapeHtml } from './dom.js';
import { CONFIG } from '../config.js';
import { localDateStr } from './date.js';

type MilestoneMap = Record<string, boolean>;
type FireConfetti = (() => void) | undefined;

interface WordData {
  status?: string;
}

function showMilestoneCelebration(type: string, fireConfetti: FireConfetti): void {
  const milestones: Record<string, { emoji: string; text: string }> = {
    'first-100': { emoji: '🎉', text: '首次掌握100词！' },
    'first-500': { emoji: '🏆', text: '突破500词大关！' },
    'first-1000': { emoji: '👑', text: '千词达成！学霸认证！' },
    'streak-7': { emoji: '🔥', text: '连续学习7天！' },
    'streak-30': { emoji: '💪', text: '坚持学习30天！' },
    'all-mastered': { emoji: '🎓', text: '全部掌握！恭喜毕业！' },
  };
  const milestone = milestones[type];
  if (!milestone) return;

  const celebration = document.createElement('div');
  celebration.className = 'milestone-celebration';
  setHtml(
    celebration,
    `<div class="emoji">${escapeHtml(milestone.emoji)}</div><div class="text">${escapeHtml(milestone.text)}</div>`
  );
  document.body.appendChild(celebration);
  if (fireConfetti) fireConfetti();

  setTimeout(() => {
    celebration.style.animation = 'milestone-pop 0.3s ease reverse';
    setTimeout(() => celebration.remove(), 300);
  }, 2500);
}

function checkAndShowMilestones(fireConfetti: FireConfetti): void {
  const data = getData() as Record<string, WordData>;
  let masteredCount = 0;
  WORDS.forEach((w: { id: number | string }) => {
    const wd = data[String(w.id)];
    if (wd && wd.status === 'mastered') masteredCount++;
  });

  let milestones: MilestoneMap = {};
  try {
    milestones = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.MILESTONES) || '{}');
  } catch (_e) {
    milestones = {};
  }

  if (masteredCount >= 100 && !milestones['first-100']) {
    showMilestoneCelebration('first-100', fireConfetti);
    milestones['first-100'] = true;
  }
  if (masteredCount >= 500 && !milestones['first-500']) {
    showMilestoneCelebration('first-500', fireConfetti);
    milestones['first-500'] = true;
  }
  if (masteredCount >= 1000 && !milestones['first-1000']) {
    showMilestoneCelebration('first-1000', fireConfetti);
    milestones['first-1000'] = true;
  }
  if (WORDS.length > 0 && masteredCount >= WORDS.length && !milestones['all-mastered']) {
    showMilestoneCelebration('all-mastered', fireConfetti);
    milestones['all-mastered'] = true;
  }

  const heatmap = getHeatmap() as Record<string, number>;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = localDateStr(date);
    if (heatmap[dateStr] > 0) streak++;
    else break;
  }
  if (streak >= 7 && !milestones['streak-7']) {
    showMilestoneCelebration('streak-7', fireConfetti);
    milestones['streak-7'] = true;
  }
  if (streak >= 30 && !milestones['streak-30']) {
    showMilestoneCelebration('streak-30', fireConfetti);
    milestones['streak-30'] = true;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
}

export { checkAndShowMilestones };