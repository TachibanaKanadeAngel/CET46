/**
 * 质量工具统一入口模块
 * 导出所有质量工具模块的统一接口，提供便捷的完整评估和快速检查方法。
 */

// 导入各子模块
import qualityConfig from './quality-config.js';
import { checklist, getAllCheckItems, getCheckItemById, getCheckItemsByCategory, getCheckItemsBySeverity, getAutoCheckItems, getChecklistStatistics } from './checklist.js';
import { IssueTracker, IssueStatus, Severity, Dimension } from './issue-tracker.js';
import { QualityWorkflow, PhaseStatus } from './workflow.js';
import { PreventionSystem } from './prevention.js';
import { ExecutionPlan, TaskStatus } from './execution-plan.js';

// 导出各模块的默认导出和命名导出
export { qualityConfig };
export { checklist, getAllCheckItems, getCheckItemById, getCheckItemsByCategory, getCheckItemsBySeverity, getAutoCheckItems, getChecklistStatistics };
export { IssueTracker, IssueStatus, Severity, Dimension };
export { QualityWorkflow, PhaseStatus };
export { PreventionSystem };
export { ExecutionPlan, TaskStatus };

// ============================================================================
// 便捷方法
// ============================================================================

/**
 * 运行完整评估
 * 包括：质量评分、检查清单验证、问题跟踪、预防规则检查
 * @returns {Object} 完整评估结果
 */
export function runFullAssessment() {
  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    qualityConfig,
    checklistStatistics: getChecklistStatistics(),
    preventionRules: new PreventionSystem().getRules(),
    phases: new ExecutionPlan().getPhases(),
  };

  return result;
}

/**
 * 运行快速检查
 * 仅运行自动检测项，不执行耗时操作（如测试覆盖率、npm audit）
 * @param {string} [code] - 待检查的代码字符串（可选，不传则仅返回检查清单统计）
 * @returns {Object} 快速检查结果
 */
export function runQuickCheck(code) {
  const timestamp = new Date().toISOString();
  const autoCheckItems = getAutoCheckItems();
  const prevention = new PreventionSystem();

  const result = {
    timestamp,
    autoCheckItemCount: autoCheckItems.length,
    autoCheckItems: autoCheckItems.map(item => ({
      id: item.id,
      category: item.category,
      item: item.item,
      severity: item.severity,
    })),
    preventionRuleCount: prevention.getRules().length,
    preventionRules: prevention.getRules(),
  };

  // 如果提供了代码，执行预防规则检查
  if (code) {
    result.preventionViolations = prevention.runPreventionChecks(code);
    result.violationCount = result.preventionViolations.length;
  }

  return result;
}

/**
 * 生成完整报告
 * 综合所有评估信息，生成格式化的完整报告
 * @param {Object} [options] - 报告选项
 * @param {boolean} [options.includeChecklist=true] - 是否包含检查清单
 * @param {boolean} [options.includeRules=true] - 是否包含预防规则
 * @param {boolean} [options.includePlan=true] - 是否包含执行计划
 * @returns {string} 格式化的完整报告文本
 */
export function generateFullReport(options = {}) {
  const {
    includeChecklist = true,
    includeRules = true,
    includePlan = true,
  } = options;

  const lines = [];
  const timestamp = new Date().toLocaleString('zh-CN');

  // 报告头部
  lines.push('╔' + '═'.repeat(58) + '╗');
  lines.push('║  CET46 项目质量工具 — 完整报告' + ' '.repeat(26) + '║');
  lines.push(`║  生成时间: ${timestamp}`.padEnd(59) + '║');
  lines.push('╚' + '═'.repeat(58) + '╝');
  lines.push('');

  // 1. 质量配置概览
  lines.push('【质量配置概览】');
  lines.push(`  配置版本: ${qualityConfig.version}`);
  lines.push(`  项目: ${qualityConfig.project.name} v${qualityConfig.project.version}`);
  lines.push(`  评估维度: ${Object.keys(qualityConfig.dimensions).length} 个`);
  const dimensionNames = Object.values(qualityConfig.dimensions).map(d => `${d.name}(${d.weight}%)`);
  lines.push(`  维度列表: ${dimensionNames.join('、')}`);
  lines.push(`  质量门禁: 合并 ≥ ${qualityConfig.qualityGates.entry.minScore} 分, 发布 ≥ ${qualityConfig.qualityGates.release.minScore} 分`);
  lines.push('');

  // 2. 检查清单统计
  if (includeChecklist) {
    const stats = getChecklistStatistics();
    lines.push('【检查清单统计】');
    lines.push(`  总检查项: ${stats.total}`);
    lines.push(`  可自动检测: ${stats.autoCheckCount}`);
    lines.push(`  需人工审查: ${stats.manualCheckCount}`);
    lines.push(`  严重程度分布: 严重 ${stats.bySeverity.critical} / 主要 ${stats.bySeverity.major} / 次要 ${stats.bySeverity.minor}`);
    lines.push('');

    // 各维度检查项数量
    lines.push('  各维度检查项:');
    for (const [category, count] of Object.entries(stats.byCategory)) {
      lines.push(`    ${category}: ${count}`);
    }
    lines.push('');
  }

  // 3. 预防规则
  if (includeRules) {
    const prevention = new PreventionSystem();
    const rules = prevention.getRules();
    lines.push('【预防规则】');
    lines.push(`  规则总数: ${rules.length}`);
    lines.push('');

    const categoryLabels = {
      security: '安全',
      performance: '性能',
      correctness: '正确性',
      maintainability: '可维护性',
    };
    const byCategory = {};
    for (const rule of rules) {
      const cat = categoryLabels[rule.category] || rule.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(rule);
    }

    for (const [cat, catRules] of Object.entries(byCategory)) {
      lines.push(`  ${cat} (${catRules.length} 条):`);
      for (const rule of catRules) {
        const severityIcon = rule.severity === 'critical' ? '🔴' : rule.severity === 'major' ? '🟡' : '🟢';
        lines.push(`    ${severityIcon} ${rule.ruleId}: ${rule.description}`);
      }
      lines.push('');
    }
  }

  // 4. 执行计划
  if (includePlan) {
    const plan = new ExecutionPlan();
    const phases = plan.getPhases();
    lines.push('【执行计划】');
    lines.push(`  阶段总数: ${phases.length}`);
    lines.push('');

    for (const phase of phases) {
      lines.push(`  ${phase.name}（${phase.duration}）`);
      lines.push(`    质量目标: ${phase.qualityTarget} 分`);
      lines.push(`    任务数: ${phase.tasks.length}`);
      lines.push(`    目标: ${phase.goals.join('；')}`);
      lines.push(`    里程碑: ${phase.milestones.map(m => m.name).join('、')}`);
      lines.push('');
    }
  }

  // 5. 已知问题
  lines.push('【已知问题】');
  for (const issue of qualityConfig.knownIssues) {
    const statusIcon = issue.status === 'fixed' ? '✅' : '⚠️';
    lines.push(`  ${statusIcon} ${issue.id}: ${issue.description}（${issue.status}）`);
  }
  lines.push('');

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

// 默认导出所有模块和便捷方法
export default {
  qualityConfig,
  checklist,
  IssueTracker,
  QualityWorkflow,
  PreventionSystem,
  ExecutionPlan,
  runFullAssessment,
  runQuickCheck,
  generateFullReport,
};
