// 46英语 - 多维多题型生成与词根词缀智能解构引擎 (Multi-Modal Learning & Etymology Engine)

const COMMON_PREFIXES = [
  { prefix: 'anti', meaning: '反对/抗' },
  { prefix: 'auto', meaning: '自动/自己' },
  { prefix: 'co', meaning: '共同/一起' },
  { prefix: 'com', meaning: '共同/完全' },
  { prefix: 'con', meaning: '共同/加强' },
  { prefix: 'de', meaning: '向下/去除/否定' },
  { prefix: 'dis', meaning: '否定/分离' },
  { prefix: 'em', meaning: '使进入/使具有' },
  { prefix: 'en', meaning: '使成为/置于...之中' },
  { prefix: 'ex', meaning: '向外/前任' },
  { prefix: 'extra', meaning: '额外的/超越' },
  { prefix: 'fore', meaning: '在前/预先' },
  { prefix: 'im', meaning: '不/向内' },
  { prefix: 'in', meaning: '不/向内' },
  { prefix: 'inter', meaning: '在...之间/相互' },
  { prefix: 'intra', meaning: '在...内部' },
  { prefix: 'macro', meaning: '宏观/巨大' },
  { prefix: 'micro', meaning: '微观/微小' },
  { prefix: 'mis', meaning: '错误/不当' },
  { prefix: 'multi', meaning: '多/多元' },
  { prefix: 'non', meaning: '非/不' },
  { prefix: 'over', meaning: '过度/在上' },
  { prefix: 'post', meaning: '在...之后' },
  { prefix: 'pre', meaning: '在...之前/预先' },
  { prefix: 'pro', meaning: '向前/支持' },
  { prefix: 're', meaning: '再次/向后/反对' },
  { prefix: 'sub', meaning: '在...之下/次级' },
  { prefix: 'super', meaning: '超级/在上' },
  { prefix: 'trans', meaning: '穿过/转换' },
  { prefix: 'tri', meaning: '三' },
  { prefix: 'un', meaning: '不/解开' },
  { prefix: 'under', meaning: '在...之下/不足' },
];

const COMMON_SUFFIXES = [
  { suffix: 'able', pos: 'adj', meaning: '可...的/能...的' },
  { suffix: 'ible', pos: 'adj', meaning: '可...的/易...的' },
  { suffix: 'al', pos: 'adj/n', meaning: '...的/人或物' },
  { suffix: 'ance', pos: 'n', meaning: '性质/状态/行为' },
  { suffix: 'ence', pos: 'n', meaning: '性质/状态/行为' },
  { suffix: 'ant', pos: 'n/adj', meaning: '...的人/...的' },
  { suffix: 'ent', pos: 'n/adj', meaning: '...的人/...的' },
  { suffix: 'ate', pos: 'v/adj', meaning: '使成为/...的' },
  { suffix: 'ation', pos: 'n', meaning: '行为/过程/结果' },
  { suffix: 'ition', pos: 'n', meaning: '行为/过程/结果' },
  { suffix: 'dom', pos: 'n', meaning: '领域/状态' },
  { suffix: 'ed', pos: 'adj', meaning: '有...的/被...的' },
  { suffix: 'en', pos: 'v/adj', meaning: '使变成/由...制成' },
  { suffix: 'er', pos: 'n', meaning: '...的人或物' },
  { suffix: 'or', pos: 'n', meaning: '...的人或物' },
  { suffix: 'ful', pos: 'adj', meaning: '充满...的/具有...倾向' },
  { suffix: 'fy', pos: 'v', meaning: '使...化/变成' },
  { suffix: 'hood', pos: 'n', meaning: '时期/身份/状态' },
  { suffix: 'ic', pos: 'adj', meaning: '...的/与...有关的' },
  { suffix: 'ical', pos: 'adj', meaning: '...的/学术的' },
  { suffix: 'ify', pos: 'v', meaning: '使成为/使化' },
  { suffix: 'ing', pos: 'adj/n', meaning: '正在...的/行业' },
  { suffix: 'ish', pos: 'adj', meaning: '稍微...的/如...的' },
  { suffix: 'ism', pos: 'n', meaning: '主义/学说/特征' },
  { suffix: 'ist', pos: 'n', meaning: '...家/主义者' },
  { suffix: 'ity', pos: 'n', meaning: '性质/状态' },
  { suffix: 'ive', pos: 'adj', meaning: '有...倾向的/具有...性质' },
  { suffix: 'ize', pos: 'v', meaning: '使...化' },
  { suffix: 'ise', pos: 'v', meaning: '使...化' },
  { suffix: 'less', pos: 'adj', meaning: '无...的/不具有...的' },
  { suffix: 'like', pos: 'adj', meaning: '像...一样的' },
  { suffix: 'ly', pos: 'adv/adj', meaning: '...地/...的' },
  { suffix: 'ment', pos: 'n', meaning: '行为/结果/手段' },
  { suffix: 'ness', pos: 'n', meaning: '性质/状态' },
  { suffix: 'ous', pos: 'adj', meaning: '充满...的/具有...特征' },
  { suffix: 'ship', pos: 'n', meaning: '身份/关系/技能' },
  { suffix: 'sion', pos: 'n', meaning: '行为/状态/结果' },
  { suffix: 'tion', pos: 'n', meaning: '行为/状态/结果' },
  { suffix: 'ward', pos: 'adv/adj', meaning: '向...的/朝...' },
  { suffix: 'wise', pos: 'adv', meaning: '在...方面/像...一样' },
  { suffix: 'y', pos: 'adj/n', meaning: '多...的/状态' },
];

/**
 * 常见拉丁/希腊词根 → 词根义（让"词根拆解"给出真实语义，而非笼统的"核心词根"）
 * 词根义面向学习者记忆启发，标"~"表示需结合整词灵活理解。
 */
const COMMON_ROOTS = {
  act: '做/行动',
  aud: '听', audi: '听',
  bio: '生命/生物',
  cap: '头/容纳', capt: '抓/拿', ceive: '拿/接收',
  cept: '拿/接收', cide: '杀/切', clude: '关闭/包含',
  cord: '心', cred: '相信',
  cult: '耕种/培养', cycle: '圆圈/循环',
  dic: '说/言', dict: '说/宣布',
  doct: '教/指导', duc: '引导/带领', duct: '引导/传导',
  fact: '做/制造', fer: '带来/携带',
  fin: '结束/边界', fix: '固定',
  form: '形状/形成', fort: '强壮',
  gen: '产生/种族', gest: '携带/运送',
  grad: '步/级', graph: '写/记录',
  greg: '群体/聚集', hydr: '水' , hydro: '水',
  ject: '投/扔', jud: '判断',
  junct: '连接', jur: '法律/誓言',
  labor: '劳动', lect: '选择/收集/读',
  leg: '法律/读/派送', liber: '自由',
  ling: '语言', log: '说/学/理性',
  lum: '光', man: '手', mand: '命令/委托',
  medi: '中间', memor: '记忆',
  ment: '心智/思考', merc: '交易/商业',
  mobil: '移动' , mov: '移动', mot: '移动',
  nat: '出生/民族', nomen: '名称', nomin: '名称',
  not: '知道/标记', nov: '新',
  ocul: '眼', opt: '光/选择',
  path: '情感/痛苦/疾病', patr: '父亲/祖国',
  ped: '脚/儿童', pend: '悬挂/支付',
  phon: '声音', photo: '光',
  plic: '折叠', port: '携带/港口',
  pos: '放置', press: '压',
  quee: '抓/询问', quer: '询问', qui: '询问/安静',
  rect: '直的/公正', rupt: '打破/破裂',
  scend: '攀爬', sci: '知道/科学',
  scrib: '写', script: '写',
  sect: '切割', sent: '感觉/赞同',
  sequ: '跟随', serv: '保留/服务',
  sign: '标记/签字', soci: '社会/同伴',
  sol: '独自/太阳', spect: '看',
  spir: '呼吸', struct: '建造/结构',
  stud: '学习/专注', tact: '接触', tail: '切割/尾部',
  ten: '持有', tend: '伸展/倾向',
  term: '边界/期限', terr: '土地/恐惧',
  test: '见证/测试', text: '编织/文本',
  tract: '拖拽/吸引', trib: '给予/部落',
  turb: '搅动/混乱', uni: '单一',
  vac: '空', ven: '来', vert: '转/翻转',
  vid: '看', vis: '看', vit: '生命',
  viv: '生活/活', voc: '声音/呼唤', 
  vol: '意愿/回转', volt: '轮/转',
};

/**
 * 谐音助记词典（P0-3 / D 谐音）——来自中文教育经典的"谐音巧记"法（对齐 XWORDS 思路）
 * 结构：word → { sound: 谐音注音, hook: 串联联想口诀 }
 * 承诺"精确、可记忆"：谐音尽量贴近词音，口诀紧扣词义，而非生硬空耳
 * 后续可经脚本从公开谐音词库批量扩量（此处作为首版浓缩样板）。
 */
const HOMOPHONE_MNEMONICS = {
  ambulance: { sound: '俺不能死', hook: '俺不能死，快叫救护车' },
  ambition: { sound: '俺必胜', hook: '志在必胜的雄心抱负' },
  grammar: { sound: '格来默', hook: '语法规则要"格来默"记' },
  pest: { sound: '拍死它', hook: '害虫？直接拍死它' },
  agony: { sound: '爱过你', hook: '爱过你却分手，很痛苦' },
  economy: { sound: '一抠门', hook: '抠门算计，就是经济' },
  cheese: { sound: '气死', hook: '吃货为这块奶酪气得跺脚' },
  olive: { sound: '橄榄', hook: '橄榄(olive)是橄榄绿' },
  bury: { sound: '败里', hook: '把悲伤埋进土里' },
  onion: { sound: '挖你眼', hook: '切洋葱辣得"挖你眼"流泪' },
  sponge: { sound: '吸蓬', hook: '海绵蓬松能吸水' },
  moon: { sound: '沐恩', hook: '满月如"沐恩"，惠泽夜路' },
  knock: { sound: '闹克', hook: '敲门"闹克闹克"响' },
  dirty: { sound: '打衣', hook: '衣服打脏了，真脏(打衣)' },
  angry: { sound: '昂鬼', hook: '生气的"昂鬼"，怒发冲冠' },
  mirror: { sound: '眯着', hook: '对着镜子眯着眼端详' },
};

/**
 * 拆解单词的词根词缀 (共享前缀/后缀匹配逻辑)
 * 返回 { prefix, root, suffix, matched } 供形态分析与词族推导复用
 */
function extractMorphology(wordText) {
  if (!wordText || typeof wordText !== 'string') return { root: '', matched: false };
  const word = wordText.trim().toLowerCase();
  if (word.length < 5) return { root: word, matched: false };

  let matchedPrefix = null;
  let matchedSuffix = null;
  let remaining = word;

  // 匹配前缀 (优先最长匹配)
  const sortedPrefixes = [...COMMON_PREFIXES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const item of sortedPrefixes) {
    if (word.startsWith(item.prefix) && word.length - item.prefix.length >= 3) {
      matchedPrefix = item;
      remaining = remaining.slice(item.prefix.length);
      break;
    }
  }

  // 匹配后缀 (优先最长匹配)
  const sortedSuffixes = [...COMMON_SUFFIXES].sort((a, b) => b.suffix.length - a.suffix.length);
  for (const item of sortedSuffixes) {
    if (remaining.endsWith(item.suffix) && remaining.length - item.suffix.length >= 2) {
      matchedSuffix = item;
      remaining = remaining.slice(0, -item.suffix.length);
      break;
    }
  }

  return {
    word,
    prefix: matchedPrefix ? matchedPrefix.prefix : '',
    suffix: matchedSuffix ? matchedSuffix.suffix : '',
    root: remaining,
    matched: Boolean(matchedPrefix || matchedSuffix),
  };
}

/**
 * 获取单词的核心词根 (去除前后缀后的词干)
 * @param {string} wordText
 * @returns {string} 词根本体；未匹配前后缀时返回原词 (小写)
 */
function getMorphologyRoot(wordText) {
  const { root } = extractMorphology(wordText);
  return root;
}

/**
 * 获取核心词根及其词根义（用于"词根拆解"的真实语义启发）
 * @param {string} wordText
 * @returns {{ root: string, meaning: string}} 未收录时 meaning 为 '核心词根'
 */
function getRootMeaning(wordText) {
  const root = getMorphologyRoot(wordText);
  return { root, meaning: COMMON_ROOTS[root] || '核心词根' };
}

/**
 * 智能拆解单词的词根词缀 (Morphology Breakdown)
 */
function analyzeMorphology(wordText) {
  const { word, prefix: prefixText, suffix: suffixText, root, matched } = extractMorphology(wordText);
  if (!word || !matched) return null;

  const matchedPrefix = COMMON_PREFIXES.find(p => p.prefix === prefixText) || null;
  const matchedSuffix = COMMON_SUFFIXES.find(s => s.suffix === suffixText) || null;

  const parts = [];
  if (matchedPrefix) {
    parts.push({ type: 'prefix', text: `${matchedPrefix.prefix}-`, meaning: matchedPrefix.meaning });
  }
  if (root) {
    parts.push({ type: 'root', text: root, meaning: COMMON_ROOTS[root] || '核心词根' });
  }
  if (matchedSuffix) {
    parts.push({ type: 'suffix', text: `-${matchedSuffix.suffix}`, meaning: matchedSuffix.meaning });
  }

  if (parts.length === 0) return null;
  return {
    word: wordText,
    parts,
    summary: parts.map(p => `${p.text} (${p.meaning})`).join(' + '),
  };
}

/**
 * 查找同根词族 (共享核心词根的其它单词)
 * 落实"学词族而非孤立单词"：同根词互相提示，举一反三
 * @param {Object} currentWord 当前单词 { id, word }
 * @param {Array} words 词库
 * @param {number} [limit=6]
 * @returns {Array} 同根词列表 [{ word, meaning, phonetic }]
 */
function findWordFamily(currentWord, words, limit = 6) {
  if (!currentWord || !currentWord.word || !Array.isArray(words)) return [];
  const root = getMorphologyRoot(currentWord.word);
  // 词根过短（<3）时无意义，不推导词族
  if (!root || root.length < 3) return [];
  const selfId = String(currentWord.id);
  const family = [];
  const seen = new Set();
  for (const candidate of words) {
    if (!candidate || !candidate.word) continue;
    const cid = String(candidate.id);
    if (cid === selfId) continue;
    const lower = String(candidate.word).toLowerCase();
    if (getMorphologyRoot(candidate.word) === root) {
      // 仅保留词干不同、避免重复词形
      const key = lower;
      if (seen.has(key)) continue;
      seen.add(key);
      family.push({
        id: candidate.id,
        word: candidate.word,
        phonetic: candidate.phonetic,
        meaning: candidate.meaning,
        root,
        rootMeaning: COMMON_ROOTS[root] || '',
      });
      if (family.length >= limit) break;
    }
  }
  // 按词长升序（词干越短越像"家族代表"）
  const sorted = family.sort((a, b) => a.word.length - b.word.length);
  // 附带统一的词根义（消除歧义、供页面展示一次）
  if (sorted.length) {
    (sorted as any).familyRoot = root;
    (sorted as any).familyRootMeaning = COMMON_ROOTS[root] || '';
  }
  return sorted;
}

/**
 * 从例句中提炼核心高频短语/搭配 (Collocation Extractor)
 */
function extractCollocations(wordText, example) {
  if (!wordText || !example) return [];
  const cleanWord = wordText.trim().toLowerCase();
  // 简易正则匹配包含该单词的 3~5 词短语
  const sentences = example.split(/[.?!;]/).filter(Boolean);
  const collocations = [];
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    const index = words.findIndex(w => w.toLowerCase().replace(/[^a-z]/g, '') === cleanWord);
    if (index !== -1) {
      const start = Math.max(0, index - 1);
      const end = Math.min(words.length, index + 3);
      const phrase = words.slice(start, end).join(' ').replace(/[.,!?;:"']/g, '').trim();
      if (phrase.length > cleanWord.length && phrase.split(' ').length >= 2) {
        collocations.push(phrase);
      }
    }
  }
  return collocations.slice(0, 2);
}

/**
 * 生成 4 选 1 辨义测验选项 (Multiple Choice Generator)
 * 确保干扰项来自同一词库、语义不重复
 */
function generateChoiceOptions(currentWord, allWords, count = 4) {
  if (!currentWord || !Array.isArray(allWords) || allWords.length === 0) {
    return [];
  }

  const correctMeaning = currentWord.meaning;
  const correctId = currentWord.id;

  // 过滤出与正确答案不重复的备选池
  const pool = allWords.filter(w => w.id !== correctId && w.meaning !== correctMeaning);

  // 随机乱序并挑选 count - 1 个干扰项
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, count - 1).map((w, idx) => ({
    id: `distractor_${idx}`,
    word: w.word,
    meaning: w.meaning,
    isCorrect: false,
  }));

  const correctOption = {
    id: `correct_${currentWord.id}`,
    word: currentWord.word,
    meaning: currentWord.meaning,
    isCorrect: true,
  };

  const options = [correctOption, ...distractors].sort(() => Math.random() - 0.5);
  return options;
}

// Fisher-Yates 原地洗牌
function shuffleArray(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 助记联想（学1记N）：把词根义 + 同根词族 熔成一条结构化记忆钩子
 * 仅当确有可联想信息时返回，否则返回空数组（避免无意义提示）
 * @param {object} word 词条 { word, meaning }
 * @param {object[]} [allWords] 参与词族聚合的当前词库
 * @returns {string[]} 记忆钩子行
 */
function getMnemonicHints(word, allWords) {
  if (!word || !word.word) return [];
  const mor = analyzeMorphology(word.word);
  const parts = (mor && mor.parts) || [];
  const rootPart = parts.find(p => p.type === 'root');
  const family = findWordFamily(word, allWords || [], 3);
  const hints = [];
  // 谐音助记优先（D 谐音不足的最直接补位）
  const hp = HOMOPHONE_MNEMONICS[String(word.word).toLowerCase()];
  if (hp) {
    hints.push(`谐音「${hp.sound}」→ ${hp.hook}`);
  }
  if (rootPart && rootPart.meaning && rootPart.meaning !== '核心词根') {
    hints.push(`词根「${rootPart.text}」表「${rootPart.meaning}」`);
  }
  if (family.length >= 2 && wordFamilyMeaningful(family, word.word)) {
    const others = family.filter(w => w.word !== word.word).slice(0, 2).map(w => w.word).join('、');
    if (others) {
      hints.push(`学1记N：与 ${others} 同根联动，一次记 ${family.length} 个词`);
    }
  }
  return hints;
}

function wordFamilyMeaningful(family, target) {
  if (!family || !family.length) return false;
  return family.some(w => w.word !== target);
}

/**
 * 造句排序（产出性练习）：把例句的英文切成词块并打乱，学习者按正确顺序重组
 * 仅当句子长度合适时开启（词数 ≥4 且 ≤12）
 * @param {string} wordText
 * @param {string} example 双语例句，英文在前
 * @returns {null|{answer: string[], bank: string[]}} 英文词块序列与打乱后的可选词块
 */
function createSentenceBuilding(wordText, example) {
  if (!wordText || !example) return null;
  const english = String(example)
    .split(/[（(]/)[0]
    .replace(/[。．！？!?;；,，…]/g, '')
    .trim();
  if (!english) return null;
  const tokens = english.split(/\s+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length < 4 || tokens.length > 12) return null;
  return {
    answer: tokens.slice(),
    bank: shuffleArray(tokens.slice()),
    english,
  };
}

module.exports = {
  analyzeMorphology,
  extractCollocations,
  generateChoiceOptions,
  getMorphologyRoot,
  getRootMeaning,
  findWordFamily,
  getMnemonicHints,
  createSentenceBuilding,
  HOMOPHONE_MNEMONICS,
};
