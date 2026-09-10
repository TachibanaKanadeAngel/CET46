const { calculateLevenshtein } = require('./string');

function shuffle(items, random = Math.random) {
  const result = Array.isArray(items) ? items.slice() : [];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function uniqueWords(words) {
  const seen = new Set();
  return (words || []).filter(word => {
    if (!word || !word.word || word.id === undefined || word.id === null) return false;
    const id = String(word.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildSpellingQueue(words, progress, wrongIds, source = 'mixed', limit = 20, random = Math.random) {
  const wordMap = new Map((words || []).map(word => [String(word.id), word]));
  const wrong = uniqueWords((wrongIds || []).map(id => wordMap.get(String(id))).filter(Boolean));
  const learned = uniqueWords((words || []).filter(word => {
    const data = progress[String(word.id)];
    return data && data.status && data.status !== 'new';
  }));
  const fresh = uniqueWords((words || []).filter(word => {
    const data = progress[String(word.id)];
    return !data || !data.status || data.status === 'new';
  }));

  let pool;
  if (source === 'wrong') pool = wrong;
  else if (source === 'learned') pool = learned;
  else pool = uniqueWords([...shuffle(wrong, random), ...shuffle(learned, random)]);

  if (pool.length === 0 && source !== 'wrong') pool = fresh;
  return shuffle(pool, random).slice(0, Math.max(1, Number(limit) || 20));
}

function getSpellingHint(word, level) {
  const value = String(word || '');
  if (!value) return '';
  const safeLevel = Math.max(1, Number(level) || 1);
  const revealCount = Math.min(value.length, safeLevel === 1 ? 1 : safeLevel);
  return `${value.slice(0, revealCount)}${'_'.repeat(Math.max(0, value.length - revealCount))}`;
}

function evaluateSpelling(input, expected, hintLevel = 0) {
  const answer = String(input || '').trim().toLowerCase();
  const target = String(expected || '').trim().toLowerCase();
  const distance = calculateLevenshtein(answer, target);
  const baseQuality = Math.max(2, 4 - Math.max(0, Number(hintLevel) || 0));

  if (distance === 0) {
    return { distance, quality: baseQuality, type: 'correct', correct: true };
  }
  if (distance === 1 && target.length >= 4) {
    return { distance, quality: 2, type: 'close', correct: false };
  }
  return { distance, quality: 1, type: 'wrong', correct: false };
}

function buildMatchPool(words, wrongIds, progress, limit = 24, random = Math.random) {
  const wordMap = new Map((words || []).map(word => [String(word.id), word]));
  const wrong = uniqueWords((wrongIds || []).map(id => wordMap.get(String(id))).filter(Boolean));
  const learned = uniqueWords((words || []).filter(word => {
    const data = progress[String(word.id)];
    return data && data.status && data.status !== 'new';
  }));
  const fallback = uniqueWords(words || []);
  const combined = uniqueWords([...shuffle(wrong, random), ...shuffle(learned, random), ...shuffle(fallback, random)]);
  return combined.filter(word => word.meaning).slice(0, Math.max(8, Number(limit) || 24));
}

function createMatchRound(pool, choiceCount = 12, random = Math.random) {
  const available = uniqueWords(pool || []).filter(word => word.meaning);
  if (available.length < 2) return null;
  const target = available[Math.floor(random() * available.length)];
  const distractors = shuffle(available.filter(word => String(word.id) !== String(target.id)), random)
    .slice(0, Math.max(1, choiceCount - 1));
  return {
    target,
    choices: shuffle([target, ...distractors], random),
  };
}

module.exports = {
  shuffle,
  buildSpellingQueue,
  getSpellingHint,
  evaluateSpelling,
  buildMatchPool,
  createMatchRound,
};
