/**
 * 问题预防机制模块
 * 通过分析历史问题、检查编码规范、生成代码审查模板和管理经验教训知识库，
 * 从源头预防常见质量问题的再次发生。
 */

// ============================================================================
// 内置预防规则
// ============================================================================

const PREVENTION_RULES = [
  {
    ruleId: 'PRV-001',
    category: 'correctness',
    description: '数值运算前必须检查 NaN',
    severity: 'critical',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/isNaN',
    checkFunction(code) {
      const violations = [];
      // 检测 parseInt/parseFloat 结果未做 isNaN 校验
      const parsePattern = /(?:parseInt|parseFloat)\s*\(/g;
      let match;
      while ((match = parsePattern.exec(code)) !== null) {
        const afterParse = code.slice(match.index, Math.min(code.length, match.index + 500));
        const nextLines = afterParse.split('\n').slice(0, 5).join('\n');
        if (!/isNaN|Number\.isNaN/.test(nextLines)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-001: parseInt/parseFloat 结果未进行 isNaN 校验` });
        }
      }
      // 检测算术运算可能产生 NaN 的场景（除法无守卫）
      const divPattern = /\/\s*(?!\/|\*)[^\s;)]+/g;
      while ((match = divPattern.exec(code)) !== null) {
        const beforeMatch = code.slice(Math.max(0, match.index - 200), match.index);
        const guardScope = beforeMatch.slice(-300);
        if (!/isNaN|Number\.isNaN|typeof.*number|isFinite/.test(guardScope)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-001: 除法运算前未检查 NaN/Infinity` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-002',
    category: 'correctness',
    description: '对象属性访问前必须检查 undefined',
    severity: 'critical',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
    checkFunction(code) {
      const violations = [];
      // 检测多层属性访问未使用可选链
      const deepAccessPattern = /\w+\.\w+\.\w+/g;
      let match;
      while ((match = deepAccessPattern.exec(code)) !== null) {
        const accessText = match[0];
        // 排除常见的安全模式（如 this.xxx.xxx、console.log 等）
        if (/^(console|window|document|Math|JSON|Object|Array|Number|String|this)\./.test(accessText)) continue;
        // 排除已使用可选链的情况
        const fullLine = code.split('\n').find(line => line.includes(accessText)) || '';
        if (!fullLine.includes('?.')) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-002: 多层属性访问 "${accessText}" 未使用可选链或 undefined 检查` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-003',
    category: 'security',
    description: '禁止直接使用 innerHTML',
    severity: 'critical',
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html',
    checkFunction(code) {
      const violations = [];
      const innerHTMLPattern = /\.innerHTML\s*=/g;
      let match;
      while ((match = innerHTMLPattern.exec(code)) !== null) {
        const lineNum = code.slice(0, match.index).split('\n').length;
        // 检查同一行或附近是否有 escapeHTML/sanitize/DOMPurify
        const lineStart = code.lastIndexOf('\n', match.index) + 1;
        const lineEnd = code.indexOf('\n', match.index);
        const fullLine = code.slice(lineStart, lineEnd === -1 ? code.length : lineEnd);
        const contextWindow = code.slice(Math.max(0, match.index - 100), Math.min(code.length, match.index + 200));
        if (!/escapeHTML|sanitize|DOMPurify|textContent/.test(contextWindow)) {
          violations.push({ line: lineNum, column: match.index, message: `PRV-003: 直接使用 innerHTML 赋值，存在 XSS 风险` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-004',
    category: 'correctness',
    description: 'IndexedDB 事务必须处理 onerror',
    severity: 'major',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/API/IDBTransaction/error_event',
    checkFunction(code) {
      const violations = [];
      const transactionPattern = /\.transaction\s*\(/g;
      let match;
      while ((match = transactionPattern.exec(code)) !== null) {
        const afterTransaction = code.slice(match.index, Math.min(code.length, match.index + 500));
        const nextLines = afterTransaction.split('\n').slice(0, 10).join('\n');
        if (!/onerror|\.catch|addEventListener.*error/.test(nextLines)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-004: IndexedDB 事务未处理 onerror 事件` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-005',
    category: 'correctness',
    description: '异步操作必须处理异常',
    severity: 'critical',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises#promise_%E5%BC%82%E5%B8%B8%E5%A4%84%E7%90%86',
    checkFunction(code) {
      const violations = [];
      // 检测 .then() 链未以 .catch() 结尾
      const thenPattern = /\.then\s*\([^)]*\)/g;
      let match;
      while ((match = thenPattern.exec(code)) !== null) {
        const afterThen = code.slice(match.index, Math.min(code.length, match.index + 300));
        if (!/\.catch\s*\(/.test(afterThen)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-005: .then() 链缺少 .catch() 异常处理` });
        }
      }
      // 检测 async 函数中 await 未被 try/catch 包裹
      const asyncFuncPattern = /async\s+(?:function\s+\w+|(?:\w+\s*)?\([^)]*\)\s*=>)/g;
      while ((match = asyncFuncPattern.exec(code)) !== null) {
        const funcBody = code.slice(match.index, Math.min(code.length, match.index + 1000));
        const hasAwait = /\bawait\b/.test(funcBody);
        const hasTryCatch = /\btry\s*\{/.test(funcBody);
        if (hasAwait && !hasTryCatch) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-005: async 函数含 await 但缺少 try/catch 异常处理` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-006',
    category: 'correctness',
    description: '缓存淘汰前必须持久化脏数据',
    severity: 'major',
    reference: 'https://web.dev/articles/storage-for-the-web',
    checkFunction(code) {
      const violations = [];
      // 检测 LRU 缓存淘汰（evict/delete/shift）模式
      const evictPattern = /(?:evict|lru.*delete|cache.*shift|cache.*pop|limitAudioCacheLRU)/gi;
      let match;
      while ((match = evictPattern.exec(code)) !== null) {
        const contextWindow = code.slice(Math.max(0, match.index - 200), Math.min(code.length, match.index + 300));
        if (!/persist|save|flush|sync|write|dirty| IndexedDB|put\(/i.test(contextWindow)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-006: 缓存淘汰操作前未检测脏数据持久化` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-007',
    category: 'security',
    description: '网络请求必须验证 URL（防 SSRF）',
    severity: 'critical',
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html',
    checkFunction(code) {
      const violations = [];
      const fetchPattern = /(?:fetch|axios|XMLHttpRequest|\.open\s*\()\s*\(\s*['"`]/g;
      let match;
      while ((match = fetchPattern.exec(code)) !== null) {
        const lineStart = code.lastIndexOf('\n', match.index) + 1;
        const lineEnd = code.indexOf('\n', match.index);
        const fullLine = code.slice(lineStart, lineEnd === -1 ? code.length : lineEnd);
        const contextWindow = code.slice(Math.max(0, match.index - 200), Math.min(code.length, match.index + 300));
        // 如果 URL 是动态构建的，检查是否有验证
        if (/\$\{|`[^`]*\$\{/.test(fullLine) || /url.*\+/.test(fullLine)) {
          if (!/validate.*url|ALLOWED_DOMAINS|whitelist|url.*check|isAllowedUrl|startsWith\s*\(/i.test(contextWindow)) {
            const lineNum = code.slice(0, match.index).split('\n').length;
            violations.push({ line: lineNum, column: match.index, message: `PRV-007: 动态 URL 网络请求未做域名验证，存在 SSRF 风险` });
          }
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-008',
    category: 'security',
    description: '用户输入必须过滤原型污染键',
    severity: 'critical',
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html',
    checkFunction(code) {
      const violations = [];
      // 检测 Object.assign、展开运算符用于合并用户输入
      const mergePattern = /Object\.assign\s*\(|\{\s*\.\.\./g;
      let match;
      while ((match = mergePattern.exec(code)) !== null) {
        const contextWindow = code.slice(Math.max(0, match.index - 200), Math.min(code.length, match.index + 400));
        if (!/__proto__|constructor|prototype|isSafeKey|filterKeys|sanitize.*input/i.test(contextWindow)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-008: 对象合并/展开操作未过滤 __proto__/constructor 等原型污染键` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-009',
    category: 'performance',
    description: '大型数据结构必须有容量限制',
    severity: 'major',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/length',
    checkFunction(code) {
      const violations = [];
      // 检测 Map/Array/Set 无限制增长
      const dataStructurePattern = /new\s+(Map|Array|Set|WeakMap|WeakSet)\s*\(/g;
      let match;
      while ((match = dataStructurePattern.exec(code)) !== null) {
        const contextWindow = code.slice(match.index, Math.min(code.length, match.index + 800));
        const hasLimit = /maxSize|MAX_SIZE|limit|capacity|length.*[<>=]|\.size\s*[<>=]|evict|trim|slice/i.test(contextWindow);
        if (!hasLimit) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-009: 数据结构实例未设置容量限制，可能导致内存溢出` });
        }
      }
      return violations;
    },
  },
  {
    ruleId: 'PRV-010',
    category: 'maintainability',
    description: '动画必须尊重 prefers-reduced-motion',
    severity: 'major',
    reference: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media/prefers-reduced-motion',
    checkFunction(code) {
      const violations = [];
      // 检测 CSS 动画或 JS 动画未适配 prefers-reduced-motion
      const animationPattern = /animation:|transition:|requestAnimationFrame|\.animate\s*\(/g;
      let match;
      while ((match = animationPattern.exec(code)) !== null) {
        const contextWindow = code.slice(Math.max(0, match.index - 300), Math.min(code.length, match.index + 300));
        if (!/prefers-reduced-motion|reduce.*motion|matchMedia.*motion/i.test(contextWindow)) {
          const lineNum = code.slice(0, match.index).split('\n').length;
          violations.push({ line: lineNum, column: match.index, message: `PRV-010: 动画/过渡未适配 prefers-reduced-motion` });
        }
      }
      return violations;
    },
  },
];

// ============================================================================
// 高频问题类型定义
// ============================================================================

const HIGH_FREQUENCY_ISSUE_TYPES = {
  nan_propagation: { label: 'NaN 传播', category: 'correctness' },
  undefined_access: { label: '未定义属性访问', category: 'correctness' },
  security_vulnerability: { label: '安全漏洞', category: 'security' },
  async_error: { label: '异步处理错误', category: 'correctness' },
  cache_data_loss: { label: '缓存数据丢失', category: 'correctness' },
  boundary_missing: { label: '边界条件遗漏', category: 'correctness' },
  input_validation_missing: { label: '输入验证缺失', category: 'security' },
  memory_leak: { label: '内存泄漏', category: 'performance' },
};

// ============================================================================
// 根本原因分类
// ============================================================================

const ROOT_CAUSE_CATEGORIES = {
  input_validation: { label: '输入验证缺失', frequency: 0 },
  boundary_condition: { label: '边界条件遗漏', frequency: 0 },
  async_handling: { label: '异步处理错误', frequency: 0 },
  type_safety: { label: '类型安全不足', frequency: 0 },
  error_handling: { label: '错误处理缺失', frequency: 0 },
  resource_management: { label: '资源管理不当', frequency: 0 },
  security_awareness: { label: '安全意识不足', frequency: 0 },
  design_flaw: { label: '设计缺陷', frequency: 0 },
};

// ============================================================================
// PreventionSystem 类
// ============================================================================

export class PreventionSystem {
  constructor() {
    /** @type {Array<Object>} 预防规则列表 */
    this.rules = [...PREVENTION_RULES];
    /** @type {Array<Object>} 经验教训知识库 */
    this.lessons = [];
    /** @type {Object} 历史问题分析结果缓存 */
    this._analysisCache = null;
  }

  // ==========================================================================
  // 历史问题分析
  // ==========================================================================

  /**
   * 分析历史问题数据
   * 统计高频问题类型、识别根本原因分布，生成根本原因分析报告
   * @param {Array<Object>} issues - 历史问题列表，每项含 type/category/description/rootCause 等字段
   * @returns {Object} 分析报告（高频类型统计、根因分布、报告文本）
   */
  analyzeHistoricalIssues(issues) {
    if (!Array.isArray(issues) || issues.length === 0) {
      return {
        highFrequencyTypes: {},
        rootCauseDistribution: {},
        report: '无历史问题数据可供分析',
      };
    }

    // 统计高频问题类型
    const typeCount = {};
    for (const issue of issues) {
      const type = issue.type || 'unknown';
      if (!typeCount[type]) {
        typeCount[type] = { count: 0, label: HIGH_FREQUENCY_ISSUE_TYPES[type]?.label || type, examples: [] };
      }
      typeCount[type].count++;
      if (typeCount[type].examples.length < 3) {
        typeCount[type].examples.push(issue.description || issue.title || '');
      }
    }

    // 按频率排序
    const sortedTypes = Object.entries(typeCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .reduce((acc, [key, val]) => { acc[key] = val; return acc; }, {});

    // 统计根本原因分布
    const rootCauseCount = {};
    for (const issue of issues) {
      const cause = issue.rootCause || 'unknown';
      if (!rootCauseCount[cause]) {
        rootCauseCount[cause] = {
          count: 0,
          label: ROOT_CAUSE_CATEGORIES[cause]?.label || cause,
          relatedIssues: [],
        };
      }
      rootCauseCount[cause].count++;
      rootCauseCount[cause].relatedIssues.push(issue.id || issue.title || '');
    }

    // 计算根因占比
    const totalIssues = issues.length;
    const rootCauseDistribution = {};
    for (const [key, val] of Object.entries(rootCauseCount)) {
      rootCauseDistribution[key] = {
        ...val,
        percentage: ((val.count / totalIssues) * 100).toFixed(1),
      };
    }

    // 生成分析报告
    const report = this._generateRootCauseReport(sortedTypes, rootCauseDistribution, totalIssues);

    const result = { highFrequencyTypes: sortedTypes, rootCauseDistribution, report };
    this._analysisCache = result;
    return result;
  }

  /**
   * 生成根本原因分析报告
   * @param {Object} typeStats - 高频类型统计
   * @param {Object} causeStats - 根因分布统计
   * @param {number} total - 问题总数
   * @returns {string} 报告文本
   * @private
   */
  _generateRootCauseReport(typeStats, causeStats, total) {
    const lines = [];
    lines.push('═'.repeat(60));
    lines.push('  历史问题根本原因分析报告');
    lines.push(`  分析时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`  问题总数: ${total}`);
    lines.push('═'.repeat(60));
    lines.push('');

    // 高频问题类型
    lines.push('【高频问题类型 TOP 排名】');
    const sortedTypeEntries = Object.entries(typeStats);
    for (const [type, stat] of sortedTypeEntries) {
      const pct = ((stat.count / total) * 100).toFixed(1);
      lines.push(`  ${stat.label}: ${stat.count} 次 (${pct}%)`);
      for (const ex of stat.examples) {
        lines.push(`    - ${ex}`);
      }
    }
    lines.push('');

    // 根本原因分布
    lines.push('【根本原因分布】');
    const sortedCauseEntries = Object.entries(causeStats).sort(([, a], [, b]) => b.count - a.count);
    for (const [cause, stat] of sortedCauseEntries) {
      lines.push(`  ${stat.label}: ${stat.count} 次 (${stat.percentage}%)`);
    }
    lines.push('');

    // 改进建议
    lines.push('【改进建议】');
    const topCause = sortedCauseEntries[0];
    if (topCause) {
      const suggestions = {
        input_validation: '建立统一的输入验证层，所有外部输入必须经过校验和消毒',
        boundary_condition: '制定边界条件检查清单，代码审查时重点验证空值、极值、NaN 场景',
        async_handling: '强制 async/await 配合 try/catch，禁止裸 .then() 不接 .catch()',
        type_safety: '启用 TypeScript strict 模式，使用类型守卫替代类型断言',
        error_handling: '完善错误处理策略，关键路径必须具备错误恢复机制',
        resource_management: '实现资源生命周期管理，缓存淘汰前必须持久化脏数据',
        security_awareness: '定期安全培训，建立安全编码规范和检查清单',
        design_flaw: '引入设计评审机制，核心模块变更前需经过架构评审',
      };
      const suggestion = suggestions[topCause[0]] || '针对高频根因制定专项改进计划';
      lines.push(`  首要改进方向: ${topCause[1].label}`);
      lines.push(`  建议: ${suggestion}`);
    }

    lines.push('');
    lines.push('═'.repeat(60));
    return lines.join('\n');
  }

  // ==========================================================================
  // 编码规范检查
  // ==========================================================================

  /**
   * 检查编码规范遵守情况
   * @param {string} directory - 待检查的目录路径
   * @returns {Object} 检查结果（违规列表、统计信息）
   */
  checkCodingStandards(directory) {
    const violations = [];

    // 使用内置预防规则进行代码检查
    const codeContent = this._readDirectoryCode(directory);

    if (!codeContent) {
      return { violations: [], statistics: { totalViolations: 0 }, message: '无法读取目录代码内容' };
    }

    // 执行所有预防规则检查
    for (const rule of this.rules) {
      const ruleViolations = rule.checkFunction(codeContent);
      for (const v of ruleViolations) {
        violations.push({
          ruleId: rule.ruleId,
          category: rule.category,
          description: rule.description,
          severity: rule.severity,
          line: v.line,
          column: v.column,
          message: v.message,
        });
      }
    }

    // 检查是否使用 const/let 替代 var
    const varPattern = /\bvar\s+\w+/g;
    let varMatch;
    while ((varMatch = varPattern.exec(codeContent)) !== null) {
      const lineNum = codeContent.slice(0, varMatch.index).split('\n').length;
      violations.push({
        ruleId: 'CODING-001',
        category: 'maintainability',
        description: '应使用 const/let 替代 var',
        severity: 'minor',
        line: lineNum,
        column: varMatch.index,
        message: 'CODING-001: 发现 var 声明，应使用 const 或 let',
      });
    }

    // 检查魔术数字
    const magicNumberPattern = /(?:^|[=<>+\-*/,(\s])(\d{2,})[);,\s]/gm;
    const commonNumbers = new Set(['100', '1000', '1024', '3600', '60', '24', '365', '10', '50', '80']);
    let numMatch;
    while ((numMatch = magicNumberPattern.exec(codeContent)) !== null) {
      const num = numMatch[1];
      if (commonNumbers.has(num)) continue;
      const lineNum = codeContent.slice(0, numMatch.index).split('\n').length;
      const lineStart = codeContent.lastIndexOf('\n', numMatch.index) + 1;
      const lineEnd = codeContent.indexOf('\n', numMatch.index);
      const fullLine = codeContent.slice(lineStart, lineEnd === -1 ? codeContent.length : lineEnd).trim();
      // 排除注释行和常量定义行
      if (fullLine.startsWith('//') || fullLine.startsWith('*') || /const\s+\w+\s*=/.test(fullLine)) continue;
      violations.push({
        ruleId: 'CODING-002',
        category: 'maintainability',
        description: '魔术数字应提取为命名常量',
        severity: 'minor',
        line: lineNum,
        column: numMatch.index,
        message: `CODING-002: 发现魔术数字 ${num}，建议提取为命名常量`,
      });
    }

    // 检查错误处理模式（空 catch 块）
    const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
    let catchMatch;
    while ((catchMatch = emptyCatchPattern.exec(codeContent)) !== null) {
      const lineNum = codeContent.slice(0, catchMatch.index).split('\n').length;
      violations.push({
        ruleId: 'CODING-003',
        category: 'correctness',
        description: 'catch 块不应为空',
        severity: 'major',
        line: lineNum,
        column: catchMatch.index,
        message: 'CODING-003: 发现空 catch 块，至少应记录错误日志',
      });
    }

    // 检查命名规范（驼峰命名）
    const funcDeclPattern = /(?:function|const|let)\s+([a-zA-Z_]\w*)/g;
    let nameMatch;
    while ((nameMatch = funcDeclPattern.exec(codeContent)) !== null) {
      const name = nameMatch[1];
      // 检查蛇形命名（除常量外）
      if (name.includes('_') && name !== name.toUpperCase() && !name.startsWith('_')) {
        const lineNum = codeContent.slice(0, nameMatch.index).split('\n').length;
        violations.push({
          ruleId: 'CODING-004',
          category: 'maintainability',
          description: '函数/变量应使用驼峰命名',
          severity: 'minor',
          line: lineNum,
          column: nameMatch.index,
          message: `CODING-004: "${name}" 使用了蛇形命名，应使用驼峰命名`,
        });
      }
    }

    // 统计信息
    const statistics = {
      totalViolations: violations.length,
      bySeverity: { critical: 0, major: 0, minor: 0 },
      byCategory: {},
      byRule: {},
    };

    for (const v of violations) {
      statistics.bySeverity[v.severity] = (statistics.bySeverity[v.severity] || 0) + 1;
      statistics.byCategory[v.category] = (statistics.byCategory[v.category] || 0) + 1;
      statistics.byRule[v.ruleId] = (statistics.byRule[v.ruleId] || 0) + 1;
    }

    return { violations, statistics };
  }

  /**
   * 读取目录下所有代码文件的内容
   * @param {string} directory - 目录路径
   * @returns {string|null} 合并后的代码内容
   * @private
   */
  _readDirectoryCode(directory) {
    try {
      const fs = require('fs');
      const path = require('path');
      const files = this._getFilesRecursive(directory);
      if (files.length === 0) return null;
      const contents = [];
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          // 为每个文件添加路径注释，便于定位
          contents.push(`// FILE: ${path.relative(directory, file)}`);
          contents.push(content);
        } catch {
          // 跳过无法读取的文件
        }
      }
      return contents.join('\n');
    } catch {
      // 在浏览器环境或无法使用 fs 时返回 null
      return null;
    }
  }

  /**
   * 递归获取目录下的代码文件列表
   * @param {string} dir - 目录路径
   * @param {string[]} [extensions] - 文件扩展名过滤
   * @returns {string[]} 文件路径列表
   * @private
   */
  _getFilesRecursive(dir, extensions = ['.js', '.ts', '.mjs']) {
    const results = [];
    try {
      const fs = require('fs');
      const path = require('path');
      if (!fs.existsSync(dir)) return results;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
          results.push(...this._getFilesRecursive(fullPath, extensions));
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          results.push(fullPath);
        }
      }
    } catch {
      // fs 不可用时返回空数组
    }
    return results;
  }

  // ==========================================================================
  // 代码审查模板
  // ==========================================================================

  /**
   * 生成代码审查模板
   * 基于文件类型和变更内容生成审查要点，包含安全、性能、可维护性审查
   * @param {string} file - 文件路径
   * @param {string} changes - 变更内容（diff 文本）
   * @returns {string} Markdown 格式审查清单
   */
  generateReviewTemplate(file, changes) {
    const ext = file.split('.').pop()?.toLowerCase() || '';
    const fileName = file.split('/').pop() || file;

    // 根据文件类型确定审查重点
    const fileTypeContext = this._getFileContext(ext, fileName, changes);

    const lines = [];
    lines.push(`# 代码审查清单: ${fileName}`);
    lines.push('');
    lines.push(`**文件**: \`${file}\``);
    lines.push(`**日期**: ${new Date().toISOString().split('T')[0]}`);
    lines.push(`**审查人**: ___________`);
    lines.push('');

    // 安全审查
    lines.push('## 🔒 安全审查');
    lines.push('');
    for (const item of fileTypeContext.securityChecks) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');

    // 性能审查
    lines.push('## ⚡ 性能审查');
    lines.push('');
    for (const item of fileTypeContext.performanceChecks) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');

    // 可维护性审查
    lines.push('## 🔧 可维护性审查');
    lines.push('');
    for (const item of fileTypeContext.maintainabilityChecks) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');

    // 文件类型专项审查
    if (fileTypeContext.specificChecks.length > 0) {
      lines.push(`## 📋 ${fileTypeContext.specificLabel}`);
      lines.push('');
      for (const item of fileTypeContext.specificChecks) {
        lines.push(`- [ ] ${item}`);
      }
      lines.push('');
    }

    // 预防规则提醒
    lines.push('## 🛡️ 预防规则提醒');
    lines.push('');
    const relevantRules = this._getRelevantRules(ext, changes);
    for (const rule of relevantRules) {
      const severityIcon = rule.severity === 'critical' ? '🔴' : rule.severity === 'major' ? '🟡' : '🟢';
      lines.push(`- ${severityIcon} **${rule.ruleId}**: ${rule.description}`);
    }
    lines.push('');

    // 变更影响评估
    lines.push('## 📊 变更影响评估');
    lines.push('');
    lines.push('- [ ] 变更是否影响核心功能（FSRS 算法、学习/复习流程）？');
    lines.push('- [ ] 变更是否涉及数据结构修改（IndexedDB schema、缓存结构）？');
    lines.push('- [ ] 变更是否需要同步更新测试用例？');
    lines.push('- [ ] 变更是否需要更新文档？');
    lines.push('');

    lines.push('---');
    lines.push('*此模板由 PreventionSystem 自动生成*');

    return lines.join('\n');
  }

  /**
   * 获取文件类型的审查上下文
   * @param {string} ext - 文件扩展名
   * @param {string} fileName - 文件名
   * @param {string} changes - 变更内容
   * @returns {Object} 审查上下文
   * @private
   */
  _getFileContext(ext, fileName, changes) {
    const context = {
      securityChecks: [
        '是否包含未转义的用户输入（innerHTML/outerHTML/document.write）？',
        '是否引入了新的外部请求 URL？是否做了域名白名单验证？',
        '是否使用 eval/new Function 等动态代码执行？',
        '敏感数据是否安全存储和传输？',
      ],
      performanceChecks: [
        '是否引入了不必要的同步阻塞操作？',
        '大数据结构是否设置了容量限制？',
        '动画是否适配 prefers-reduced-motion？',
        '是否正确使用 Web Worker 卸载计算密集型任务？',
      ],
      maintainabilityChecks: [
        '新增代码是否有对应的单元测试？',
        '复杂逻辑是否有充分注释？',
        '是否使用 const/let 替代 var？',
        '错误处理是否完善（无空 catch 块）？',
      ],
      specificChecks: [],
      specificLabel: '专项审查',
    };

    // 根据文件类型添加专项检查
    if (['js', 'mjs', 'ts'].includes(ext)) {
      context.specificLabel = 'JavaScript/TypeScript 专项';
      context.specificChecks = [
        '数值运算是否检查 NaN/Infinity？',
        '对象属性访问是否使用可选链或 undefined 守卫？',
        '异步操作是否有完善的错误处理（try/catch 或 .catch）？',
        'IndexedDB 操作是否处理了 onerror 事件？',
        '缓存淘汰逻辑是否在移除前持久化脏数据？',
      ];
    } else if (ext === 'html') {
      context.specificLabel = 'HTML 专项';
      context.specificChecks = [
        '交互元素是否有正确的 ARIA 属性？',
        '表单输入是否有 label 关联？',
        '图片是否有 alt 替代文本？',
        '语义化标签使用是否恰当？',
      ];
    } else if (ext === 'css') {
      context.specificLabel = 'CSS 专项';
      context.specificChecks = [
        '是否使用 prefers-reduced-motion 媒体查询？',
        '暗色模式是否适配？',
        '布局是否响应式（使用相对单位）？',
        '颜色对比度是否符合 WCAG AA 标准？',
      ];
    } else if (ext === 'json') {
      context.specificLabel = 'JSON 配置专项';
      context.specificChecks = [
        '配置项是否向后兼容？',
        '敏感信息是否误提交到配置文件？',
        'schema 变更是否需要迁移脚本？',
      ];
    }

    // 根据变更内容动态添加检查项
    if (changes) {
      if (/innerHTML|outerHTML|document\.write/.test(changes)) {
        context.securityChecks.push('⚠️ 检测到 DOM 直接写入，确认已使用 escapeHTML/sanitize 转义？');
      }
      if (/fetch|XMLHttpRequest|axios/.test(changes)) {
        context.securityChecks.push('⚠️ 检测到网络请求，确认 URL 已做域名验证？');
      }
      if (/async|await|\.then|Promise/.test(changes)) {
        context.specificChecks.push('⚠️ 检测到异步操作，确认有 try/catch 或 .catch() 异常处理？');
      }
      if (/transaction|IndexedDB|IDBDatabase/.test(changes)) {
        context.specificChecks.push('⚠️ 检测到 IndexedDB 操作，确认事务处理了 onerror 事件？');
      }
    }

    return context;
  }

  /**
   * 获取与当前文件/变更相关的预防规则
   * @param {string} ext - 文件扩展名
   * @param {string} changes - 变更内容
   * @returns {Array<Object>} 相关规则列表
   * @private
   */
  _getRelevantRules(ext, changes) {
    if (!changes) return this.rules.slice(0, 5);

    const relevant = [];
    for (const rule of this.rules) {
      try {
        const violations = rule.checkFunction(changes);
        if (violations.length > 0) {
          relevant.push(rule);
        }
      } catch {
        // 规则检查失败时跳过
      }
    }

    // 如果没有命中规则，返回前5条最相关规则
    if (relevant.length === 0) {
      if (['js', 'mjs', 'ts'].includes(ext)) {
        return this.rules.filter(r => ['PRV-001', 'PRV-002', 'PRV-003', 'PRV-005', 'PRV-008'].includes(r.ruleId));
      }
      if (ext === 'css') {
        return this.rules.filter(r => r.ruleId === 'PRV-010');
      }
      return this.rules.slice(0, 3);
    }

    return relevant;
  }

  // ==========================================================================
  // 知识库管理
  // ==========================================================================

  /**
   * 添加经验教训
   * @param {string} issue - 问题描述
   * @param {string} solution - 解决方案
   * @param {string} category - 分类（security/performance/correctness/maintainability）
   * @returns {Object} 添加的经验教训对象
   */
  addLesson(issue, solution, category) {
    const lesson = {
      id: `LESSON-${String(this.lessons.length + 1).padStart(3, '0')}`,
      issue,
      solution,
      category,
      createdAt: new Date().toISOString(),
      relatedRules: this._findRelatedRules(issue),
    };
    this.lessons.push(lesson);
    return lesson;
  }

  /**
   * 获取分类经验教训
   * @param {string} [category] - 分类筛选，不传则返回全部
   * @returns {Array<Object>} 经验教训列表
   */
  getLessons(category) {
    if (!category) return [...this.lessons];
    return this.lessons.filter(l => l.category === category);
  }

  /**
   * 导出知识库
   * @returns {Object} 可序列化的知识库数据
   */
  exportLessons() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      lessonCount: this.lessons.length,
      lessons: this.lessons,
    };
  }

  /**
   * 导入知识库
   * @param {Object} data - 知识库数据（由 exportLessons 生成）
   * @returns {number} 导入的经验教训数量
   * @throws {Error} 数据格式无效时抛出异常
   */
  importLessons(data) {
    if (!data || !Array.isArray(data.lessons)) {
      throw new Error('无效的导入数据：缺少 lessons 数组');
    }
    this.lessons = data.lessons;
    return this.lessons.length;
  }

  /**
   * 根据问题描述查找相关预防规则
   * @param {string} issue - 问题描述
   * @returns {string[]} 相关规则 ID 列表
   * @private
   */
  _findRelatedRules(issue) {
    const related = [];
    const lowerIssue = issue.toLowerCase();
    for (const rule of this.rules) {
      if (lowerIssue.includes(rule.description.toLowerCase()) ||
          lowerIssue.includes(rule.category) ||
          rule.description.toLowerCase().split(/\s+/).some(word => word.length > 3 && lowerIssue.includes(word))) {
        related.push(rule.ruleId);
      }
    }
    return related;
  }

  // ==========================================================================
  // 预防规则查询
  // ==========================================================================

  /**
   * 获取所有预防规则
   * @returns {Array<Object>} 预防规则列表（不含 checkFunction）
   */
  getRules() {
    return this.rules.map(({ ruleId, category, description, severity, reference }) => ({
      ruleId,
      category,
      description,
      severity,
      reference,
    }));
  }

  /**
   * 按规则 ID 获取预防规则
   * @param {string} ruleId - 规则 ID
   * @returns {Object|null} 规则对象（不含 checkFunction）
   */
  getRuleById(ruleId) {
    const rule = this.rules.find(r => r.ruleId === ruleId);
    if (!rule) return null;
    const { checkFunction, ...rest } = rule;
    return rest;
  }

  /**
   * 按类别获取预防规则
   * @param {string} category - 规则类别
   * @returns {Array<Object>} 该类别的规则列表（不含 checkFunction）
   */
  getRulesByCategory(category) {
    return this.rules
      .filter(r => r.category === category)
      .map(({ ruleId, category: cat, description, severity, reference }) => ({
        ruleId,
        category: cat,
        description,
        severity,
        reference,
      }));
  }

  /**
   * 对指定代码执行预防规则检查
   * @param {string} code - 待检查的代码字符串
   * @param {string[]} [ruleIds] - 指定规则 ID（不传则执行全部规则）
   * @returns {Array<Object>} 违规列表
   */
  runPreventionChecks(code, ruleIds) {
    const targetRules = ruleIds
      ? this.rules.filter(r => ruleIds.includes(r.ruleId))
      : this.rules;

    const allViolations = [];
    for (const rule of targetRules) {
      try {
        const violations = rule.checkFunction(code);
        for (const v of violations) {
          allViolations.push({
            ruleId: rule.ruleId,
            category: rule.category,
            severity: rule.severity,
            description: rule.description,
            ...v,
          });
        }
      } catch {
        // 规则执行异常时跳过
      }
    }

    return allViolations;
  }
}

export default PreventionSystem;
