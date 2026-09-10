const { calculateLevenshtein } = require('./string');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const IRREGULAR_BASES = {
  shrank: 'shrink',
};

function addCandidate(candidates, value) {
  const candidate = String(value || '').trim();
  if (candidate.length >= 2) candidates.add(candidate);
}

function getCandidateBases(word) {
  const value = String(word || '').trim();
  const lower = value.toLowerCase();
  const candidates = new Set();
  addCandidate(candidates, value);
  addCandidate(candidates, IRREGULAR_BASES[lower]);

  if (/ies$/i.test(value)) addCandidate(candidates, `${value.slice(0, -3)}y`);
  if (/ied$/i.test(value)) addCandidate(candidates, `${value.slice(0, -3)}y`);

  if (/ing$/i.test(value) && value.length > 4) {
    const stem = value.slice(0, -3);
    addCandidate(candidates, stem);
    addCandidate(candidates, `${stem}e`);
    if (/(.)\1$/i.test(stem)) addCandidate(candidates, stem.slice(0, -1));
  }

  if (/ed$/i.test(value) && value.length > 3) {
    const stem = value.slice(0, -2);
    addCandidate(candidates, stem);
    addCandidate(candidates, `${stem}e`);
    if (/(.)\1$/i.test(stem)) addCandidate(candidates, stem.slice(0, -1));
  }

  if (/est$/i.test(value) && value.length > 4) {
    const stem = value.slice(0, -3);
    addCandidate(candidates, stem);
    addCandidate(candidates, `${stem}e`);
    if (/(.)\1$/i.test(stem)) addCandidate(candidates, stem.slice(0, -1));
  } else if (/er$/i.test(value) && value.length > 3) {
    const stem = value.slice(0, -2);
    addCandidate(candidates, stem);
    addCandidate(candidates, `${stem}e`);
    if (/(.)\1$/i.test(stem)) addCandidate(candidates, stem.slice(0, -1));
  }

  if (/es$/i.test(value) && value.length > 3) addCandidate(candidates, value.slice(0, -2));
  if (/s$/i.test(value) && value.length > 2 && lower !== 'its') {
    addCandidate(candidates, value.slice(0, -1));
  }
  return Array.from(candidates).sort((a: string, b: string) => b.length - a.length);
}

function getInflectionPattern(base) {
  const escaped = escapeRegExp(base);
  if (/y$/i.test(base)) {
    const stem = escapeRegExp(base.slice(0, -1));
    return `(?:${escaped}|${stem}(?:ies|ied|ying))`;
  }
  if (/e$/i.test(base)) {
    const stem = escapeRegExp(base.slice(0, -1));
    return `(?:${escaped}(?:s|d|r|st)?|${stem}(?:ing|er|est))`;
  }

  const forms = [`${escaped}(?:s|es|ed|ing|er|est)?`];
  if (/[bcdfghjklmnpqrstvwxyz]$/i.test(base)) {
    const last = escapeRegExp(base.slice(-1));
    forms.push(`${escaped}${last}(?:ed|ing|er|est)`);
  }
  return `(?:${forms.join('|')})`;
}

function createCloze(word, example) {
  const original = String(example || '');
  if (!word || !original) return { text: original, matched: false };
  const forms = getCandidateBases(word).map(getInflectionPattern).join('|');
  const pattern = new RegExp(`\\b(?:${forms})\\b`, 'gi');
  let matched = false;
  const text = original.replace(pattern, match => {
    matched = true;
    return '_'.repeat(Math.max(4, match.length));
  });
  return { text: matched ? text : original, matched };
}

function generateCloze(word, example) {
  return createCloze(word, example).text;
}

function canGenerateCloze(word, example) {
  return createCloze(word, example).matched;
}

function findConfusingWords(currentWord, words, limit = 4) {
  if (!currentWord || !currentWord.word) return [];
  const target = String(currentWord.word).toLowerCase();
  const threshold = Math.max(1, Math.min(2, Math.floor(target.length * 0.3)));
  return (words || [])
    .filter(candidate => candidate && String(candidate.id) !== String(currentWord.id) && candidate.word)
    .filter(candidate => Math.abs(String(candidate.word).length - target.length) <= threshold)
    .map(candidate => ({
      word: candidate,
      distance: calculateLevenshtein(target, String(candidate.word).toLowerCase()),
    }))
    .filter(item => item.distance > 0 && item.distance <= threshold)
    .sort((a, b) => a.distance - b.distance || a.word.word.localeCompare(b.word.word))
    .slice(0, Math.max(0, Number(limit) || 4))
    .map(item => item.word);
}

module.exports = { generateCloze, canGenerateCloze, findConfusingWords };
