/**
 * 评估检查清单模块
 * 按六大维度组织完整的质量检查项，每项包含唯一标识、维度、描述、严重程度、
 * 是否可自动检测、检测方法及通过标准。
 */

export const checklist = {
  // ============================================================
  // 一、代码质量检查项（Code Quality）
  // ============================================================
  codeQuality: [
    {
      id: 'CQ-001',
      category: '代码质量',
      item: '测试覆盖率是否达到阈值',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '运行 vitest --coverage，解析 coverage 报告中的行覆盖率、分支覆盖率、函数覆盖率',
      passCriteria: '行覆盖率 ≥ 80%，分支覆盖率 ≥ 70%，函数覆盖率 ≥ 75%',
    },
    {
      id: 'CQ-002',
      category: '代码质量',
      item: 'ESLint 是否有 error 级别问题',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '运行 eslint --format json，统计 error 级别问题的数量',
      passCriteria: 'ESLint error 数量为 0',
    },
    {
      id: 'CQ-003',
      category: '代码质量',
      item: '是否存在未捕获的 Promise 异常',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '静态分析 .then() 调用是否缺少 .catch()；检测 async 函数中缺少 try/catch 的 await 调用',
      passCriteria: '所有 Promise 链均有错误处理，无 unhandledRejection 风险',
    },
    {
      id: 'CQ-004',
      category: '代码质量',
      item: '函数圈复杂度是否超标（>10）',
      severity: 'major',
      autoCheck: true,
      checkMethod: '使用 ESLint complexity 规则或静态分析工具计算每个函数的圈复杂度',
      passCriteria: '所有函数圈复杂度 ≤ 10',
    },
    {
      id: 'CQ-005',
      category: '代码质量',
      item: '是否存在未使用的变量/导入',
      severity: 'major',
      autoCheck: true,
      checkMethod: '运行 ESLint no-unused-vars / no-unused-imports 规则检测',
      passCriteria: '未使用变量和导入数量为 0',
    },
    {
      id: 'CQ-006',
      category: '代码质量',
      item: '代码重复率是否低于阈值',
      severity: 'major',
      autoCheck: true,
      checkMethod: '使用 jscpd 或类似工具扫描重复代码块，计算重复率',
      passCriteria: '代码重复率 < 5%',
    },
    {
      id: 'CQ-007',
      category: '代码质量',
      item: 'TypeScript strict 是否启用',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检查 tsconfig.json 中 compilerOptions.strict 是否为 true',
      passCriteria: 'strict 模式已启用，且 tsc --noEmit 无错误',
    },
    {
      id: 'CQ-008',
      category: '代码质量',
      item: '是否存在 NaN 传播风险',
      severity: 'major',
      autoCheck: true,
      checkMethod: '静态分析算术运算结果是否可能为 NaN，检测 parseInt/parseFloat 未校验结果',
      passCriteria: '所有数值运算结果均经过 isNaN / Number.isNaN 校验',
    },
    {
      id: 'CQ-009',
      category: '代码质量',
      item: '是否存在隐式类型转换',
      severity: 'minor',
      autoCheck: true,
      checkMethod: 'ESLint eqeqeq 规则检测 ==/!= 使用，检测 + 运算符与字符串/数字混用',
      passCriteria: '使用 ===/!== 进行比较，显式类型转换代替隐式转换',
    },
    {
      id: 'CQ-010',
      category: '代码质量',
      item: '异步操作是否正确处理',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检测 async 函数中缺少 await 的调用、Promise 构造器中同步抛出异常、回调与 async 混用',
      passCriteria: '所有异步操作均正确 await 或 .then()/.catch() 处理',
    },
    {
      id: 'CQ-011',
      category: '代码质量',
      item: '是否有硬编码的魔术数字',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '扫描代码中直接使用的数字常量（排除 0、1、-1 等常见值），对比 CONFIG 常量定义',
      passCriteria: '所有业务相关数字已提取为命名常量',
    },
    {
      id: 'CQ-012',
      category: '代码质量',
      item: '模块依赖是否存在循环引用',
      severity: 'major',
      autoCheck: true,
      checkMethod: '使用 madge 或类似工具分析模块依赖图，检测循环依赖',
      passCriteria: '模块依赖图中无循环引用',
    },
    {
      id: 'CQ-013',
      category: '代码质量',
      item: '是否存在空函数/占位函数',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '检测函数体仅含空语句或 TODO 注释的函数定义',
      passCriteria: '无空函数或占位函数遗留',
    },
    {
      id: 'CQ-014',
      category: '代码质量',
      item: '是否有未处理的边界条件',
      severity: 'major',
      autoCheck: false,
      checkMethod: '代码审查中检查数组越界访问、null/undefined 属性访问、除零、空数组/空对象处理',
      passCriteria: '关键路径的边界条件均有防护处理',
    },
    {
      id: 'CQ-015',
      category: '代码质量',
      item: '错误日志是否完整',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查 catch 块中是否包含 logger 调用，检测空 catch 块，验证错误信息包含上下文',
      passCriteria: '所有 catch 块均有日志记录，错误信息包含足够上下文',
    },
  ],

  // ============================================================
  // 二、功能完整性检查项（Functional Completeness）
  // ============================================================
  functionalCompleteness: [
    {
      id: 'FN-001',
      category: '功能完整性',
      item: '核心学习流程是否完整（学习→复习→掌握）',
      severity: 'critical',
      autoCheck: false,
      checkMethod: '端到端测试覆盖学习、复习、掌握三个核心状态转换',
      passCriteria: '核心流程所有状态转换可正常执行',
    },
    {
      id: 'FN-002',
      category: '功能完整性',
      item: 'FSRS 算法调度是否正确',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '单元测试验证 FSRS 参数计算、复习间隔、记忆稳定性预测的准确性',
      passCriteria: 'FSRS 核心计算逻辑测试通过率 100%',
    },
    {
      id: 'FN-003',
      category: '功能完整性',
      item: '词库数据是否完整且有效',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '运行 validate-vocab 脚本验证词库 JSON 的字段完整性、去重、编码正确性',
      passCriteria: '词库校验零错误',
    },
    {
      id: 'FN-004',
      category: '功能完整性',
      item: '数据持久化是否可靠（IndexedDB 读写）',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '测试 IndexedDB 的 CRUD 操作、事务完整性、异常恢复',
      passCriteria: '数据读写一致性测试全部通过',
    },
    {
      id: 'FN-005',
      category: '功能完整性',
      item: 'WebDAV 同步功能是否正常',
      severity: 'major',
      autoCheck: false,
      checkMethod: '模拟 WebDAV 服务器测试上传、下载、冲突解决、增量同步',
      passCriteria: '同步功能测试通过，冲突解决策略正确执行',
    },
    {
      id: 'FN-006',
      category: '功能完整性',
      item: '离线模式是否可用',
      severity: 'major',
      autoCheck: true,
      checkMethod: '在断网条件下测试核心功能的可用性，验证 Service Worker 缓存策略',
      passCriteria: '离线状态下核心学习功能可正常使用',
    },
    {
      id: 'FN-007',
      category: '功能完整性',
      item: '拼写练习功能是否正确',
      severity: 'major',
      autoCheck: true,
      checkMethod: '单元测试验证拼写判定逻辑、大小写处理、特殊字符处理',
      passCriteria: '拼写判定准确率 100%，边界情况正确处理',
    },
    {
      id: 'FN-008',
      category: '功能完整性',
      item: '统计与进度追踪是否准确',
      severity: 'major',
      autoCheck: true,
      checkMethod: '验证统计数据计算逻辑（已学/新词/复习/掌握数量），检查里程碑触发',
      passCriteria: '统计数据与实际学习记录一致',
    },
    {
      id: 'FN-009',
      category: '功能完整性',
      item: '错误单词本功能是否完整',
      severity: 'major',
      autoCheck: true,
      checkMethod: '测试错误单词的添加、查看、重新学习、移除流程',
      passCriteria: '错误单词本所有操作可正常执行',
    },
    {
      id: 'FN-010',
      category: '功能完整性',
      item: '设置与偏好是否持久化',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '修改设置后刷新页面，验证设置值是否保持；测试 localStorage 读写',
      passCriteria: '设置变更后持久化保存，页面重载后恢复',
    },
    {
      id: 'FN-011',
      category: '功能完整性',
      item: '主题切换功能是否正常',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '测试主题切换的 CSS 变量切换、localStorage 持久化、系统主题跟随',
      passCriteria: '主题切换即时生效，刷新后保持选择',
    },
    {
      id: 'FN-012',
      category: '功能完整性',
      item: 'PWA 安装与更新是否正常',
      severity: 'major',
      autoCheck: true,
      checkMethod: '验证 manifest.json 配置、Service Worker 注册、更新提示机制',
      passCriteria: 'PWA 可正常安装，版本更新提示正常',
    },
  ],

  // ============================================================
  // 三、性能检查项（Performance）
  // ============================================================
  performance: [
    {
      id: 'PF-001',
      category: '性能',
      item: '首屏加载时间是否达标',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '使用 Lighthouse 或 Web Vitals 测量 LCP（Largest Contentful Paint）',
      passCriteria: 'LCP ≤ 2.5 秒',
    },
    {
      id: 'PF-002',
      category: '性能',
      item: '交互响应时间是否达标',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '使用 Web Vitals 测量 INP（Interaction to Next Paint）',
      passCriteria: 'INP ≤ 200ms',
    },
    {
      id: 'PF-003',
      category: '性能',
      item: '页面布局稳定性是否达标',
      severity: 'major',
      autoCheck: true,
      checkMethod: '使用 Web Vitals 测量 CLS（Cumulative Layout Shift）',
      passCriteria: 'CLS ≤ 0.1',
    },
    {
      id: 'PF-004',
      category: '性能',
      item: 'JS 包体积是否在合理范围内',
      severity: 'major',
      autoCheck: true,
      checkMethod: '分析 vite build 产物，检查总体积和各 chunk 大小',
      passCriteria: '主包体积 < 200KB（gzip 后），无单个 chunk > 100KB',
    },
    {
      id: 'PF-005',
      category: '性能',
      item: '是否存在内存泄漏',
      severity: 'critical',
      autoCheck: false,
      checkMethod: 'Chrome DevTools Memory 面板多次快照对比，检测事件监听器未移除、闭包引用未释放',
      passCriteria: '长时间使用后内存占用稳定，无持续增长趋势',
    },
    {
      id: 'PF-006',
      category: '性能',
      item: '图片资源是否优化',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查图片格式（WebP/AVIF）、压缩率、是否有未使用的图片资源',
      passCriteria: '图片均为优化格式，压缩后体积合理，无冗余图片',
    },
    {
      id: 'PF-007',
      category: '性能',
      item: 'CSS 是否存在未使用的规则',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '使用 PurgeCSS 或 Chrome Coverage 工具分析 CSS 使用率',
      passCriteria: 'CSS 使用率 > 90%',
    },
    {
      id: 'PF-008',
      category: '性能',
      item: 'Worker 通信是否高效',
      severity: 'major',
      autoCheck: true,
      checkMethod: '测量 Worker postMessage 的数据量与延迟，检测是否存在序列化瓶颈',
      passCriteria: 'Worker 通信延迟 < 5ms，传输数据使用 Transferable 对象',
    },
    {
      id: 'PF-009',
      category: '性能',
      item: '列表渲染性能是否达标',
      severity: 'major',
      autoCheck: true,
      checkMethod: '测试大量词汇列表的渲染时间，检查是否使用虚拟滚动或分页',
      passCriteria: '1000+ 条目渲染时间 < 100ms，滚动帧率 ≥ 55fps',
    },
    {
      id: 'PF-010',
      category: '性能',
      item: 'IndexedDB 查询性能是否达标',
      severity: 'major',
      autoCheck: true,
      checkMethod: '测量常用查询（按状态筛选、按日期排序）的响应时间',
      passCriteria: '单次查询响应时间 < 50ms，批量操作使用事务',
    },
  ],

  // ============================================================
  // 四、安全检查项（Security）
  // ============================================================
  security: [
    {
      id: 'SC-001',
      category: '安全',
      item: '是否存在 XSS 漏洞',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '扫描 innerHTML、document.write、eval 等危险 API 的使用，检测未转义的用户输入',
      passCriteria: '无直接 innerHTML 插入用户输入，所有动态内容经过转义',
    },
    {
      id: 'SC-002',
      category: '安全',
      item: '是否使用 HTTPS 传输',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检查所有外部请求 URL 是否为 HTTPS，验证 CSP 中 upgrade-insecure-requests',
      passCriteria: '所有外部通信均使用 HTTPS',
    },
    {
      id: 'SC-003',
      category: '安全',
      item: '敏感数据是否加密存储',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检查 WebDAV 凭据、用户令牌等敏感数据在本地存储前是否加密',
      passCriteria: '敏感数据经 AES 或同等强度加密后存储',
    },
    {
      id: 'SC-004',
      category: '安全',
      item: '依赖包是否存在已知漏洞',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '运行 npm audit，检查 CVE 数据库中是否有影响当前依赖的漏洞',
      passCriteria: 'npm audit 零 critical/high 级别漏洞',
    },
    {
      id: 'SC-005',
      category: '安全',
      item: 'Content Security Policy 是否配置',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查 HTTP 响应头或 meta 标签中的 CSP 策略配置',
      passCriteria: 'CSP 已配置，限制 script-src、style-src、connect-src 等指令',
    },
    {
      id: 'SC-006',
      category: '安全',
      item: '是否有代码注入风险',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检测 eval()、new Function()、setTimeout(string) 等动态代码执行',
      passCriteria: '无动态代码执行，所有逻辑为静态定义',
    },
    {
      id: 'SC-007',
      category: '安全',
      item: '第三方资源完整性是否校验',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查外部引入的 CDN 资源是否包含 integrity 属性（SRI）',
      passCriteria: '所有第三方 CDN 资源配置 SRI 校验',
    },
    {
      id: 'SC-008',
      category: '安全',
      item: '是否有信息泄露风险',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查 console 输出是否包含敏感信息，验证错误消息是否暴露内部实现细节',
      passCriteria: '生产环境无敏感信息输出到控制台，错误消息不含内部路径或密钥',
    },
    {
      id: 'SC-009',
      category: '安全',
      item: 'WebDAV 通信是否安全',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '验证 WebDAV 请求使用 HTTPS、凭据不以明文传输、token 有有效期',
      passCriteria: 'WebDAV 连接全程 HTTPS，凭据加密传输',
    },
    {
      id: 'SC-010',
      category: '安全',
      item: 'Service Worker 安全是否合规',
      severity: 'major',
      autoCheck: true,
      checkMethod: '验证 SW 注册域与作用域、检查缓存策略是否可能被中间人利用',
      passCriteria: 'SW 作用域正确，缓存策略无安全风险',
    },
  ],

  // ============================================================
  // 五、用户体验检查项（User Experience）
  // ============================================================
  userExperience: [
    {
      id: 'UX-001',
      category: '用户体验',
      item: '加载状态是否有明确反馈',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查所有异步操作是否显示 loading 指示器或骨架屏',
      passCriteria: '所有耗时 > 300ms 的操作有加载状态提示',
    },
    {
      id: 'UX-002',
      category: '用户体验',
      item: '操作反馈是否及时',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查按钮点击、卡片翻转等交互是否有视觉反馈（动画/颜色变化）',
      passCriteria: '所有可交互元素有即时视觉反馈',
    },
    {
      id: 'UX-003',
      category: '用户体验',
      item: '错误信息是否用户友好',
      severity: 'major',
      autoCheck: false,
      checkMethod: '审查所有用户可见的错误提示，确认是否使用通俗语言而非技术术语',
      passCriteria: '错误提示使用用户友好语言，包含解决建议',
    },
    {
      id: 'UX-004',
      category: '用户体验',
      item: '键盘导航是否完整可用',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查 Tab 键焦点顺序、Enter/Space 激活、快捷键绑定',
      passCriteria: '所有核心功能可通过键盘完成操作',
    },
    {
      id: 'UX-005',
      category: '用户体验',
      item: '屏幕阅读器兼容性',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查 ARIA 标签、role 属性、alt 文本、语义化 HTML 标签的使用',
      passCriteria: '所有交互元素有正确的 ARIA 标签，图像有替代文本',
    },
    {
      id: 'UX-006',
      category: '用户体验',
      item: '响应式布局是否适配主流屏幕',
      severity: 'major',
      autoCheck: true,
      checkMethod: '在不同视口宽度（320px/768px/1024px/1440px）下测试布局',
      passCriteria: '内容在所有主流屏幕宽度下可正常阅读和操作',
    },
    {
      id: 'UX-007',
      category: '用户体验',
      item: '触摸操作是否友好',
      severity: 'major',
      autoCheck: true,
      checkMethod: '检查可点击元素尺寸 ≥ 44px、手势操作（滑动翻页）是否流畅',
      passCriteria: '触摸目标尺寸合规，手势操作响应及时',
    },
    {
      id: 'UX-008',
      category: '用户体验',
      item: '色彩对比度是否达标',
      severity: 'major',
      autoCheck: true,
      checkMethod: '使用对比度检测工具验证文本与背景的对比度（WCAG AA 标准）',
      passCriteria: '普通文本对比度 ≥ 4.5:1，大文本对比度 ≥ 3:1',
    },
    {
      id: 'UX-009',
      category: '用户体验',
      item: '数据丢失防护是否到位',
      severity: 'critical',
      autoCheck: true,
      checkMethod: '检查页面关闭/刷新时是否有未保存数据提醒，表单是否有自动保存',
      passCriteria: '存在未保存数据时弹出确认提示，关键数据自动保存',
    },
    {
      id: 'UX-010',
      category: '用户体验',
      item: '空状态是否有引导提示',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '检查列表为空、搜索无结果等场景是否有友好的空状态提示和操作引导',
      passCriteria: '所有空状态页面有清晰的说明和下一步操作指引',
    },
  ],

  // ============================================================
  // 六、文档检查项（Documentation）
  // ============================================================
  documentation: [
    {
      id: 'DC-001',
      category: '文档',
      item: 'README 是否包含完整的项目说明',
      severity: 'major',
      autoCheck: false,
      checkMethod: '检查 README.md 是否包含项目简介、安装步骤、使用说明、技术栈说明',
      passCriteria: 'README 包含项目概述、安装、运行、构建说明',
    },
    {
      id: 'DC-002',
      category: '文档',
      item: 'API 文档是否与代码同步',
      severity: 'major',
      autoCheck: true,
      checkMethod: '对比导出函数的 JSDoc 注释与实际参数/返回值，检测缺失或不一致',
      passCriteria: '所有公共 API 有 JSDoc 注释且与实现一致',
    },
    {
      id: 'DC-003',
      category: '文档',
      item: '变更日志是否及时更新',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '检查 CHANGELOG.md 最新条目是否覆盖最近版本的变更',
      passCriteria: '每个发布版本有对应的变更记录',
    },
    {
      id: 'DC-004',
      category: '文档',
      item: '架构文档是否反映当前设计',
      severity: 'major',
      autoCheck: false,
      checkMethod: '审查 ARCHITECTURE.md 是否与实际代码模块结构、数据流一致',
      passCriteria: '架构文档描述与代码结构一致',
    },
    {
      id: 'DC-005',
      category: '文档',
      item: '部署文档是否完整',
      severity: 'major',
      autoCheck: false,
      checkMethod: '检查 DEPLOY/BUILD_GUIDE 是否包含所有目标平台（Vercel/Electron/Android）的部署步骤',
      passCriteria: '部署文档覆盖所有目标平台，步骤可复现',
    },
    {
      id: 'DC-006',
      category: '文档',
      item: '代码注释是否充分',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '统计公共函数的 JSDoc 覆盖率，检查复杂逻辑的行内注释',
      passCriteria: '公共函数 JSDoc 覆盖率 ≥ 80%，复杂算法有行内注释',
    },
    {
      id: 'DC-007',
      category: '文档',
      item: '配置项是否有说明文档',
      severity: 'minor',
      autoCheck: true,
      checkMethod: '检查 CONFIG 对象中每个配置项是否有对应的注释或文档说明',
      passCriteria: '所有配置项有注释说明其用途和可选值',
    },
    {
      id: 'DC-008',
      category: '文档',
      item: '故障排查文档是否存在',
      severity: 'minor',
      autoCheck: false,
      checkMethod: '检查是否有常见问题 FAQ 或故障排查指南文档',
      passCriteria: '存在故障排查文档，覆盖已知问题和解决方案',
    },
  ],
};

/**
 * 获取所有检查项（扁平数组）
 * @returns {Array} 所有检查项的扁平数组
 */
export function getAllCheckItems() {
  return [
    ...checklist.codeQuality,
    ...checklist.functionalCompleteness,
    ...checklist.performance,
    ...checklist.security,
    ...checklist.userExperience,
    ...checklist.documentation,
  ];
}

/**
 * 按 ID 获取检查项
 * @param {string} id - 检查项 ID
 * @returns {Object|undefined} 检查项对象
 */
export function getCheckItemById(id) {
  return getAllCheckItems().find(item => item.id === id);
}

/**
 * 按维度获取检查项
 * @param {string} category - 维度名称
 * @returns {Array} 该维度的检查项数组
 */
export function getCheckItemsByCategory(category) {
  const categoryMap = {
    '代码质量': checklist.codeQuality,
    '功能完整性': checklist.functionalCompleteness,
    '性能': checklist.performance,
    '安全': checklist.security,
    '用户体验': checklist.userExperience,
    '文档': checklist.documentation,
  };
  return categoryMap[category] || [];
}

/**
 * 按严重程度筛选检查项
 * @param {string} severity - 严重程度（critical/major/minor）
 * @returns {Array} 符合条件的检查项数组
 */
export function getCheckItemsBySeverity(severity) {
  return getAllCheckItems().filter(item => item.severity === severity);
}

/**
 * 获取可自动检测的检查项
 * @returns {Array} 可自动检测的检查项数组
 */
export function getAutoCheckItems() {
  return getAllCheckItems().filter(item => item.autoCheck);
}

/**
 * 获取检查清单统计信息
 * @returns {Object} 各维度和严重程度的数量统计
 */
export function getChecklistStatistics() {
  const all = getAllCheckItems();
  const byCategory = {};
  const bySeverity = { critical: 0, major: 0, minor: 0 };
  const autoCheckCount = all.filter(i => i.autoCheck).length;

  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  }

  return {
    total: all.length,
    byCategory,
    bySeverity,
    autoCheckCount,
    manualCheckCount: all.length - autoCheckCount,
  };
}

export default checklist;
