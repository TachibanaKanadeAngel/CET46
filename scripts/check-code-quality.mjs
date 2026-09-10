import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';

const JS_DIR = 'js';
const SKIP_FILES = ['js/data/default_vocab.js'];
const SUPPRESSIONS_FILE = 'reports/check-logs/suppressions.json';
const GARBLED_PATTERNS = ['锟斤拷', '\ufffd'];
const GARBLED_CHAR_SET = new Set('瀹鐨鍜搴绛瑙濂');
const GARBLED_SEQUENCE_RE = new RegExp(`[${[...GARBLED_CHAR_SET].join('')}]{2,}`);
const TRIPLE_ASCII_QUESTION_RE = /\?{3,}/;
const MOJIBAKE_PHRASES = [
  '鍒濆鍖?', '鍔犺浇', '瀹€濮嬪垵濮嬪寲', '缁х画瀛︿範',
  '鐐瑰嚮浜?', '鎵ц鍔ㄤ綔', '娌℃湁瀵瑰簲鐨勫鐞嗗嚱鏁',
  '鏍煎紡瑙ｆ瀽澶辫触', '绾у埆锛?', '宸叉洿鏂帮紝椤甸潰',
  '鏈畾涔夛紒', '宸叉湁澶勭悊浠诲姟',
  '鍏堥殣钘忛鏋跺睆', '鍒濆 WORDS 闀垮害',
  'DEFAULT_WORDS 闀垮害', '璺宠繃鏃犳晥鍗曡瘝',
  '綃涢€夊悗鍗曡瘝', '瀛︿範宸插惎鍔?', '瀛︿範鍚姩澶辫触',
];

let totalIssues = 0;
let totalWarnings = 0;
const results = { critical: [], high: [], medium: [], low: [], info: [] };

// 加载抑制清单
function loadSuppressions() {
  if (existsSync(SUPPRESSIONS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(SUPPRESSIONS_FILE, 'utf-8'));
      return data.entries || [];
    } catch { return []; }
  }
  return [];
}

// 简单通配符匹配
function globMatch(pattern, str) {
  if (!pattern || !str) return false;
  if (pattern === str) return true;
  if (!pattern.includes('*') && !pattern.includes('?')) return pattern === str;
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  try { return new RegExp(`^${regexStr}$`).test(str); }
  catch { return false; }
}

// 检查文件是否被抑制
function isSuppressed(file, checkName) {
  const suppressions = loadSuppressions();
  return suppressions.some(s =>
    globMatch(s.pattern, file) && (s.check === checkName || s.check === 'all')
  );
}

function addIssue(severity, category, file, line, message) {
  // 检查SKIP_FILES
  if (SKIP_FILES.some(skip => file === skip || file.startsWith(skip.replace(/\/$/, '/')))) return;
  // 检查抑制清单
  if (isSuppressed(file, category)) return;
  const entry = { file, line, message };
  results[severity].push(entry);
  if (severity === 'critical' || severity === 'high') totalIssues++;
  else if (severity === 'medium') totalWarnings++;
  else totalWarnings++;
}

function getAllJsFiles(dir) {
  const files = [];
  function walk(d) {
    try {
      const entries = readdirSync(d);
      for (const entry of entries) {
        const fullPath = join(d, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          walk(fullPath);
        } else if (extname(entry) === '.js' || extname(entry) === '.ts') {
          // 跳过SKIP_FILES中的文件
          const relPath = relative('.', fullPath).replace(/\\/g, '/');
          if (!SKIP_FILES.includes(relPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (e) {}
  }
  walk(dir);
  return files;
}

function checkConsoleUsage(content, file) {
  const lines = content.split('\n');
  if (file.endsWith('utils/logger.js') || file.endsWith('utils/logger.ts')) return;
  if (file.includes('data/')) return;
  const isWorker = file.includes('workers/');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//')) continue;
    const match = line.match(/console\.(log|error|warn|info|debug)\(/);
    if (match) {
      if (isWorker) {
        addIssue('info', 'console.* in Worker', file, i + 1, `Worker 中使用 console.${match[1]}()（架构限制，可接受）`);
      } else {
        addIssue('high', 'console.* 未替换', file, i + 1, `应替换为 logger.${match[1] === 'log' ? 'info' : match[1]}()`);
      }
    }
  }
}

function checkEmptyCatch(content, file) {
  if (file.includes('data/')) return;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/\bcatch\s*\([^)]*\)\s*\{\s*\}/.test(lines[i])) {
      addIssue('medium', '空 catch 块', file, i + 1, 'catch 块为空，错误被静默吞没');
    }
  }
}

function checkDynamicImportNoCatch(content, file) {
  if (file.includes('data/')) return;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/import\([^)]+\)\.then\(/.test(line)) {
      let hasCatch = false;
      for (let j = i; j < Math.min(i + 60, lines.length); j++) {
        if (/\.catch\(/.test(lines[j])) { hasCatch = true; break; }
        if (/^\s*\}\s*[,;]\s*$/.test(lines[j]) && !hasCatch) break;
      }
      if (!hasCatch) {
        addIssue('high', '动态 import 无 .catch()', file, i + 1, 'import().then() 缺少 .catch() 错误处理');
      }
    }
  }
}

function checkDomNullSafety(content, file) {
  if (file.includes('data/')) return;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/document\.getElementById\([^)]+\)\.(classList|style)\b/.test(line) &&
        !line.includes('&&') && !line.includes('?.') &&
        !line.includes('if (') && !line.includes('if(')) {
      addIssue('high', 'DOM null 安全', file, i + 1, 'getElementById() 结果未做 null 检查直接访问 .classList/.style');
    }
  }
}

function checkMojibake(content, file) {
  if (file.includes('data/')) return;
  const lines = content.split('\n');
  const isGarbledDetector = file.endsWith('main.js') || file.endsWith('ui-repair.js');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isGarbledDetector && (line.includes('CORRUPTED_GARBLED_PATTERN') || line.includes('GARBLED_CHAR_SET') || line.includes('hasCorruptedPlaceholderText'))) continue;
    if (line.includes('GARBLED') || line.includes('garbled') || line.includes('CORRUPTED')) continue;
    if (TRIPLE_ASCII_QUESTION_RE.test(line) && !line.includes('regex') && !line.includes('RegExp') && !line.includes('match') && !line.includes('test')) {
      addIssue('critical', '乱码文本', file, i + 1, '检测到 ??? 模式，可能为 UTF-8 编码损坏');
    }
    if (GARBLED_SEQUENCE_RE.test(line)) {
      addIssue('critical', '乱码文本', file, i + 1, '检测到连续乱码字符（瀹鐨鍜搴绛瑙濂）');
    }
    for (const phrase of MOJIBAKE_PHRASES) {
      if (line.includes(phrase)) {
        addIssue('critical', 'mojibake 乱码', file, i + 1, `检测到 mojibake 编码错误文本: ${phrase}`);
        break;
      }
    }
  }
}

function checkLoggerImport(content, file) {
  if (file.includes('data/') || file.includes('workers/')) return;
  const usesLogger = /logger\.(info|error|warn|debug)\(/.test(content);
  const hasImport = /import logger from/.test(content);
  const isLogger = file.endsWith('utils/logger.js');
  if (usesLogger && !hasImport && !isLogger) {
    addIssue('high', '缺少 logger 导入', file, 1, '使用了 logger.* 但未导入 logger 模块');
  }
}

function checkConfigImport(content, file) {
  if (file.includes('data/')) return;
  const usesConfig = /\bCONFIG\b/.test(content) && !/CONFIG\s*=/.test(content.split('\n')[0]);
  const hasImport = /import.*CONFIG.*from/.test(content);
  const isConfig = file.endsWith('config.js');
  const hasDefine = /export.*CONFIG/.test(content);
  if (usesConfig && !hasImport && !isConfig && !hasDefine) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\bCONFIG\b/.test(lines[i]) && !lines[i].includes('import')) {
        addIssue('medium', 'CONFIG 未导入', file, i + 1, '使用了 CONFIG 但未导入');
        break;
      }
    }
  }
}

function checkDuplicateImports(content, file) {
  if (file.includes('data/')) return;
  const importMap = {};
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/import\s+.*from\s+['"]([^'"]+)['"]/);
    if (match) {
      const source = match[1];
      if (importMap[source]) {
        addIssue('medium', '重复导入', file, i + 1, `'${source}' 被导入了两次（首次在第 ${importMap[source]} 行）`);
      } else {
        importMap[source] = i + 1;
      }
    }
  }
}

function checkHardcodedTotalVocab(content, file) {
  if (file.includes('data/') || file.includes('workers/')) return;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/\b6662\b/.test(lines[i]) && !lines[i].includes('TOTAL_VOCAB_COUNT') && !lines[i].includes('CONFIG')) {
      addIssue('medium', '硬编码词库总数', file, i + 1, '硬编码 6662，应使用 CONFIG.CONSTANTS.TOTAL_VOCAB_COUNT');
    }
  }
}

const checks = [
  { name: 'console.* 未替换为 logger', fn: checkConsoleUsage },
  { name: '空 catch 块', fn: checkEmptyCatch },
  { name: '动态 import 无 .catch()', fn: checkDynamicImportNoCatch },
  { name: 'DOM null 安全', fn: checkDomNullSafety },
  { name: '乱码/mojibake 文本', fn: checkMojibake },
  { name: '缺少 logger 导入', fn: checkLoggerImport },
  { name: 'CONFIG 未导入', fn: checkConfigImport },
  { name: '重复导入', fn: checkDuplicateImports },
  { name: '硬编码词库总数', fn: checkHardcodedTotalVocab },
];

console.log('🔍 CET46 全面代码质量检查');
console.log('='.repeat(60));

const files = getAllJsFiles(JS_DIR);
console.log(`扫描 ${files.length} 个 JS 文件...\n`);

for (const file of files) {
  const relPath = relative('.', file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  for (const check of checks) {
    check.fn(content, relPath);
  }
}

const severityLabels = {
  critical: '🔴 严重',
  high: '🟠 高',
  medium: '🟡 中',
  low: '🔵 低',
  info: '⚪ 信息'
};

let hasOutput = false;
for (const [severity, label] of Object.entries(severityLabels)) {
  const items = results[severity];
  if (items.length === 0) continue;
  hasOutput = true;
  console.log(`\n${label} (${items.length} 项)`);
  console.log('-'.repeat(50));
  for (const item of items) {
    console.log(`  ${item.file}:${item.line} — ${item.message}`);
  }
}

console.log('\n' + '='.repeat(60));
if (!hasOutput) {
  console.log('✅ 所有检查项通过，未发现问题');
} else {
  const criticalCount = results.critical.length;
  const highCount = results.high.length;
  const mediumCount = results.medium.length;
  const infoCount = results.info.length + results.low.length;
  console.log(`汇总: 严重 ${criticalCount} | 高 ${highCount} | 中 ${mediumCount} | 信息 ${infoCount}`);
  if (criticalCount > 0 || highCount > 0) {
    console.log('\n❌ 存在需要修复的问题');
    process.exit(1);
  } else {
    console.log('\n⚠️ 仅有中/低级别问题，无阻塞性错误');
  }
}
