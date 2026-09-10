const MAX_CUSTOM_WORDS = 500;

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function normalizeCustomWord(raw, defaultLevel = 'CET4') {
  if (!raw || typeof raw !== 'object') return null;
  const word = String(raw.word || '').trim();
  const meaning = String(raw.meaning || raw.translation || '').trim();
  if (!word || !meaning || word.length > 64 || meaning.length > 300) return null;
  const level = raw.level === 'CET6' ? 'CET6' : defaultLevel === 'CET6' ? 'CET6' : 'CET4';
  const normalized = word.toLowerCase();
  return {
    id: `custom:${level}:${stableHash(normalized)}`,
    word,
    meaning,
    phonetic: String(raw.phonetic || '').trim().slice(0, 100),
    example: String(raw.example || '').trim().slice(0, 500),
    level,
    custom: true,
  };
}

function normalizeCustomWords(rawWords, defaultLevel = 'CET4') {
  const result = { CET4: [], CET6: [] };
  const seen = new Set();
  (Array.isArray(rawWords) ? rawWords : []).slice(0, MAX_CUSTOM_WORDS * 2).forEach(raw => {
    const word = normalizeCustomWord(raw, defaultLevel);
    if (!word) return;
    const key = `${word.level}:${word.word.toLowerCase()}`;
    if (seen.has(key) || result.CET4.length + result.CET6.length >= MAX_CUSTOM_WORDS) return;
    seen.add(key);
    result[word.level].push(word);
  });
  return result;
}

function normalizeCustomStore(raw) {
  if (!raw || typeof raw !== 'object') return { CET4: [], CET6: [] };
  const combined = [
    ...(Array.isArray(raw.CET4) ? raw.CET4.map(word => ({ ...word, level: 'CET4' })) : []),
    ...(Array.isArray(raw.CET6) ? raw.CET6.map(word => ({ ...word, level: 'CET6' })) : []),
  ];
  return normalizeCustomWords(combined);
}

function mergeCustomStores(current, incoming) {
  const base = normalizeCustomStore(current);
  const next = normalizeCustomStore(incoming);
  const merged = { CET4: [], CET6: [] };
  ['CET4', 'CET6'].forEach(level => {
    const byWord = new Map();
    [...base[level], ...next[level]].forEach(word => byWord.set(word.word.toLowerCase(), word));
    merged[level] = Array.from(byWord.values()).slice(0, MAX_CUSTOM_WORDS);
  });
  return merged;
}

function mergeWithBuiltIn(words, customWords) {
  const byWord = new Set();
  const result = [];
  [...(words || []), ...(customWords || [])].forEach(word => {
    if (!word) return;
    const key = word.word
      ? `word:${String(word.word).toLowerCase()}`
      : word.id !== undefined && word.id !== null
        ? `id:${String(word.id)}`
        : '';
    if (!key) return;
    if (byWord.has(key)) return;
    byWord.add(key);
    result.push(word);
  });
  return result;
}

module.exports = {
  MAX_CUSTOM_WORDS,
  normalizeCustomWord,
  normalizeCustomWords,
  normalizeCustomStore,
  mergeCustomStores,
  mergeWithBuiltIn,
};
