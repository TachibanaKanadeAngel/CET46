const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '../public/data/vocab.json'), 'utf8');
const data = JSON.parse(raw);
const words = data.words;

const level4 = words.filter(w => w.level === 'CET4');
const level6 = words.filter(w => w.level === 'CET6');

function generateFile(wordsList, level) {
  return `// CET${level} 词库数据（自动从 public/data/vocab.json 生成）\n// 该文件位于分包内，按需加载\nconst WORDS = ${JSON.stringify(wordsList)};\n\nmodule.exports = { WORDS };\n`;
}

fs.writeFileSync(path.join(__dirname, '../miniprogram/packages/level4/words.js'), generateFile(level4, 4));
fs.writeFileSync(path.join(__dirname, '../miniprogram/packages/level6/words.js'), generateFile(level6, 6));

console.log('CET4:', level4.length, 'CET6:', level6.length);
console.log('level4 size:', (fs.statSync(path.join(__dirname, '../miniprogram/packages/level4/words.js')).size / 1024).toFixed(2), 'KB');
console.log('level6 size:', (fs.statSync(path.join(__dirname, '../miniprogram/packages/level6/words.js')).size / 1024).toFixed(2), 'KB');
