/**
 * 质量评估核心配置模块
 *
 * 为 CET46 项目提供完整的质量评估配置，包含六大评估维度、
 * 可量化指标、评分规则、质量门禁及行业基准对照。
 *
 * 项目背景：CET46 是基于 FSRS 算法的英语四六级词汇学习应用
 * 技术栈：Vite 8 + Vitest 4 + ESLint 8 + Prettier 3
 * 运行平台：Web / Android(Electron/Capacitor)
 * 当前状态：Web 端 645+ 测试全部通过，小程序端测试独立运行，综合测试覆盖率约 58%
 * 历史问题：NaN 传播、LRU 缓存数据丢失、FSRS 算法顺序错误、SSRF 漏洞、原型污染等
 */

// ============================================================================
// 行业基准对照表
// ============================================================================
const BENCHMARK_LEVELS = {
  excellent: { min: 90, max: 100, label: '优秀', color: 'green' },
  good: { min: 80, max: 89, label: '良好', color: 'blue' },
  pass: { min: 70, max: 79, label: '合格', color: 'yellow' },
  needsWork: { min: 60, max: 69, label: '需改进', color: 'orange' },
  fail: { min: 0, max: 59, label: '不合格', color: 'red' },
};

// ============================================================================
// 六大评估维度及指标定义
// ============================================================================
const dimensions = {
  // ---- 1. 代码质量 (Code Quality) - 25% ----
  codeQuality: {
    id: 'code-quality',
    name: '代码质量',
    nameEn: 'Code Quality',
    weight: 25,
    description: '评估代码的可维护性、规范性和健壮性，包括测试覆盖、静态检查、复杂度等',
    indicators: [
      {
        id: 'cq-test-coverage',
        name: '测试覆盖率（行覆盖率）',
        description: '衡量代码被单元测试覆盖的比例，反映测试充分程度',
        weight: 25,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 80, score: 90, label: '优秀覆盖' },
            { min: 60, score: 75, label: '良好覆盖' },
            { min: 40, score: 60, label: '基本覆盖' },
            { min: 20, score: 40, label: '覆盖不足' },
            { min: 0, score: 20, label: '严重不足' },
          ],
          measure: '通过 vitest --coverage 获取 v8 覆盖率报告的行覆盖率百分比值',
        },
        benchmark: 70,
        currentValue: 58.08,
      },
      {
        id: 'cq-eslint-density',
        name: 'ESLint 错误密度',
        description: '每千行代码（KLOC）中的 ESLint 错误数量，越低越好',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 0, score: 100, label: '零错误' },
            { max: 1, score: 85, label: '极低密度' },
            { max: 3, score: 70, label: '低密度' },
            { max: 5, score: 50, label: '中等密度' },
            { max: 10, score: 30, label: '高密度' },
          ],
          measure: 'ESLint 错误总数 / (代码总行数 / 1000)，取反评分（越低分越高）',
        },
        benchmark: 2,
        currentValue: 0,
      },
      {
        id: 'cq-cyclomatic-complexity',
        name: '函数复杂度（平均圈复杂度）',
        description: '函数的平均圈复杂度，反映代码逻辑分支的复杂程度',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 5, score: 95, label: '极低复杂度' },
            { max: 10, score: 80, label: '低复杂度' },
            { max: 15, score: 65, label: '中等复杂度' },
            { max: 20, score: 45, label: '较高复杂度' },
            { max: 30, score: 25, label: '高复杂度' },
          ],
          measure: '通过 ESLint complexity 规则或静态分析工具计算所有函数圈复杂度的平均值',
        },
        benchmark: 10,
        currentValue: 8,
      },
      {
        id: 'cq-duplication-rate',
        name: '代码重复率',
        description: '项目中重复代码块占总代码量的比例，越低越好',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 3, score: 95, label: '极低重复' },
            { max: 5, score: 85, label: '低重复' },
            { max: 10, score: 70, label: '中等重复' },
            { max: 15, score: 55, label: '较高重复' },
            { max: 20, score: 35, label: '高重复' },
          ],
          measure: '使用 jscpd 或类似工具扫描项目代码，计算重复行占总行数的百分比',
        },
        benchmark: 5,
        currentValue: 8,
      },
      {
        id: 'cq-type-safety',
        name: '类型安全率（TypeScript strict 覆盖率）',
        description: '启用 TypeScript strict 模式的文件占总代码文件的比例',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '全面类型安全' },
            { min: 70, score: 80, label: '大部分类型安全' },
            { min: 50, score: 65, label: '部分类型安全' },
            { min: 30, score: 45, label: '少量类型安全' },
            { min: 0, score: 20, label: '缺乏类型安全' },
          ],
          measure: 'TypeScript strict 模式文件数 / (TS 文件数 + JS 文件数) × 100%',
        },
        benchmark: 80,
        currentValue: 5,
      },
      {
        id: 'cq-dead-code',
        name: '未使用代码比例',
        description: '未被引用的导出函数、变量和模块占代码总量的比例，越低越好',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 2, score: 95, label: '几乎无冗余' },
            { max: 5, score: 80, label: '少量冗余' },
            { max: 10, score: 65, label: '中等冗余' },
            { max: 15, score: 45, label: '较多冗余' },
            { max: 20, score: 25, label: '大量冗余' },
          ],
          measure: '通过 tree-shaking 分析或 ts-prune 等工具检测未使用的导出，计算其占比',
        },
        benchmark: 5,
        currentValue: 12,
      },
    ],
  },

  // ---- 2. 功能完整性 (Functionality) - 20% ----
  functionality: {
    id: 'functionality',
    name: '功能完整性',
    nameEn: 'Functionality',
    weight: 20,
    description: '评估功能实现完整度、边界处理、错误恢复及跨平台可用性',
    indicators: [
      {
        id: 'fn-test-pass-rate',
        name: '核心功能测试通过率',
        description: '核心功能（FSRS 算法、学习/复习流程、数据持久化）的测试通过率',
        weight: 25,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 100, score: 100, label: '全部通过' },
            { min: 95, score: 90, label: '几乎全通过' },
            { min: 90, score: 75, label: '大部分通过' },
            { min: 80, score: 55, label: '较多失败' },
            { min: 0, score: 20, label: '严重失败' },
          ],
          measure: '核心模块测试通过数 / 核心模块测试总数 × 100%',
        },
        benchmark: 100,
        currentValue: 100,
      },
      {
        id: 'fn-boundary-coverage',
        name: '边界条件覆盖度',
        description: '对空值、极值、NaN、溢出等边界条件的测试和代码处理覆盖程度',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '全面覆盖' },
            { min: 70, score: 80, label: '较好覆盖' },
            { min: 50, score: 65, label: '部分覆盖' },
            { min: 30, score: 45, label: '覆盖不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含边界条件断言的测试数 / 测试总数 × 100%，并结合代码审查评分',
        },
        benchmark: 80,
        currentValue: 60,
      },
      {
        id: 'fn-error-handling',
        name: '错误处理完整度',
        description: '关键路径上 try/catch 覆盖率、错误恢复机制和用户提示的完整性',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '全面处理' },
            { min: 75, score: 80, label: '较好处理' },
            { min: 60, score: 65, label: '部分处理' },
            { min: 40, score: 45, label: '处理不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含错误处理（try/catch 或 .catch）的函数数 / 可抛错函数总数 × 100%',
        },
        benchmark: 85,
        currentValue: 55,
      },
      {
        id: 'fn-offline-availability',
        name: '离线功能可用性',
        description: 'PWA 离线场景下核心功能（学习、复习、查看词库）的可用比例',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '几乎完全可用' },
            { min: 80, score: 80, label: '大部分可用' },
            { min: 60, score: 65, label: '部分可用' },
            { min: 40, score: 45, label: '可用性差' },
            { min: 0, score: 20, label: '基本不可用' },
          ],
          measure: '离线可用核心功能数 / 核心功能总数 × 100%',
        },
        benchmark: 90,
        currentValue: 85,
      },
      {
        id: 'fn-cross-platform',
        name: '跨平台兼容性',
        description: '在 Web、Android(Electron/Capacitor) 多平台上功能表现一致性的程度',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '完全一致' },
            { min: 85, score: 80, label: '微小差异' },
            { min: 70, score: 65, label: '部分差异' },
            { min: 50, score: 45, label: '差异明显' },
            { min: 0, score: 20, label: '严重不一致' },
          ],
          measure: '各平台测试通过功能数 / 功能总数 × 100%，取各平台最小值',
        },
        benchmark: 90,
        currentValue: 70,
      },
      {
        id: 'fn-data-consistency',
        name: '数据一致性保证',
        description: 'IndexedDB、LRU 缓存、FSRS 状态之间数据一致性的保障程度',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '强一致' },
            { min: 85, score: 80, label: '最终一致' },
            { min: 70, score: 65, label: '偶尔不一致' },
            { min: 50, score: 45, label: '常见不一致' },
            { min: 0, score: 20, label: '严重不一致' },
          ],
          measure: '数据一致性测试通过率 + 同步冲突解决完整性评分的加权平均',
        },
        benchmark: 90,
        currentValue: 75,
      },
    ],
  },

  // ---- 3. 性能表现 (Performance) - 20% ----
  performance: {
    id: 'performance',
    name: '性能表现',
    nameEn: 'Performance',
    weight: 20,
    description: '评估应用加载速度、运行时性能、内存管理和缓存效率',
    indicators: [
      {
        id: 'pf-fcp',
        name: '首次内容绘制（FCP）',
        description: '页面首次呈现内容的时间，反映首屏加载速度',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 1.0, score: 95, label: '极速' },
            { max: 1.8, score: 85, label: '快速' },
            { max: 3.0, score: 70, label: '中等' },
            { max: 5.0, score: 50, label: '较慢' },
            { max: 10, score: 25, label: '极慢' },
          ],
          measure: '使用 Lighthouse 或 web-vitals 库测量 FCP 时间（秒）',
        },
        benchmark: 1.8,
        currentValue: 2.5,
      },
      {
        id: 'pf-lcp',
        name: '最大内容绘制（LCP）',
        description: '页面最大内容元素渲染完成的时间，反映主要内容的加载体验',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 2.0, score: 95, label: '极速' },
            { max: 2.5, score: 85, label: '快速' },
            { max: 4.0, score: 70, label: '中等' },
            { max: 6.0, score: 50, label: '较慢' },
            { max: 10, score: 25, label: '极慢' },
          ],
          measure: '使用 Lighthouse 或 web-vitals 库测量 LCP 时间（秒）',
        },
        benchmark: 2.5,
        currentValue: 3.5,
      },
      {
        id: 'pf-memory-leak',
        name: '内存泄漏风险指数',
        description: '检测页面长时间运行后内存增长情况，0 为无泄漏风险',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 0, score: 100, label: '无泄漏风险' },
            { max: 5, score: 85, label: '极低风险' },
            { max: 15, score: 70, label: '低风险' },
            { max: 30, score: 50, label: '中等风险' },
            { max: 50, score: 25, label: '高风险' },
          ],
          measure: '模拟 30 分钟连续使用后，通过 Chrome DevTools Memory 面板测量内存增长百分比',
        },
        benchmark: 5,
        currentValue: 10,
      },
      {
        id: 'pf-main-thread-blocking',
        name: '主线程阻塞时间',
        description: '总阻塞时间（TBT），衡量主线程被长任务阻塞的程度',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 100, score: 95, label: '极低阻塞' },
            { max: 200, score: 85, label: '低阻塞' },
            { max: 400, score: 70, label: '中等阻塞' },
            { max: 600, score: 50, label: '较高阻塞' },
            { max: 1000, score: 25, label: '严重阻塞' },
          ],
          measure: '使用 Lighthouse 测量 TBT（毫秒），即 FCP 到 TTI 之间长任务超出 50ms 的部分之和',
        },
        benchmark: 200,
        currentValue: 300,
      },
      {
        id: 'pf-cache-hit-rate',
        name: '缓存命中率',
        description: 'LRU 缓存命中次数占总访问次数的比例，反映缓存策略有效性',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '极高命中率' },
            { min: 75, score: 80, label: '高命中率' },
            { min: 60, score: 65, label: '中等命中率' },
            { min: 40, score: 45, label: '低命中率' },
            { min: 0, score: 20, label: '极低命中率' },
          ],
          measure: 'LRU 缓存命中次数 / (命中次数 + 未命中次数) × 100%',
        },
        benchmark: 80,
        currentValue: 70,
      },
      {
        id: 'pf-worker-utilization',
        name: 'Worker 线程利用率',
        description: 'Worker 线程处理任务占比（vs 主线程同步执行），反映多线程策略的有效性',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 80, score: 95, label: '充分利用' },
            { min: 60, score: 80, label: '较好利用' },
            { min: 40, score: 65, label: '部分利用' },
            { min: 20, score: 45, label: '利用不足' },
            { min: 0, score: 20, label: '几乎未利用' },
          ],
          measure: 'Worker 线程处理的计算密集型任务数 / 可卸载的计算密集型任务总数 × 100%',
        },
        benchmark: 60,
        currentValue: 55,
      },
    ],
  },

  // ---- 4. 安全性 (Security) - 15% ----
  security: {
    id: 'security',
    name: '安全性',
    nameEn: 'Security',
    weight: 15,
    description: '评估应用抵御常见攻击的能力、输入验证、敏感数据保护和依赖安全',
    indicators: [
      {
        id: 'sec-known-vulnerabilities',
        name: '已知漏洞数量',
        description: 'npm audit 检测到的已知安全漏洞数量（含直接和间接依赖），越少越好',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { max: 0, score: 100, label: '零漏洞' },
            { max: 2, score: 85, label: '极少漏洞' },
            { max: 5, score: 70, label: '少量漏洞' },
            { max: 10, score: 50, label: '较多漏洞' },
            { max: 20, score: 25, label: '大量漏洞' },
          ],
          measure: 'npm audit --json 报告中的漏洞总数（critical + high + moderate + low）',
        },
        benchmark: 3,
        currentValue: 22,
      },
      {
        id: 'sec-input-validation',
        name: '输入验证覆盖率',
        description: '所有外部输入（用户输入、URL 参数、API 返回）经过验证和消毒的比例',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '全面验证' },
            { min: 80, score: 80, label: '较好验证' },
            { min: 65, score: 65, label: '部分验证' },
            { min: 45, score: 45, label: '验证不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含输入验证/消毒的入口函数数 / 所有外部输入入口函数数 × 100%',
        },
        benchmark: 90,
        currentValue: 85,
      },
      {
        id: 'sec-sensitive-data',
        name: '敏感数据保护率',
        description: '密钥、令牌、用户隐私数据等敏感信息得到安全存储和传输的比例',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '全面保护' },
            { min: 80, score: 80, label: '较好保护' },
            { min: 65, score: 65, label: '部分保护' },
            { min: 45, score: 45, label: '保护不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '安全存储的敏感数据项 / 项目中所有敏感数据项 × 100%，检测硬编码、明文存储等',
        },
        benchmark: 90,
        currentValue: 90,
      },
      {
        id: 'sec-xss-protection',
        name: 'XSS 防护率',
        description: '所有 innerHTML/outerHTML/document.write 调用点经过转义消毒的比例',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 100, score: 100, label: '全面防护' },
            { min: 90, score: 85, label: '较好防护' },
            { min: 75, score: 70, label: '部分防护' },
            { min: 50, score: 45, label: '防护不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '使用 escapeHTML/消毒的 DOM 写入点 / 所有 DOM 写入点 × 100%',
        },
        benchmark: 100,
        currentValue: 95,
      },
      {
        id: 'sec-dependency-score',
        name: '依赖安全评分',
        description: '第三方依赖的整体安全评分，基于漏洞严重程度和依赖时效性',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '高度可信' },
            { min: 75, score: 80, label: '较为可信' },
            { min: 60, score: 65, label: '一般' },
            { min: 40, score: 45, label: '风险较高' },
            { min: 0, score: 20, label: '风险极高' },
          ],
          measure: '基于 Snyk/Socket 等工具扫描，综合 critical/high/moderate 漏洞数和过时依赖比例的评分',
        },
        benchmark: 80,
        currentValue: 60,
      },
      {
        id: 'sec-cors-csrf',
        name: 'CORS/CSRF 防护率',
        description: '跨域请求和跨站请求伪造防护策略的覆盖程度',
        weight: 10,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '全面防护' },
            { min: 80, score: 80, label: '较好防护' },
            { min: 65, score: 65, label: '部分防护' },
            { min: 45, score: 45, label: '防护不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含 CORS 策略和 CSRF Token 的请求端点数 / 所有跨域/写操作端点数 × 100%',
        },
        benchmark: 90,
        currentValue: 70,
      },
    ],
  },

  // ---- 5. 用户体验 (UX/Accessibility) - 12% ----
  userExperience: {
    id: 'user-experience',
    name: '用户体验',
    nameEn: 'UX/Accessibility',
    weight: 12,
    description: '评估无障碍支持、交互体验、视觉适配和用户偏好适配程度',
    indicators: [
      {
        id: 'ux-aria-coverage',
        name: 'ARIA 无障碍覆盖率',
        description: '交互元素具有正确 ARIA 属性（role, aria-label 等）的比例',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '全面覆盖' },
            { min: 75, score: 80, label: '较好覆盖' },
            { min: 55, score: 65, label: '部分覆盖' },
            { min: 35, score: 45, label: '覆盖不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含正确 ARIA 属性的交互元素数 / 所有交互元素数 × 100%',
        },
        benchmark: 85,
        currentValue: 75,
      },
      {
        id: 'ux-keyboard-nav',
        name: '键盘导航完整度',
        description: '所有交互功能可通过键盘完整操作的比例',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '完全可导航' },
            { min: 80, score: 80, label: '较好可导航' },
            { min: 65, score: 65, label: '部分可导航' },
            { min: 45, score: 45, label: '导航不完整' },
            { min: 0, score: 20, label: '基本不可导航' },
          ],
          measure: '可通过键盘完成的交互操作数 / 所有交互操作数 × 100%',
        },
        benchmark: 90,
        currentValue: 75,
      },
      {
        id: 'ux-dark-mode',
        name: '暗色模式支持度',
        description: '所有界面元素在暗色模式下正确渲染和可读的比例',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '完美支持' },
            { min: 80, score: 80, label: '较好支持' },
            { min: 65, score: 65, label: '部分支持' },
            { min: 45, score: 45, label: '支持不完整' },
            { min: 0, score: 20, label: '基本不支持' },
          ],
          measure: '暗色模式下视觉正确的 UI 组件数 / 所有 UI 组件数 × 100%',
        },
        benchmark: 90,
        currentValue: 85,
      },
      {
        id: 'ux-responsive',
        name: '响应式适配度',
        description: '在不同屏幕尺寸（手机/平板/桌面）下布局正确适配的比例',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '完美适配' },
            { min: 85, score: 80, label: '较好适配' },
            { min: 70, score: 65, label: '部分适配' },
            { min: 50, score: 45, label: '适配不完整' },
            { min: 0, score: 20, label: '基本不适配' },
          ],
          measure: '在 320px/768px/1024px/1440px 四个断点下布局正确的页面区域占比',
        },
        benchmark: 90,
        currentValue: 80,
      },
      {
        id: 'ux-i18n-readiness',
        name: '国际化准备度',
        description: 'UI 文本已抽取为可翻译字符串的比例，反映国际化扩展的难易程度',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '完全就绪' },
            { min: 70, score: 80, label: '较好就绪' },
            { min: 50, score: 65, label: '部分就绪' },
            { min: 30, score: 45, label: '就绪度低' },
            { min: 0, score: 20, label: '未准备' },
          ],
          measure: '已抽取至 i18n 资源文件的文本数 / 界面硬编码文本总数 × 100%',
        },
        benchmark: 60,
        currentValue: 10,
      },
      {
        id: 'ux-motion-pref',
        name: '动画偏好适配',
        description: '尊重用户 prefers-reduced-motion 设置，减少动画和过渡的比例',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 95, score: 95, label: '全面适配' },
            { min: 80, score: 80, label: '较好适配' },
            { min: 60, score: 65, label: '部分适配' },
            { min: 40, score: 45, label: '适配不足' },
            { min: 0, score: 20, label: '未适配' },
          ],
          measure: '含 @media(prefers-reduced-motion) 的动画/过渡数 / 所有动画/过渡数 × 100%',
        },
        benchmark: 80,
        currentValue: 20,
      },
    ],
  },

  // ---- 6. 文档完整性 (Documentation) - 8% ----
  documentation: {
    id: 'documentation',
    name: '文档完整性',
    nameEn: 'Documentation',
    weight: 8,
    description: '评估项目各类文档的覆盖度和质量，影响团队协作和项目可维护性',
    indicators: [
      {
        id: 'doc-api-coverage',
        name: 'API 文档覆盖率',
        description: '公开 API 和核心模块接口具有文档注释的比例',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '全面覆盖' },
            { min: 70, score: 80, label: '较好覆盖' },
            { min: 50, score: 65, label: '部分覆盖' },
            { min: 30, score: 45, label: '覆盖不足' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '含 JSDoc/TSDoc 注释的公开函数和类数 / 所有公开函数和类数 × 100%',
        },
        benchmark: 80,
        currentValue: 25,
      },
      {
        id: 'doc-architecture',
        name: '架构文档完整度',
        description: '项目架构图、模块依赖关系、数据流图等技术文档的完整性',
        weight: 20,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '非常完整' },
            { min: 70, score: 80, label: '较完整' },
            { min: 50, score: 65, label: '部分完整' },
            { min: 30, score: 45, label: '不够完整' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '基于架构文档清单逐项评分：目录结构说明、模块依赖图、数据流图、部署架构图',
        },
        benchmark: 70,
        currentValue: 30,
      },
      {
        id: 'doc-changelog',
        name: '变更日志完整度',
        description: 'CHANGELOG 按版本记录变更内容的完整性和规范性',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '非常完整' },
            { min: 75, score: 80, label: '较完整' },
            { min: 55, score: 65, label: '部分完整' },
            { min: 35, score: 45, label: '不够完整' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '遵循 Conventional Commits 规范的版本条目数 / 总版本条目数 × 100%',
        },
        benchmark: 80,
        currentValue: 50,
      },
      {
        id: 'doc-comment-density',
        name: '代码注释密度',
        description: '代码中注释行占总行数的比例，反映代码自文档化程度',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 20, max: 35, score: 95, label: '适中密度' },
            { min: 15, score: 80, label: '良好密度' },
            { min: 10, score: 65, label: '偏低密度' },
            { min: 5, score: 45, label: '密度不足' },
            { min: 0, score: 20, label: '几乎无注释' },
          ],
          measure: '注释行数 / (代码行数 + 注释行数) × 100%',
        },
        benchmark: 15,
        currentValue: 8,
      },
      {
        id: 'doc-readme',
        name: 'README 完整度',
        description: 'README 包含项目介绍、安装指南、使用说明、贡献指南等必要内容的完整性',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '非常完整' },
            { min: 75, score: 80, label: '较完整' },
            { min: 55, score: 65, label: '部分完整' },
            { min: 35, score: 45, label: '不够完整' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '基于 README 清单逐项评分：项目简介、安装步骤、使用示例、配置说明、贡献指南、许可证',
        },
        benchmark: 80,
        currentValue: 78,
      },
      {
        id: 'doc-troubleshooting',
        name: '故障排查文档',
        description: '常见问题、错误排查指南和运维手册的完整性',
        weight: 15,
        scoring: {
          maxScore: 100,
          thresholds: [
            { min: 90, score: 95, label: '非常完整' },
            { min: 70, score: 80, label: '较完整' },
            { min: 50, score: 65, label: '部分完整' },
            { min: 30, score: 45, label: '不够完整' },
            { min: 0, score: 20, label: '严重缺失' },
          ],
          measure: '基于故障排查清单逐项评分：FAQ、常见错误码、调试指南、性能调优、回滚方案',
        },
        benchmark: 60,
        currentValue: 60,
      },
    ],
  },
};

// ============================================================================
// 质量门禁配置
// ============================================================================
const qualityGates = {
  /** 进入下一开发阶段的最低总分 */
  entry: {
    minScore: 75,
    description: '进入下一开发阶段（如合并到 develop）的最低总分要求',
  },
  /** 发布版本的最低总分 */
  release: {
    minScore: 85,
    description: '发布到生产环境的最低总分要求',
  },
  /** 关键维度的最低分数（任一关键维度低于此值则阻断） */
  critical: {
    minScore: 70,
    description: '关键维度（代码质量、安全性）的最低分数，低于此值无论总分如何都阻断',
    criticalDimensions: ['codeQuality', 'security'],
  },
};

// ============================================================================
// 完整配置对象
// ============================================================================
const qualityConfig = {
  /** 配置版本号 */
  version: '1.0.0',

  /** 项目标识 */
  project: {
    name: '46英语',
    description: '基于 FSRS 的英语学习工具',
    version: '1.4.0',
    techStack: ['Vite 8', 'Vitest 4', 'ESLint 8', 'Prettier 3', 'TypeScript 6'],
    platforms: ['Web', 'Android (Electron/Capacitor)'],
  },

  /** 六大评估维度 */
  dimensions,

  /** 质量门禁 */
  qualityGates,

  /** 行业基准对照表 */
  benchmarkLevels: BENCHMARK_LEVELS,

  /** 历史已知问题（用于指导评估关注点） */
  knownIssues: [
    { id: 'KI-001', type: 'bug', description: 'NaN 传播导致 FSRS 计算异常', status: 'fixed' },
    { id: 'KI-002', type: 'bug', description: 'LRU 缓存数据丢失', status: 'fixed' },
    { id: 'KI-003', type: 'bug', description: 'FSRS 算法执行顺序错误', status: 'fixed' },
    { id: 'KI-004', type: 'security', description: 'SSRF 漏洞风险', status: 'fixed' },
    { id: 'KI-005', type: 'security', description: '原型污染风险', status: 'fixed' },
  ],

  /**
   * 文档化问题注册表 - 来自历次评审报告的 P0/P1 缺陷
   *
   * 每个问题附带验证逻辑（verification），脚本将实际执行验证以判定
   * 问题真实状态，而非信任标签。验证类型：
   *   - staticImportAbsent : 验证指定文件不静态导入某模块
   *   - coverageThreshold  : 验证覆盖率 ≥ 阈值
   *   - testFilesExist     : 验证给定模块的测试文件存在
   *   - cspHasDirective    : 验证 CSP 含指定指令
   *   - noPatternInJs      : 验证 js/ 下不含指定正则模式
   *   - dependencyVersion  : 验证依赖版本满足要求
   *   - largeChunkAbsent   : 验证 dist 下无单文件超过阈值 KB
   *   - readmeHasSection   : 验证 README 含必要章节
   *   - fileExists         : 验证文件存在
   *   - commandSucceeds    : 验证命令退出码为 0
   *
   * source 字段标注问题来源的报告文件
   */
  documentedIssues: [
    {
      id: 'DI-001',
      severity: 'P0',
      description: 'vocab-data 738KB large chunk 影响首次加载（应懒加载）',
      source: 'reports/quality-assessment-2026-06-07.md P0',
      expectedStatus: 'fixed',
      verification: {
        type: 'staticImportAbsent',
        file: 'js/main.js',
        importPath: 'default_vocab',
      },
    },
    {
      id: 'DI-002',
      severity: 'P0',
      description: '测试覆盖率低于 50% 目标',
      source: 'reports/quality-assessment-2026-06-07.md P0',
      expectedStatus: 'fixed',
      verification: {
        type: 'coverageThreshold',
        threshold: 50,
      },
    },
    {
      id: 'DI-003',
      severity: 'P1',
      description: '无严格 CSP（Content-Security-Policy）',
      source: 'reports/quality-assessment-2026-06-07.md 安全性扣分',
      expectedStatus: 'fixed',
      verification: {
        type: 'cspHasDirective',
        directives: ["default-src", "script-src", "object-src", "base-uri", "frame-ancestors"],
      },
    },
    {
      id: 'DI-004',
      severity: 'P1',
      description: 'eval/Function 代码注入风险',
      source: 'reports/quality-assessment-2026-06-07.md 安全性',
      expectedStatus: 'fixed',
      verification: {
        type: 'noPatternInJs',
        pattern: '\\beval\\s*\\(|new\\s+Function\\s*\\(',
      },
    },
    {
      id: 'DI-005',
      severity: 'P1',
      description: 'WebDAV/Crypto 同步功能无测试覆盖',
      source: 'reports/quality-assessment-2026-06-07.md 功能完整性',
      expectedStatus: 'fixed',
      verification: {
        type: 'testFilesExist',
        modules: ['webdav'],
      },
    },
    {
      id: 'DI-006',
      severity: 'P1',
      description: '小游戏/引擎可视化无测试',
      source: 'reports/quality-assessment-2026-06-07.md 功能完整性',
      expectedStatus: 'fixed',
      verification: {
        type: 'testFilesExist',
        modules: ['minigame', 'engine-visualizer'],
      },
    },
    {
      id: 'DI-007',
      severity: 'P1',
      description: 'Electron 版本需升级至 v30+',
      source: 'reports/quality-assessment-2026-06-07.md P1',
      expectedStatus: 'fixed',
      verification: {
        type: 'dependencyVersion',
        dependency: 'electron',
        minMajor: 30,
      },
    },
    {
      id: 'DI-008',
      severity: 'P1',
      description: 'ARIA 无障碍覆盖率不足',
      source: 'reports/quality-assessment-2026-06-07.md 用户体验',
      expectedStatus: 'fixed',
      verification: {
        type: 'coverageThreshold',
        threshold: 60,
        // 此项由 checkRealAriaCoverage 提供实际值
        customMetric: 'ariaCoverageRate',
      },
    },
    {
      id: 'DI-009',
      severity: 'P2',
      description: '缺少 E2E 测试（Playwright/Cypress）',
      source: 'reports/quality-assessment-2026-06-07.md P1',
      expectedStatus: 'fixed',
      verification: {
        type: 'dependencyVersion',
        dependency: '@playwright/test',
        minMajor: 1,
      },
    },
    {
      id: 'DI-010',
      severity: 'P2',
      description: 'TypeScript 仅 constants.ts，核心 JS 未迁移',
      source: 'reports/quality-assessment-2026-06-07.md P2',
      expectedStatus: 'open',
      verification: {
        type: 'coverageThreshold',
        threshold: 30,
        customMetric: 'tsFileRatio',
      },
    },
  ],

  /**
   * 问题核对惩罚配置
   * 每个未解决的 P0/P1 问题将从总分中扣除对应分值
   */
  issuePenalty: {
    P0: 5,
    P1: 2,
    P2: 0,
    maxPenalty: 25,
  },

  /**
   * 深层静态分析阈值
   */
  deepAnalysis: {
    largeChunkThresholdKB: 200,
    perModuleCoverageMin: 30,
    readmeRequiredSections: ['安装', '使用', '贡献', 'License', 'MIT'],
    cspRequiredDirectives: ['default-src', 'script-src', 'object-src', 'base-uri', 'frame-ancestors'],
  },
};

export default qualityConfig;
