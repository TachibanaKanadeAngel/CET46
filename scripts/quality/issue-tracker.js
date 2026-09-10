/**
 * 问题跟踪模块
 * 提供质量问题的添加、更新、筛选、统计、导入导出及报告生成功能。
 */

/**
 * 问题状态枚举
 */
export const IssueStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  FIXED: 'fixed',
  VERIFIED: 'verified',
  WONT_FIX: 'wont_fix',
  FALSE_POSITIVE: 'false_positive',
};

/**
 * 严重程度枚举
 */
export const Severity = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
};

/**
 * 维度枚举
 */
export const Dimension = {
  CODE_QUALITY: '代码质量',
  FUNCTIONAL: '功能完整性',
  PERFORMANCE: '性能',
  SECURITY: '安全',
  UX: '用户体验',
  DOCUMENTATION: '文档',
};

export class IssueTracker {
  constructor() {
    /** @type {Array<Object>} 问题列表 */
    this.issues = [];
    /** @type {number} 自增 ID 计数器 */
    this._nextId = 1;
  }

  /**
   * 添加问题
   * @param {Object} issue - 问题对象
   * @param {string} issue.title - 问题标题
   * @param {string} issue.severity - 严重程度（critical/major/minor）
   * @param {string} issue.dimension - 所属维度
   * @param {string} [issue.file] - 所在文件路径
   * @param {number} [issue.line] - 所在行号
   * @param {string} [issue.description] - 详细描述
   * @param {string} [issue.status] - 初始状态（默认 open）
   * @param {string} [issue.checkId] - 关联的检查项 ID（如 CQ-001）
   * @returns {Object} 添加后的问题对象（含 id 和 createdAt）
   */
  addIssue(issue) {
    const newIssue = {
      id: this._nextId++,
      title: issue.title || '未命名问题',
      severity: issue.severity || Severity.MINOR,
      dimension: issue.dimension || Dimension.CODE_QUALITY,
      file: issue.file || null,
      line: issue.line || null,
      description: issue.description || '',
      status: issue.status || IssueStatus.OPEN,
      checkId: issue.checkId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.issues.push(newIssue);
    return newIssue;
  }

  /**
   * 更新问题状态
   * @param {number} id - 问题 ID
   * @param {Object} updates - 更新字段对象
   * @returns {Object|null} 更新后的问题对象，未找到返回 null
   */
  updateIssue(id, updates) {
    const issue = this.issues.find(i => i.id === id);
    if (!issue) return null;

    const allowedFields = ['title', 'severity', 'dimension', 'file', 'line', 'description', 'status', 'checkId'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        issue[field] = updates[field];
      }
    }
    issue.updatedAt = new Date().toISOString();
    return issue;
  }

  /**
   * 按条件筛选问题
   * @param {Object} [filter] - 筛选条件
   * @param {string} [filter.severity] - 按严重程度筛选
   * @param {string} [filter.dimension] - 按维度筛选
   * @param {string} [filter.status] - 按状态筛选
   * @param {string} [filter.file] - 按文件路径筛选（支持部分匹配）
   * @param {string} [filter.checkId] - 按检查项 ID 筛选
   * @returns {Array} 符合条件的问题数组
   */
  getIssues(filter = {}) {
    return this.issues.filter(issue => {
      if (filter.severity && issue.severity !== filter.severity) return false;
      if (filter.dimension && issue.dimension !== filter.dimension) return false;
      if (filter.status && issue.status !== filter.status) return false;
      if (filter.file && (!issue.file || !issue.file.includes(filter.file))) return false;
      if (filter.checkId && issue.checkId !== filter.checkId) return false;
      return true;
    });
  }

  /**
   * 按 ID 获取问题
   * @param {number} id - 问题 ID
   * @returns {Object|undefined} 问题对象
   */
  getIssueById(id) {
    return this.issues.find(i => i.id === id);
  }

  /**
   * 获取统计信息
   * @returns {Object} 各严重程度数量、各维度数量、各状态数量
   */
  getStatistics() {
    const bySeverity = { critical: 0, major: 0, minor: 0 };
    const byDimension = {};
    const byStatus = {};

    for (const issue of this.issues) {
      // 按严重程度统计
      if (bySeverity[issue.severity] !== undefined) {
        bySeverity[issue.severity]++;
      }

      // 按维度统计
      byDimension[issue.dimension] = (byDimension[issue.dimension] || 0) + 1;

      // 按状态统计
      byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
    }

    return {
      total: this.issues.length,
      bySeverity,
      byDimension,
      byStatus,
    };
  }

  /**
   * 导出为 JSON 字符串
   * @returns {string} JSON 格式的问题列表
   */
  exportJSON() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      nextId: this._nextId,
      issues: this.issues,
    }, null, 2);
  }

  /**
   * 从 JSON 字符串导入
   * @param {string} json - JSON 格式的问题列表
   * @returns {number} 导入的问题数量
   * @throws {Error} JSON 解析失败时抛出异常
   */
  importJSON(json) {
    const data = JSON.parse(json);
    if (!data.issues || !Array.isArray(data.issues)) {
      throw new Error('无效的导入数据：缺少 issues 数组');
    }

    this.issues = data.issues;
    this._nextId = data.nextId || (Math.max(...data.issues.map(i => i.id), 0) + 1);
    return this.issues.length;
  }

  /**
   * 生成格式化报告
   * @returns {string} 文本格式的质量报告
   */
  generateReport() {
    const stats = this.getStatistics();
    const lines = [];

    lines.push('═'.repeat(60));
    lines.push('  质量问题跟踪报告');
    lines.push(`  生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('═'.repeat(60));

    // 概要统计
    lines.push('');
    lines.push('【概要统计】');
    lines.push(`  问题总数: ${stats.total}`);
    lines.push(`  严重: ${stats.bySeverity.critical}  |  主要: ${stats.bySeverity.major}  |  次要: ${stats.bySeverity.minor}`);
    lines.push('');

    // 按维度统计
    lines.push('【按维度统计】');
    for (const [dim, count] of Object.entries(stats.byDimension)) {
      lines.push(`  ${dim}: ${count}`);
    }
    lines.push('');

    // 按状态统计
    lines.push('【按状态统计】');
    const statusLabels = {
      open: '待处理',
      in_progress: '处理中',
      fixed: '已修复',
      verified: '已验证',
      wont_fix: '不修复',
      false_positive: '误报',
    };
    for (const [status, count] of Object.entries(stats.byStatus)) {
      lines.push(`  ${statusLabels[status] || status}: ${count}`);
    }

    // 按严重程度列出问题详情
    const severityOrder = ['critical', 'major', 'minor'];
    const severityLabels = { critical: '🔴 严重', major: '🟠 主要', minor: '🟡 次要' };

    for (const severity of severityOrder) {
      const issues = this.getIssues({ severity });
      if (issues.length === 0) continue;

      lines.push('');
      lines.push(`【${severityLabels[severity]}】(${issues.length} 项)`);
      lines.push('-'.repeat(50));

      for (const issue of issues) {
        lines.push(`  #${issue.id} ${issue.title}`);
        if (issue.file) {
          lines.push(`    文件: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
        if (issue.checkId) {
          lines.push(`    检查项: ${issue.checkId}`);
        }
        lines.push(`    维度: ${issue.dimension}  |  状态: ${statusLabels[issue.status] || issue.status}`);
        if (issue.description) {
          lines.push(`    描述: ${issue.description}`);
        }
        lines.push('');
      }
    }

    lines.push('═'.repeat(60));
    return lines.join('\n');
  }
}

export default IssueTracker;
