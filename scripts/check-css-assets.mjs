import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 抑制配置
const SUPPRESSIONS_FILE = join(ROOT, 'reports/check-logs/suppressions.json');

function loadSuppressions() {
  try {
    if (existsSync(SUPPRESSIONS_FILE)) {
      const data = JSON.parse(readFileSync(SUPPRESSIONS_FILE, 'utf-8'));
      return data.entries || [];
    }
  } catch {}
  return [];
}

function globMatch(pattern, str) {
  if (!pattern || !str) return false;
  if (pattern === str) return true;
  if (!pattern.includes('*') && !pattern.includes('?')) return pattern === str;
  const regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  try { return new RegExp(`^${regexStr}$`).test(str); }
  catch { return false; }
}

function isSuppressed(file, checkName) {
  const suppressions = loadSuppressions();
  return suppressions.some(s => globMatch(s.pattern, file) && (s.check === checkName || s.check === 'all'));
}

const CSS_URL_RE = /url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/g;

const errors = [];
const warnings = [];

async function getAllCssFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...await getAllCssFiles(fullPath));
      } else if (entry.isFile() && /\.css$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

function resolveCssPath(cssFilePath, assetPath) {
  if (assetPath.startsWith('data:') || assetPath.startsWith('http:') || assetPath.startsWith('https:')) {
    return 'external';
  }
  return resolve(dirname(cssFilePath), assetPath);
}

async function checkFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = filePath.replace(ROOT + '\\', '').replace(ROOT + '/', '');

  if (isSuppressed(relativePath, 'check-css-assets')) return;

  let match;
  CSS_URL_RE.lastIndex = 0;
  while ((match = CSS_URL_RE.exec(content)) !== null) {
    const assetPath = match[1];
    const resolved = resolveCssPath(filePath, assetPath);
    if (resolved !== 'external' && !existsSync(resolved)) {
      const relAsset = assetPath.length > 60 ? assetPath.substring(0, 57) + '...' : assetPath;
      errors.push(`${relativePath}: 引用资源不存在 "${relAsset}"`);
    }
  }
}

async function main() {
  console.log('🔍 检查所有 CSS 资源引用...\n');

  const cssDir = join(ROOT, 'css');
  const files = await getAllCssFiles(cssDir);

  for (const file of files) {
    await checkFile(file);
  }

  if (errors.length > 0) {
    console.error('❌ 发现无效资源引用:\n');
    errors.forEach(e => console.error(`  ${e}`));
    process.exit(1);
  } else {
    console.log(`✅ 所有 CSS 资源引用验证通过 (${files.length} 个文件)`);
  }
}

main();
