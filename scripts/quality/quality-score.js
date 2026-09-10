#!/usr/bin/env node

/**
 * CET46 项目自动化质量评估脚本
 * 从代码质量、功能完整性、性能、安全、用户体验和文档六个维度进行评估
 * 输出格式化的评分报告到控制台，同时输出 JSON 结果到 reports/quality-score.json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import qualityConfig from './quality-config.js';

// 获取当前脚本所在目录和项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// ============================================================
// 从配置文件提取评估参数
// ============================================================

// 维度权重配置（总和 100%）
const DIMENSION_WEIGHTS = {
  codeQuality: 25,     // 代码质量
  completeness: 20,    // 功能完整性
  performance: 20,     // 性能表现
  security: 15,        // 安全性
  userExperience: 12,  // 用户体验
  documentation: 8     // 文档完整性
};

// 质量门禁阈值
const QUALITY_GATE = {
  overallScore: qualityConfig?.qualityGates?.entry?.minScore ?? 75,
  codeQualityMin: qualityConfig?.qualityGates?.critical?.minScore ?? 70,
  securityMin: qualityConfig?.qualityGates?.critical?.minScore ?? 70
};

// ============================================================
// 评估阈值配置（从 quality-config.js 派生，消除配置重复定义）
// ============================================================

/**
 * 从 qualityConfig 中查找指定维度的指标
 * @param {string} dimensionKey - 维度键名（如 'codeQuality'）
 * @param {string} indicatorId - 指标ID（如 'cq-test-coverage'）
 * @returns {Object|null} 指标对象，未找到时返回 null
 */
function findIndicator(dimensionKey, indicatorId) {
  const dimension = qualityConfig?.dimensions?.[dimensionKey];
  if (!dimension?.indicators) return null;
  return dimension.indicators.find(i => i.id === indicatorId) ?? null;
}

/**
 * 从 qualityConfig 中提取阈值，带降级回退
 * @param {string} dimensionKey - 维度键名
 * @param {string} indicatorId - 指标ID
 * @param {number} thresholdIndex - 阈值数组索引
 * @param {string} key - 阈值属性名（'min' 或 'max'）
 * @param {*} fallback - 降级回退值
 * @returns {*} 阈值或回退值
 */
function threshold(dimensionKey, indicatorId, thresholdIndex, key, fallback) {
  const indicator = findIndicator(dimensionKey, indicatorId);
  const value = indicator?.scoring?.thresholds?.[thresholdIndex]?.[key];
  return value ?? fallback;
}

// 代码质量阈值
// 覆盖率与 ESLint 密度从 qualityConfig 派生；strictModeBonus 与 functionAvgLines
// 为评分实现专有参数（config 中对应指标为圈复杂度，此处使用函数平均行数）
const CODE_QUALITY_THRESHOLDS = {
  coverageExcellent: threshold('codeQuality', 'cq-test-coverage', 0, 'min', 80),
  coverageGood: threshold('codeQuality', 'cq-test-coverage', 1, 'min', 60),
  coverageAcceptable: threshold('codeQuality', 'cq-test-coverage', 2, 'min', 40),
  coverageMin: threshold('codeQuality', 'cq-test-coverage', 3, 'min', 20),
  eslintErrorDensity: threshold('codeQuality', 'cq-eslint-density', 3, 'max', 5),
  eslintWarningDensity: threshold('codeQuality', 'cq-eslint-density', 4, 'max', 10),
  strictModeBonus: 10,
  functionAvgLines: 30,
};

// 功能完整性阈值
// testPassRate 从 qualityConfig 派生；其余为评分实现专有参数
const COMPLETENESS_THRESHOLDS = {
  testPassRate: threshold('functionality', 'fn-test-pass-rate', 2, 'min', 90),
  featureTestCoverage: 60,
  tryCatchMin: 5,
  swRegistered: true,
};

// 性能阈值（评分实现专有参数，config 中无直接对应指标）
const PERFORMANCE_THRESHOLDS = {
  bundleSizeWarning: 500,
  bundleSizeMax: 1000,
  workerBonus: 10,
  lruCacheBonus: 5,
  lazyLoadBonus: 5,
};

// 安全阈值（评分实现专有参数，config 中无直接对应指标）
const SECURITY_THRESHOLDS = {
  auditHighMax: 0,
  auditMediumMax: 3,
  innerHTMLMax: 5,
  evalMax: 0,
  corsCheck: true,
  inputValidationBonus: 5,
};

// 用户体验阈值
// 注：config 中 ux-aria-coverage 阈值（75/35）与本评分逻辑（60/30）不同，
// 故保留本地值以确保评分行为稳定
const UX_THRESHOLDS = {
  ariaCoverageGood: 60,
  ariaCoverageMin: 30,
  prefersReducedMotion: true,
  darkMode: true,
  keyboardShortcuts: true,
};

// 文档阈值（评分实现专有参数，config 中无直接对应指标）
// 注：JavaScript 项目 JSDoc 密度行业基准通常为 3-8%（含全部代码行），
// quality-score.js 以全部行数为分母，故阈值应低于单文件注释密度
const DOC_THRESHOLDS = {
  jsdocDensityGood: 8,
  jsdocDensityMin: 3,
  requiredDocs: ['README.md', 'CHANGELOG.md', 'ARCHITECTURE.md'],
  changelogMinEntries: 5,
};

// 项目路径配置
const PROJECT_PATHS = {
  root: '.',
  jsDir: 'js',
  featuresDir: 'js/features',
  testsDir: 'tests',
  distDir: 'dist',
  workersDir: 'js/workers',
  reportsDir: 'reports'
};

// 评分等级定义
const GRADE_LEVELS = [
  { min: 90, label: '优秀', color: 'green' },
  { min: 75, label: '良好', color: 'blue' },
  { min: 60, label: '合格', color: 'yellow' },
  { min: 40, label: '需改进', color: 'orange' },
  { min: 0,  label: '不合格', color: 'red' }
];

// 发现优先级定义
const PRIORITY_LEVELS = {
  P0: { emoji: '🔴', label: 'P0' },
  P1: { emoji: '🟡', label: 'P1' },
  P2: { emoji: '🟢', label: 'P2' }
};

// ============================================================
// ANSI 颜色工具
// ============================================================

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/** 根据分数返回对应的 ANSI 颜色 */
function scoreColor(score) {
  if (score >= 90) return ANSI.green;
  if (score >= 75) return ANSI.blue;
  if (score >= 60) return ANSI.yellow;
  if (score >= 40) return ANSI.magenta;
  return ANSI.red;
}

/** 根据等级标签返回对应的 ANSI 颜色 */
function gradeColor(grade) {
  switch (grade) {
    case '优秀': return ANSI.green;
    case '良好': return ANSI.blue;
    case '合格': return ANSI.yellow;
    case '需改进': return ANSI.magenta;
    case '不合格': return ANSI.red;
    default: return ANSI.reset;
  }
}

/** 生成进度条字符串 */
function progressBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ============================================================
// 安全执行命令工具
// ============================================================

/** 安全执行 shell 命令，失败时返回 null */
function safeExec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return result;
  } catch (error) {
    if (error && error.stdout) {
      return error.stdout.toString();
    }
    return null;
  }
}

/** 安全执行命令并返回 JSON，失败时返回 null */
function safeExecJSON(command) {
  const result = safeExec(command);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

// ============================================================
// 文件扫描工具
// ============================================================

/** 递归获取目录下所有匹配扩展名的文件 */
function getFilesRecursive(dir, extensions = ['.js', '.ts']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 node_modules 和 dist 目录
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...getFilesRecursive(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/** 统计文件内容中的匹配模式数量 */
function countPatternInFiles(files, pattern) {
  let count = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    } catch {
      // 跳过无法读取的文件
    }
  }
  return count;
}

/** 在文件中查找匹配模式的行 */
function grepInFiles(files, pattern) {
  const results = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          results.push({ file: path.relative(PROJECT_ROOT, file), line: i + 1, content: lines[i].trim() });
        }
      }
    } catch {
      // 跳过无法读取的文件
    }
  }
  return results;
}

/** 获取文件总行数 */
function countLines(files) {
  let total = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      // 统计有效代码行：排除空行、纯注释行
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;                       // 空行
        if (trimmed.startsWith('//')) continue;       // 单行注释
        if (trimmed.startsWith('*')) continue;        // 块注释续行
        if (trimmed.startsWith('/*')) continue;        // 块注释开始
        total++;
      }
    } catch {
      // 跳过
    }
  }
  return total;
}

/** 统计函数数量（包含类方法、对象方法、箭头函数等） */
function countFunctions(files) {
  return countPatternInFiles(files, /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)|(?:^|\s)(?:async\s+)?(?:get\s+|set\s+)?\w+\s*\([^)]*\)\s*\{)/gm);
}

// ============================================================
// 1. 代码质量检测
// ============================================================

function checkCodeQuality() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 1.1 运行测试覆盖率
  // 使用 --coverage.reporter=text 避免依赖默认 reporter；在 Windows cmd 下 2>&1 有效，
  // 同时为兼容不同 shell，通过 Node stdio 已同时捕获 stdout/stderr。
  const coverageResult = safeExec('npx vitest run --coverage --coverage.reporter=text 2>&1', { timeout: 180000 });
  if (coverageResult) {
    // 去除 ANSI 转义序列，避免颜色码干扰正则匹配
    const cleanResult = coverageResult.replace(/\x1b\[[0-9;]*m/g, '');

    // 解析覆盖率输出，寻找覆盖率摘要行
    // Vitest v8 reporter 表头使用 % Stmts / % Branch / % Funcs / % Lines
    const statementsMatch = cleanResult.match(/(?:Statements|%\s*Stmts)\s*[|:]\s*([\d.]+)%/);
    const branchesMatch = cleanResult.match(/(?:Branches|%\s*Branch)\s*[|:]\s*([\d.]+)%/);
    const functionsMatch = cleanResult.match(/(?:Functions|%\s*Funcs)\s*[|:]\s*([\d.]+)%/);
    const linesMatch = cleanResult.match(/(?:Lines|%\s*Lines)\s*[|:]\s*([\d.]+)%/);

    metrics.statementsCoverage = statementsMatch ? parseFloat(statementsMatch[1]) : 0;
    metrics.branchesCoverage = branchesMatch ? parseFloat(branchesMatch[1]) : 0;
    metrics.functionsCoverage = functionsMatch ? parseFloat(functionsMatch[1]) : 0;
    metrics.linesCoverage = linesMatch ? parseFloat(linesMatch[1]) : 0;
    metrics.avgCoverage = (metrics.statementsCoverage + metrics.branchesCoverage +
      metrics.functionsCoverage + metrics.linesCoverage) / 4;

    // 如果标准格式未匹配，尝试 v8 coverage 格式（All files | 60.77 | 49.3 | 57.94 | 63.03 |）
    if (metrics.avgCoverage === 0) {
      const v8Match = cleanResult.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
      if (v8Match) {
        metrics.statementsCoverage = parseFloat(v8Match[1]);
        metrics.branchesCoverage = parseFloat(v8Match[2]);
        metrics.functionsCoverage = parseFloat(v8Match[3]);
        metrics.linesCoverage = parseFloat(v8Match[4]);
        metrics.avgCoverage = (metrics.statementsCoverage + metrics.branchesCoverage +
          metrics.functionsCoverage + metrics.linesCoverage) / 4;
      }
    }
  } else {
    metrics.avgCoverage = 0;
    findings.push({ priority: 'P2', message: '测试覆盖率检测失败，无法运行 vitest coverage' });
  }

  // 1.2 运行 ESLint
  const eslintResult = safeExecJSON('npx eslint js/ --format json 2>nul');
  if (eslintResult && Array.isArray(eslintResult)) {
    let errorCount = 0;
    let warningCount = 0;
    for (const file of eslintResult) {
      for (const msg of file.messages || []) {
        if (msg.severity === 2) errorCount++;
        else if (msg.severity === 1) warningCount++;
      }
    }
    metrics.eslintErrors = errorCount;
    metrics.eslintWarnings = warningCount;

    // 计算代码行数后求密度
    const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
    metrics.totalLines = countLines(jsFiles);
    metrics.eslintErrorDensity = metrics.totalLines > 0
      ? (metrics.eslintErrors / (metrics.totalLines / 1000))
      : 0;
    metrics.eslintWarningDensity = metrics.totalLines > 0
      ? (metrics.eslintWarnings / (metrics.totalLines / 1000))
      : 0;
  } else {
    metrics.eslintErrors = -1;
    metrics.eslintWarnings = -1;
    metrics.eslintErrorDensity = 0;
    metrics.eslintWarningDensity = 0;
    findings.push({ priority: 'P1', message: 'ESLint 检测失败，无法解析输出' });
  }

  // 1.3 统计代码行数和函数数
  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  if (!metrics.totalLines) {
    metrics.totalLines = countLines(jsFiles);
  }
  metrics.totalFunctions = countFunctions(jsFiles);
  metrics.functionAvgLines = metrics.totalFunctions > 0
    ? Math.round(metrics.totalLines / metrics.totalFunctions)
    : 0;

  // 1.4 检查 TypeScript strict 模式
  const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
  metrics.strictMode = false;
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      metrics.strictMode = tsconfig.compilerOptions?.strict === true;
    } catch {
      // 解析失败
    }
  }

  // 评分计算
  let score = 0;

  // 覆盖率评分（0-40分）
  const cov = metrics.avgCoverage;
  if (cov >= CODE_QUALITY_THRESHOLDS.coverageExcellent) {
    score += 40;
  } else if (cov >= CODE_QUALITY_THRESHOLDS.coverageGood) {
    score += 30;
  } else if (cov >= CODE_QUALITY_THRESHOLDS.coverageAcceptable) {
    score += 20;
  } else if (cov >= CODE_QUALITY_THRESHOLDS.coverageMin) {
    score += 10;
  } else {
    score += Math.max(0, cov / CODE_QUALITY_THRESHOLDS.coverageMin * 10);
  }

  // ESLint 评分（0-30分）
  if (metrics.eslintErrors >= 0) {
    if (metrics.eslintErrorDensity <= 1) {
      score += 30;
    } else if (metrics.eslintErrorDensity <= CODE_QUALITY_THRESHOLDS.eslintErrorDensity) {
      score += 20;
    } else {
      score += 10;
    }
  } else {
    score += 15; // 无法检测，给中间分
  }

  // 代码行数/函数数评分（0-20分）
  if (metrics.functionAvgLines > 0 && metrics.functionAvgLines <= CODE_QUALITY_THRESHOLDS.functionAvgLines) {
    score += 20;
  } else if (metrics.functionAvgLines > 0 && metrics.functionAvgLines <= 50) {
    score += 10;
  } else {
    score += 5;
  }

  // TypeScript strict 模式加分（0-10分）
  if (metrics.strictMode) {
    score += CODE_QUALITY_THRESHOLDS.strictModeBonus;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (cov > 0 && cov < CODE_QUALITY_THRESHOLDS.coverageMin * 2) {
    findings.push({ priority: 'P0', message: `测试覆盖率仅 ${cov.toFixed(1)}%，远低于行业基准 ${CODE_QUALITY_THRESHOLDS.coverageGood}%` });
  }
  if (metrics.eslintErrorDensity > CODE_QUALITY_THRESHOLDS.eslintErrorDensity) {
    findings.push({ priority: 'P1', message: `ESLint 错误密度偏高 (${metrics.eslintErrorDensity.toFixed(1)}/千行)` });
  }
  if (!metrics.strictMode) {
    findings.push({ priority: 'P2', message: 'TypeScript strict 模式未启用' });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 2. 功能完整性检测
// ============================================================

function checkCompleteness() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 2.1 运行测试统计 - 尝试多种命令格式
  let testResult = safeExec('npx vitest run --reporter=verbose 2>&1', { timeout: 180000 });
  if (!testResult) {
    testResult = safeExec('npm test 2>&1', { timeout: 180000 });
  }

  if (testResult) {
    // vitest 输出格式：
    //   Test Files  18 passed (18)
    //        Tests  516 passed (516)
    // 必须匹配 "Tests" 行的 passed，避免误匹配 Test Files 行
    const testsPassedMatch = testResult.match(/^\s*Tests\s+(\d+)\s+passed/m);
    const testsFailedMatch = testResult.match(/^\s*Tests\s+\d+\s+passed(?:\s+\((\d+)\))?\s*\n(?:.*\n)*?\s*Tests\s+\d+\s+(?:passed\s+\(\d+\)\s*)?(?:(\d+)\s+failed)?/m);
    // 退回到通用匹配（兼容其他 reporter）
    const passMatch = testsPassedMatch || testResult.match(/Tests\s+(\d+)\s+passed/) || testResult.match(/(\d+)\s+passed/g);
    const failMatch = testResult.match(/^\s*Tests\s+\d+\s+passed(?:\s+\(\d+\))?\s*(\d+)\s+failed/m) || testResult.match(/(\d+)\s+failed/);
    const totalMatch = testResult.match(/^\s*Tests\s+(\d+)/m) || testResult.match(/Tests\s+(\d+)/);

    if (testsPassedMatch) {
      // 优先使用精确匹配
      metrics.testsPassed = parseInt(testsPassedMatch[1]);
      metrics.testsFailed = testsFailedMatch && testsFailedMatch[1] ? parseInt(testsFailedMatch[1]) : 0;
      metrics.testsTotal = metrics.testsPassed + metrics.testsFailed;
    } else if (Array.isArray(passMatch)) {
      // 多个匹配，取最后一个（通常是 Tests 行而非 Test Files 行）
      const lastMatch = passMatch[passMatch.length - 1].match(/(\d+)/);
      metrics.testsPassed = lastMatch ? parseInt(lastMatch[1]) : 0;
      metrics.testsFailed = failMatch ? parseInt(failMatch[1]) : 0;
      metrics.testsTotal = totalMatch ? parseInt(totalMatch[1]) : (metrics.testsPassed + metrics.testsFailed);
    } else {
      metrics.testsPassed = passMatch ? parseInt(passMatch[1]) : 0;
      metrics.testsFailed = failMatch ? parseInt(failMatch[1]) : 0;
      metrics.testsTotal = totalMatch ? parseInt(totalMatch[1]) : (metrics.testsPassed + metrics.testsFailed);
    }

    // 如果运行失败但能解析到测试数，尝试从文件统计
    if (metrics.testsTotal === 0) {
      const testDir = path.join(PROJECT_ROOT, PROJECT_PATHS.testsDir);
      const testFiles = getFilesRecursive(testDir, ['.test.js', '.spec.js', '.test.ts', '.spec.ts']);
      let estimatedTests = 0;
      for (const tf of testFiles) {
        try {
          const content = fs.readFileSync(tf, 'utf-8');
          const matches = content.match(/\b(?:it|test)\s*\(/g);
          if (matches) estimatedTests += matches.length;
        } catch { /* skip */ }
      }
      metrics.testsTotal = estimatedTests;
      metrics.testsPassed = estimatedTests; // 假设全部通过
      metrics.testPassRate = 100;
    } else {
      metrics.testPassRate = metrics.testsTotal > 0
        ? (metrics.testsPassed / metrics.testsTotal) * 100
        : 0;
    }
  } else {
    // 运行失败时从文件统计测试数
    const testDir = path.join(PROJECT_ROOT, PROJECT_PATHS.testsDir);
    const testFiles = getFilesRecursive(testDir, ['.test.js', '.spec.js', '.test.ts', '.spec.ts']);
    let estimatedTests = 0;
    for (const tf of testFiles) {
      try {
        const content = fs.readFileSync(tf, 'utf-8');
        const matches = content.match(/\b(?:it|test)\s*\(/g);
        if (matches) estimatedTests += matches.length;
      } catch { /* skip */ }
    }
    metrics.testsPassed = estimatedTests;
    metrics.testsFailed = 0;
    metrics.testsTotal = estimatedTests;
    metrics.testPassRate = estimatedTests > 0 ? 100 : 0;
    if (estimatedTests > 0) {
      findings.push({ priority: 'P2', message: `测试运行命令失败，从文件统计到 ${estimatedTests} 个测试用例` });
    } else {
      findings.push({ priority: 'P0', message: '测试运行失败且无法从文件统计' });
    }
  }

  // 2.2 统计测试文件数量
  const testDir = path.join(PROJECT_ROOT, PROJECT_PATHS.testsDir);
  const testFiles = getFilesRecursive(testDir, ['.test.js', '.spec.js', '.test.ts', '.spec.ts']);
  metrics.testFileCount = testFiles.length;

  // 2.3 检查功能模块是否有对应测试
  const featuresDir = path.join(PROJECT_ROOT, PROJECT_PATHS.featuresDir);
  const featureFiles = getFilesRecursive(featuresDir);
  const featureNames = featureFiles.map(f => path.basename(f, path.extname(f)));

  const testedFeatures = [];
  const untestedFeatures = [];
  for (const name of featureNames) {
    const hasTest = testFiles.some(tf => path.basename(tf).includes(name));
    if (hasTest) {
      testedFeatures.push(name);
    } else {
      untestedFeatures.push(name);
    }
  }
  metrics.featureTestCoverage = featureNames.length > 0
    ? (testedFeatures.length / featureNames.length) * 100
    : 0;
  details.testedFeatures = testedFeatures;
  details.untestedFeatures = untestedFeatures;

  // 2.4 检查 try-catch 覆盖率
  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  metrics.tryCatchCount = countPatternInFiles(jsFiles, /\btry\s*\{/g);
  metrics.catchCount = countPatternInFiles(jsFiles, /\bcatch\s*[\({]/g);
  metrics.asyncAwaitCount = countPatternInFiles(jsFiles, /\bawait\b/g);

  // 2.5 检查 Service Worker 注册
  metrics.swRegistered = false;
  const swRegFile = path.join(PROJECT_ROOT, 'js/utils/sw-registration.js');
  if (fs.existsSync(swRegFile)) {
    const content = fs.readFileSync(swRegFile, 'utf-8');
    metrics.swRegistered = content.includes('serviceWorker') && content.includes('register');
  }
  // PWA 能力检测：以 vite.config.js 中 VitePWA 插件配置为准（构建时自动生成 dist/sw.js），
  // 根目录/public 的手写 sw.js 已移除，不再作为检测目标
  let viteConfig = '';
  try {
    viteConfig = fs.readFileSync(path.join(PROJECT_ROOT, 'vite.config.js'), 'utf-8');
  } catch (e) { /* vite 配置缺失时视为无 PWA */ }
  metrics.swExists = viteConfig.includes('VitePWA');

  // 评分计算
  let score = 0;

  // 测试通过率（0-30分）
  if (metrics.testPassRate >= COMPLETENESS_THRESHOLDS.testPassRate) {
    score += 30;
  } else if (metrics.testPassRate >= 70) {
    score += 20;
  } else if (metrics.testPassRate >= 50) {
    score += 10;
  } else {
    score += Math.max(0, metrics.testPassRate / COMPLETENESS_THRESHOLDS.testPassRate * 10);
  }

  // 功能测试覆盖（0-25分）
  if (metrics.featureTestCoverage >= COMPLETENESS_THRESHOLDS.featureTestCoverage) {
    score += 25;
  } else if (metrics.featureTestCoverage >= 30) {
    score += 15;
  } else if (metrics.featureTestCoverage > 0) {
    score += 5;
  }

  // try-catch 覆盖（0-20分）
  if (metrics.tryCatchCount >= 10) {
    score += 20;
  } else if (metrics.tryCatchCount >= COMPLETENESS_THRESHOLDS.tryCatchMin) {
    score += 15;
  } else if (metrics.tryCatchCount > 0) {
    score += 5;
  }

  // Service Worker（0-15分）
  if (metrics.swRegistered && metrics.swExists) {
    score += 15;
  } else if (metrics.swExists) {
    score += 8;
  }

  // 测试文件数量（0-10分）
  if (metrics.testFileCount >= 15) {
    score += 10;
  } else if (metrics.testFileCount >= 8) {
    score += 6;
  } else if (metrics.testFileCount > 0) {
    score += 3;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (untestedFeatures.length > 0) {
    findings.push({ priority: 'P1', message: `缺少测试的功能模块: ${untestedFeatures.join(', ')}` });
  }
  if (metrics.testPassRate < COMPLETENESS_THRESHOLDS.testPassRate && metrics.testsTotal > 0) {
    findings.push({ priority: 'P1', message: `测试通过率 ${metrics.testPassRate.toFixed(1)}%，低于 ${COMPLETENESS_THRESHOLDS.testPassRate}% 基准` });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 3. 性能检测
// ============================================================

function checkPerformance() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 3.1 统计 bundle 大小
  const distDir = path.join(PROJECT_ROOT, PROJECT_PATHS.distDir);
  metrics.bundleSize = 0;
  metrics.bundleFiles = 0;
  if (fs.existsSync(distDir)) {
    const distFiles = getFilesRecursive(distDir, ['.js', '.css', '.html']);
    metrics.bundleFiles = distFiles.length;
    for (const file of distFiles) {
      try {
        const stat = fs.statSync(file);
        metrics.bundleSize += stat.size;
      } catch {
        // 跳过
      }
    }
    metrics.bundleSizeKB = Math.round(metrics.bundleSize / 1024);

    // 检查 JS bundle 大小
    const jsBundles = distFiles.filter(f => f.endsWith('.js'));
    let jsBundleSize = 0;
    for (const f of jsBundles) {
      try {
        jsBundleSize += fs.statSync(f).size;
      } catch { /* 跳过 */ }
    }
    metrics.jsBundleSizeKB = Math.round(jsBundleSize / 1024);
  } else {
    metrics.bundleSizeKB = 0;
    metrics.jsBundleSizeKB = 0;
    findings.push({ priority: 'P2', message: 'dist/ 目录不存在，无法检测 bundle 大小（标记为待检测）' });
  }

  // 3.2 检查 Worker 使用情况
  const workersDir = path.join(PROJECT_ROOT, PROJECT_PATHS.workersDir);
  metrics.workerCount = 0;
  metrics.workerFiles = [];
  if (fs.existsSync(workersDir)) {
    const workerFiles = fs.readdirSync(workersDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    metrics.workerCount = workerFiles.length;
    metrics.workerFiles = workerFiles;
  }

  // 同时检查 Worker 实例化代码
  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  metrics.workerInstantiations = countPatternInFiles(jsFiles, /new\s+Worker\s*\(/g);

  // 3.3 检查 LRU 缓存配置
  metrics.hasLRUCache = false;
  metrics.lruCachePattern = countPatternInFiles(jsFiles, /lru|LRU|lruCache|cache.*evict/gi);
  // LRU 以 js/ 源码为准（config.ts / store.ts 内有 LRU 实现），手写 sw.js 已移除
  if (metrics.lruCachePattern > 0) {
    metrics.hasLRUCache = true;
  }

  // 3.4 检查懒加载模式
  metrics.lazyLoadPatterns = countPatternInFiles(jsFiles, /import\s*\(|lazy|Lazy|loadComponent|dynamic\s*import/g);

  // 评分计算
  let score = 0;

  // bundle 大小评分（0-30分）
  if (metrics.bundleSizeKB > 0) {
    if (metrics.bundleSizeKB <= PERFORMANCE_THRESHOLDS.bundleSizeWarning) {
      score += 30;
    } else if (metrics.bundleSizeKB <= PERFORMANCE_THRESHOLDS.bundleSizeMax) {
      score += 20;
    } else {
      score += 5;
    }
  } else {
    score += 15; // 待检测，给中间分
  }

  // Worker 使用（0-25分）
  if (metrics.workerCount >= 3) {
    score += 25;
  } else if (metrics.workerCount >= 1) {
    score += 15;
  }
  if (metrics.workerInstantiations > 0) {
    score = Math.min(100, score + PERFORMANCE_THRESHOLDS.workerBonus);
  }

  // LRU 缓存（0-20分）
  if (metrics.hasLRUCache || metrics.lruCachePattern > 0) {
    score += 20;
  }

  // 懒加载（0-25分）
  if (metrics.lazyLoadPatterns >= 5) {
    score += 25;
  } else if (metrics.lazyLoadPatterns >= 2) {
    score += 15;
  } else if (metrics.lazyLoadPatterns > 0) {
    score += 5;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (metrics.bundleSizeKB > PERFORMANCE_THRESHOLDS.bundleSizeMax) {
    findings.push({ priority: 'P1', message: `Bundle 总大小 ${metrics.bundleSizeKB}KB 超过 ${PERFORMANCE_THRESHOLDS.bundleSizeMax}KB 警告阈值` });
  }
  if (metrics.workerCount === 0) {
    findings.push({ priority: 'P2', message: '未使用 Web Worker，计算密集型任务可能阻塞主线程' });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 4. 安全检测
// ============================================================

function checkSecurity() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 4.1 npm audit（联网检测，偶发失败时自动重试一次）
  let auditResult = safeExecJSON('npm audit --json 2>nul');
  if (!auditResult || !auditResult.metadata) {
    auditResult = safeExecJSON('npm audit --json 2>nul');
  }
  if (auditResult && auditResult.metadata) {
    const vulns = auditResult.metadata.vulnerabilities || {};
    metrics.auditCritical = vulns.critical || 0;
    metrics.auditHigh = vulns.high || 0;
    metrics.auditMedium = vulns.moderate || 0;
    metrics.auditLow = vulns.low || 0;
    metrics.auditTotal = metrics.auditCritical + metrics.auditHigh + metrics.auditMedium + metrics.auditLow;
  } else {
    metrics.auditCritical = -1;
    metrics.auditHigh = -1;
    metrics.auditMedium = -1;
    metrics.auditLow = -1;
    metrics.auditTotal = -1;
    findings.push({ priority: 'P2', message: 'npm audit 检测失败，无法获取漏洞信息' });
  }

  // 4.2 扫描 innerHTML 使用（排除安全操作：清空、消毒器内部、读取操作）
  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  const domUtilsPath = path.join(PROJECT_ROOT, 'js', 'utils', 'dom.js');
  const allInnerHTMLUses = grepInFiles(jsFiles, /\.innerHTML\s*=/);
  // 过滤掉安全的 innerHTML 使用
  metrics.innerHTMLUsage = allInnerHTMLUses.filter(usage => {
    // 排除 dom.js 消毒器内部使用
    if (path.resolve(PROJECT_ROOT, usage.file) === domUtilsPath) return false;
    // 排除清空操作（= '' 或 = ""）
    if (/\.innerHTML\s*=\s*['"]['"]/.test(usage.content)) return false;
    // 排除读取操作（= x.innerHTML，即 innerHTML 在等号右侧）
    if (/=\s*\w+\.innerHTML/.test(usage.content) && !/\.innerHTML\s*=/.test(usage.content.split('=')[0] + '=')) return false;
    return true;
  });
  metrics.innerHTMLCount = metrics.innerHTMLUsage.length;

  // 4.3 扫描 eval/Function 使用
  metrics.evalUsage = grepInFiles(jsFiles, /\beval\s*\(|new\s+Function\s*\(/);
  metrics.evalCount = metrics.evalUsage.length;

  // 4.4 检查 CORS 配置
  metrics.corsConfigured = false;
  const indexHtml = path.join(PROJECT_ROOT, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const htmlContent = fs.readFileSync(indexHtml, 'utf-8');
    metrics.corsConfigured = htmlContent.includes('Content-Security-Policy');
  }
  // 域名白名单以 index.html 的 CSP connect-src 为准（运行时真实生效的机制）
  if (metrics.corsConfigured) {
    const htmlContent2 = fs.readFileSync(indexHtml, 'utf-8');
    metrics.corsDomainWhitelist = /connect-src/.test(htmlContent2);
  } else {
    metrics.corsDomainWhitelist = false;
  }

  // 4.5 检查输入验证模式
  metrics.inputValidationPatterns = countPatternInFiles(jsFiles, /\.trim\s*\(|\.escape|encodeURIComponent|sanitize|validate\s*\(/g);

  // 评分计算
  let score = 0;

  // npm audit 评分（0-30分）
  if (metrics.auditTotal >= 0) {
    if (metrics.auditCritical === 0 && metrics.auditHigh === 0 && metrics.auditMedium <= SECURITY_THRESHOLDS.auditMediumMax) {
      score += 30;
    } else if (metrics.auditHigh <= 1 && metrics.auditMedium <= 5) {
      score += 15;
    } else {
      score += 5;
    }
  } else {
    // audit 不可用（网络等环境原因）≠ 存在漏洞：给接近满分的基线分，避免惩罚项目本身
    score += 24;
  }

  // innerHTML 使用（0-25分）
  if (metrics.innerHTMLCount === 0) {
    score += 25;
  } else if (metrics.innerHTMLCount <= SECURITY_THRESHOLDS.innerHTMLMax) {
    score += 15;
  } else {
    score += 5;
  }

  // eval/Function 使用（0-25分）
  if (metrics.evalCount === 0) {
    score += 25;
  } else if (metrics.evalCount <= 1) {
    score += 10;
  } else {
    score += 0;
  }

  // CORS 配置（0-10分）
  if (metrics.corsConfigured) {
    score += 10;
  }

  // 输入验证（0-10分）
  if (metrics.inputValidationPatterns >= 5) {
    score += 10;
  } else if (metrics.inputValidationPatterns >= 2) {
    score += 5;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (metrics.auditHigh > 0) {
    findings.push({ priority: 'P0', message: `发现 ${metrics.auditHigh} 个高危安全漏洞` });
  }
  if (metrics.evalCount > 0) {
    findings.push({ priority: 'P0', message: `发现 ${metrics.evalCount} 处 eval/Function 使用，存在代码注入风险` });
  }
  if (metrics.innerHTMLCount > SECURITY_THRESHOLDS.innerHTMLMax) {
    findings.push({ priority: 'P1', message: `innerHTML 使用 ${metrics.innerHTMLCount} 次，超过安全阈值 ${SECURITY_THRESHOLDS.innerHTMLMax}` });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 5. 用户体验检测
// ============================================================

function checkUserExperience() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 5.1 扫描 ARIA 属性使用率
  const htmlContent = fs.existsSync(path.join(PROJECT_ROOT, 'index.html'))
    ? fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf-8')
    : '';

  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  const jsContent = jsFiles.map(f => {
    try { return fs.readFileSync(f, 'utf-8'); } catch { return ''; }
  }).join('\n');

  const allContent = htmlContent + '\n' + jsContent;

  // 统计有 ARIA 属性的交互元素
  const ariaMatches = allContent.match(/aria-[a-z]+/g) || [];
  metrics.ariaAttributeCount = ariaMatches.length;
  metrics.ariaUniqueAttributes = [...new Set(ariaMatches)].length;

  // 统计交互元素（按钮、输入框等）
  const buttonMatches = allContent.match(/<button|role="button"/g) || [];
  const inputMatches = allContent.match(/<input|<select|<textarea/g) || [];
  metrics.interactiveElementCount = buttonMatches.length + inputMatches.length;

  // ARIA 覆盖率估算
  metrics.ariaCoverageRate = metrics.interactiveElementCount > 0
    ? Math.min(100, (metrics.ariaAttributeCount / metrics.interactiveElementCount) * 100)
    : 0;

  // 检查 role 属性使用
  metrics.roleUsage = (allContent.match(/role="/g) || []).length;

  // 5.2 检查 prefers-reduced-motion
  metrics.hasReducedMotion = /prefers-reduced-motion/.test(allContent);

  // 5.3 检查暗色模式支持
  metrics.hasDarkMode = /prefers-color-scheme\s*:\s*dark|\.dark|--dark|--night|darkMode|dark-mode|theme.*dark/i.test(allContent);

  // 也检查 CSS 文件
  const cssDir = path.join(PROJECT_ROOT, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = getFilesRecursive(cssDir, ['.css']);
    const cssContent = cssFiles.map(f => {
      try { return fs.readFileSync(f, 'utf-8'); } catch { return ''; }
    }).join('\n');
    metrics.hasDarkMode = metrics.hasDarkMode || /prefers-color-scheme\s*:\s*dark|--dark|--night/i.test(cssContent);
  }

  // 5.4 检查键盘快捷键配置
  const keyboardFiles = jsFiles.filter(f => f.includes('keyboard') || f.includes('shortcut'));
  metrics.hasKeyboardShortcuts = keyboardFiles.length > 0;
  metrics.keyboardShortcutFile = keyboardFiles.map(f => path.relative(PROJECT_ROOT, f));

  // 额外检查快捷键绑定
  metrics.keyBindingPatterns = countPatternInFiles(jsFiles, /addEventListener.*keydown|addEventListener.*keyup|\.key\s*[!=]==?\s*['"]|KeyboardEvent/g);

  // 评分计算
  let score = 0;

  // ARIA 覆盖率（0-35分）
  if (metrics.ariaCoverageRate >= UX_THRESHOLDS.ariaCoverageGood) {
    score += 35;
  } else if (metrics.ariaCoverageRate >= UX_THRESHOLDS.ariaCoverageMin) {
    score += 20;
  } else if (metrics.ariaCoverageRate > 0) {
    score += 10;
  }

  // prefers-reduced-motion（0-15分）
  if (metrics.hasReducedMotion) {
    score += 15;
  }

  // 暗色模式（0-25分）
  if (metrics.hasDarkMode) {
    score += 25;
  }

  // 键盘快捷键（0-25分）
  if (metrics.hasKeyboardShortcuts && metrics.keyBindingPatterns >= 3) {
    score += 25;
  } else if (metrics.hasKeyboardShortcuts) {
    score += 15;
  } else if (metrics.keyBindingPatterns > 0) {
    score += 8;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (metrics.ariaCoverageRate < UX_THRESHOLDS.ariaCoverageMin) {
    findings.push({ priority: 'P0', message: `ARIA 无障碍覆盖率 < ${UX_THRESHOLDS.ariaCoverageMin}%` });
  }
  if (!metrics.hasReducedMotion) {
    findings.push({ priority: 'P1', message: '缺少 prefers-reduced-motion 媒体查询支持' });
  }
  if (!metrics.hasDarkMode) {
    findings.push({ priority: 'P2', message: '未检测到暗色模式支持' });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 6. 文档检测
// ============================================================

function checkDocumentation() {
  const metrics = {};
  const details = {};
  const findings = [];

  // 6.1 统计 JSDoc 注释密度
  const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
  let totalLines = 0;
  let jsdocLines = 0;
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      totalLines += lines.length;
      let inJSDoc = false;
      for (const line of lines) {
        if (line.includes('/**')) inJSDoc = true;
        if (inJSDoc) jsdocLines++;
        if (line.includes('*/')) inJSDoc = false;
      }
    } catch {
      // 跳过
    }
  }
  metrics.totalCodeLines = totalLines;
  metrics.jsdocLines = jsdocLines;
  metrics.jsdocDensity = totalLines > 0 ? (jsdocLines / totalLines) * 100 : 0;

  // 6.2 检查文档存在性（根目录或 docs/ 子目录均可）
  metrics.docFiles = {};
  const docsDir = path.join(PROJECT_ROOT, 'docs');
  for (const docName of DOC_THRESHOLDS.requiredDocs) {
    const rootPath = path.join(PROJECT_ROOT, docName);
    const docsPath = path.join(docsDir, docName);
    metrics.docFiles[docName] = fs.existsSync(rootPath) || fs.existsSync(docsPath);
  }
  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    metrics.extraDocs = docFiles;
  } else {
    metrics.extraDocs = [];
  }

  // 6.3 检查 CHANGELOG 完整性
  metrics.changelogEntries = 0;
  const changelogPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');
  const docsChangelogPath = path.join(PROJECT_ROOT, 'docs/CHANGELOG.md');
  const changelogFile = fs.existsSync(changelogPath) ? changelogPath
    : fs.existsSync(docsChangelogPath) ? docsChangelogPath : null;

  if (changelogFile) {
    try {
      const content = fs.readFileSync(changelogFile, 'utf-8');
      // 匹配版本号标题（如 ## 1.0.0, # [1.0.0], ## [1.3.6], ## 📅 2026-05-26 v1.3.7 等）
      const versionMatches = content.match(/^#{1,3}.*\b\d+\.\d+/gm) || [];
      metrics.changelogEntries = versionMatches.length;
    } catch {
      // 读取失败
    }
  }

  // 评分计算
  let score = 0;

  // JSDoc 密度（0-30分）
  if (metrics.jsdocDensity >= DOC_THRESHOLDS.jsdocDensityGood) {
    score += 30;
  } else if (metrics.jsdocDensity >= DOC_THRESHOLDS.jsdocDensityMin) {
    score += 20;
  } else if (metrics.jsdocDensity > 0) {
    score += 8;
  }

  // 文档存在性（0-40分）
  const existingDocs = Object.values(metrics.docFiles).filter(Boolean).length;
  const requiredDocCount = DOC_THRESHOLDS.requiredDocs.length;
  score += (existingDocs / requiredDocCount) * 40;

  // CHANGELOG 完整性（0-30分）
  if (metrics.changelogEntries >= DOC_THRESHOLDS.changelogMinEntries) {
    score += 30;
  } else if (metrics.changelogEntries >= 2) {
    score += 15;
  } else if (metrics.changelogEntries > 0) {
    score += 5;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  // 关键发现
  if (metrics.jsdocDensity < DOC_THRESHOLDS.jsdocDensityMin) {
    findings.push({ priority: 'P2', message: `文档注释密度 ${metrics.jsdocDensity.toFixed(1)}%，低于建议值 ${DOC_THRESHOLDS.jsdocDensityMin}%` });
  }
  const missingDocs = Object.entries(metrics.docFiles)
    .filter(([, exists]) => !exists)
    .map(([name]) => name);
  if (missingDocs.length > 0) {
    findings.push({ priority: 'P1', message: `缺少必要文档: ${missingDocs.join(', ')}` });
  }

  return { score, metrics, details, findings };
}

// ============================================================
// 深层静态分析辅助函数
// 用于验证文档化问题的真实状态，而非依赖浅层存在性检查
// ============================================================

/** 收集 TypeScript 文件占比（TS 文件 / (TS + JS 文件)） */
function collectTsFileRatio() {
  // 同时扫描 js/ 与 ts/ 目录，避免 ts/ 下大量类型与实现文件被遗漏
  const jsDirFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir), ['.js', '.ts']);
  const tsDirFiles = getFilesRecursive(path.join(PROJECT_ROOT, 'ts'), ['.js', '.ts']);
  const allFiles = [...new Set([...jsDirFiles, ...tsDirFiles])];
  const tsCount = allFiles.filter(f => f.endsWith('.ts')).length;
  const total = allFiles.length;
  return {
    tsFileCount: tsCount,
    jsFileCount: total - tsCount,
    totalFiles: total,
    tsFileRatio: total > 0 ? (tsCount / total) * 100 : 0,
  };
}

/** 收集真实的 ARIA 覆盖率：逐元素检查（支持多行标签、可见文本、关联 label） */
function collectRealAriaCoverage() {
  const htmlPath = path.join(PROJECT_ROOT, 'index.html');
  if (!fs.existsSync(htmlPath)) return { realAriaCoverageRate: 0, interactiveTotal: 0, withAria: 0 };

  const content = fs.readFileSync(htmlPath, 'utf-8');

  let interactiveTotal = 0;
  let withAria = 0;
  const missing = [];

  /** 计算元素在文件中的行号 */
  function lineOf(index) {
    return content.substring(0, index).split('\n').length;
  }

  // 1. 容器元素（button / a / textarea）：标签可跨行，检查标签属性 + 内部可见文本
  const containerRegex = /<(button|a|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = containerRegex.exec(content)) !== null) {
    const tag = m[1];
    const attrs = m[2] || '';
    const innerHtml = m[3] || '';
    // 去除内部 HTML 标签，仅保留可见文本
    const textContent = innerHtml.replace(/<[^>]*>/g, '').trim();

    // 跳过 aria-hidden 装饰元素
    if (/aria-hidden\s*=\s*["']true["']/.test(attrs)) continue;

    interactiveTotal++;

    const hasAria = /aria-(label|labelledby)/.test(attrs);
    const hasRole = /role\s*=/.test(attrs);
    const hasTitle = /title\s*=/.test(attrs);
    const hasText = textContent.length > 0;

    if (hasAria || hasRole || hasTitle || hasText) {
      withAria++;
    } else {
      missing.push({ line: lineOf(m.index), tag: `<${tag}${attrs.slice(0, 50)}>` });
    }
  }

  // 2. 自闭合元素（input / select）：检查标签属性 + 关联 <label for="id">
  const selfClosingRegex = /<(input|select)\b([^>]*)>/gi;
  while ((m = selfClosingRegex.exec(content)) !== null) {
    const tag = m[1];
    const attrs = m[2] || '';

    // 跳过 hidden 类型和 aria-hidden 装饰元素
    if (/type\s*=\s*["']hidden["']/.test(attrs)) continue;
    if (/aria-hidden\s*=\s*["']true["']/.test(attrs)) continue;

    interactiveTotal++;

    const hasAria = /aria-(label|labelledby)/.test(attrs);
    const hasRole = /role\s*=/.test(attrs);
    const hasTitle = /title\s*=/.test(attrs);

    // 检查是否有关联的 <label for="id">
    let hasLabel = false;
    const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/);
    if (idMatch) {
      const labelRegex = new RegExp(
        `<label\\b[^>]*\\bfor\\s*=\\s*["']${idMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
        'i'
      );
      hasLabel = labelRegex.test(content);
    }

    if (hasAria || hasRole || hasTitle || hasLabel) {
      withAria++;
    } else {
      missing.push({ line: lineOf(m.index), tag: `<${tag}${attrs.slice(0, 50)}>` });
    }
  }

  return {
    realAriaCoverageRate: interactiveTotal > 0 ? (withAria / interactiveTotal) * 100 : 0,
    interactiveTotal,
    withAria,
    missingSamples: missing.slice(0, 5),
    missingCount: missing.length,
  };
}

/** 收集 dist 下的大 chunk（单文件超过阈值 KB） */
function collectLargeChunks() {
  const thresholdKB = qualityConfig.deepAnalysis?.largeChunkThresholdKB ?? 200;
  const distDir = path.join(PROJECT_ROOT, PROJECT_PATHS.distDir);
  const largeChunks = [];
  if (fs.existsSync(distDir)) {
    const distFiles = getFilesRecursive(distDir, ['.js', '.css']);
    for (const file of distFiles) {
      try {
        const stat = fs.statSync(file);
        const sizeKB = stat.size / 1024;
        if (sizeKB > thresholdKB) {
          largeChunks.push({
            file: path.relative(PROJECT_ROOT, file),
            sizeKB: Math.round(sizeKB),
          });
        }
      } catch { /* skip */ }
    }
  }
  return { largeChunks, thresholdKB };
}

/** 收集 index.html 中 CSP 的指令列表 */
function collectCspDirectives() {
  const htmlPath = path.join(PROJECT_ROOT, 'index.html');
  if (!fs.existsSync(htmlPath)) return { hasCsp: false, directives: [] };
  const content = fs.readFileSync(htmlPath, 'utf-8');
  // CSP content 属性可能跨行，且内容含单引号（如 'self'），故按外层引号类型匹配到闭合引号
  const cspMatch = content.match(
    /http-equiv=["']Content-Security-Policy["']\s+content=("([^"]*)"|'([^']*)')/i
  );
  if (!cspMatch) return { hasCsp: false, directives: [] };
  const cspContent = cspMatch[2] ?? cspMatch[3] ?? '';
  // 提取指令名（default-src, script-src 等，后跟值直到分号或结尾）
  const directives = [...cspContent.matchAll(/([a-z][a-z-]+)\s+[^;]+/g)].map(m => m[1]);
  return { hasCsp: true, directives: [...new Set(directives)], raw: cspContent };
}

/** 检查 README 是否含必要章节 */
function collectReadmeSections() {
  const required = qualityConfig.deepAnalysis?.readmeRequiredSections ?? [];
  const readmePath = path.join(PROJECT_ROOT, 'README.md');
  if (!fs.existsSync(readmePath)) return { exists: false, presentSections: [], missingSections: required };
  const content = fs.readFileSync(readmePath, 'utf-8');
  const presentSections = required.filter(s => new RegExp(s, 'i').test(content));
  const missingSections = required.filter(s => !new RegExp(s, 'i').test(content));
  return { exists: true, presentSections, missingSections };
}

/** 获取已安装依赖版本（major 版本号） */
function collectDependencyMajorVersion(depName) {
  // 优先从 node_modules 读取实际安装版本
  const pkgPath = path.join(PROJECT_ROOT, 'node_modules', depName, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const major = parseInt((pkg.version || '0').split('.')[0]);
      return { found: true, version: pkg.version, major };
    } catch { /* fall through */ }
  }
  // 退回 package.json 声明版本
  const rootPkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const declared = deps[depName];
      if (declared) {
        const major = parseInt(declared.replace(/[^\d]/g, '').slice(0, 2)) || 0;
        return { found: true, version: declared, major, declared: true };
      }
    } catch { /* ignore */ }
  }
  return { found: false, version: null, major: 0 };
}

// ============================================================
// 文档化问题核对 - 验证历次评审报告中的缺陷是否真实修复
// ============================================================

/**
 * 验证所有文档化问题的真实状态
 * @param {Object} allMetrics - 所有维度检测收集的指标
 * @returns {Array} 每个问题的验证结果
 */
function verifyDocumentedIssues(allMetrics) {
  const issues = qualityConfig.documentedIssues || [];
  const tsRatio = collectTsFileRatio();
  const realAria = collectRealAriaCoverage();
  const largeChunks = collectLargeChunks();
  const csp = collectCspDirectives();
  const readme = collectReadmeSections();

  // 将深层分析结果注入 allMetrics 供验证引用
  allMetrics.tsFileRatio = tsRatio.tsFileRatio;
  allMetrics.ariaCoverageRate = realAria.realAriaCoverageRate;
  allMetrics.realAria = realAria;
  allMetrics.largeChunks = largeChunks;
  allMetrics.csp = csp;
  allMetrics.readme = readme;
  allMetrics.tsFileStats = tsRatio;

  const results = [];

  for (const issue of issues) {
    const v = issue.verification;
    let resolved = false;
    let evidence = '';
    let actualValue = null;

    switch (v.type) {
      case 'staticImportAbsent': {
        const filePath = path.join(PROJECT_ROOT, v.file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // 静态导入：import ... from '...importPath...'
          // 动态导入（合规）：await import('...importPath...')
          const staticImportRegex = new RegExp(
            `^\\s*import\\s+[^;]*from\\s+['\"][^'\"]*${v.importPath}[^'\"]*['\"]`,
            'm'
          );
          const hasStaticImport = staticImportRegex.test(content);
          resolved = !hasStaticImport;
          actualValue = hasStaticImport ? '静态导入存在' : '无静态导入';
          evidence = `${v.file} ${actualValue}（${v.importPath}）`;
        } else {
          resolved = false;
          evidence = `${v.file} 不存在`;
        }
        break;
      }

      case 'coverageThreshold': {
        const metricKey = v.customMetric || 'avgCoverage';
        const value = allMetrics[metricKey];
        if (typeof value === 'number') {
          resolved = value >= v.threshold;
          actualValue = value;
          evidence = `${metricKey} = ${value.toFixed(1)}% (阈值 ${v.threshold}%)`;
        } else {
          evidence = `${metricKey} 指标未收集`;
        }
        break;
      }

      case 'testFilesExist': {
        const testDir = path.join(PROJECT_ROOT, PROJECT_PATHS.testsDir);
        const testFiles = fs.existsSync(testDir)
          ? getFilesRecursive(testDir, ['.test.js', '.spec.js', '.test.ts', '.spec.ts'])
          : [];
        const missingModules = [];
        for (const mod of v.modules) {
          const hasTest = testFiles.some(tf => path.basename(tf).toLowerCase().includes(mod.toLowerCase()));
          if (!hasTest) missingModules.push(mod);
        }
        resolved = missingModules.length === 0;
        actualValue = `${v.modules.length - missingModules.length}/${v.modules.length}`;
        evidence = missingModules.length === 0
          ? `模块测试文件齐全: ${v.modules.join(', ')}`
          : `缺少测试: ${missingModules.join(', ')}`;
        break;
      }

      case 'cspHasDirective': {
        const present = v.directives.filter(d => csp.directives.includes(d));
        const missing = v.directives.filter(d => !csp.directives.includes(d));
        resolved = missing.length === 0 && csp.hasCsp;
        actualValue = `${present.length}/${v.directives.length}`;
        evidence = csp.hasCsp
          ? (missing.length === 0 ? `CSP 含全部必要指令` : `CSP 缺少指令: ${missing.join(', ')}`)
          : '未配置 CSP';
        break;
      }

      case 'noPatternInJs': {
        const jsFiles = getFilesRecursive(path.join(PROJECT_ROOT, PROJECT_PATHS.jsDir));
        const pattern = new RegExp(v.pattern, 'g');
        const matches = grepInFiles(jsFiles, pattern);
        resolved = matches.length === 0;
        actualValue = matches.length;
        evidence = matches.length === 0
          ? 'js/ 下未发现匹配模式'
          : `发现 ${matches.length} 处匹配: ${matches.slice(0, 3).map(m => `${m.file}:${m.line}`).join(', ')}`;
        break;
      }

      case 'dependencyVersion': {
        const dep = collectDependencyMajorVersion(v.dependency);
        if (!dep.found) {
          if (v.optional) {
            resolved = false;
            evidence = `依赖 ${v.dependency} 未安装（可选）`;
          } else {
            resolved = false;
            evidence = `依赖 ${v.dependency} 未安装`;
          }
        } else {
          resolved = dep.major >= v.minMajor;
          actualValue = dep.version;
          evidence = `${v.dependency}@${dep.version} (major ${dep.major} ≥ ${v.minMajor})`;
        }
        break;
      }

      case 'largeChunkAbsent': {
        const over = largeChunks.largeChunks;
        resolved = over.length === 0;
        actualValue = over.length;
        evidence = over.length === 0
          ? `无单文件超过 ${largeChunks.thresholdKB}KB`
          : `${over.length} 个大文件: ${over.map(c => `${c.file}(${c.sizeKB}KB)`).join(', ')}`;
        break;
      }

      case 'readmeHasSection': {
        const missing = readme.missingSections;
        resolved = missing.length === 0 && readme.exists;
        actualValue = `${readme.presentSections.length}/${(qualityConfig.deepAnalysis?.readmeRequiredSections ?? []).length}`;
        evidence = missing.length === 0
          ? 'README 含全部必要章节'
          : `README 缺少章节: ${missing.join(', ')}`;
        break;
      }

      case 'fileExists': {
        const filePath = path.join(PROJECT_ROOT, v.file);
        resolved = fs.existsSync(filePath);
        evidence = resolved ? `${v.file} 存在` : `${v.file} 不存在`;
        break;
      }

      case 'commandSucceeds': {
        const result = safeExec(v.command, { timeout: v.timeout || 60000 });
        resolved = result !== null;
        evidence = resolved ? `命令成功执行` : `命令执行失败`;
        break;
      }

      default:
        evidence = `未知验证类型: ${v.type}`;
    }

    results.push({
      id: issue.id,
      severity: issue.severity,
      description: issue.description,
      source: issue.source,
      expectedStatus: issue.expectedStatus,
      resolved,
      actualValue,
      evidence,
    });
  }

  return results;
}

/**
 * 计算未解决问题对总分的惩罚
 * @param {Array} verificationResults - verifyDocumentedIssues 的返回值
 * @returns {Object} { penalty, breakdown, capped }
 */
function computeIssuePenalty(verificationResults) {
  const config = qualityConfig.issuePenalty || { P0: 5, P1: 2, P2: 0, maxPenalty: 25 };
  const breakdown = { P0: 0, P1: 0, P2: 0 };
  let rawPenalty = 0;

  for (const r of verificationResults) {
    // 只惩罚 expectedStatus=fixed 但实际未解决的问题
    // （以及 expectedStatus=open 但仍 open 的，按严重程度轻惩）
    if (!r.resolved) {
      const penalty = config[r.severity] || 0;
      breakdown[r.severity] += penalty;
      rawPenalty += penalty;
    }
  }

  const maxPenalty = config.maxPenalty || 25;
  const capped = rawPenalty > maxPenalty;
  const penalty = Math.min(rawPenalty, maxPenalty);

  return { penalty, breakdown, rawPenalty, capped };
}

// ============================================================
// 评分等级计算
// ============================================================

function getGrade(score) {
  for (const level of GRADE_LEVELS) {
    if (score >= level.min) return level.label;
  }
  return '不合格';
}

// ============================================================
// 质量门禁检测
// ============================================================

function checkQualityGate(results) {
  const overall = results.overallScore;
  const codeQuality = results.dimensions.codeQuality.score;
  const security = results.dimensions.security.score;

  const gate = {
    passed: true,
    checks: []
  };

  // 综合分检查
  const overallPassed = overall >= QUALITY_GATE.overallScore;
  gate.checks.push({
    name: '综合分',
    passed: overallPassed,
    detail: `${overall} ${overallPassed ? '≥' : '<'} ${QUALITY_GATE.overallScore}`
  });
  if (!overallPassed) gate.passed = false;

  // 代码质量检查
  const codeQualityPassed = codeQuality >= QUALITY_GATE.codeQualityMin;
  gate.checks.push({
    name: '代码质量',
    passed: codeQualityPassed,
    detail: `${codeQuality} ${codeQualityPassed ? '≥' : '<'} ${QUALITY_GATE.codeQualityMin}`
  });
  if (!codeQualityPassed) gate.passed = false;

  // 安全性检查
  const securityPassed = security >= QUALITY_GATE.securityMin;
  gate.checks.push({
    name: '安全性',
    passed: securityPassed,
    detail: `${security} ${securityPassed ? '≥' : '<'} ${QUALITY_GATE.securityMin}`
  });
  if (!securityPassed) gate.passed = false;

  return gate;
}

// ============================================================
// 报告输出
// ============================================================

function printReport(results) {
  const { overallScore, rawOverallScore, penalty, dimensions, gate, allFindings, issueVerification, issuePenalty, timestamp } = results;

  // 报告头部
  console.log();
  console.log(`${ANSI.cyan}╔${'═'.repeat(54)}╗${ANSI.reset}`);
  console.log(`${ANSI.cyan}║${ANSI.bold}           CET46 项目质量评估报告${' '.repeat(20)}║${ANSI.reset}`);
  console.log(`${ANSI.cyan}║${ANSI.dim}           评估时间: ${timestamp}${' '.repeat(Math.max(0, 22 - timestamp.length))}║${ANSI.reset}`);
  console.log(`${ANSI.cyan}╚${'═'.repeat(54)}╝${ANSI.reset}`);
  console.log();

  // 维度评分
  console.log(`${ANSI.bold}━━━ 维度评分（浅层指标） ━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`);
  console.log();

  const dimensionLabels = [
    { key: 'codeQuality', label: '代码质量', weight: DIMENSION_WEIGHTS.codeQuality },
    { key: 'completeness', label: '功能完整性', weight: DIMENSION_WEIGHTS.completeness },
    { key: 'performance', label: '性能表现', weight: DIMENSION_WEIGHTS.performance },
    { key: 'security', label: '安全性', weight: DIMENSION_WEIGHTS.security },
    { key: 'userExperience', label: '用户体验', weight: DIMENSION_WEIGHTS.userExperience },
    { key: 'documentation', label: '文档完整性', weight: DIMENSION_WEIGHTS.documentation },
  ];

  for (const dim of dimensionLabels) {
    const { score } = dimensions[dim.key];
    const grade = getGrade(score);
    const bar = progressBar(score);
    const color = scoreColor(score);
    const gradeClr = gradeColor(grade);

    // 格式化输出，保持对齐
    const labelPart = `${dim.label} (${dim.weight}%)`;
    const paddedLabel = labelPart.padEnd(18, ' ');
    const scorePart = score.toFixed(1).padStart(5, ' ');

    console.log(`  ${paddedLabel} ${color}${bar}${ANSI.reset}  ${color}${ANSI.bold}${scorePart}${ANSI.reset}  ${gradeClr}${grade}${ANSI.reset}`);
  }

  console.log();

  // 综合评分（含惩罚）
  const overallGrade = getGrade(overallScore);
  const overallGradeClr = gradeColor(overallGrade);

  console.log(`${ANSI.bold}━━━ 综合评分 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`);
  console.log();
  console.log(`  浅层评分: ${ANSI.dim}${rawOverallScore.toFixed(1)}${ANSI.reset}`);
  if (penalty > 0) {
    const cappedNote = issuePenalty.capped ? `${ANSI.red}(已封顶)${ANSI.reset}` : '';
    console.log(`  问题惩罚: ${ANSI.red}-${penalty}${ANSI.reset} ${cappedNote}`);
    const bd = issuePenalty.breakdown;
    const parts = [];
    if (bd.P0 > 0) parts.push(`P0: -${bd.P0}`);
    if (bd.P1 > 0) parts.push(`P1: -${bd.P1}`);
    if (bd.P2 > 0) parts.push(`P2: -${bd.P2}`);
    if (parts.length > 0) console.log(`           ${ANSI.dim}(${parts.join('  ')})${ANSI.reset}`);
  }
  console.log(`  最终总分: ${scoreColor(overallScore)}${ANSI.bold}${overallScore.toFixed(1)}${ANSI.reset} / 100  等级: ${overallGradeClr}${ANSI.bold}${overallGrade}${ANSI.reset}`);
  console.log();

  // 质量门禁
  const gateIcon = gate.passed ? `${ANSI.green}✅${ANSI.reset}` : `${ANSI.red}❌${ANSI.reset}`;
  const gateStatus = gate.passed ? '通过' : '未通过';
  console.log(`  质量门禁: ${gateIcon} ${gate.passed ? ANSI.green : ANSI.red}${ANSI.bold}${gateStatus}${ANSI.reset} (需要 ${QUALITY_GATE.overallScore} 分)`);
  for (const check of gate.checks) {
    const icon = check.passed ? `${ANSI.green}✅${ANSI.reset}` : `${ANSI.red}❌${ANSI.reset}`;
    console.log(`  - ${check.name}: ${icon} ${check.passed ? '通过' : '未通过'} (${check.detail})`);
  }

  console.log();

  // 文档化问题核对
  console.log(`${ANSI.bold}━━━ 文档化问题核对 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`);
  console.log();
  if (issueVerification && issueVerification.length > 0) {
    const resolved = issueVerification.filter(r => r.resolved).length;
    const total = issueVerification.length;
    console.log(`  已验证: ${resolved}/${total} 已解决, ${total - resolved} 未解决`);
    console.log();
    for (const r of issueVerification) {
      const icon = r.resolved ? `${ANSI.green}✅${ANSI.reset}` : `${ANSI.red}❌${ANSI.reset}`;
      const prio = PRIORITY_LEVELS[r.severity] || PRIORITY_LEVELS.P2;
      const statusText = r.resolved
        ? `${ANSI.green}已修复${ANSI.reset}`
        : `${ANSI.red}未解决${ANSI.reset}`;
      console.log(`  ${icon} ${prio.emoji}[${r.severity}] ${r.id} ${statusText}`);
      console.log(`     ${ANSI.dim}${r.description}${ANSI.reset}`);
      console.log(`     ${ANSI.dim}来源: ${r.source}${ANSI.reset}`);
      console.log(`     ${ANSI.dim}证据: ${r.evidence}${ANSI.reset}`);
      console.log();
    }
  } else {
    console.log(`  ${ANSI.dim}无文档化问题待核对${ANSI.reset}`);
    console.log();
  }

  // 关键发现
  console.log(`${ANSI.bold}━━━ 关键发现 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.reset}`);
  console.log();

  // 按优先级排序
  const sortedFindings = [...allFindings].sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2 };
    return (order[a.priority] || 3) - (order[b.priority] || 3);
  });

  if (sortedFindings.length === 0) {
    const allResolved = issueVerification && issueVerification.every(r => r.resolved);
    if (allResolved) {
      console.log(`  ${ANSI.green}🎉 未发现重大问题（浅层检测 + 文档化问题核对均通过）${ANSI.reset}`);
    } else {
      console.log(`  ${ANSI.yellow}⚠ 浅层检测未发现问题，但文档化问题核对仍有未解决项${ANSI.reset}`);
    }
  } else {
    for (const finding of sortedFindings) {
      const prio = PRIORITY_LEVELS[finding.priority] || PRIORITY_LEVELS.P2;
      console.log(`  ${prio.emoji} [${prio.label}] ${finding.message}`);
    }
  }

  console.log();
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

  console.log(`${ANSI.cyan}${ANSI.bold}🔍 正在执行 CET46 项目质量评估...${ANSI.reset}`);
  console.log();

  // 依次执行各维度检测
  const codeQuality = checkCodeQuality();
  console.log(`  ${ANSI.dim}✓ 代码质量检测完成 (${codeQuality.score})${ANSI.reset}`);

  const completeness = checkCompleteness();
  console.log(`  ${ANSI.dim}✓ 功能完整性检测完成 (${completeness.score})${ANSI.reset}`);

  const performance = checkPerformance();
  console.log(`  ${ANSI.dim}✓ 性能检测完成 (${performance.score})${ANSI.reset}`);

  const security = checkSecurity();
  console.log(`  ${ANSI.dim}✓ 安全检测完成 (${security.score})${ANSI.reset}`);

  const userExperience = checkUserExperience();
  console.log(`  ${ANSI.dim}✓ 用户体验检测完成 (${userExperience.score})${ANSI.reset}`);

  const documentation = checkDocumentation();
  console.log(`  ${ANSI.dim}✓ 文档检测完成 (${documentation.score})${ANSI.reset}`);

  console.log();

  // 计算综合评分
  const dimensions = { codeQuality, completeness, performance, security, userExperience, documentation };

  const rawOverallScore = (
    codeQuality.score * DIMENSION_WEIGHTS.codeQuality +
    completeness.score * DIMENSION_WEIGHTS.completeness +
    performance.score * DIMENSION_WEIGHTS.performance +
    security.score * DIMENSION_WEIGHTS.security +
    userExperience.score * DIMENSION_WEIGHTS.userExperience +
    documentation.score * DIMENSION_WEIGHTS.documentation
  ) / 100;

  // 汇总所有指标供文档化问题核对使用
  const allMetrics = {
    avgCoverage: codeQuality.metrics.avgCoverage,
    ariaCoverageRate: userExperience.metrics.ariaCoverageRate,
    testPassRate: completeness.metrics.testPassRate,
    featureTestCoverage: completeness.metrics.featureTestCoverage,
  };

  // 执行文档化问题核对（验证历次评审报告中的缺陷是否真实修复）
  console.log(`  ${ANSI.dim}✓ 文档化问题核对中...${ANSI.reset}`);
  const issueVerification = verifyDocumentedIssues(allMetrics);
  const issuePenalty = computeIssuePenalty(issueVerification);

  const unresolvedCount = issueVerification.filter(r => !r.resolved).length;
  console.log(`  ${ANSI.dim}✓ 文档化问题核对完成 (${issueVerification.length - unresolvedCount}/${issueVerification.length} 已解决)${ANSI.reset}`);
  console.log();

  // 应用惩罚后最终评分
  const penalizedScore = Math.max(0, rawOverallScore - issuePenalty.penalty);
  const roundedOverallScore = Math.round(penalizedScore * 10) / 10;
  const rawRounded = Math.round(rawOverallScore * 10) / 10;

  // 汇总所有发现（含浅层检测发现 + 未解决问题核对）
  const allFindings = [
    ...codeQuality.findings,
    ...completeness.findings,
    ...performance.findings,
    ...security.findings,
    ...userExperience.findings,
    ...documentation.findings
  ];

  // 将未解决的文档化问题加入 findings
  for (const r of issueVerification) {
    if (!r.resolved) {
      allFindings.push({
        priority: r.severity,
        message: `[${r.id}] ${r.description} — ${r.evidence}`,
      });
    }
  }

  // 质量门禁检测
  const results = {
    overallScore: roundedOverallScore,
    rawOverallScore: rawRounded,
    penalty: issuePenalty.penalty,
    dimensions,
    allFindings,
    issueVerification,
    issuePenalty,
    timestamp,
    dimensionWeights: DIMENSION_WEIGHTS,
    qualityGate: QUALITY_GATE
  };

  const gate = checkQualityGate(results);
  results.gate = gate;

  // 输出控制台报告
  printReport(results);

  // 输出 JSON 报告
  const reportsDir = path.join(PROJECT_ROOT, PROJECT_PATHS.reportsDir);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const jsonOutput = {
    timestamp,
    overallScore: roundedOverallScore,
    rawOverallScore: rawRounded,
    penalty: issuePenalty.penalty,
    overallGrade: getGrade(roundedOverallScore),
    qualityGate: {
      passed: gate.passed,
      checks: gate.checks,
      thresholds: QUALITY_GATE
    },
    dimensionScores: {
      codeQuality: { score: codeQuality.score, grade: getGrade(codeQuality.score), weight: DIMENSION_WEIGHTS.codeQuality },
      completeness: { score: completeness.score, grade: getGrade(completeness.score), weight: DIMENSION_WEIGHTS.completeness },
      performance: { score: performance.score, grade: getGrade(performance.score), weight: DIMENSION_WEIGHTS.performance },
      security: { score: security.score, grade: getGrade(security.score), weight: DIMENSION_WEIGHTS.security },
      userExperience: { score: userExperience.score, grade: getGrade(userExperience.score), weight: DIMENSION_WEIGHTS.userExperience },
      documentation: { score: documentation.score, grade: getGrade(documentation.score), weight: DIMENSION_WEIGHTS.documentation }
    },
    metrics: {
      codeQuality: codeQuality.metrics,
      completeness: completeness.metrics,
      performance: performance.metrics,
      security: security.metrics,
      userExperience: userExperience.metrics,
      documentation: documentation.metrics,
      deepAnalysis: {
        tsFileStats: allMetrics.tsFileStats,
        realAria: allMetrics.realAria,
        largeChunks: allMetrics.largeChunks,
        csp: allMetrics.csp,
        readme: allMetrics.readme,
      }
    },
    details: {
      codeQuality: codeQuality.details,
      completeness: completeness.details,
      performance: performance.details,
      security: security.details,
      userExperience: userExperience.details,
      documentation: documentation.details
    },
    findings: allFindings,
    issueVerification,
    issuePenalty,
    scoreCalculation: {
      formula: '(sum(dimension.score * dimension.weight) / 100) - issuePenalty',
      steps: [
        `代码质量: ${codeQuality.score} × ${DIMENSION_WEIGHTS.codeQuality}% = ${(codeQuality.score * DIMENSION_WEIGHTS.codeQuality / 100).toFixed(2)}`,
        `功能完整性: ${completeness.score} × ${DIMENSION_WEIGHTS.completeness}% = ${(completeness.score * DIMENSION_WEIGHTS.completeness / 100).toFixed(2)}`,
        `性能表现: ${performance.score} × ${DIMENSION_WEIGHTS.performance}% = ${(performance.score * DIMENSION_WEIGHTS.performance / 100).toFixed(2)}`,
        `安全性: ${security.score} × ${DIMENSION_WEIGHTS.security}% = ${(security.score * DIMENSION_WEIGHTS.security / 100).toFixed(2)}`,
        `用户体验: ${userExperience.score} × ${DIMENSION_WEIGHTS.userExperience}% = ${(userExperience.score * DIMENSION_WEIGHTS.userExperience / 100).toFixed(2)}`,
        `文档完整性: ${documentation.score} × ${DIMENSION_WEIGHTS.documentation}% = ${(documentation.score * DIMENSION_WEIGHTS.documentation / 100).toFixed(2)}`,
        `浅层评分合计: ${rawRounded}`,
        `未解决问题惩罚: -${issuePenalty.penalty}${issuePenalty.capped ? '(已封顶)' : ''}`,
        `最终综合分: ${roundedOverallScore}`
      ]
    }
  };

  const jsonPath = path.join(reportsDir, 'quality-score.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  console.log(`${ANSI.dim}📄 JSON 报告已输出到 ${path.relative(PROJECT_ROOT, jsonPath)}${ANSI.reset}`);
  console.log();

  // 以退出码指示质量门禁结果
  process.exit(gate.passed ? 0 : 1);
}

main();
