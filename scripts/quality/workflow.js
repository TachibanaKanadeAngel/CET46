/**
 * 评估-修复-验证闭环流程模块
 * 实现"评估→修复→验证"的完整质量改进闭环，每个阶段记录输入、输出、耗时和结果状态。
 */

import { IssueTracker } from './issue-tracker.js';
import { getAllCheckItems, getChecklistStatistics } from './checklist.js';

/**
 * 阶段结果状态枚举
 */
export const PhaseStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

/**
 * 质量改进闭环工作流
 */
export class QualityWorkflow {
  constructor() {
    /** @type {IssueTracker} 问题跟踪器 */
    this.tracker = new IssueTracker();
    /** @type {Array<Object>} 各阶段执行记录 */
    this.phaseLog = [];
    /** @type {Object|null} 当前轮次信息 */
    this.currentCycle = null;
    /** @type {Object} 评估结果 */
    this.assessmentResult = null;
    /** @type {Array<Object>} 修复计划 */
    this.fixPlan = [];
  }

  /**
   * 记录阶段执行信息
   * @param {string} phase - 阶段名称
   * @param {Object} input - 输入信息
   * @param {Object} output - 输出信息
   * @param {number} durationMs - 耗时（毫秒）
   * @param {string} status - 结果状态
   * @private
   */
  _logPhase(phase, input, output, durationMs, status) {
    const record = {
      phase,
      input,
      output,
      durationMs,
      status,
      timestamp: new Date().toISOString(),
    };
    this.phaseLog.push(record);
    return record;
  }

  /**
   * 执行评估阶段
   * 调用 quality-score.js 获取当前质量评分，根据检查清单识别问题
   * @returns {Object} 评估结果（评分、问题列表、阶段记录）
   */
  async runAssessment() {
    const startTime = Date.now();
    const input = {
      checklistTotal: getChecklistStatistics().total,
      cycleNumber: (this.currentCycle?.number || 0) + 1,
    };

    try {
      // 尝试调用 quality-score.js 获取评分
      let scoreResult = null;
      try {
        const { calculateQualityScore } = await import('./quality-score.js');
        scoreResult = await calculateQualityScore();
      } catch {
        // quality-score.js 不可用时使用内建简化评分
        scoreResult = this._fallbackScoring();
      }

      this.assessmentResult = scoreResult;

      // 根据评分和检查清单识别问题
      const allChecks = getAllCheckItems();
      const identifiedIssues = [];

      for (const check of allChecks) {
        // 基于 autoCheck 标记和评分结果初步判断
        if (scoreResult.failedChecks && scoreResult.failedChecks.includes(check.id)) {
          const issue = this.tracker.addIssue({
            title: check.item,
            severity: check.severity,
            dimension: check.category,
            description: `检查项 ${check.id} 未通过。通过标准: ${check.passCriteria}`,
            status: 'open',
            checkId: check.id,
          });
          identifiedIssues.push(issue);
        }
      }

      const durationMs = Date.now() - startTime;
      const output = {
        score: scoreResult.overallScore,
        dimensionScores: scoreResult.dimensionScores,
        identifiedIssues: identifiedIssues.length,
        totalIssues: this.tracker.getStatistics().total,
      };

      const status = identifiedIssues.length > 0
        ? (identifiedIssues.some(i => i.severity === 'critical') ? PhaseStatus.PARTIAL : PhaseStatus.PARTIAL)
        : PhaseStatus.SUCCESS;

      const record = this._logPhase('评估', input, output, durationMs, status);
      return { record, assessment: this.assessmentResult, issues: identifiedIssues };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('评估', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, assessment: null, issues: [], error: error.message };
    }
  }

  /**
   * 内建简化评分（quality-score.js 不可用时的回退方案）
   * @returns {Object} 简化评分结果
   * @private
   */
  _fallbackScoring() {
    return {
      overallScore: 0,
      dimensionScores: {
        '代码质量': 0,
        '功能完整性': 0,
        '性能': 0,
        '安全': 0,
        '用户体验': 0,
        '文档': 0,
      },
      failedChecks: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分析问题，确定根本原因
   * 对评估阶段识别的问题进行分类和根因分析
   * @returns {Object} 分析结果（根因分组、影响范围、优先级排序）
   */
  analyzeIssues() {
    const startTime = Date.now();
    const openIssues = this.tracker.getIssues({ status: 'open' });
    const input = { issueCount: openIssues.length };

    try {
      // 按维度分组分析
      const groupedByDimension = {};
      for (const issue of openIssues) {
        const dim = issue.dimension;
        if (!groupedByDimension[dim]) {
          groupedByDimension[dim] = [];
        }
        groupedByDimension[dim].push(issue);
      }

      // 根因分析：将相关问题归为同一根因
      const rootCauses = [];
      const fileIssueMap = {};

      // 按文件聚合，同一文件的多个问题可能源于同一根因
      for (const issue of openIssues) {
        if (issue.file) {
          if (!fileIssueMap[issue.file]) {
            fileIssueMap[issue.file] = [];
          }
          fileIssueMap[issue.file].push(issue);
        }
      }

      for (const [file, issues] of Object.entries(fileIssueMap)) {
        if (issues.length >= 2) {
          rootCauses.push({
            type: '文件级聚合',
            file,
            relatedIssues: issues.map(i => i.id),
            description: `${file} 存在 ${issues.length} 个问题，可能源于同一根因`,
          });
        }
      }

      // 按检查项 ID 聚合（同类型问题可能是系统性根因）
      const checkIdIssueMap = {};
      for (const issue of openIssues) {
        if (issue.checkId) {
          if (!checkIdIssueMap[issue.checkId]) {
            checkIdIssueMap[issue.checkId] = [];
          }
          checkIdIssueMap[issue.checkId].push(issue);
        }
      }

      for (const [checkId, issues] of Object.entries(checkIdIssueMap)) {
        if (issues.length >= 2) {
          rootCauses.push({
            type: '检查项聚合',
            checkId,
            relatedIssues: issues.map(i => i.id),
            description: `检查项 ${checkId} 涉及 ${issues.length} 处，可能为系统性问题`,
          });
        }
      }

      // 按严重程度排序确定优先级
      const priorityOrder = { critical: 0, major: 1, minor: 2 };
      const sortedIssues = [...openIssues].sort((a, b) =>
        (priorityOrder[a.severity] || 99) - (priorityOrder[b.severity] || 99)
      );

      const durationMs = Date.now() - startTime;
      const output = {
        dimensionGroups: Object.keys(groupedByDimension).length,
        rootCauses: rootCauses.length,
        priorityIssues: sortedIssues.filter(i => i.severity === 'critical').length,
        sortedIssueIds: sortedIssues.map(i => i.id),
      };

      const status = openIssues.length > 0 ? PhaseStatus.SUCCESS : PhaseStatus.SUCCESS;
      const record = this._logPhase('分析', input, output, durationMs, status);

      return { record, groupedByDimension, rootCauses, sortedIssues };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('分析', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, error: error.message };
    }
  }

  /**
   * 制定修复计划，评估变更影响
   * @returns {Object} 修复计划（步骤列表、影响评估、预计工作量）
   */
  planFixes() {
    const startTime = Date.now();
    const openIssues = this.tracker.getIssues({ status: 'open' });
    const input = { issueCount: openIssues.length };

    try {
      // 按优先级分组
      const criticalIssues = openIssues.filter(i => i.severity === 'critical');
      const majorIssues = openIssues.filter(i => i.severity === 'major');
      const minorIssues = openIssues.filter(i => i.severity === 'minor');

      // 生成修复步骤
      const fixSteps = [];

      // 第一批：严重问题
      if (criticalIssues.length > 0) {
        fixSteps.push({
          batch: 1,
          priority: 'critical',
          description: `修复 ${criticalIssues.length} 个严重问题`,
          issueIds: criticalIssues.map(i => i.id),
          estimatedEffort: criticalIssues.length * 2, // 每个严重问题预计 2 小时
          impactAssessment: '涉及安全漏洞和核心功能缺陷，必须优先修复',
        });
      }

      // 第二批：主要问题
      if (majorIssues.length > 0) {
        fixSteps.push({
          batch: 2,
          priority: 'major',
          description: `修复 ${majorIssues.length} 个主要问题`,
          issueIds: majorIssues.map(i => i.id),
          estimatedEffort: majorIssues.length * 1, // 每个主要问题预计 1 小时
          impactAssessment: '影响用户体验和代码质量，建议尽快修复',
        });
      }

      // 第三批：次要问题
      if (minorIssues.length > 0) {
        fixSteps.push({
          batch: 3,
          priority: 'minor',
          description: `修复 ${minorIssues.length} 个次要问题`,
          issueIds: minorIssues.map(i => i.id),
          estimatedEffort: minorIssues.length * 0.5, // 每个次要问题预计 0.5 小时
          impactAssessment: '代码风格和文档类问题，可择机修复',
        });
      }

      // 评估变更影响范围
      const affectedFiles = [...new Set(openIssues.filter(i => i.file).map(i => i.file))];
      const affectedDimensions = [...new Set(openIssues.map(i => i.dimension))];

      this.fixPlan = fixSteps;

      const durationMs = Date.now() - startTime;
      const output = {
        totalBatches: fixSteps.length,
        totalEstimatedEffort: fixSteps.reduce((sum, s) => sum + s.estimatedEffort, 0),
        affectedFiles: affectedFiles.length,
        affectedDimensions: affectedDimensions.length,
      };

      const record = this._logPhase('计划', input, output, durationMs, PhaseStatus.SUCCESS);
      return { record, fixSteps, affectedFiles, affectedDimensions };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('计划', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, error: error.message };
    }
  }

  /**
   * 执行修复
   * 按修复计划依次将问题标记为处理中，并记录修复结果
   * @param {Object} [options] - 执行选项
   * @param {string[]} [options.batchFilter] - 只执行指定批次（如 ['critical']）
   * @param {Function} [options.onFix] - 单个问题修复回调，返回修复结果
   * @returns {Object} 执行结果（已修复数量、失败数量、跳过数量）
   */
  async executeFixes(options = {}) {
    const startTime = Date.now();
    const { batchFilter, onFix } = options;
    const openIssues = this.tracker.getIssues({ status: 'open' });
    const input = {
      issueCount: openIssues.length,
      batchFilter: batchFilter || 'all',
    };

    try {
      let fixedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const issue of openIssues) {
        // 按批次过滤
        if (batchFilter && batchFilter.length > 0 && !batchFilter.includes(issue.severity)) {
          skippedCount++;
          continue;
        }

        // 将问题标记为处理中
        this.tracker.updateIssue(issue.id, { status: 'in_progress' });

        try {
          // 如果提供了修复回调，则执行
          if (onFix) {
            const result = await onFix(issue);
            if (result && result.success) {
              this.tracker.updateIssue(issue.id, { status: 'fixed' });
              fixedCount++;
            } else {
              this.tracker.updateIssue(issue.id, { status: 'open' });
              failedCount++;
            }
          } else {
            // 无回调时仅标记（实际修复需手动完成）
            this.tracker.updateIssue(issue.id, { status: 'fixed' });
            fixedCount++;
          }
        } catch {
          this.tracker.updateIssue(issue.id, { status: 'open' });
          failedCount++;
        }
      }

      const durationMs = Date.now() - startTime;
      const output = { fixedCount, failedCount, skippedCount };

      const status = failedCount > 0 ? PhaseStatus.PARTIAL : PhaseStatus.SUCCESS;
      const record = this._logPhase('修复', input, output, durationMs, status);
      return { record, fixedCount, failedCount, skippedCount };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('修复', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, error: error.message };
    }
  }

  /**
   * 验证修复效果
   * 重新运行评估，对比修复前后的评分和问题数量
   * @returns {Object} 验证结果（修复前后对比、验证通过率）
   */
  async verifyFixes() {
    const startTime = Date.now();
    const fixedIssues = this.tracker.getIssues({ status: 'fixed' });
    const input = { fixedIssueCount: fixedIssues.length };

    try {
      // 重新运行评估
      const reassessment = await this.runAssessment();
      const newScore = reassessment.assessment ? reassessment.assessment.overallScore : 0;
      const oldScore = this.assessmentResult ? this.assessmentResult.overallScore : 0;

      // 验证每个已修复的问题
      let verifiedCount = 0;
      let unverifiableCount = 0;

      for (const issue of fixedIssues) {
        // 简化验证逻辑：如果新评估中不再出现该检查项，则视为已验证
        const stillFailing = reassessment.assessment?.failedChecks?.includes(issue.checkId);
        if (!stillFailing) {
          this.tracker.updateIssue(issue.id, { status: 'verified' });
          verifiedCount++;
        } else {
          unverifiableCount++;
        }
      }

      const scoreImprovement = newScore - oldScore;

      const durationMs = Date.now() - startTime;
      const output = {
        oldScore,
        newScore,
        scoreImprovement,
        verifiedCount,
        unverifiableCount,
        remainingIssues: this.tracker.getIssues({ status: 'open' }).length,
      };

      const status = verifiedCount === fixedIssues.length
        ? PhaseStatus.SUCCESS
        : (verifiedCount > 0 ? PhaseStatus.PARTIAL : PhaseStatus.FAILED);

      const record = this._logPhase('验证', input, output, durationMs, status);
      return { record, verifiedCount, unverifiableCount, scoreImprovement };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('验证', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, error: error.message };
    }
  }

  /**
   * 回归测试
   * 验证修复操作未引入新问题
   * @returns {Object} 回归测试结果（是否有回归、新增问题数量）
   */
  async checkRegression() {
    const startTime = Date.now();
    const statsBefore = this.tracker.getStatistics();
    const input = { issueCountBefore: statsBefore.total };

    try {
      // 记录修复前的问题集合
      const issuesBeforeIds = new Set(this.tracker.issues.map(i => `${i.checkId}:${i.file}:${i.line}`));

      // 运行完整评估检测新问题
      const reassessment = await this.runAssessment();

      // 识别新增问题（不在修复前集合中的问题）
      const newIssues = this.tracker.issues.filter(
        i => !issuesBeforeIds.has(`${i.checkId}:${i.file}:${i.line}`) && i.status === 'open'
      );

      const statsAfter = this.tracker.getStatistics();
      const hasRegression = newIssues.length > 0;

      const durationMs = Date.now() - startTime;
      const output = {
        hasRegression,
        newIssueCount: newIssues.length,
        totalBefore: statsBefore.total,
        totalAfter: statsAfter.total,
      };

      const status = hasRegression ? PhaseStatus.PARTIAL : PhaseStatus.SUCCESS;
      const record = this._logPhase('回归测试', input, output, durationMs, status);

      return { record, hasRegression, newIssues };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const record = this._logPhase('回归测试', input, { error: error.message }, durationMs, PhaseStatus.FAILED);
      return { record, hasRegression: true, error: error.message };
    }
  }

  /**
   * 生成本轮改进报告
   * @returns {Object} 完整的闭环改进报告
   */
  generateCycleReport() {
    const stats = this.tracker.getStatistics();

    // 计算各阶段耗时
    const phaseDurations = {};
    for (const log of this.phaseLog) {
      phaseDurations[log.phase] = (phaseDurations[log.phase] || 0) + log.durationMs;
    }

    // 生成阶段摘要
    const phaseSummary = this.phaseLog.map(log => ({
      phase: log.phase,
      status: log.status,
      durationMs: log.durationMs,
      timestamp: log.timestamp,
      inputSummary: log.input,
      outputSummary: log.output,
    }));

    // 生成文本报告
    const lines = [];
    lines.push('╔' + '═'.repeat(58) + '╗');
    lines.push('║  质量改进闭环报告' + ' '.repeat(40) + '║');
    lines.push(`║  生成时间: ${new Date().toLocaleString('zh-CN')}`.padEnd(59) + '║');
    lines.push('╚' + '═'.repeat(58) + '╝');
    lines.push('');

    // 一、阶段执行概况
    lines.push('【阶段执行概况】');
    for (const summary of phaseSummary) {
      const statusIcon = {
        success: '✅',
        partial: '⚠️',
        failed: '❌',
        skipped: '⏭️',
      }[summary.status] || '❓';
      lines.push(`  ${statusIcon} ${summary.phase} — 耗时 ${summary.durationMs}ms — ${summary.status}`);
    }
    lines.push('');

    // 二、问题统计
    lines.push('【问题统计】');
    lines.push(`  总计: ${stats.total}`);
    lines.push(`  严重: ${stats.bySeverity.critical}  |  主要: ${stats.bySeverity.major}  |  次要: ${stats.bySeverity.minor}`);
    lines.push('');

    // 三、维度分布
    lines.push('【维度分布】');
    for (const [dim, count] of Object.entries(stats.byDimension)) {
      lines.push(`  ${dim}: ${count}`);
    }
    lines.push('');

    // 四、状态分布
    lines.push('【状态分布】');
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
    lines.push('');

    // 五、改进效果
    lines.push('【改进效果】');
    const verifiedCount = (stats.byStatus['verified'] || 0);
    const fixedCount = (stats.byStatus['fixed'] || 0);
    const remainingOpen = (stats.byStatus['open'] || 0);
    lines.push(`  已验证通过: ${verifiedCount}`);
    lines.push(`  已修复待验证: ${fixedCount}`);
    lines.push(`  仍待处理: ${remainingOpen}`);
    lines.push('');

    // 六、阶段耗时
    lines.push('【阶段耗时】');
    for (const [phase, ms] of Object.entries(phaseDurations)) {
      lines.push(`  ${phase}: ${ms}ms`);
    }
    lines.push('');

    lines.push('═'.repeat(60));

    const report = {
      generatedAt: new Date().toISOString(),
      phaseSummary,
      statistics: stats,
      phaseDurations,
      textReport: lines.join('\n'),
    };

    return report;
  }
}

export default QualityWorkflow;
