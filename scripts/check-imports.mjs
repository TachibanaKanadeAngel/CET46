import { readdir, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

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

const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const STATIC_IMPORT_RE = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;

const errors = [];
const warnings = [];

async function getAllJsFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...await getAllJsFiles(fullPath));
      } else if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (e) {}
  return files;
}

function resolveImportPath(importerPath, importPath) {
  if (importPath.includes('?worker') || importPath.includes('?inline')) {
    importPath = importPath.split('?')[0];
  }
  if (importPath.startsWith('.')) {
    let resolved = resolve(dirname(importerPath), importPath);
    try { statSync(resolved); return resolved; } catch {}
    if (resolved.endsWith('.js')) {
      const tsPath = resolved.slice(0, -3) + '.ts';
      try { statSync(tsPath); return tsPath; } catch {}
    }
    for (const ext of ['.js', '.ts', '.mjs', '/index.js', '/index.ts']) {
      try { statSync(resolved + ext); return resolved + ext; } catch {}
    }
    return null;
  }
  return 'external';
}

import { statSync } from 'node:fs';

async function checkFile(filePath) {
  const content = await import('node:fs').then(fs => fs.promises.readFile(filePath, 'utf-8'));
  const relativePath = filePath.replace(ROOT + '\\', '').replace(ROOT + '/', '');

  if (isSuppressed(relativePath, 'check-imports')) return;

  let match;
  DYNAMIC_IMPORT_RE.lastIndex = 0;
  while ((match = DYNAMIC_IMPORT_RE.exec(content)) !== null) {
    const importPath = match[1];
    const resolved = resolveImportPath(filePath, importPath);
    if (resolved === null) {
      errors.push(`${relativePath}: 动态导入 "${importPath}" 目标文件不存在`);
    }
  }

  STATIC_IMPORT_RE.lastIndex = 0;
  while ((match = STATIC_IMPORT_RE.exec(content)) !== null) {
    const importPath = match[1];
    const resolved = resolveImportPath(filePath, importPath);
    if (resolved === null) {
      errors.push(`${relativePath}: 静态导入 "${importPath}" 目标文件不存在`);
    }
  }
}

async function main() {
  console.log('🔍 检查所有导入路径...\n');

  const jsDir = join(ROOT, 'js');
  const files = await getAllJsFiles(jsDir);

  for (const file of files) {
    await checkFile(file);
  }

  if (errors.length > 0) {
    console.error('❌ 发现无效导入路径:\n');
    errors.forEach(e => console.error(`  ${e}`));
    process.exit(1);
  } else {
    console.log(`✅ 所有导入路径验证通过 (${files.length} 个文件)`);
  }
}

main();
