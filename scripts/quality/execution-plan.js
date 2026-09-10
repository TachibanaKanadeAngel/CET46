/**
 * 执行计划与里程碑模块
 * 定义 CET46 项目质量改进的五个实施阶段，提供进度跟踪和效果评估功能。
 */

// ============================================================================
// 任务状态枚举
// ============================================================================

export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};

// ============================================================================
// 五个实施阶段定义
// ============================================================================

const PHASES = [
  {
    id: 'phase-1',
    name: '评估体系建立',
    duration: '第1-2周',
    goals: [
      '完成所有质量评估工具开发',
      '建立基线评分体系',
      '完成首次全面质量评估',
      '生成基线报告和问题清单',
    ],
    tasks: [
      {
        id: 'T1-01',
        name: '完善质量评估配置模块',
        description: '优化 quality-config.js 中的指标定义和阈值配置，确保评估维度覆盖全面',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['更新后的 quality-config.js', '指标阈值说明文档'],
      },
      {
        id: 'T1-02',
        name: '开发自动化评分脚本',
        description: '完善 quality-score.js 的自动检测逻辑，确保六大维度均可自动评分',
        priority: 'critical',
        estimatedEffort: '5天',
        deliverables: ['完善的 quality-score.js', '评分算法说明'],
      },
      {
        id: 'T1-03',
        name: '建立检查清单体系',
        description: '完善 checklist.js 的检查项，确保每项均可追溯至评估指标',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['完整的 checklist.js', '检查项-指标对照表'],
      },
      {
        id: 'T1-04',
        name: '实现问题跟踪系统',
        description: '完善 issue-tracker.js 的问题管理功能，支持筛选、统计和报告生成',
        priority: 'critical',
        estimatedEffort: '2天',
        deliverables: ['完善的 issue-tracker.js', '问题跟踪流程文档'],
      },
      {
        id: 'T1-05',
        name: '构建评估-修复闭环流程',
        description: '完善 workflow.js 的评估→修复→验证闭环流程',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['完善的 workflow.js', '闭环流程说明'],
      },
      {
        id: 'T1-06',
        name: '建立问题预防机制',
        description: '开发 prevention.js 预防规则和知识库，从源头预防问题',
        priority: 'major',
        estimatedEffort: '3天',
        deliverables: ['完善的 prevention.js', '预防规则清单'],
      },
      {
        id: 'T1-07',
        name: '运行首次全面质量评估',
        description: '使用完善的评估工具对项目进行首次全面评估，建立基线',
        priority: 'critical',
        estimatedEffort: '1天',
        deliverables: ['基线评估报告', '问题清单'],
      },
    ],
    qualityTarget: 63,
    milestones: [
      {
        id: 'M1-01',
        name: '首次完整质量评估报告',
        description: '完成首次六大维度全面评估，输出基线分数和问题清单',
        targetDate: '第2周末',
        criteria: '六大维度评分均已完成，基线总分已确定',
      },
    ],
  },
  {
    id: 'phase-2',
    name: '快速修复',
    duration: '第3-5周',
    goals: [
      '修复所有 P0（critical）问题',
      '修复所有 P1（major）安全与正确性问题',
      '测试覆盖率从 20% 提升至 35%',
      '消除所有已知安全漏洞',
    ],
    tasks: [
      {
        id: 'T2-01',
        name: '修复 NaN 传播问题',
        description: '在所有数值运算前增加 isNaN 守卫，确保 FSRS 计算不受 NaN 影响',
        priority: 'critical',
        estimatedEffort: '2天',
        deliverables: ['修复后的 FSRS 计算模块', 'NaN 防护单元测试'],
      },
      {
        id: 'T2-02',
        name: '修复 LRU 缓存数据丢失',
        description: '缓存淘汰前持久化脏数据，确保数据不丢失',
        priority: 'critical',
        estimatedEffort: '2天',
        deliverables: ['修复后的 LRU 缓存模块', '缓存持久化测试'],
      },
      {
        id: 'T2-03',
        name: '修复 SSRF 漏洞',
        description: '为所有网络请求添加 URL 域名白名单验证',
        priority: 'critical',
        estimatedEffort: '1天',
        deliverables: ['URL 验证模块', '安全测试用例'],
      },
      {
        id: 'T2-04',
        name: '修复原型污染风险',
        description: '过滤用户输入中的 __proto__、constructor 等原型污染键',
        priority: 'critical',
        estimatedEffort: '1天',
        deliverables: ['输入消毒模块', '原型污染测试'],
      },
      {
        id: 'T2-05',
        name: '消除 innerHTML XSS 风险',
        description: '替换所有 innerHTML 为 textContent 或使用 DOMPurify 消毒',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['XSS 修复后的文件', 'XSS 防护测试'],
      },
      {
        id: 'T2-06',
        name: '完善异步错误处理',
        description: '为所有 async/await 添加 try/catch，为所有 .then() 添加 .catch()',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['异步错误处理完善的代码', 'unhandled rejection 测试'],
      },
      {
        id: 'T2-07',
        name: 'IndexedDB 事务错误处理',
        description: '为所有 IndexedDB 事务添加 onerror 和 onabort 处理',
        priority: 'major',
        estimatedEffort: '2天',
        deliverables: ['IDB 错误处理完善的代码', 'IDB 事务测试'],
      },
      {
        id: 'T2-08',
        name: '补充核心模块单元测试',
        description: '为 FSRS 算法、学习/复习流程、数据持久化补充单元测试',
        priority: 'critical',
        estimatedEffort: '5天',
        deliverables: ['新增测试用例', '覆盖率提升报告'],
      },
      {
        id: 'T2-09',
        name: '修复 npm audit 高危漏洞',
        description: '升级或替换存在高危漏洞的依赖包',
        priority: 'critical',
        estimatedEffort: '2天',
        deliverables: ['更新后的 package.json', 'npm audit 报告'],
      },
    ],
    qualityTarget: 70,
    milestones: [
      {
        id: 'M2-01',
        name: '通过质量门禁（75分）',
        description: '所有 P0/P1 问题修复完成，质量评分达到门禁要求',
        targetDate: '第5周末',
        criteria: '总分 ≥ 75，代码质量 ≥ 70，安全性 ≥ 70',
      },
    ],
  },
  {
    id: 'phase-3',
    name: '深度优化',
    duration: '第6-10周',
    goals: [
      '消除代码重复，重复率降至 5% 以下',
      '启用 TypeScript strict 模式',
      '测试覆盖率提升至 50%',
      '完善错误恢复机制',
      '优化缓存策略',
    ],
    tasks: [
      {
        id: 'T3-01',
        name: '代码去重',
        description: '使用 jscpd 扫描重复代码，提取公共函数和模块',
        priority: 'major',
        estimatedEffort: '5天',
        deliverables: ['去重后的代码', '重复率下降报告'],
      },
      {
        id: 'T3-02',
        name: '启用 TypeScript strict 模式',
        description: '逐步修复类型错误，启用 tsconfig.json strict 选项',
        priority: 'major',
        estimatedEffort: '8天',
        deliverables: ['启用 strict 的 tsconfig.json', '类型错误修复清单'],
      },
      {
        id: 'T3-03',
        name: '测试覆盖率提升至 50%',
        description: '补充边界条件测试、集成测试、端到端测试',
        priority: 'major',
        estimatedEffort: '10天',
        deliverables: ['新增测试文件', '覆盖率报告'],
      },
      {
        id: 'T3-04',
        name: '完善错误恢复机制',
        description: '实现 IndexedDB 读写失败重试、Service Worker 降级策略',
        priority: 'major',
        estimatedEffort: '5天',
        deliverables: ['错误恢复机制代码', '故障恢复测试'],
      },
      {
        id: 'T3-05',
        name: '优化 LRU 缓存策略',
        description: '改进缓存淘汰算法，增加缓存命中率监控',
        priority: 'major',
        estimatedEffort: '3天',
        deliverables: ['优化的缓存模块', '缓存命中率报告'],
      },
      {
        id: 'T3-06',
        name: '优化 Worker 通信效率',
        description: '使用 Transferable 对象减少序列化开销',
        priority: 'minor',
        estimatedEffort: '3天',
        deliverables: ['优化后的 Worker 通信', '性能对比报告'],
      },
      {
        id: 'T3-07',
        name: '补充边界条件测试',
        description: '针对 NaN、undefined、null、空数组等边界值添加测试',
        priority: 'major',
        estimatedEffort: '5天',
        deliverables: ['边界条件测试文件', '边界覆盖报告'],
      },
      {
        id: 'T3-08',
        name: '配置 CSP 安全策略',
        description: '配置 Content-Security-Policy，限制 script-src 和 connect-src',
        priority: 'major',
        estimatedEffort: '2天',
        deliverables: ['CSP 配置', 'CSP 合规测试'],
      },
    ],
    qualityTarget: 80,
    milestones: [
      {
        id: 'M3-01',
        name: '发布质量合格版本',
        description: '代码质量、安全性、测试覆盖率均达到合格标准',
        targetDate: '第10周末',
        criteria: '总分 ≥ 80，测试覆盖率 ≥ 50%，代码重复率 < 5%',
      },
    ],
  },
  {
    id: 'phase-4',
    name: '精益改进',
    duration: '第11-16周',
    goals: [
      'ARIA 无障碍覆盖率提升至 80%',
      '完善项目文档',
      '性能指标全面达标（LCP ≤ 2.5s, FCP ≤ 1.8s）',
      '键盘导航完整可用',
      'prefers-reduced-motion 全面适配',
    ],
    tasks: [
      {
        id: 'T4-01',
        name: 'ARIA 属性补全',
        description: '为所有交互元素添加 role、aria-label、aria-describedby 等属性',
        priority: 'major',
        estimatedEffort: '8天',
        deliverables: ['ARIA 属性完善的组件', 'ARIA 覆盖率报告'],
      },
      {
        id: 'T4-02',
        name: '键盘导航优化',
        description: '确保所有交互功能可通过 Tab/Enter/Space/Arrow 键完成操作',
        priority: 'major',
        estimatedEffort: '5天',
        deliverables: ['键盘导航完善的功能', '键盘导航测试'],
      },
      {
        id: 'T4-03',
        name: 'prefers-reduced-motion 适配',
        description: '为所有动画和过渡添加 @media(prefers-reduced-motion) 适配',
        priority: 'major',
        estimatedEffort: '3天',
        deliverables: ['适配后的动画代码', '减少动画偏好测试'],
      },
      {
        id: 'T4-04',
        name: '性能优化至达标',
        description: '优化首屏加载（代码分割、懒加载），确保 LCP ≤ 2.5s',
        priority: 'major',
        estimatedEffort: '8天',
        deliverables: ['性能优化后的构建', 'Lighthouse 报告'],
      },
      {
        id: 'T4-05',
        name: '完善 API 文档',
        description: '为所有公共 API 添加 JSDoc 注释，生成 API 文档',
        priority: 'major',
        estimatedEffort: '5天',
        deliverables: ['JSDoc 注释完善的代码', 'API 文档'],
      },
      {
        id: 'T4-06',
        name: '完善架构文档',
        description: '编写/更新 ARCHITECTURE.md，包含模块依赖图和数据流图',
        priority: 'major',
        estimatedEffort: '3天',
        deliverables: ['ARCHITECTURE.md'],
      },
      {
        id: 'T4-07',
        name: '编写故障排查文档',
        description: '整理常见问题和解决方案，编写 FAQ 和故障排查指南',
        priority: 'minor',
        estimatedEffort: '3天',
        deliverables: ['FAQ 文档', '故障排查指南'],
      },
      {
        id: 'T4-08',
        name: '暗色模式完善',
        description: '确保所有 UI 组件在暗色模式下正确显示',
        priority: 'minor',
        estimatedEffort: '3天',
        deliverables: ['暗色模式完善的组件', '暗色模式测试'],
      },
      {
        id: 'T4-09',
        name: '响应式布局优化',
        description: '在 320px-1440px 范围内确保布局正确适配',
        priority: 'minor',
        estimatedEffort: '3天',
        deliverables: ['响应式优化的布局', '多设备测试报告'],
      },
    ],
    qualityTarget: 85,
    milestones: [
      {
        id: 'M4-01',
        name: '高质量发布',
        description: '质量评分达到 85 分，各项指标均达到良好水平',
        targetDate: '第16周末',
        criteria: '总分 ≥ 85，ARIA 覆盖率 ≥ 80%，LCP ≤ 2.5s',
      },
    ],
  },
  {
    id: 'phase-5',
    name: '持续运营',
    duration: '第17周起',
    goals: [
      '建立持续质量保障机制',
      '定期评估和报告',
      '持续改进质量指标',
      '维护经验教训知识库',
    ],
    tasks: [
      {
        id: 'T5-01',
        name: '建立 CI 质量门禁',
        description: '在 CI/CD 流程中集成质量评估，未达标的 PR 不可合并',
        priority: 'critical',
        estimatedEffort: '3天',
        deliverables: ['CI 质量门禁配置', '门禁说明文档'],
      },
      {
        id: 'T5-02',
        name: '建立定期评估机制',
        description: '每周运行自动化评估，月度生成质量趋势报告',
        priority: 'major',
        estimatedEffort: '2天',
        deliverables: ['定期评估脚本', '评估日历'],
      },
      {
        id: 'T5-03',
        name: '维护经验教训知识库',
        description: '持续记录问题解决方案和经验教训，更新预防规则',
        priority: 'major',
        estimatedEffort: '持续',
        deliverables: ['更新的知识库', '新增预防规则'],
      },
      {
        id: 'T5-04',
        name: '测试覆盖率持续提升',
        description: '每个迭代补充测试，逐步提升覆盖率至 70% 以上',
        priority: 'major',
        estimatedEffort: '持续',
        deliverables: ['覆盖率趋势报告'],
      },
      {
        id: 'T5-05',
        name: '性能持续监控',
        description: '集成 Web Vitals 监控，设置性能退化告警',
        priority: 'major',
        estimatedEffort: '3天',
        deliverables: ['性能监控集成', '告警配置'],
      },
      {
        id: 'T5-06',
        name: '安全依赖自动更新',
        description: '配置 Dependabot 或类似工具，自动更新有漏洞的依赖',
        priority: 'major',
        estimatedEffort: '1天',
        deliverables: ['Dependabot 配置', '自动更新流程'],
      },
    ],
    qualityTarget: 90,
    milestones: [
      {
        id: 'M5-01',
        name: '项目质量成熟',
        description: '质量评分达到 90 分，持续质量保障机制稳定运行',
        targetDate: '持续',
        criteria: '总分 ≥ 90，CI 质量门禁稳定运行 ≥ 4 周',
      },
    ],
  },
];

// ============================================================================
// ExecutionPlan 类
// ============================================================================

export class ExecutionPlan {
  constructor() {
    /** @type {Array<Object>} 阶段定义列表 */
    this.phases = JSON.parse(JSON.stringify(PHASES));
    /** @type {Object} 任务状态映射 { taskId: status } */
    this.taskStatus = {};
    /** @type {Object} 任务进度备注 { taskId: notes } */
    this.taskNotes = {};
    /** @type {string} 当前阶段 ID */
    this.currentPhaseId = 'phase-1';
    /** @type {Object} 评估结果记录 */
    this.assessmentHistory = [];

    // 初始化所有任务状态为未开始
    for (const phase of this.phases) {
      for (const task of phase.tasks) {
        this.taskStatus[task.id] = TaskStatus.NOT_STARTED;
      }
    }
  }

  // ==========================================================================
  // 阶段查询
  // ==========================================================================

  /**
   * 获取所有阶段定义
   * @returns {Array<Object>} 阶段列表
   */
  getPhases() {
    return this.phases;
  }

  /**
   * 按阶段 ID 获取阶段定义
   * @param {string} phaseId - 阶段 ID
   * @returns {Object|null} 阶段定义对象
   */
  getPhaseById(phaseId) {
    return this.phases.find(p => p.id === phaseId) || null;
  }

  /**
   * 获取当前阶段
   * @returns {Object} 当前阶段定义
   */
  getCurrentPhase() {
    return this.getPhaseById(this.currentPhaseId) || this.phases[0];
  }

  // ==========================================================================
  // 进度跟踪
  // ==========================================================================

  /**
   * 获取当前进度
   * @returns {Object} 进度信息（各阶段完成率、总体进度、当前阶段）
   */
  getProgress() {
    const phaseProgress = [];
    let totalTasks = 0;
    let completedTasks = 0;

    for (const phase of this.phases) {
      const phaseTaskCount = phase.tasks.length;
      let phaseCompleted = 0;

      for (const task of phase.tasks) {
        totalTasks++;
        if (this.taskStatus[task.id] === TaskStatus.COMPLETED) {
          phaseCompleted++;
          completedTasks++;
        }
      }

      const completionRate = phaseTaskCount > 0
        ? ((phaseCompleted / phaseTaskCount) * 100).toFixed(1)
        : '0.0';

      phaseProgress.push({
        phaseId: phase.id,
        name: phase.name,
        duration: phase.duration,
        totalTasks: phaseTaskCount,
        completedTasks: phaseCompleted,
        completionRate: parseFloat(completionRate),
        qualityTarget: phase.qualityTarget,
        isCurrentPhase: phase.id === this.currentPhaseId,
      });
    }

    const overallRate = totalTasks > 0
      ? ((completedTasks / totalTasks) * 100).toFixed(1)
      : '0.0';

    return {
      overallProgress: {
        totalTasks,
        completedTasks,
        completionRate: parseFloat(overallRate),
      },
      phaseProgress,
      currentPhase: this.getCurrentPhase(),
    };
  }

  /**
   * 更新任务状态
   * @param {string} taskId - 任务 ID
   * @param {string} status - 新状态（TaskStatus 枚举值）
   * @param {string} [notes] - 进度备注
   * @returns {Object|null} 更新后的任务信息，未找到返回 null
   */
  updateTask(taskId, status, notes) {
    // 查找任务
    let targetTask = null;
    for (const phase of this.phases) {
      targetTask = phase.tasks.find(t => t.id === taskId);
      if (targetTask) break;
    }

    if (!targetTask) return null;

    this.taskStatus[taskId] = status;
    if (notes) {
      this.taskNotes[taskId] = notes;
    }

    // 检查当前阶段是否所有任务都已完成，如果是则自动推进到下一阶段
    const currentPhase = this.getCurrentPhase();
    const allCompleted = currentPhase.tasks.every(t => this.taskStatus[t.id] === TaskStatus.COMPLETED);
    if (allCompleted) {
      const currentIndex = this.phases.findIndex(p => p.id === this.currentPhaseId);
      if (currentIndex < this.phases.length - 1) {
        this.currentPhaseId = this.phases[currentIndex + 1].id;
      }
    }

    return {
      taskId,
      name: targetTask.name,
      status: this.taskStatus[taskId],
      notes: this.taskNotes[taskId] || null,
    };
  }

  /**
   * 生成进度报告
   * @returns {string} 文本格式的进度报告
   */
  generateProgressReport() {
    const progress = this.getProgress();
    const lines = [];

    lines.push('╔' + '═'.repeat(58) + '╗');
    lines.push('║  CET46 质量改进执行计划 — 进度报告' + ' '.repeat(22) + '║');
    lines.push(`║  生成时间: ${new Date().toLocaleString('zh-CN')}`.padEnd(59) + '║');
    lines.push('╚' + '═'.repeat(58) + '╝');
    lines.push('');

    // 总体进度
    const { overallProgress } = progress;
    const barWidth = 30;
    const filled = Math.round((overallProgress.completionRate / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    lines.push(`【总体进度】 ${bar} ${overallProgress.completionRate}%`);
    lines.push(`  已完成: ${overallProgress.completedTasks}/${overallProgress.totalTasks} 个任务`);
    lines.push('');

    // 各阶段进度
    lines.push('【各阶段进度】');
    for (const pp of progress.phaseProgress) {
      const current = pp.isCurrentPhase ? ' ◄ 当前' : '';
      const ppFilled = Math.round((pp.completionRate / 100) * 20);
      const ppBar = '█'.repeat(ppFilled) + '░'.repeat(20 - ppFilled);
      lines.push(`  ${pp.name}（${pp.duration}）${current}`);
      lines.push(`    进度: ${ppBar} ${pp.completionRate}%  (${pp.completedTasks}/${pp.totalTasks})`);
      lines.push(`    质量目标: ${pp.qualityTarget} 分`);

      // 列出各任务状态
      const phase = this.getPhaseById(pp.phaseId);
      if (phase) {
        for (const task of phase.tasks) {
          const statusIcon = {
            [TaskStatus.NOT_STARTED]: '⬜',
            [TaskStatus.IN_PROGRESS]: '🔄',
            [TaskStatus.COMPLETED]: '✅',
            [TaskStatus.BLOCKED]: '🚫',
            [TaskStatus.CANCELLED]: '❌',
          }[this.taskStatus[task.id]] || '⬜';
          lines.push(`    ${statusIcon} ${task.id}: ${task.name}`);
        }
      }
      lines.push('');
    }

    // 里程碑状态
    lines.push('【里程碑状态】');
    for (const phase of this.phases) {
      for (const milestone of phase.milestones) {
        const phaseProgress = progress.phaseProgress.find(p => p.phaseId === phase.id);
        const achieved = phaseProgress && phaseProgress.completionRate === 100;
        const icon = achieved ? '🏆' : '🎯';
        lines.push(`  ${icon} ${milestone.name}（${phase.name}）`);
        lines.push(`    目标日期: ${milestone.targetDate}`);
        lines.push(`    达成标准: ${milestone.criteria}`);
        lines.push(`    状态: ${achieved ? '已达成' : '进行中'}`);
      }
    }

    lines.push('');
    lines.push('═'.repeat(60));

    return lines.join('\n');
  }

  // ==========================================================================
  // 方案有效性评估
  // ==========================================================================

  /**
   * 评估改进效果
   * 对比改进前后的质量评分，计算各维度提升幅度
   * @param {Object} before - 改进前的评估结果
   * @param {Object} after - 改进后的评估结果
   * @returns {Object} 改进效果评估（总分提升、各维度提升、效果等级）
   */
  evaluateEffectiveness(before, after) {
    const totalImprovement = (after.overallScore || 0) - (before.overallScore || 0);

    // 各维度提升
    const dimensionImprovements = {};
    const dimensions = ['codeQuality', 'completeness', 'performance', 'security', 'userExperience', 'documentation'];
    const dimensionLabels = {
      codeQuality: '代码质量',
      completeness: '功能完整性',
      performance: '性能表现',
      security: '安全性',
      userExperience: '用户体验',
      documentation: '文档完整性',
    };

    for (const dim of dimensions) {
      const beforeScore = before.dimensionScores?.[dim]?.score || before[dim] || 0;
      const afterScore = after.dimensionScores?.[dim]?.score || after[dim] || 0;
      dimensionImprovements[dim] = {
        label: dimensionLabels[dim],
        before: beforeScore,
        after: afterScore,
        improvement: afterScore - beforeScore,
        improvementRate: beforeScore > 0 ? (((afterScore - beforeScore) / beforeScore) * 100).toFixed(1) : 'N/A',
      };
    }

    // 评估效果等级
    let effectivenessLevel;
    if (totalImprovement >= 20) {
      effectivenessLevel = '显著改进';
    } else if (totalImprovement >= 10) {
      effectivenessLevel = '明显改进';
    } else if (totalImprovement >= 5) {
      effectivenessLevel = '有效改进';
    } else if (totalImprovement >= 0) {
      effectivenessLevel = '轻微改进';
    } else {
      effectivenessLevel = '质量退化';
    }

    return {
      totalImprovement,
      beforeScore: before.overallScore || 0,
      afterScore: after.overallScore || 0,
      dimensionImprovements,
      effectivenessLevel,
      summary: `总分从 ${before.overallScore || 0} 提升至 ${after.overallScore || 0}（+${totalImprovement}），评估为"${effectivenessLevel}"`,
    };
  }

  /**
   * 计算 ROI（投资回报率）
   * @param {Object} investment - 投入信息
   * @param {number} investment.hours - 投入工时（人时）
   * @param {number} investment.cost - 投入成本（元）
   * @param {Object} improvement - 改进效果
   * @param {number} improvement.scoreGain - 质量分提升
   * @param {number} improvement.bugsPrevented - 预防的 Bug 数
   * @param {number} improvement.userIssuesReduced - 减少的用户反馈问题数
   * @returns {Object} ROI 计算结果
   */
  calculateROI(investment, improvement) {
    const { hours = 0, cost = 0 } = investment;
    const { scoreGain = 0, bugsPrevented = 0, userIssuesReduced = 0 } = improvement;

    // 每个 Bug 的平均修复成本（业界平均：1 个线上 Bug 约 4 人时）
    const avgBugFixCost = 4;
    // 每个用户反馈问题的平均处理成本
    const avgUserIssueCost = 2;

    // 避免的损失（预防性投入的价值）
    const avoidedBugFixCost = bugsPrevented * avgBugFixCost;
    const avoidedUserIssueCost = userIssuesReduced * avgUserIssueCost;
    const totalAvoidedCost = avoidedBugFixCost + avoidedUserIssueCost;

    // 质量分提升的效率
    const scorePerHour = hours > 0 ? (scoreGain / hours).toFixed(2) : '0.00';

    // ROI 计算
    const roi = cost > 0
      ? (((totalAvoidedCost - cost) / cost) * 100).toFixed(1)
      : 'N/A';

    // 投资回收期估算（简化模型）
    const monthlyAvoidedCost = totalAvoidedCost / 6; // 假设6个月内均匀分布
    const paybackMonths = cost > 0 && monthlyAvoidedCost > 0
      ? (cost / monthlyAvoidedCost).toFixed(1)
      : 'N/A';

    return {
      investment: { hours, cost },
      improvement: { scoreGain, bugsPrevented, userIssuesReduced },
      benefit: {
        avoidedBugFixCost,
        avoidedUserIssueCost,
        totalAvoidedCost,
      },
      efficiency: {
        scorePerHour: parseFloat(scorePerHour),
        costPerScorePoint: cost > 0 && scoreGain > 0 ? (cost / scoreGain).toFixed(2) : 'N/A',
      },
      roi: roi === 'N/A' ? 'N/A' : parseFloat(roi),
      paybackMonths,
      assessment: parseFloat(roi) > 100 ? '投资回报优秀' :
                  parseFloat(roi) > 0 ? '投资回报正向' :
                  roi === 'N/A' ? '无法计算' : '投资回报不足',
    };
  }

  // ==========================================================================
  // 导入导出
  // ==========================================================================

  /**
   * 导出执行计划数据
   * @returns {Object} 可序列化的执行计划数据
   */
  exportPlan() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currentPhaseId: this.currentPhaseId,
      taskStatus: this.taskStatus,
      taskNotes: this.taskNotes,
      assessmentHistory: this.assessmentHistory,
    };
  }

  /**
   * 导入执行计划数据
   * @param {Object} data - 由 exportPlan 生成的数据
   * @returns {boolean} 导入是否成功
   */
  importPlan(data) {
    if (!data || !data.taskStatus) {
      return false;
    }
    this.currentPhaseId = data.currentPhaseId || 'phase-1';
    this.taskStatus = data.taskStatus || {};
    this.taskNotes = data.taskNotes || {};
    this.assessmentHistory = data.assessmentHistory || [];
    return true;
  }

  /**
   * 记录评估结果到历史
   * @param {Object} assessmentResult - 评估结果
   */
  recordAssessment(assessmentResult) {
    this.assessmentHistory.push({
      ...assessmentResult,
      recordedAt: new Date().toISOString(),
    });
  }

  /**
   * 获取评估历史趋势
   * @returns {Array<Object>} 评估历史列表
   */
  getAssessmentTrend() {
    return [...this.assessmentHistory];
  }
}

export default ExecutionPlan;
