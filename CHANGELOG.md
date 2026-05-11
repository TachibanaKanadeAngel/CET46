# CET46 科学记忆引擎 Pro v1.3.6 (local stable) - 更新日志

## 📅 2026-05-11 v1.3.6 - 版本统一与工程化完善 (local stable)

### 修复问题
- 统一项目所有文件版本号至 v1.3.6（config.js、main.js、index.html、package.json、electron/index.js、tools/build-file-html.mjs、manifest.json、css/theme-stardew.css）
- 修复 Vite HMR WebSocket 连接失败问题（简化 HMR 配置，端口改为 3001）
- 清理重复的旧版 `CET46/` 源文件目录
- 移除孤儿文件 `electron/main.js`、`js/widgets/review-widget.js` 等

### 恢复文件
- 恢复 PWA 关键文件 `sw.js`（Service Worker）和 `manifest.json`
- 恢复项目文档 `ARCHITECTURE.md`、`BUILD_GUIDE.md`、`DEPLOY.md`
- 恢复构建脚本 `build-exe.bat`、`build-exe-local.bat`

### 安全性
- UI 安全性改进：`ui.js` 中 `innerHTML` 替换为 DOM API，防范 XSS 注入
- 新增 `js/utils.js` 工具模块，提供 `escapeHTML` 和 `escapeRegExp` 安全函数

### 状态管理
- 修复 `state.js` Proxy 中 `this` 绑定问题，方法调用时自动绑定目标对象
- 修复 Map/Set 数据在 Proxy 下的读写兼容
- 添加事件监听器去重，防止重复注册

### 工程化
- `dist-file/` 加入 `.gitignore`，避免构建产物被误提交
- Electron 主进程入口整理（`electron/index.js`）
- `manifest.json` 应用名版本号更新至 1.3.6

### 新增文件
- `css/list-fix.css` — 词库列表样式修复
- `css/theme-stardew.css` — 星露谷主题皮肤
- `js/utils.js` — 公共工具函数提取
- `js/utils/logger.js` — 统一日志模块
- `tools/build-file-html.mjs` — 单文件 HTML 构建脚本
- `dist-file/` — 单文件 HTML 构建产物
- `server.cjs` — 本地静态服务器
- `scripts/clean_ui_assets.py` / `scripts/split_ui_assets.py` — UI 资源脚本
- `scripts/convert_vocab.mjs` — 词库转换脚本
- `public/` / `assets/` — 静态资源目录

### 代码质量
- 提取共享 DOM 辅助函数至 `js/utils.js`
- 清理乱码文本修复逻辑
- 添加乱码检测工具
- 添加项目验证脚本
- 补全项目 README 和词库校验脚本

---

## 📅 2026-05-08 v1.3.5 - WebDAV 同步增强

### 修复问题
- Phase 1.5：`generateBackupData` 改为从 IndexedDB 全量读取而非 LRU 缓存，确保备份数据完整

### WebDAV Phase 1
- 新增 `cet46_backup.json` 完整快照生成
- 同步基准（sync_base）对称性修复
- patch 增量日志上传与合并

---

## 📅 2026-05-07 v1.3.4 - 拼写评分与 CSP 双构建

### 修复问题
- 修复拼写评分策略（提示使用参与评分，避免一次正确直接 mastered）
- CSP 双构建模式：网页/PWA 保留 CSP 安全策略，仅 `build:file` 单文件版本移除

---

## 📅 2026-05-06 v1.3.3 - 核心流程稳定

### 修复问题
- 稳定核心学习与复习流程
- 修复学习功能参数传递不完整导致的学习模式异常
- 优化虚拟滚动 DOM 复用逻辑

---

## 📅 2026-04-26 v1.3.2 - 功能优化与问题修复

### 修复问题
- 修复学习功能参数传递不完整导致的学习模式异常（`study.js` `startStudy` 参数签名统一）
- 统一版本号至 v1.3.2（config.js、index.html、package.json）
- 合并重复的全局错误处理逻辑（移除 index.html 和 main.js 底部的重复监听器）
- 优化虚拟滚动性能，使用 `replaceChildren` 替代 `innerHTML`，减少 DOM 重排

### 性能优化
- 音频预加载改为并发批处理模式（限10并发），提升加载速度
- IndexedDB 默认词库导入改为 `bulkSave` 批量操作
- 添加语义图谱构建取消机制（`cleanupSemanticGraph`），`beforeunload` 时自动终止，防止内存泄漏

### 安全性
- 添加 `escapeHtml` 函数，对错误分析中的动态内容进行 HTML 转义，防范 XSS
- 移除 `index.html` 中冗余的内联错误监听脚本

### 代码质量
- 提取魔法数字到 `CONSTANTS` 常量（学习限制、预加载并发等）
- 添加 JSDoc 类型注释至核心函数（`startStudy`、`buildSemanticGraphAsync`、`prefetchAudioLibrary` 等）

---

## 📅 2026-04-24 v1.3.1 - 全面代码修复

### 修复问题
- 缺失 `js/workers/fsrs-trainer-worker.js` Worker 文件，导致 FSRS 训练功能崩溃
- `server.cjs` 路径遍历安全漏洞，添加路径校验和 OPTIONS 预检处理
- 清理孤儿文件 `electron/main.js`
- 补充 `vercel.json` 构建配置
- 更新 `vite.config.js` 插件注释以反映实际功能
- 修复 `index.html` 版本号不一致 (v1.0 → v1.3)
- 更新 `electron-builder.json` 版权年份 (2024 → 2024-2026)
- 优化 `build-apk.yml` 工作流，移除冗余 Capacitor 安装步骤

---

## 📅 2026-04-13 v1.3.0 - 支持本地文件直接打开

### 新增功能
- 可直接双击 `dist/index.html` 使用，无需服务器

### 使用方法
```bash
# 构建单文件版本
npm run build

# 然后直接打开 dist/index.html 即可使用
```

### 技术改动
- `vite.config.js` - 移除 CSP，内联资源
- `main.js` - Worker降级、跳过持久化存储请求
- `ui.js` - Particle Worker降级
- `settings.js` - FSRS Trainer Worker降级
- `sync.js` - Crypto Worker错误处理
- `particle-system.js` - file://协议下禁用粒子系统

### 验证结果
- ✅ 词库列表、学习、复习、统计功能正常
- ✅ 无控制台错误、无警告条、无闪烁白点

---

## 📅 2026-04-13 v1.0.1 - 移除冗余文件

### 功能说明
清理项目中的测试文件和冗余代码，减小项目体积。

### 使用方法
直接删除以下文件即可，不影响核心功能：
- 测试文件（7个）: `js/__tests__/*`, `tests/*`, `tests-e2e/*`, `playwright.config.js`, `vitest.setup.js`, `test.html`
- 冗余代码（4个）: `js/utils/dom-utils.js`, `js/workers/vocab-loader-worker.js`, `js/widgets/review-widget.js`, `scripts/convert_vocab.js`
- 重复脚本（2个）: `启动服务器.bat`, `打开浏览器.bat`

### 修改文件
- `js/widgets/pwa-widgets.js` - 移除review-widget引用
- `package.json` - 清理测试配置

---

## 📅 2026-04-13 v1.0.0 - 项目完成

### 核心功能
- **词库管理**: 6662个四六级单词，支持搜索、筛选、查看详情
- **学习模式**: 基于FSRS算法的科学记忆，支持认识/不认识/拼写
- **复习模式**: 智能安排待复习单词
- **错题本**: 自动记录错误单词
- **统计功能**: 学习进度、记忆曲线可视化
- **数据同步**: 支持WebDAV同步学习数据

### 使用方法
1. 打开应用后选择学习级别（CET-4/CET-6/全部）
2. 点击"开始学习"进入学习模式
3. 查看单词后选择：认识/不认识/拼写
4. 系统会根据FSRS算法自动安排复习时间
5. 在"复习"标签页查看待复习单词

### 修复问题
- 词库列表显示问题（骨架屏、CSS、虚拟滚动）
- 学习功能显示问题（骨架屏内容恢复）
- 代码清理（移除未使用导入、调试代码）

---

## 📅 2026-04-12 v9 - 修复致命错误

### 修复问题
- `StudyFeature.checkStudySession is not a function`
- 词库列表DOM覆写Bug

---

## 📅 2026-04-12 v8 - 修复词库/学习功能

### 修复问题
- 词库界面为空（事件绑定时机、WORDS初始化、空指针）
- 学习功能显示"本轮剩余: 0"

---

## 📅 2026-04-03 v7 - 修复点击/词库问题

### 修复问题
- 点击完全无反应
- 看不见单词

---

## 📅 2026-04-03 v6~v2 - 紧急修复系列

### 修复问题
- 点击无反应、词库不显示、白点闪烁
- IndexedDB失败处理、空指针风险
- 重复事件监听器、参数错误

---

## 📅 2026-04-03 - 全面优化

### 优化内容
- 冗余文件清理（24个文件）
- 核心代码优化（main.js 3100→2136行）
