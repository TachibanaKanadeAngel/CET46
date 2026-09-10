const fs = require('fs');
const path = require('path');

function verifyLevel(levelDir) {
  const lettersDir = path.join(__dirname, '..', 'miniprogram', 'packages', levelDir, 'letters');
  const files = fs.readdirSync(lettersDir).filter(f => f.endsWith('.js') && f !== 'index.js');
  let total = 0;
  for (const f of files) {
    const p = path.join(lettersDir, f);
    const s = fs.readFileSync(p, 'utf8');
    const arrStart = s.indexOf('[');
    const arrEnd = s.lastIndexOf(']');
    if (arrStart === -1 || arrEnd === -1 || arrEnd <= arrStart) {
      console.error(`[verify] ${levelDir}/${f} 格式异常`);
      continue;
    }
    const arr = JSON.parse(s.slice(arrStart, arrEnd + 1));
    const hasPhonetic = arr.some(w => 'phonetic' in w);
    console.log(`[verify] ${levelDir}/${f}: ${arr.length} words, phonetic=${hasPhonetic}`);
    total += arr.length;
  }

  const indexPath = path.join(lettersDir, 'index.js');
  const indexSource = fs.readFileSync(indexPath, 'utf8');
  console.log(`[verify] ${levelDir} total from files: ${total}, index imports: ${(indexSource.match(/require\(/g) || []).length}`);
}

verifyLevel('level4');
verifyLevel('level6');
console.log('[verify] done');
