import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const GARBLED_PATTERNS = [
  '???',
  '锟斤拷',
  '\ufffd',
  '瀹',
  '鐨',
  '鍜',
  '搴',
  '淇',
  '绛',
  '瑙',
  '濂'
];

function getFiles(globs) {
  return globs.flatMap((g) => {
    const result = execSync(`git --no-pager ls-files -- "${g}"`, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return result ? result.split('\n').map((f) => join(root, f)) : [];
  });
}

const files = getFiles(['index.html', 'README.md', 'js/**/*.js', 'css/**/*.css']);

if (files.length === 0) {
  console.log('⚠ 未找到待扫描文件');
  process.exit(0);
}

console.log(`扫描 ${files.length} 个文件，检查 ${GARBLED_PATTERNS.length} 个乱码模式...\n`);

let foundCount = 0;

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf-8');
  } catch {
    console.warn(`  ⚠ 无法读取: ${file}`);
    continue;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of GARBLED_PATTERNS) {
      if (line.includes(pattern)) {
        foundCount++;
        const relativePath = file.replace(root + '/', '').replace(root + '\\', '');
        const snippet = line.trim().substring(0, 120);
        console.error(`  ❌ ${relativePath}:${i + 1}  模式 "${pattern}"`);
        console.error(`     ${snippet}`);
        break;
      }
    }
  }
}

if (foundCount > 0) {
  console.error(`\n发现 ${foundCount} 处疑似乱码`);
  process.exit(1);
}

console.log('✅ 未发现乱码');