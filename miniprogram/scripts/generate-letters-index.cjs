// 生成 packages/level4/letters/index.js 与 packages/level6/letters/index.js
// 两个文件仅注释中的 LEVEL 标识不同，避免手工维护出现漂移。

const fs = require('fs');
const path = require('path');

const LEVELS = ['level4', 'level6'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

function generateContent(level) {
  const upperLevel = level.toUpperCase();
  const requires = LETTERS.map(letter => `const { WORDS_${letter.toUpperCase()} } = require('./${letter}.js');`).join('\n');
  const items = LETTERS.map(letter => `  WORDS_${letter.toUpperCase()}`).join(',\n');

  return `// ${upperLevel} 词库聚合（按首字母分片）
// 本文件由 scripts/generate-letters-index.cjs 自动生成，请勿手工修改。

${requires}

const WORDS = [
${items}
].reduce((all, words) => all.concat(words), []);

module.exports = { WORDS };
`;
}

function main() {
  const root = path.resolve(__dirname, '..');
  for (const level of LEVELS) {
    const target = path.join(root, 'packages', level, 'letters', 'index.js');
    const content = generateContent(level);
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Generated ${target}`);
  }
}

main();
