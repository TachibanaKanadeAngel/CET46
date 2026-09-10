#!/usr/bin/env node
/**
 * CET46 全面代码检查脚本
 * 一次性发现所有问题，避免反复检查
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readFileSync, existsSync } from 'node:fs';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}`),
};

// 抑制配置
const SUPPRESSIONS_FILE = path.join(process.cwd(), 'reports/check-logs/suppressions.json');

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

// 问题收集
const issues = {
  critical: [],
  major: [],
  minor: [],
  info: [],
};

function addIssue(level, file, line, message, category) {
  if (isSuppressed(file, category)) return;
  issues[level].push({ file, line, message, category });
}

// 1. 静态分析 - ESLint
function runESLint() {
  log.section('1. 静态代码分析 (ESLint)');
  try {
    const result = execSync('npm run lint 2>&1', { encoding: 'utf-8', cwd: process.cwd() });
    log.success('ESLint 检查通过，无错误');
    return true;
  } catch (error) {
    const output = error.stdout || error.message;
    
    // 解析 ESLint 输出
    const lines = output.split('\n');
    let currentFile = '';
    
    for (const line of lines) {
      // 匹配文件路径
      const fileMatch = line.match(/^(E:\\.+)\.js/);
      if (fileMatch) {
        currentFile = fileMatch[1] + '.js';
        continue;
      }
      
      // 匹配错误/警告行
      const errorMatch = line.match(/(\d+):(\d+)\s+(error|warning)\s+(.+)/);
      if (errorMatch && currentFile) {
        const [, lineNum, , severity, message] = errorMatch;
        const level = severity === 'error' ? 'critical' : 'minor';
        addIssue(level, currentFile, lineNum, message, 'ESLint');
      }
    }
    
    const errorCount = issues.critical.filter(i => i.category === 'ESLint').length;
    const warnCount = issues.minor.filter(i => i.category === 'ESLint').length;
    
    if (errorCount > 0) {
      log.error(`ESLint 发现 ${errorCount} 个错误`);
    }
    if (warnCount > 0) {
      log.warning(`ESLint 发现 ${warnCount} 个警告`);
    }
    return errorCount === 0;
  }
}

// 2. 单元测试
function runTests() {
  log.section('2. 单元测试');
  try {
    const result = execSync('npm run test 2>&1', { encoding: 'utf-8', cwd: process.cwd() });
    
    // 解析测试结果
    const passMatch = result.match(/(\d+) passed/);
    const failMatch = result.match(/(\d+) failed/);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    
    if (failed === 0) {
      log.success(`所有测试通过 (${passed} 个用例)`);
      return true;
    } else {
      log.error(`${failed} 个测试失败`);
      addIssue('critical', 'tests/', '-', `${failed} 个测试失败`, 'Test');
      return false;
    }
  } catch (error) {
    log.error('测试执行失败');
    addIssue('critical', 'tests/', '-', '测试执行异常', 'Test');
    return false;
  }
}

// 3. 覆盖率检查
function runCoverage() {
  log.section('3. 测试覆盖率检查');
  try {
    const result = execSync('npx vitest run --coverage 2>&1', { 
      encoding: 'utf-8', 
      cwd: process.cwd(),
      timeout: 120000
    });
    
    // 解析覆盖率
    const coverageMatch = result.match(/All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/);
    
    if (coverageMatch) {
      const [, statements, branches, functions, lines] = coverageMatch;
      log.info(`覆盖率 - 语句: ${statements}%, 分支: ${branches}%, 函数: ${functions}%, 行: ${lines}%`);
      
      // 检查是否满足阈值
      if (parseFloat(statements) < 20) {
        addIssue('major', 'project', '-', `语句覆盖率 ${statements}% 低于阈值 20%`, 'Coverage');
      }
      if (parseFloat(branches) < 15) {
        addIssue('major', 'project', '-', `分支覆盖率 ${branches}% 低于阈值 15%`, 'Coverage');
      }
      
      return parseFloat(statements) >= 20;
    }
    
    return true;
  } catch (error) {
    log.error('覆盖率检查失败');
    return false;
  }
}

// 4. 构建验证
function runBuild() {
  log.section('4. 构建验证');
  let webBuildSuccess = false;
  let fileBuildSuccess = false;
  
  // Web 构建
  try {
    execSync('npm run build 2>&1', { encoding: 'utf-8', cwd: process.cwd(), timeout: 60000 });
    log.success('Web 构建成功');
    webBuildSuccess = true;
  } catch (error) {
    log.error('Web 构建失败');
    addIssue('critical', 'build', '-', 'Web 构建失败', 'Build');
  }
  
  // 单文件构建
  try {
    execSync('npm run build:file 2>&1', { encoding: 'utf-8', cwd: process.cwd(), timeout: 60000 });
    log.success('单文件构建成功');
    fileBuildSuccess = true;
  } catch (error) {
    log.error('单文件构建失败');
    addIssue('critical', 'build', '-', '单文件构建失败', 'Build');
  }
  
  return webBuildSuccess && fileBuildSuccess;
}

// 5. 代码模式检查
function checkCodePatterns() {
  log.section('5. 代码模式检查');
  
  const jsFiles = getAllJsFiles('js');
  let patternIssues = 0;
  
  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    
    // 检查 1: innerHTML 使用（XSS 风险）
    const innerHTMLMatches = content.match(/\.innerHTML\s*=/g);
    if (innerHTMLMatches && !file.includes('test')) {
      addIssue('major', relativePath, '-', 
        `发现 ${innerHTMLMatches.length} 处 innerHTML 使用，需确认已做 XSS 防护`, 
        'Security');
      patternIssues++;
    }
    
    // 检查 2: console.log 生产代码
    const consoleMatches = content.match(/console\.(log|warn|error)\(/g);
    if (consoleMatches) {
      const unguarded = content.match(/console\.(log|warn|error)\([^)]+\)(?!.*CONFIG\.DEBUG)/g);
      if (unguarded && unguarded.length > 0) {
        addIssue('minor', relativePath, '-', 
          `发现 ${unguarded.length} 处未受保护的 console 调用`, 
          'Quality');
        patternIssues++;
      }
    }
    
    // 检查 3: 潜在的空值引用
    const nullRiskPatterns = [
      /\.getElementById\([^)]+\)\.\w+/g,  // getElementById 后直接访问属性
      /\.querySelector\([^)]+\)\.\w+/g,     // querySelector 后直接访问属性
    ];
    
    for (const pattern of nullRiskPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // 检查是否有 null 检查
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i]) && !lines[i].includes('?.')) {
            // 简化检查：没有可选链可能有问题
            if (!content.includes('if (' + lines[i].match(/getElementById|querySelector/)?.[0])) {
              addIssue('minor', relativePath, i + 1, 
                '潜在的 null 引用风险，建议添加 null 检查或可选链', 
                'Robustness');
              patternIssues++;
            }
          }
        }
      }
    }
    
    // 检查 4: 硬编码敏感信息
    const sensitivePatterns = [
      /password\s*[=:]\s*["'][^"']+["']/i,
      /secret\s*[=:]\s*["'][^"']+["']/i,
      /api[_-]?key\s*[=:]\s*["'][^"']+["']/i,
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        addIssue('critical', relativePath, '-', 
          '发现潜在的硬编码敏感信息', 
          'Security');
        patternIssues++;
      }
    }
  }
  
  if (patternIssues === 0) {
    log.success('代码模式检查通过');
  } else {
    log.warning(`代码模式检查发现 ${patternIssues} 处潜在问题`);
  }
  
  return patternIssues === 0;
}

// 6. 架构合规检查
function checkArchitecture() {
  log.section('6. 架构合规检查');
  
  const violations = [];
  
  // 读取核心文件
  const coreFile = fs.existsSync('js/core.ts') ? 'js/core.ts' : 'js/core.js';
  const coreContent = fs.readFileSync(coreFile, 'utf-8');
  
  // 检查 1: core 不应依赖 UI 层
  const uiDependencies = [
    'window.UI',
    'document.',
    'getElementById',
    'querySelector',
  ];
  
  for (const dep of uiDependencies) {
    if (coreContent.includes(dep)) {
      violations.push(`${coreFile} 包含 UI 层依赖: ${dep}`);
      addIssue('major', coreFile, '-', 
        `核心模块不应依赖 UI 层: ${dep}`, 
        'Architecture');
    }
  }
  
  // 检查 2: utils 不应依赖 features
  const utilsFiles = getAllJsFiles('js/utils');
  for (const file of utilsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes("from '../features/") || content.includes('from "../features/')) {
      const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      violations.push(`${relativePath} 依赖 features 层`);
      addIssue('major', relativePath, '-', 
        '工具模块不应依赖功能模块', 
        'Architecture');
    }
  }
  
  if (violations.length === 0) {
    log.success('架构合规检查通过');
    return true;
  } else {
    log.error(`发现 ${violations.length} 处架构违规`);
    return false;
  }
}

// 辅助函数：获取所有 JS 文件
function getAllJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules')) {
      files.push(...getAllJsFiles(fullPath));
    } else if ((item.endsWith('.js') || item.endsWith('.ts')) && !item.includes('.test.')) {
      const relativePath = path.relative(process.cwd(), fullPath);
      if (!isSuppressed(relativePath, 'all')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// 生成报告
function generateReport() {
  log.section('检查报告汇总');
  
  console.log('\n');
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              CET46 全面代码检查报告                    ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  // 问题统计
  const totalIssues = issues.critical.length + issues.major.length + 
                      issues.minor.length + issues.info.length;
  
  console.log('📊 问题统计:');
  console.log(`   ${colors.red}Critical: ${issues.critical.length}${colors.reset}`);
  console.log(`   ${colors.yellow}Major:    ${issues.major.length}${colors.reset}`);
  console.log(`   ${colors.blue}Minor:    ${issues.minor.length}${colors.reset}`);
  console.log(`   ${colors.cyan}Info:     ${issues.info.length}${colors.reset}`);
  console.log(`   总计: ${totalIssues}`);
  console.log('\n');
  
  // 详细问题列表
  if (totalIssues > 0) {
    console.log('📋 详细问题列表:');
    console.log('');
    
    const printIssues = (level, color, label) => {
      if (issues[level].length > 0) {
        console.log(`${color}【${label}】${colors.reset}`);
        issues[level].forEach((issue, idx) => {
          console.log(`  ${idx + 1}. [${issue.category}] ${issue.file}:${issue.line}`);
          console.log(`     ${issue.message}`);
        });
        console.log('');
      }
    };
    
    printIssues('critical', colors.red, '严重问题');
    printIssues('major', colors.yellow, '重要问题');
    printIssues('minor', colors.blue, '一般问题');
    printIssues('info', colors.cyan, '提示信息');
  }
  
  // 结论
  console.log('');
  if (issues.critical.length === 0 && issues.major.length === 0) {
    console.log(`${colors.green}✅ 检查通过！代码质量符合标准。${colors.reset}`);
  } else if (issues.critical.length === 0) {
    console.log(`${colors.yellow}⚠️  检查通过，但存在需要关注的问题。${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ 检查未通过！存在严重问题需要立即修复。${colors.reset}`);
  }
  console.log('');
  
  // 保存报告到文件
  const reportPath = 'reports/code-review-report.md';
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportContent = generateMarkdownReport();
  fs.writeFileSync(reportPath, reportContent);
  
  log.info(`详细报告已保存至: ${reportPath}`);
}

function generateMarkdownReport() {
  const now = new Date().toISOString().split('T')[0];
  
  let md = `# 代码检查报告 - ${now}\n\n`;
  md += `## 统计摘要\n\n`;
  md += `- **Critical**: ${issues.critical.length}\n`;
  md += `- **Major**: ${issues.major.length}\n`;
  md += `- **Minor**: ${issues.minor.length}\n`;
  md += `- **Info**: ${issues.info.length}\n`;
  md += `- **总计**: ${issues.critical.length + issues.major.length + issues.minor.length + issues.info.length}\n\n`;
  
  const addSection = (level, title) => {
    if (issues[level].length > 0) {
      md += `## ${title}\n\n`;
      md += '| # | 文件 | 行号 | 类别 | 描述 |\n';
      md += '|---|------|------|------|------|\n';
      issues[level].forEach((issue, idx) => {
        md += `| ${idx + 1} | ${issue.file} | ${issue.line} | ${issue.category} | ${issue.message} |\n`;
      });
      md += '\n';
    }
  };
  
  addSection('critical', '严重问题 (Critical)');
  addSection('major', '重要问题 (Major)');
  addSection('minor', '一般问题 (Minor)');
  addSection('info', '提示信息 (Info)');
  
  return md;
}

// 主函数
async function main() {
  console.log(`${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     CET46 全面代码检查 - 一次性发现所有问题           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // 运行所有检查
  const results = {
    eslint: runESLint(),
    tests: runTests(),
    coverage: runCoverage(),
    build: runBuild(),
    patterns: checkCodePatterns(),
    architecture: checkArchitecture(),
  };
  
  // 生成报告
  generateReport();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  检查耗时: ${duration} 秒\n`);
  
  // 返回退出码
  const hasCritical = issues.critical.length > 0;
  const hasMajor = issues.major.length > 0;
  
  if (hasCritical) {
    process.exit(1);
  } else if (hasMajor) {
    process.exit(2);  // 警告退出码
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('检查脚本执行失败:', err);
  process.exit(1);
});
