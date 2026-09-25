import { CONFIG, MS_PER_DAY } from '../config.js';
import { db } from '../db.js';
import { getData, getWordData } from '../core.js';
import { getHeatmap, memoryCache } from '../store.js';
import { DeviceBridge } from '../bridge.js';
import { WORDS } from '../data/vocab-store.js';
import { setHtml } from './dom.js';
import { localDateStr } from './date.js';
import { computeCurrentStreak, computeLongestStreak } from './streak.js';
import { evaluateAchievements } from './achievements.js';
import { averageRetentionCurve } from './retention.js';
import { shuffle } from '../utils.js';

let StudyFeature: any = null;

export function registerStudyFeature(feature: any): void {
  StudyFeature = feature;
}

const CONSTANTS = CONFIG.CONSTANTS;

export function updateStats(): void {
  const data = getData();
  let newCount = 0,
    reviewCount = 0,
    masteredCount = 0;
  let todayReviewCount = 0;
  const today = localDateStr();

  WORDS.forEach(w => {
    const wd = data[w.id];
    if (!wd || wd.status === 'new') newCount++;
    else if (wd.status === 'review') {
      reviewCount++;
      if (wd.nextReviewDate === today) todayReviewCount++;
    } else if (wd.status === 'mastered') masteredCount++;
  });

  const el = (id: string) => document.getElementById(id);
  const elTotal = el('stat-total');
  if (elTotal) elTotal.textContent = String(WORDS.length);
  const elNew = el('stat-new');
  if (elNew) elNew.textContent = String(newCount);
  const elReview = el('stat-review');
  if (elReview) elReview.textContent = String(reviewCount);
  const elMastered = el('stat-mastered');
  if (elMastered) elMastered.textContent = String(masteredCount);

  checkMemoryOverload(todayReviewCount);
  DeviceBridge.scheduleNextReviewReminder(WORDS, getWordData);
}

export function checkMemoryOverload(todayCount: number): void {
  const studyView = document.getElementById('view-study');
  let banner = document.getElementById('overload-banner');

  if (todayCount > (CONSTANTS?.OVERLOAD_THRESHOLD || 50)) {
    if (!banner && studyView) {
      banner = document.createElement('div');
      banner.id = 'overload-banner';
      banner.style.cssText =
        'background:linear-gradient(135deg,#f56565 0%,#e53e3e 100%);color:white;padding:1rem;border-radius:12px;margin-bottom:1rem;text-align:center;';
      const title = document.createElement('div');
      title.style.cssText = 'font-weight:bold;font-size:1.1rem;';
      title.textContent = '记忆负载过高';
      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:0.9rem;margin-top:0.3rem;';
      desc.textContent = `今日待复习 ${todayCount} 词，建议先消化积压内容`;
      const btn = document.createElement('button');
      btn.style.cssText =
        'margin-top:0.5rem;padding:0.5rem 1rem;background:white;color:#e53e3e;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
      btn.textContent = '进入快速回顾';
      btn.addEventListener('click', enterQuickReviewMode);
      banner.append(title, desc, btn);
      studyView.insertBefore(banner, studyView.firstChild);
    }
  } else if (banner) {
    banner.remove();
  }
}

export function enterQuickReviewMode(): void {
  if (!StudyFeature) return;
  const data = getData();
  const todayLocal = localDateStr();
  const todayISO = new Date().toISOString().slice(0, 10);
  const quickQueue = WORDS.filter(w => {
    const wd = data[w.id];
    return wd && wd.status === 'review' && (wd.nextReviewDate === todayLocal || wd.nextReviewDate === todayISO || (wd.nextReview && wd.nextReview <= Date.now()));
  }).slice(0, CONSTANTS?.QUICK_REVIEW_LIMIT || 20);

  if (quickQueue.length === 0) return;
  shuffle(quickQueue);
  StudyFeature.setWords(WORDS);
  StudyFeature.startStudy('all', CONSTANTS?.QUICK_REVIEW_LIMIT || 20, getData, memoryCache, db, {
    overrideQueue: quickQueue,
  });
}

export function renderHeatmap(): void {
  const heatmap = getHeatmap();
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const today = new Date();
  const fragment = document.createDocumentFragment();
  grid.replaceChildren();

  const daySquares: HTMLDivElement[] = [];
  for (let i = 49; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    const count = heatmap[dateStr] || 0;

    const square = document.createElement('div');
    square.className = 'heatmap-cell heatmap-day';
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 10) level = 2;
    if (count >= 25) level = 3;
    if (count >= 50) level = 4;
    square.dataset.level = String(level);
    square.title = `${dateStr}: 学习 ${count} 词`;
    daySquares.push(square);
  }
  daySquares.forEach(sq => fragment.appendChild(sq));
  grid.appendChild(fragment);

  const currentStreak = computeCurrentStreak(heatmap, localDateStr(today));

  const heatmapStreakEl = document.getElementById('heatmap-streak');
  if (heatmapStreakEl) {
    heatmapStreakEl.textContent = `连续学习 ${currentStreak} 天`;
  }
  const streakEl = document.getElementById('stats-streak');
  if (streakEl) {
    streakEl.textContent = String(currentStreak);
  }
  const longestStreakEl = document.getElementById('stats-longest-streak');
  if (longestStreakEl) {
    longestStreakEl.textContent = String(computeLongestStreak(heatmap));
  }

  const allData = getData();
  let totalEF = 0;
  let efCount = 0;
  let masteredCount = 0;
  const upcomingReviews = [0, 0, 0, 0, 0, 0, 0];
  const todayNorm = new Date(today);
  todayNorm.setHours(0, 0, 0, 0);

  Object.values(allData).forEach((wd: any) => {
    if (wd) {
      if (wd.ef) {
        totalEF += wd.ef;
        efCount++;
      }
      if (wd.status === 'mastered') masteredCount++;
      if (wd.status === 'review' && wd.nextReview) {
        const reviewDate = new Date(wd.nextReview);
        reviewDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((reviewDate.getTime() - todayNorm.getTime()) / MS_PER_DAY);
        if (daysDiff >= 0 && daysDiff < 7) upcomingReviews[daysDiff]++;
      }
    }
  });

  const setText = (id: string, text: string | number) => {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = String(text);
  };
  setText('stats-total-words', Object.keys(allData).length);
  setText('stats-avg-ef', efCount > 0 ? (totalEF / efCount).toFixed(2) : '2.5');
  setText('stats-days', Object.keys(heatmap).length);

  updateProgressEstimation(masteredCount);
  renderRetentionChart(upcomingReviews);
  renderAchievements(Object.keys(allData).length, allData, masteredCount, currentStreak);
  renderForgettingCurve(allData);
}

export function renderRetentionChart(upcomingReviews: number[]): void {
  const canvas = document.getElementById('retention-chart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const totalUpcoming = upcomingReviews.reduce((a, b) => a + b, 0);
  const totalEl = document.getElementById('total-upcoming');
  if (totalEl) totalEl.textContent = `总计: ${totalUpcoming} 词`;

  const labels = ['今天', '+1天', '+2天', '+3天', '+4天', '+5天', '+6天'];
  const maxValue = Math.max(...upcomingReviews, 10);
  const barWidth = (rect.width - 60) / 7;
  const barGap = 8;
  const chartHeight = rect.height - 50;

  ctx.clearRect(0, 0, rect.width, rect.height);
  const rootStyle = getComputedStyle(document.documentElement);
  const textColor = rootStyle.getPropertyValue('--text-color') || '#2d3748';
  const borderColor = rootStyle.getPropertyValue('--border-color') || '#e2e8f0';

  ctx.fillStyle = textColor;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  upcomingReviews.forEach((count, i) => {
    const x = 30 + i * barWidth + barWidth / 2;
    const barHeight = (count / maxValue) * chartHeight * 0.7;
    const y = rect.height - 30 - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, '#e2a053');
    gradient.addColorStop(1, '#b16223');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - barWidth / 2 + barGap / 2, y, barWidth - barGap, barHeight);
    ctx.fillStyle = textColor;
    ctx.fillText(count.toString(), x, y - 5);
    ctx.fillText(labels[i], x, rect.height - 10);
  });

  ctx.strokeStyle = borderColor;
  ctx.beginPath();
  ctx.moveTo(20, rect.height - 30);
  ctx.lineTo(rect.width - 20, rect.height - 30);
  ctx.stroke();
}

export function updateProgressEstimation(masteredCount: number): void {
  const heatmap = getHeatmap();
  const dates = Object.keys(heatmap).sort();
  const estElement = document.getElementById('stats-est-date');
  if (!estElement) return;
  const remaining = WORDS.length - masteredCount;

  if (dates.length < 3 || masteredCount < 5) {
    estElement.textContent = '继续学习后生成预测';
    return;
  }

  const last14Days = dates.slice(-14);
  const dailyMastery: number[] = [];
  for (let i = 1; i < last14Days.length; i++) {
    const currDate = last14Days[i];
    const prevMastered = memoryCache.progressSnapshot?.[last14Days[i - 1]]?.mastered || 0;
    const currMastered = memoryCache.progressSnapshot?.[currDate]?.mastered || 0;
    const gain = Math.max(0, currMastered - prevMastered);
    if (gain > 0) dailyMastery.push(gain);
  }

  let avgMasteryRate: number;
  if (dailyMastery.length >= 3) {
    const recent = dailyMastery.slice(-7);
    avgMasteryRate = recent.reduce((a, b) => a + b, 0) / recent.length;
  } else {
    const last7Days = dates.slice(-7);
    const totalActivity = last7Days.reduce((sum, d) => sum + (heatmap[d] || 0), 0);
    avgMasteryRate = Math.max((totalActivity / Math.max(last7Days.length, 1)) * 0.15, 1);
  }
  avgMasteryRate = Math.max(avgMasteryRate, 0.5);

  const daysToFinish = Math.ceil(remaining / avgMasteryRate);
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + daysToFinish);
  setHtml(
    estElement,
    `<strong>${estDate.getMonth() + 1} 月 ${estDate.getDate()} 日</strong>（${daysToFinish} 天后）`
  );
}

export function renderAchievements(learnedCount: number, allData: any, masteredCount: number, currentStreak: number): void {
  const container = document.getElementById('achievements-row');
  if (!container) return;
  const dates = new Set(Object.keys(getHeatmap()));
  const statsInput = {
    newLearned: learnedCount,
    reviewCount: Object.values(allData).filter((d: any) => d && d.status === 'review').length,
    mastered: masteredCount,
    currentStreak,
    days: dates.size,
    sessions: currentStreak,
  };
  const badges = evaluateAchievements(statsInput);
  container.replaceChildren();
  if (badges.length === 0) return;
  const title = document.createElement('span');
  title.className = 'achievements-title';
  title.textContent = '🏆 成就';
  container.appendChild(title);
  for (const badge of badges) {
    const chip = document.createElement('span');
    chip.className = `achievement-chip${badge.earned ? '' : ' locked'}`;
    chip.title = `${badge.description}\n进度 ${badge.progress.current}/${badge.progress.goal}`;
    chip.textContent = badge.earned ? badge.name : `${badge.name} ${badge.progress.current}/${badge.progress.goal}`;
    container.appendChild(chip);
  }
}

export function renderForgettingCurve(allData: any): void {
  const canvas = document.getElementById('retention-curve') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const intervals = Object.values(allData)
    .filter((d: any) => d && d.status === 'review')
    .map((d: any) => d.intervalDays)
    .filter((ivl: any) => ivl && ivl > 0);
  const avgInterval = intervals.length
    ? intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length
    : 7;
  const points = averageRetentionCurve([{ initialRetention: 1, halfLife: Math.max(avgInterval, 1) }], { days: 7 });

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  const rootStyle = getComputedStyle(document.documentElement);
  const textColor = rootStyle.getPropertyValue('--text-color') || '#2d3748';
  const accent = '#e2a053';
  const padL = 34;
  const padB = 20;
  const padT = 14;

  ctx.strokeStyle = 'rgba(128,128,128,0.2)';
  ctx.fillStyle = textColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let v = 0.5; v <= 1.001; v += 0.1) {
    const y = padT + (h - padT - padB) * (1 - (v - 0.5) / 0.5);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - 4, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(v * 100)}%`, padL - 4, y + 3);
  }

  ctx.textAlign = 'center';
  const dayStep = (w - padL - 10) / 7;
  for (let d = 0; d <= 7; d++) {
    const x = padL + d * dayStep;
    ctx.fillText(`+${d}d`, x, h - 4);
  }

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p: any, i: number) => {
    const x = padL + (p.t || i) * dayStep;
    const clampedR = Math.max(0.5, Math.min(1, p.retention));
    const y = padT + (h - padT - padB) * (1 - (clampedR - 0.5) / 0.5);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = accent;
  points.forEach((p: any, i: number) => {
    const x = padL + (p.t || i) * dayStep;
    const clampedR = Math.max(0.5, Math.min(1, p.retention));
    const y = padT + (h - padT - padB) * (1 - (clampedR - 0.5) / 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

export async function saveDailyProgressSnapshot(): Promise<void> {
  const data = getData();
  const todayLocal = localDateStr();
  const todayISO = new Date().toISOString().slice(0, 10);
  let masteredCount = 0;
  WORDS.forEach(w => {
    const wd = data[w.id];
    if (wd && wd.status === 'mastered') masteredCount++;
  });
  if (!memoryCache.progressSnapshot) memoryCache.progressSnapshot = {};
  memoryCache.progressSnapshot[todayLocal] = { mastered: masteredCount };
  if (todayISO !== todayLocal) {
    memoryCache.progressSnapshot[todayISO] = { mastered: masteredCount };
  }
  if (db.instance) {
    await db.save('session', { key: 'progressSnapshot', data: memoryCache.progressSnapshot });
  }
}

export async function renderStorageInfo(): Promise<void> {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage = 0, quota = 1 } = await navigator.storage.estimate();
    const percent = ((usage / (quota || 1)) * 100).toFixed(2);
    const usedMB = (usage / 1024 / 1024).toFixed(1);
    const totalMB = (quota / 1024 / 1024).toFixed(0);
    const statusEl = document.getElementById('webdav-status');
    if (!statusEl) return;
    const existing = statusEl.querySelector('.storage-info');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'storage-info';
    div.style.cssText =
      'margin-top:10px;padding:10px;background:rgba(0,0,0,0.05);border-radius:8px;';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;font-size:0.75rem;';
    const label = document.createElement('span');
    label.textContent = '当前 PWA 缓存资源占用';
    const value = document.createElement('span');
    value.textContent = `${usedMB}MB / ${totalMB}MB`;
    row.appendChild(label);
    row.appendChild(value);
    const bar = document.createElement('div');
    bar.style.cssText =
      'height:4px;background:var(--border-color);border-radius:2px;margin-top:5px;overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:${percent}%;background:${parseFloat(percent) > 80 ? 'var(--danger)' : 'var(--success)'};`;
    bar.appendChild(fill);
    div.appendChild(row);
    div.appendChild(bar);
    if (window.location.protocol === 'file:') {
      const note = document.createElement('div');
      note.style.cssText = 'margin-top:6px;font-size:0.75rem;color:var(--gray);';
      note.textContent = '本地模式下部分云同步功能可能不可用';
      div.appendChild(note);
    }
    statusEl.appendChild(div);
  }
}
