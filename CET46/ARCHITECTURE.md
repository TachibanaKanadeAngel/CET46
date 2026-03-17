# CET46 科学记忆引擎 Pro v1.0 - 架构说明

## 📁 项目结构

```
CET46/
├── index.html              # 主入口文件，包含完整UI结构
├── manifest.json           # PWA配置清单
├── sw.js                   # Service Worker（离线缓存）
├── DEPLOY.md               # Vercel部署说明
├── package.json            # 项目依赖配置
├── README.md               # 项目简介
├── DEPLOY.md               # 部署说明
├── css/
│   └── styles.css          # 统一样式文件（包含粒子效果、引擎样式）
├── icons/
│   ├── icon.svg            # 主图标
│   ├── icon-192.svg        # PWA图标(192x192)
│   └── icon-512.svg        # PWA图标(512x512)
└── js/
    ├── main.js             # 应用入口，初始化所有模块
    ├── config.js           # 全局配置常量
    ├── core.js             # 核心数据操作（包含FSRS算法、IndexedDB、数据迁移）
    ├── state.js            # 响应式状态管理
    ├── ui.js               # UI工具函数（toast、模态框等）
    ├── network.js          # 网络请求封装
    ├── sync.js             # WebDAV同步与加密
    ├── data/
    │   └── default_vocab.js # 默认词库数据
    ├── features/
    │   ├── study.js        # 学习功能模块
    │   ├── review.js       # 复习功能模块
    │   ├── spelling.js     # 拼写挑战模块
    │   ├── minigame.js     # 单词小游戏模块
    │   ├── settings.js     # 设置与FSRS训练模块
    │   ├── webdav.js       # WebDAV配置UI模块
    │   └── engine-visualizer.js # 引擎可视化模块
    ├── utils/
    │   ├── particle-system.js   # 粒子效果系统
    │   └── performance-monitor.js # 性能监控
    ├── widgets/
    │   ├── pwa-widgets.js       # PWA小组件
    │   └── review-widget.js     # 复习提醒小组件
    └── workers/
        ├── vocab-worker.js      # 词库处理Worker
        ├── semantic-worker.js   # 语义图谱构建Worker
        └── fsrs-trainer-worker.js # FSRS训练Worker
```

---

## 🏗️ 架构设计

### 1. 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (UI)                           │
│  index.html + css/styles.css + js/ui.js                     │
├─────────────────────────────────────────────────────────────┤
│                        功能层 (Features)                     │
│  study.js | review.js | spelling.js | minigame.js | ...     │
├─────────────────────────────────────────────────────────────┤
│                        核心层 (Core)                         │
│  main.js | core.js | fsrs.js | sync.js | network.js         │
├─────────────────────────────────────────────────────────────┤
│                        数据层 (Data)                         │
│  state.js | store.js | db.js | config.js                    │
├─────────────────────────────────────────────────────────────┤
│                        基础设施层                           │
│  Workers | Service Worker | IndexedDB | LocalStorage        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 模块依赖关系

```
main.js (入口)
    ├── config.js (配置常量)
    ├── core.js (核心数据操作 - 包含FSRS、IndexedDB、内存缓存)
    │   ├── config.js
    │   └── fsrs.js (FSRS算法函数)
    ├── state.js (响应式状态)
    ├── ui.js (UI工具)
    ├── sync.js (同步)
    │   ├── config.js
    │   └── network.js
    ├── features/study.js (学习)
    │   ├── state.js
    │   ├── core.js
    │   └── ui.js
    ├── features/review.js (复习)
    │   ├── state.js
    │   ├── core.js
    │   └── ui.js
    └── ...其他功能模块
```

---

## 🔧 核心模块说明

### 1. main.js - 应用入口
- **职责**: 初始化应用、加载功能模块、设置事件监听
- **关键功能**:
  - Worker池管理 (WorkerPool)
  - Web Vitals性能监控
  - 语义图谱异步构建
  - 全局事件委托系统
  - 触摸手势支持
  - Service Worker注册

### 2. config.js - 全局配置
- **常量定义**:
  - FSRS算法参数 (DEFAULT_W等)
  - 存储键名
  - CORS代理列表
  - 缓存配置
- **语义数据**:
  - SEMANTIC_CLUSTERS: 语义关联词组
  - CONFUSING_PAIRS: 易混淆词对

### 3. state.js - 响应式状态管理
- **AppState**: 基础状态对象
- **ReactiveAppState**: Proxy代理的响应式状态
- **API**:
  - `watch(keys, callback)`: 监听状态变化
  - `computed(getter, deps)`: 计算属性

### 4. core.js - 核心数据操作（已合并）
- **职责**: 集中管理所有数据操作，已合并 db.js、store.js、fsrs.js 的功能
- **内存缓存**: memoryCache (progress, wrongWords, heatmap, session)
- **IndexedDB**: CET46_DB (版本2)
  - progress: 单词学习进度
  - words: 词库
  - wrongWords: 错词
  - heatmap: 热力图
  - session: 会话数据
  - actionStack: 操作栈（撤销用）
  - meta_store: 元数据（BK-Tree缓存）
- **FSRS 4.5算法**:
  - `updateFSRS(wd, quality)`: 更新稳定性和难度
  - `calculateFSRSInterval(s)`: 计算复习间隔
  - `applyFuzz(interval)`: 添加随机扰动

### 5. sync.js - WebDAV同步
- **加密**: AES-GCM + PBKDF2 (60万次迭代)
- **冲突解决**: 向量时钟 + 属性感知合并
- **功能**:
  - 增量同步
  - 自动同步配置
  - 凭证导出/导入

---

## 📊 数据流

### 学习流程
```
用户操作 → main.js事件委托 → StudyFeature方法
    ↓
更新memoryCache → 写入IndexedDB (异步批量)
    ↓
更新UI统计 → 记录热力图 → 检查里程碑
```

### 同步流程
```
触发同步 → 收集变更数据 → 加密
    ↓
WebDAV上传 → 向量时钟比较 → 冲突检测
    ↓
合并数据 → 解密 → 更新本地存储
```

---

## 🎨 UI架构

### 视图结构 (index.html)
```
.app-container
├── .header (头部统计)
│   ├── 引擎核心可视化
│   └── 统计数字
├── .nav-tabs (导航标签)
│   ├── 学习 | 复习 | 错题 | 统计 | 词库
├── .content
│   ├── #view-study (学习视图)
│   ├── #view-review (复习视图)
│   ├── #view-wrong (错题视图)
│   ├── #view-stats (统计视图)
│   └── #view-list (词库视图)
└── 模态框 (拼写、游戏、冲突解决等)
```

### 主题系统
- CSS变量定义在 `:root`
- 支持深色/浅色主题切换
- 星露谷风格配色方案

---

## ⚡ 性能优化

### 1. 虚拟滚动
- 词库列表使用虚拟滚动
- 只渲染可见区域DOM
- 对象池复用列表项

### 2. Worker多线程
- vocab-worker: 词库JSON解析
- semantic-worker: 语义图谱构建
- fsrs-trainer-worker: 模型训练

### 3. 缓存策略
- 内存缓存优先读取
- IndexedDB批量写入
- Service Worker离线缓存

### 4. 懒加载
- 动态导入功能模块
- 音频预缓存（后台）

---

## 🔒 安全设计

### 数据加密
- WebDAV凭证: AES-GCM加密存储
- 本地数据: 依赖浏览器同源策略

### 输入验证
- 所有用户输入经过escapeHTML处理
- CSP策略限制资源加载

---

## 📱 PWA特性

### 1. Service Worker (sw.js)
- 离线缓存策略
- 音频资源预缓存
- 后台同步支持

### 2. Manifest
- 可安装为独立应用
- 支持添加到主屏幕
- 自定义启动画面

### 3. 离线功能
- 完全离线可用
- 数据本地持久化
- 网络状态检测

---

## 🧪 算法特性

### FSRS 4.5 实现
- 17维权重参数
- 稳定性计算
- 难度动态调整
- 个性化节律因子

### 语义干扰检测
- BK-Tree模糊匹配
- 易混淆词对检测
- 复习间隔自动调整

### 记忆负载监控
- 每日复习量预警
- 快速回顾模式
- 学习进度预测

---

## 🔌 扩展点

### 添加新功能模块
1. 在 `js/features/` 创建模块文件
2. 在 `main.js` 中动态导入
3. 在 `ACTION_HANDLERS` 中注册事件

### 自定义词库
- 支持JSON格式导入
- 必须包含字段: id, word, phonetic, meaning, example, level

---

## 📈 监控指标

### Web Vitals
- LCP (最大内容绘制)
- FID (首次输入延迟)
- CLS (累积布局偏移)
- TTFB (首字节时间)

### 性能面板
- 按 `Ctrl+F12` 打开
- 显示实时性能数据

---

## 📝 开发规范

### 代码风格
- ES6+ 模块化
- 异步函数优先
- 错误边界处理

### 文件组织
- 功能相关代码放同一目录
- 工具函数统一放utils
- 常量集中管理

---

## 🐛 常见问题

### 1. IndexedDB初始化失败
- 检查浏览器隐私模式
- 确认存储空间充足

### 2. WebDAV同步失败
- 验证服务器地址
- 检查CORS配置
- 确认凭证正确

### 3. 音频无法播放
- 检查网络连接
- 确认音频缓存正常

---

## 📚 相关文档

- [README.md](README.md) - 项目简介
- [DEPLOY.md](DEPLOY.md) - 部署指南

---

*文档版本: v1.0*  
*最后更新: 2026-03-17*
