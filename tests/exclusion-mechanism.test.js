/**
 * 排除机制测试 - globMatch / accepted-issues / suppressions
 * 覆盖正向和反向测试用例各5+个
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════
// globMatch 测试
// ═══════════════════════════════════════════════════════════

// 从 check-code-quality.mjs 提取 globMatch 逻辑进行独立测试
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

describe('globMatch 通配符匹配', () => {
  // 正向测试 - 应该匹配
  describe('正向: 应匹配', () => {
    it('精确匹配无通配符', () => {
      expect(globMatch('js/main.js', 'js/main.js')).toBe(true);
    });

    it('单星号匹配文件名', () => {
      expect(globMatch('js/workers/*.js', 'js/workers/fsrs-worker.js')).toBe(true);
    });

    it('单星号匹配另一个文件', () => {
      expect(globMatch('js/workers/*.js', 'js/workers/semantic-worker.js')).toBe(true);
    });

    it('双星号匹配多级目录', () => {
      expect(globMatch('js/data/**', 'js/data/default_vocab.js')).toBe(true);
    });

    it('问号匹配单个字符', () => {
      expect(globMatch('js/core.j?', 'js/core.js')).toBe(true);
    });

    it('问号匹配 .ts 扩展名', () => {
      expect(globMatch('js/core.??', 'js/core.ts')).toBe(true);
    });

    it('通配符匹配 sw.js', () => {
      expect(globMatch('*.js', 'sw.js')).toBe(true);
    });

    it('scripts 目录通配符', () => {
      expect(globMatch('scripts/*.mjs', 'scripts/check-code-quality.mjs')).toBe(true);
    });
  });

  // 反向测试 - 不应匹配
  describe('反向: 不应匹配', () => {
    it('精确不匹配不同文件', () => {
      expect(globMatch('js/main.js', 'js/core.js')).toBe(false);
    });

    it('通配符不匹配不同目录', () => {
      expect(globMatch('js/workers/*.js', 'js/main.js')).toBe(false);
    });

    it('通配符不匹配不同扩展名', () => {
      expect(globMatch('js/workers/*.js', 'js/workers/worker.ts')).toBe(false);
    });

    it('问号不匹配多个字符', () => {
      expect(globMatch('js/core.j?', 'js/core.json')).toBe(false);
    });

    it('空模式不匹配', () => {
      expect(globMatch('', 'js/main.js')).toBe(false);
    });

    it('空字符串不匹配', () => {
      expect(globMatch('js/main.js', '')).toBe(false);
    });

    it('null 不匹配', () => {
      expect(globMatch(null, 'js/main.js')).toBe(false);
    });

    it('双星号不匹配目录外文件', () => {
      expect(globMatch('js/data/**', 'js/core.js')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// accepted-issues 过滤测试
// ═══════════════════════════════════════════════════════════

describe('accepted-issues 过滤逻辑', () => {
  const acceptedIssues = [
    {
      id: 'ACCEPT-001',
      file: 'js/main.js',
      category: 'ESLint',
      message: 'no-promise-executor-return',
      reason: '合法模式',
      status: 'accepted'
    },
    {
      id: 'ACCEPT-003',
      file: 'js/workers/*.js',
      category: 'Quality',
      message: 'console usage in Worker',
      reason: 'Worker架构限制',
      status: 'accepted'
    },
    {
      id: 'ACCEPT-004',
      file: 'sw.js',
      category: 'Quality',
      message: 'console usage in Service Worker',
      reason: 'SW独立上下文',
      status: 'accepted'
    }
  ];

  function isAccepted(file, category, message) {
    return acceptedIssues.some(a =>
      globMatch(a.file, file) && a.category === category && a.message === message
    );
  }

  // 正向测试 - 应被接受
  describe('正向: 应被接受过滤', () => {
    it('精确匹配 js/main.js 的 ESLint 问题', () => {
      expect(isAccepted('js/main.js', 'ESLint', 'no-promise-executor-return')).toBe(true);
    });

    it('通配符匹配 Worker 文件的 console 问题', () => {
      expect(isAccepted('js/workers/fsrs-worker.js', 'Quality', 'console usage in Worker')).toBe(true);
    });

    it('通配符匹配另一个 Worker 文件', () => {
      expect(isAccepted('js/workers/semantic-worker.js', 'Quality', 'console usage in Worker')).toBe(true);
    });

    it('精确匹配 sw.js 的 console 问题', () => {
      expect(isAccepted('sw.js', 'Quality', 'console usage in Service Worker')).toBe(true);
    });

    it('通配符匹配 particle-worker', () => {
      expect(isAccepted('js/workers/particle-worker.js', 'Quality', 'console usage in Worker')).toBe(true);
    });
  });

  // 反向测试 - 不应被接受
  describe('反向: 不应被接受过滤', () => {
    it('不同类别不应匹配', () => {
      expect(isAccepted('js/main.js', 'Quality', 'no-promise-executor-return')).toBe(false);
    });

    it('不同消息不应匹配', () => {
      expect(isAccepted('js/main.js', 'ESLint', 'no-unused-vars')).toBe(false);
    });

    it('主线程代码的 console 不应被接受', () => {
      expect(isAccepted('js/core.js', 'Quality', 'console usage in Worker')).toBe(false);
    });

    it('非 Worker 目录不应匹配 Worker 通配符', () => {
      expect(isAccepted('js/features/study.js', 'Quality', 'console usage in Worker')).toBe(false);
    });

    it('空参数不应匹配', () => {
      expect(isAccepted('', 'ESLint', 'no-promise-executor-return')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// suppressions 过滤测试
// ═══════════════════════════════════════════════════════════

describe('suppressions 抑制清单过滤逻辑', () => {
  const suppressions = [
    { id: 'SUP-001', pattern: 'js/data/**', check: 'check-code-quality', reason: '数据文件' },
    { id: 'SUP-002', pattern: 'js/data/default_vocab.js', check: 'all', reason: '词库数据' },
    { id: 'SUP-003', pattern: 'js/workers/*.js', check: 'console-usage', reason: 'Worker' },
    { id: 'SUP-004', pattern: 'sw.js', check: 'console-usage', reason: 'Service Worker' },
    { id: 'SUP-005', pattern: 'scripts/*.mjs', check: 'console-usage', reason: '构建脚本' },
    { id: 'SUP-006', pattern: 'js/utils/logger.js', check: 'console-usage', reason: 'logger模块' }
  ];

  function isSuppressed(file, checkName) {
    return suppressions.some(s =>
      globMatch(s.pattern, file) && (s.check === checkName || s.check === 'all')
    );
  }

  // 正向测试 - 应被抑制
  describe('正向: 应被抑制过滤', () => {
    it('data 目录文件被 check-code-quality 抑制', () => {
      expect(isSuppressed('js/data/default_vocab.js', 'check-code-quality')).toBe(true);
    });

    it('data 目录子文件被通配符抑制', () => {
      expect(isSuppressed('js/data/other_data.js', 'check-code-quality')).toBe(true);
    });

    it('Worker 文件被 console-usage 抑制', () => {
      expect(isSuppressed('js/workers/fsrs-worker.js', 'console-usage')).toBe(true);
    });

    it('sw.js 被 console-usage 抑制', () => {
      expect(isSuppressed('sw.js', 'console-usage')).toBe(true);
    });

    it('logger.js 被 console-usage 抑制', () => {
      expect(isSuppressed('js/utils/logger.js', 'console-usage')).toBe(true);
    });

    it('all 检查名匹配任意检查', () => {
      expect(isSuppressed('js/data/default_vocab.js', 'any-check-name')).toBe(true);
    });
  });

  // 反向测试 - 不应被抑制
  describe('反向: 不应被抑制过滤', () => {
    it('主线程 JS 文件不应被抑制', () => {
      expect(isSuppressed('js/core.js', 'console-usage')).toBe(false);
    });

    it('Worker 文件不应被非 console-usage 检查抑制', () => {
      expect(isSuppressed('js/workers/fsrs-worker.js', 'check-code-quality')).toBe(false);
    });

    it('features 文件不应被抑制', () => {
      expect(isSuppressed('js/features/study.js', 'console-usage')).toBe(false);
    });

    it('scripts 文件不应被非 console-usage 检查抑制', () => {
      expect(isSuppressed('scripts/check-code-quality.mjs', 'check-code-quality')).toBe(false);
    });

    it('空文件路径不应被抑制', () => {
      expect(isSuppressed('', 'console-usage')).toBe(false);
    });

    it('不存在的文件不应被抑制', () => {
      expect(isSuppressed('nonexistent.js', 'console-usage')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// accepted-issues.json 文件格式验证
// ═══════════════════════════════════════════════════════════

describe('accepted-issues.json 文件格式', () => {
  const acceptedPath = path.join(process.cwd(), 'reports/check-logs/accepted-issues.json');

  it('文件应存在', () => {
    expect(fs.existsSync(acceptedPath)).toBe(true);
  });

  it('应为有效 JSON 数组', () => {
    const content = fs.readFileSync(acceptedPath, 'utf-8');
    const data = JSON.parse(content);
    expect(Array.isArray(data)).toBe(true);
  });

  it('每条记录应包含必填字段', () => {
    const content = fs.readFileSync(acceptedPath, 'utf-8');
    const data = JSON.parse(content);
    const requiredFields = ['id', 'file', 'category', 'message', 'reason', 'status', 'acceptedAt', 'acceptedBy'];
    for (const item of data) {
      for (const field of requiredFields) {
        expect(item).toHaveProperty(field);
      }
    }
  });

  it('每条记录的 status 应为 accepted', () => {
    const content = fs.readFileSync(acceptedPath, 'utf-8');
    const data = JSON.parse(content);
    for (const item of data) {
      expect(item.status).toBe('accepted');
    }
  });

  it('应包含 reviewedBy 和 updatedAt 字段', () => {
    const content = fs.readFileSync(acceptedPath, 'utf-8');
    const data = JSON.parse(content);
    for (const item of data) {
      expect(item).toHaveProperty('reviewedBy');
      expect(item).toHaveProperty('updatedAt');
    }
  });
});

// ═══════════════════════════════════════════════════════════
// suppressions.json 文件格式验证
// ═══════════════════════════════════════════════════════════

describe('suppressions.json 文件格式', () => {
  const suppressionsPath = path.join(process.cwd(), 'reports/check-logs/suppressions.json');

  it('文件应存在', () => {
    expect(fs.existsSync(suppressionsPath)).toBe(true);
  });

  it('应为有效 JSON 对象', () => {
    const content = fs.readFileSync(suppressionsPath, 'utf-8');
    const data = JSON.parse(content);
    expect(data).toHaveProperty('entries');
    expect(Array.isArray(data.entries)).toBe(true);
  });

  it('每条记录应包含必填字段', () => {
    const content = fs.readFileSync(suppressionsPath, 'utf-8');
    const data = JSON.parse(content);
    const requiredFields = ['id', 'pattern', 'check', 'reason', 'addedAt', 'addedBy'];
    for (const item of data.entries) {
      for (const field of requiredFields) {
        expect(item).toHaveProperty(field);
      }
    }
  });

  it('check 字段应为 all 或具体检查名', () => {
    const content = fs.readFileSync(suppressionsPath, 'utf-8');
    const data = JSON.parse(content);
    const validChecks = ['all', 'console-usage', 'check-code-quality'];
    for (const item of data.entries) {
      expect(validChecks).toContain(item.check);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SKIP_FILES 与 suppressions.json 一致性验证
// ═══════════════════════════════════════════════════════════

describe('SKIP_FILES 与 suppressions.json 一致性', () => {
  const SKIP_FILES = ['js/data/default_vocab.js'];

  it('SKIP_FILES 中的文件应在 suppressions.json 中有对应条目', () => {
    const suppressionsPath = path.join(process.cwd(), 'reports/check-logs/suppressions.json');
    const content = fs.readFileSync(suppressionsPath, 'utf-8');
    const data = JSON.parse(content);
    const patterns = data.entries.map(e => e.pattern);

    for (const skipFile of SKIP_FILES) {
      const hasMatch = patterns.some(p => globMatch(p, skipFile));
      expect(hasMatch).toBe(true);
    }
  });

  it('suppressions.json 的 all 规则应覆盖 SKIP_FILES', () => {
    const suppressionsPath = path.join(process.cwd(), 'reports/check-logs/suppressions.json');
    const content = fs.readFileSync(suppressionsPath, 'utf-8');
    const data = JSON.parse(content);
    const allRules = data.entries.filter(e => e.check === 'all');

    for (const skipFile of SKIP_FILES) {
      const covered = allRules.some(r => globMatch(r.pattern, skipFile));
      expect(covered).toBe(true);
    }
  });
});
