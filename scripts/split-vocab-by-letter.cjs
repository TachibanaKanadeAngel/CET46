const fs = require('fs');
const path = require('path');

const vocabPath = path.resolve(__dirname, '..', 'public', 'data', 'vocab.json');
const sourceWords = JSON.parse(fs.readFileSync(vocabPath, 'utf-8')).words;

function splitLevel(levelDir, level) {
  const root = path.resolve(__dirname, '..', 'miniprogram', 'packages', levelDir);
  const wordsPath = path.join(root, 'words.js');
  const lettersDir = path.join(root, 'letters');
  fs.mkdirSync(lettersDir, { recursive: true });

  const WORDS = sourceWords.filter(word => word.level === level);
  console.log(`[split] ${levelDir} total words:`, WORDS.length);

  // Group by first letter (case-insensitive, fallback to # for non-alpha)
  const groups = {};
  for (const w of WORDS) {
    const first = w.word ? String(w.word).trim().charAt(0).toLowerCase() : '#';
    const key = /^[a-z]$/.test(first) ? first : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }

  const letters = Object.keys(groups).sort();
  const indexImports = [];
  const indexArrays = [];

  for (const letter of letters) {
    const list = groups[letter];
    const fileName = `${letter}.js`;
    const filePath = path.join(lettersDir, fileName);
    const content = `// ${levelDir.toUpperCase()} 词库：以 "${letter.toUpperCase()}" 开头（${list.length} 词）\n` +
      `const WORDS_${letter.toUpperCase()} = ${JSON.stringify(list, null, 2)};\n\n` +
      `module.exports = { WORDS_${letter.toUpperCase()} };\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[split] ${levelDir}/letters/${fileName}: ${list.length} words`);
    indexImports.push(`const { WORDS_${letter.toUpperCase()} } = require('./${fileName}');`);
    indexArrays.push(`WORDS_${letter.toUpperCase()}`);
  }

  // Write letters/index.js
  const indexContent = `// ${levelDir.toUpperCase()} 词库聚合（按首字母分片）\n` +
    `// 自动从 public/data/vocab.json 生成\n\n` +
    indexImports.join('\n') + '\n\n' +
    `const WORDS = [\n  ${indexArrays.join(',\n  ')}\n].reduce((all, words) => all.concat(words), []);\n\n` +
    `module.exports = { WORDS };\n`;
  fs.writeFileSync(path.join(lettersDir, 'index.js'), indexContent, 'utf-8');
  console.log(`[split] ${levelDir}/letters/index.js written`);

  // Replace words.js with a thin re-export so existing requires keep working
  const reexportContent = `// ${levelDir.toUpperCase()} 词库入口\n` +
    `// 当前按首字母分片加载，入口统一导出 WORDS\n\n` +
    `module.exports = require('./letters/index.js');\n`;
  fs.writeFileSync(wordsPath, reexportContent, 'utf-8');
  console.log(`[split] ${levelDir}/words.js replaced with re-export`);
}

splitLevel('level4', 'CET4');
splitLevel('level6', 'CET6');
console.log('[split] done');
