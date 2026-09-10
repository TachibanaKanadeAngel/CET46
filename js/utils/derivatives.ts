// 词根词缀 / 派生词（“学1记N”）工具
// 根据常见前缀/后缀推导一个单词的词根，把同词根词归入同一“词族”，
// 便于在学习页展示同族派生词，实现“学1记N”。纯函数、无 DOM 依赖。
// 前缀/后缀与 miniprogram/utils/multi-modal.js 及 backfill-examples.cjs 保持一致。

export interface WordLike {
  word: string;
  [key: string]: unknown;
}

const PREFIXES = ['anti','auto','co','com','con','de','dis','em','en','ex','extra','fore',
  'im','in','inter','intra','macro','micro','mis','multi','non','over','post','pre','pro',
  're','sub','super','trans','tri','un','under'].sort((a, b) => b.length - a.length);

const SUFFIXES = ['able','ible','al','ance','ence','ant','ent','ate','ation','ition','dom',
  'ed','en','er','or','ful','fy','hood','ic','ical','ify','ing','ish','ism','ist','ity','ive',
  'ize','ise','less','like','ly','ment','ness','ous','ship','sion','tion','ward','wise','y']
  .sort((a, b) => b.length - a.length);

/** 推导一个单词的词根（e.g. 'international' -> 'national'，'happiness' -> 'happi'）。 */
export function getMorphologyRoot(wordText: string): string {
  if (!wordText || typeof wordText !== 'string') return '';
  const word = wordText.trim().toLowerCase();
  if (!word) return '';
  if (word.length < 5) return word;
  let remaining = word;
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length - p.length >= 3) {
      remaining = remaining.slice(p.length);
      break;
    }
  }
  for (const s of SUFFIXES) {
    if (remaining.endsWith(s) && remaining.length - s.length >= 2) {
      remaining = remaining.slice(0, -s.length);
      break;
    }
  }
  return remaining;
}

/** 构建“词根 -> 词族”索引，供一次索引、多次查询。 */
export function buildWordFamilyIndex(words: WordLike[] | null | undefined): Map<string, WordLike[]> {
  const index = new Map<string, WordLike[]>();
  for (const w of words || []) {
    if (!w || typeof w.word !== 'string' || !w.word.trim()) continue;
    const root = getMorphologyRoot(w.word);
    if (!root) continue;
    if (!index.has(root)) index.set(root, []);
    (index.get(root) as WordLike[]).push(w);
  }
  return index;
}

/** 获取一个单词的同族（同词根）词，默认排除自身。 */
export function getWordFamily(
  wordText: string,
  words: WordLike[],
  opts: { includeSelf?: boolean } = {}
): WordLike[] {
  const { includeSelf = false } = opts;
  const index = buildWordFamilyIndex(words);
  const root = getMorphologyRoot(wordText);
  const family = (index.get(root) || [])
    .filter(w => includeSelf || String(w.word).toLowerCase() !== String(wordText).toLowerCase());
  return family.sort((a, b) => String(a.word).localeCompare(String(b.word)));
}

/** 获取一个单词的同族派生形式汇总，便于学习页“学1记N”展示。 */
export function getWordDerivativeSummary(
  wordText: string,
  words: WordLike[]
): { root: string; total: number; counts: { total: number; siblings: number }; siblings: WordLike[] } {
  const root = getMorphologyRoot(wordText);
  const index = buildWordFamilyIndex(words);
  const family = index.get(root) || [];
  const siblings = family.filter(
    w => String(w.word).toLowerCase() !== String(wordText).toLowerCase()
  );
  return {
    root,
    total: family.length,
    counts: { total: family.length, siblings: siblings.length },
    siblings: siblings.sort((a, b) => String(a.word).localeCompare(String(b.word))),
  };
}

export default {
  getMorphologyRoot,
  buildWordFamilyIndex,
  getWordFamily,
  getWordDerivativeSummary,
};